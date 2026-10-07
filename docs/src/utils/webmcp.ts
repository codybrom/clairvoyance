// Registers this site's read-only tools with browser agents through WebMCP
// (https://github.com/webmachinelearning/webmcp). The definitions come from
// /tools.json, the same file the /mcp server reads (edge/mcp.ts), and each tool
// fetches a Markdown file this site already publishes. Does nothing in
// browsers without WebMCP.
import type { ToolDefinition, ToolManifest } from "../../edge/mcp.ts";

interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

interface Registration {
  name: string;
  title: string;
  description: string;
  inputSchema: ToolDefinition["inputSchema"];
  annotations: { readOnlyHint: boolean };
  execute: (input: Record<string, unknown>) => Promise<ToolResult>;
}

/** The WebMCP surface: `registerTool` in current drafts, `provideContext` in older ones. */
export interface ModelContext {
  registerTool?: (tool: Registration) => void;
  provideContext?: (context: { tools: Registration[] }) => void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Navigator {
    modelContext?: ModelContext;
  }
}

export interface WebMcpEnvironment {
  document?: { modelContext?: ModelContext };
  navigator?: { modelContext?: ModelContext };
  fetch: typeof fetch;
  origin: string;
}

export async function registerWebMcpTools(
  env: WebMcpEnvironment,
): Promise<void> {
  // The proposal moved the API from navigator to document; accept either.
  const modelContext =
    env.document?.modelContext ?? env.navigator?.modelContext;
  if (!modelContext?.registerTool && !modelContext?.provideContext) return;

  let manifest: ToolManifest;
  try {
    const response = await env.fetch(new URL("/tools.json", env.origin));
    if (!response.ok) return;
    manifest = await response.json();
  } catch {
    return;
  }

  const registrations = manifest.tools.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: { readOnlyHint: tool.readOnly },
    execute: (input: Record<string, unknown>) => run(tool, input, env),
  }));

  if (modelContext.registerTool) {
    for (const registration of registrations) {
      try {
        modelContext.registerTool(registration);
      } catch {
        // Already registered, or the browser rejected this tool's shape.
      }
    }
  } else {
    modelContext.provideContext?.({ tools: registrations });
  }
}

async function run(
  tool: ToolDefinition,
  input: Record<string, unknown>,
  env: WebMcpEnvironment,
): Promise<ToolResult> {
  const url = new URL(resolvePath(tool.path, input), env.origin);
  try {
    const response = await env.fetch(url);
    if (!response.ok)
      return errorResult(`${response.status} fetching ${url.pathname}`);
    return { content: [{ type: "text", text: await response.text() }] };
  } catch (error) {
    return errorResult(`Failed to fetch ${url.pathname}: ${error}`);
  }
}

// "/skills/{slug}.md" with { slug: "deep-modules" } → "/skills/deep-modules.md"
function resolvePath(template: string, input: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    encodeURIComponent(String(input[key] ?? "")),
  );
}

function errorResult(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
