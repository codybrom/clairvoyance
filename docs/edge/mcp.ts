// A read-only MCP server at /mcp, using the Streamable HTTP transport
// (https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
// Stateless: each POST carries one JSON-RPC message and gets a JSON response;
// there are no sessions and no server-initiated stream, so GET is 405.
//
// The tools come from the build's /tools.json, the same definitions the site's
// WebMCP script registers for browser agents. Each tool fetches a Markdown file
// this site already publishes, so the server has no state of its own. Each
// skill is also a prompt, which clients such as Claude Code offer as a slash
// command. The version and instructions come from /tools.json too, so they
// always match what's deployed.
import type { FetchOrigin } from "./worker.ts";

/** One tool in /tools.json. `path` may contain `{argument}` placeholders. */
export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: InputSchema;
  readOnly: boolean;
  path: string;
}

/** One prompt in /tools.json: a slash command whose message is the Markdown at `path`. */
export interface PromptDefinition {
  name: string;
  title: string;
  description: string;
  path: string;
}

export interface ToolManifest {
  version: string;
  /** Sent to clients on initialize; many add it to the agent's context. */
  instructions: string;
  tools: ToolDefinition[];
  prompts: PromptDefinition[];
}

interface InputSchema {
  type: "object";
  properties: Record<
    string,
    { type?: string; description?: string; enum?: string[] }
  >;
  required?: string[];
  additionalProperties?: boolean;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

type Outcome =
  { result: unknown } | { error: { code: number; message: string } };

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
};

export async function handleMcp(
  request: Request,
  fetchOrigin: FetchOrigin,
): Promise<Response> {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") {
    return new Response("This MCP endpoint accepts JSON-RPC over POST.\n", {
      status: 405,
      headers: { ...CORS, Allow: "POST, OPTIONS" },
    });
  }

  let message: JsonRpcRequest;
  try {
    message = await request.json();
  } catch {
    return jsonResponse(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      400,
    );
  }
  if (
    !message ||
    message.jsonrpc !== "2.0" ||
    typeof message.method !== "string"
  ) {
    return jsonResponse(
      {
        jsonrpc: "2.0",
        id: message?.id ?? null,
        error: { code: -32600, message: "Invalid request" },
      },
      400,
    );
  }
  // Notifications (no id) need no answer.
  if (message.id === undefined)
    return new Response(null, { status: 202, headers: CORS });

  const outcome = await dispatch(message, request.url, fetchOrigin);
  return jsonResponse({ jsonrpc: "2.0", id: message.id, ...outcome });
}

async function dispatch(
  { method, params = {} }: JsonRpcRequest,
  requestUrl: string,
  fetchOrigin: FetchOrigin,
): Promise<Outcome> {
  switch (method) {
    case "initialize": {
      const { version, instructions } = await loadManifest(
        requestUrl,
        fetchOrigin,
      );
      const requested = params.protocolVersion;
      return {
        result: {
          protocolVersion:
            typeof requested === "string" &&
            SUPPORTED_VERSIONS.includes(requested)
              ? requested
              : SUPPORTED_VERSIONS[0],
          capabilities: { tools: {}, prompts: {} },
          serverInfo: { name: "clairvoyance", title: "Clairvoyance", version },
          instructions,
        },
      };
    }
    case "ping":
      return { result: {} };
    case "prompts/list": {
      const { prompts } = await loadManifest(requestUrl, fetchOrigin);
      return {
        result: {
          prompts: prompts.map(({ path: _path, ...prompt }) => prompt),
        },
      };
    }
    case "prompts/get": {
      const { prompts } = await loadManifest(requestUrl, fetchOrigin);
      const prompt = prompts.find((p) => p.name === params.name);
      if (!prompt)
        return {
          error: {
            code: -32602,
            message: `Unknown prompt: ${String(params.name)}`,
          },
        };
      const url = new URL(prompt.path, requestUrl);
      const response = await fetchOrigin(new Request(url));
      if (!response.ok)
        return {
          error: {
            code: -32603,
            message: `${response.status} fetching ${url.pathname}`,
          },
        };
      return {
        result: {
          description: prompt.description,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: await response.text(),
              },
            },
          ],
        },
      };
    }
    case "tools/list": {
      const { tools } = await loadManifest(requestUrl, fetchOrigin);
      return {
        result: {
          tools: tools.map(
            ({ name, title, description, inputSchema, readOnly }) => ({
              name,
              title,
              description,
              inputSchema,
              annotations: { readOnlyHint: readOnly },
            }),
          ),
        },
      };
    }
    case "tools/call": {
      const { tools } = await loadManifest(requestUrl, fetchOrigin);
      const tool = tools.find((t) => t.name === params.name);
      if (!tool)
        return {
          error: {
            code: -32602,
            message: `Unknown tool: ${String(params.name)}`,
          },
        };
      const args = params.arguments ?? {};
      const problem = validate(tool.inputSchema, args);
      if (problem) return { result: errorResult(problem) };
      const url = new URL(
        resolvePath(tool.path, args as Record<string, string>),
        requestUrl,
      );
      const response = await fetchOrigin(new Request(url));
      if (!response.ok)
        return {
          result: errorResult(`${response.status} fetching ${url.pathname}`),
        };
      return {
        result: { content: [{ type: "text", text: await response.text() }] },
      };
    }
    default:
      return {
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

async function loadManifest(
  requestUrl: string,
  fetchOrigin: FetchOrigin,
): Promise<ToolManifest> {
  const response = await fetchOrigin(
    new Request(new URL("/tools.json", requestUrl)),
  );
  if (!response.ok) throw new Error(`tools.json: ${response.status}`);
  return response.json();
}

// Enough JSON Schema for these tools: required keys, no extra keys, string
// types and enums. Arguments outside the schema never reach a URL.
function validate(schema: InputSchema, args: unknown): string | null {
  if (typeof args !== "object" || args === null || Array.isArray(args))
    return "Arguments must be an object.";
  for (const key of schema.required ?? []) {
    if (!(key in args)) return `Missing required argument: ${key}`;
  }
  for (const [key, value] of Object.entries(args)) {
    const property = schema.properties[key];
    if (!property) {
      if (schema.additionalProperties === false)
        return `Unknown argument: ${key}`;
      continue;
    }
    if (property.type === "string" && typeof value !== "string")
      return `${key} must be a string.`;
    if (property.enum && !property.enum.includes(value as string)) {
      return `${key} must be one of: ${property.enum.join(", ")}`;
    }
  }
  return null;
}

// "/skills/{slug}.md" with { slug: "deep-modules" } → "/skills/deep-modules.md"
function resolvePath(template: string, args: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    encodeURIComponent(String(args[key] ?? "")),
  );
}

function errorResult(message: string) {
  return { content: [{ type: "text", text: message }], isError: true };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
