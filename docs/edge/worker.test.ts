import { test } from "node:test";
import assert from "node:assert/strict";
import type { ToolDefinition } from "./mcp.ts";
import { handle, negotiate } from "./worker.ts";

const SITE = "https://clairvoyance.fyi";
const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

// Stands in for GitHub Pages: serves a fixed set of paths, 404s everything else.
interface OriginFile {
  body: string;
  type: string;
}

function fakeOrigin(files: Record<string, OriginFile>) {
  const calls: string[] = [];
  const fetchOrigin = async (request: Request) => {
    const { pathname } = new URL(request.url);
    calls.push(pathname);
    const file = files[pathname];
    if (!file) {
      return new Response("<h1>GitHub Pages 404</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response(request.method === "HEAD" ? null : file.body, {
      status: 200,
      headers: {
        "Content-Type": file.type,
        Vary: "Accept-Encoding",
      },
    });
  };
  return { fetchOrigin, calls };
}

// Stands in for the tools in the build's /tools.json, shared by WebMCP and /mcp.
const TOOLS: ToolDefinition[] = [
  {
    name: "skillsIndex",
    title: "List skills",
    description: "List every skill.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    readOnly: true,
    path: "/skills.md",
  },
  {
    name: "skillBySlug",
    title: "Fetch a skill",
    description: "Fetch one skill.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", enum: ["deep-modules"] } },
      required: ["slug"],
      additionalProperties: false,
    },
    readOnly: true,
    path: "/skills/{slug}.md",
  },
];

const html = (body: string): OriginFile => ({
  body,
  type: "text/html; charset=utf-8",
});
const md = (body: string): OriginFile => ({
  body,
  type: "text/markdown; charset=utf-8",
});

const origin = () =>
  fakeOrigin({
    "/": html("<h1>Home</h1>"),
    "/index.md": md("# Clairvoyance\n\nHome in Markdown."),
    "/skills/deep-modules/": html("<h1>Deep Modules</h1>"),
    "/skills/deep-modules.md": md("# Deep Modules"),
    "/about/": html("<h1>About</h1>"),
    "/llms.txt": { body: "# Clairvoyance", type: "text/plain; charset=utf-8" },
    "/og.png": { body: "PNG", type: "image/png" },
    "/skills.md": md("# All Skills"),
    "/mcp/": html("<h1>The Clairvoyance MCP server</h1>"),
    "/mcp.md": md("# The Clairvoyance MCP server"),
    "/tools.json": {
      body: JSON.stringify({
        version: "9.9.9",
        instructions: "Use the skills.",
        tools: TOOLS,
        prompts: [
          {
            name: "deep-modules",
            title: "Deep Modules",
            description: "Measures module depth.",
            path: "/skills/deep-modules.md",
          },
        ],
      }),
      type: "application/json",
    },
  });

function get(path: string, accept?: string, method = "GET") {
  const headers: HeadersInit = accept === undefined ? {} : { Accept: accept };
  return new Request(SITE + path, { method, headers });
}

function header(response: Response, name: string): string {
  return response.headers.get(name) ?? "";
}

function varyIncludesAccept(response: Response) {
  const vary = response.headers.get("Vary") ?? "";
  return vary
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .includes("accept");
}

test("serves the Markdown variant of the homepage when Markdown is requested", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", "text/markdown"), fetchOrigin);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.ok(varyIncludesAccept(res));
  assert.equal(await res.text(), "# Clairvoyance\n\nHome in Markdown.");
});

test("keeps origin Vary values when adding Accept", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", "text/markdown"), fetchOrigin);
  assert.match(header(res, "Vary"), /accept-encoding/i);
});

test("serves HTML with Vary: Accept when HTML is requested", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", "text/html"), fetchOrigin);
  assert.equal(res.status, 200);
  assert.match(header(res, "Content-Type"), /^text\/html/);
  assert.ok(varyIncludesAccept(res));
  assert.equal(await res.text(), "<h1>Home</h1>");
});

test("serves HTML to a typical browser Accept header", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", BROWSER_ACCEPT), fetchOrigin);
  assert.match(header(res, "Content-Type"), /^text\/html/);
});

test("serves HTML for wildcard-only or missing Accept headers", async () => {
  for (const accept of ["*/*", "text/*", undefined]) {
    const { fetchOrigin } = origin();
    const res = await negotiate(get("/", accept), fetchOrigin);
    assert.match(
      header(res, "Content-Type"),
      /^text\/html/,
      `Accept: ${accept}`,
    );
  }
});

test("honors q-values when choosing between HTML and Markdown", async () => {
  {
    const { fetchOrigin } = origin();
    const res = await negotiate(
      get("/", "text/markdown;q=0.5, text/html"),
      fetchOrigin,
    );
    assert.match(header(res, "Content-Type"), /^text\/html/);
  }
  {
    const { fetchOrigin } = origin();
    const res = await negotiate(
      get("/", "text/html;q=0.5, text/markdown"),
      fetchOrigin,
    );
    assert.match(header(res, "Content-Type"), /^text\/markdown/);
  }
  {
    const { fetchOrigin } = origin();
    const res = await negotiate(
      get("/", "text/markdown;q=0, */*"),
      fetchOrigin,
    );
    assert.match(header(res, "Content-Type"), /^text\/html/);
  }
});

test("prefers Markdown when the client lists it alongside HTML at equal weight", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(
    get("/", "text/markdown, text/html"),
    fetchOrigin,
  );
  assert.match(header(res, "Content-Type"), /^text\/markdown/);
});

test("maps nested page paths, with or without a trailing slash, to their .md file", async () => {
  for (const path of ["/skills/deep-modules", "/skills/deep-modules/"]) {
    const { fetchOrigin, calls } = origin();
    const res = await negotiate(get(path, "text/markdown"), fetchOrigin);
    assert.equal(await res.text(), "# Deep Modules", path);
    assert.deepEqual(calls, ["/skills/deep-modules.md"]);
  }
});

test("returns a Markdown 404 body for missing pages when Markdown is requested", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(
    get("/no-such-page", "text/markdown"),
    fetchOrigin,
  );
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.ok(varyIncludesAccept(res));
  const body = await res.text();
  assert.ok(body.length >= 20);
  assert.match(body, /^# /);
  assert.ok(body.includes("https://clairvoyance.fyi/llms.txt"));
  assert.ok(body.includes("/no-such-page"));
});

test("leaves HTML 404s from the origin untouched apart from Vary", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(
    get("/no-such-page", BROWSER_ACCEPT),
    fetchOrigin,
  );
  assert.equal(res.status, 404);
  assert.equal(await res.text(), "<h1>GitHub Pages 404</h1>");
  assert.ok(varyIncludesAccept(res));
});

test("falls back to HTML for a page that has no Markdown variant", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/about/", "text/markdown"), fetchOrigin);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "<h1>About</h1>");
  assert.ok(varyIncludesAccept(res));
});

test("answers 406 when the client accepts neither HTML nor Markdown", async () => {
  const { fetchOrigin, calls } = origin();
  const res = await negotiate(get("/", "application/json"), fetchOrigin);
  assert.equal(res.status, 406);
  assert.ok(varyIncludesAccept(res));
  assert.deepEqual(calls, []);
});

test("answers 406 when HTML is explicitly refused and Markdown is not offered", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", "text/html;q=0"), fetchOrigin);
  assert.equal(res.status, 406);
});

test("supports HEAD requests for the Markdown variant", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", "text/markdown", "HEAD"), fetchOrigin);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Type"), "text/markdown; charset=utf-8");
});

test("passes files with an extension straight through, even when Markdown is requested", async () => {
  for (const path of ["/llms.txt", "/og.png", "/index.md"]) {
    const { fetchOrigin, calls } = origin();
    const res = await negotiate(get(path, "text/markdown"), fetchOrigin);
    assert.equal(res.status, 200, path);
    assert.deepEqual(calls, [path]);
    assert.ok(!varyIncludesAccept(res), path);
  }
});

test("passes non-GET/HEAD requests straight through", async () => {
  const { fetchOrigin, calls } = origin();
  const res = await negotiate(get("/", "text/markdown", "POST"), fetchOrigin);
  assert.equal(await res.text(), "<h1>Home</h1>");
  assert.deepEqual(calls, ["/"]);
});

// ── Link headers (RFC 8288) ────────────────────────────────────────

function links(response: Response) {
  return (response.headers.get("Link") ?? "")
    .split(/,\s*(?=<)/)
    .filter(Boolean);
}

test("HTML pages advertise their canonical URL, Markdown twin and the sitemap", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", "text/html"), fetchOrigin);
  assert.deepEqual(links(res), [
    `<${SITE}/>; rel="canonical"`,
    `<${SITE}/index.md>; rel="alternate"; type="text/markdown"`,
    `<${SITE}/sitemap-index.xml>; rel="sitemap"`,
  ]);
});

test("Markdown responses point back to the canonical HTML page", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(
    get("/skills/deep-modules/", "text/markdown"),
    fetchOrigin,
  );
  assert.deepEqual(links(res), [
    `<${SITE}/skills/deep-modules>; rel="canonical"`,
    `<${SITE}/skills/deep-modules>; rel="alternate"; type="text/html"`,
    `<${SITE}/sitemap-index.xml>; rel="sitemap"`,
  ]);
});

test("pages served as HTML because they lack a twin don't advertise one", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/about/", "text/markdown"), fetchOrigin);
  assert.ok(!links(res).some((l) => l.includes("text/markdown")));
  assert.ok(links(res).includes(`<${SITE}/about>; rel="canonical"`));
});

test("404s and plain files carry no Link header", async () => {
  for (const [path, accept] of [
    ["/no-such-page", "text/markdown"],
    ["/no-such-page", "text/html"],
    ["/og.png", "image/png"],
  ]) {
    const { fetchOrigin } = origin();
    const res = await negotiate(get(path, accept), fetchOrigin);
    assert.equal(res.headers.get("Link"), null, path);
  }
});

// ── MCP server (Streamable HTTP, stateless JSON responses) ─────────

function rpc(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${SITE}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function call(method: string, params: unknown, id = 1) {
  const { fetchOrigin, calls } = origin();
  const res = await handle(
    rpc({ jsonrpc: "2.0", id, method, params }),
    fetchOrigin,
  );
  return { res, body: await res.json(), calls };
}

test("MCP initialize negotiates the protocol version and advertises tools", async () => {
  const { res, body } = await call("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "1" },
  });
  assert.equal(res.status, 200);
  assert.match(header(res, "Content-Type"), /^application\/json/);
  assert.equal(body.jsonrpc, "2.0");
  assert.equal(body.id, 1);
  assert.equal(body.result.protocolVersion, "2025-06-18");
  assert.deepEqual(body.result.capabilities, { tools: {}, prompts: {} });
  assert.equal(
    body.result.instructions,
    "Use the skills.",
    "instructions come from /tools.json",
  );
  assert.equal(body.result.serverInfo.name, "clairvoyance");
  assert.equal(
    body.result.serverInfo.version,
    "9.9.9",
    "the deployed plugin version",
  );
});

test("MCP initialize answers an unknown protocol version with the latest it supports", async () => {
  const { body } = await call("initialize", {
    protocolVersion: "1999-01-01",
    capabilities: {},
  });
  assert.equal(body.result.protocolVersion, "2025-11-25");
});

test("MCP notifications are accepted with 202 and no body", async () => {
  const { fetchOrigin } = origin();
  const res = await handle(
    rpc({ jsonrpc: "2.0", method: "notifications/initialized" }),
    fetchOrigin,
  );
  assert.equal(res.status, 202);
  assert.equal(await res.text(), "");
});

test("MCP tools/list returns the tools from /tools.json", async () => {
  const { body } = await call("tools/list", {});
  assert.deepEqual(
    body.result.tools.map((t: { name: string }) => t.name),
    ["skillsIndex", "skillBySlug"],
  );
  const skillBySlug = body.result.tools[1];
  assert.deepEqual(skillBySlug.inputSchema, TOOLS[1].inputSchema);
  assert.equal(skillBySlug.annotations.readOnlyHint, true);
  assert.equal(skillBySlug.path, undefined, "internal path not exposed");
});

test("MCP tools/call fetches the tool's Markdown from the origin", async () => {
  const { body, calls } = await call("tools/call", {
    name: "skillBySlug",
    arguments: { slug: "deep-modules" },
  });
  assert.deepEqual(body.result.content, [
    { type: "text", text: "# Deep Modules" },
  ]);
  assert.ok(!body.result.isError);
  assert.ok(calls.includes("/skills/deep-modules.md"));
});

test("MCP tools/call rejects arguments outside the schema without fetching", async () => {
  for (const args of [{ slug: "../../etc" }, {}]) {
    const { body, calls } = await call("tools/call", {
      name: "skillBySlug",
      arguments: args,
    });
    assert.equal(body.result.isError, true, JSON.stringify(args));
    assert.ok(
      !calls.some((c) => c.startsWith("/skills/")),
      JSON.stringify(args),
    );
  }
});

test("MCP tools/call on an unknown tool is a JSON-RPC invalid-params error", async () => {
  const { body } = await call("tools/call", {
    name: "deleteEverything",
    arguments: {},
  });
  assert.equal(body.error.code, -32602);
});

test("MCP unknown methods are method-not-found errors, and ping is answered", async () => {
  assert.equal((await call("resources/list", {})).body.error.code, -32601);
  assert.deepEqual((await call("ping", {})).body.result, {});
});

test("MCP malformed JSON is a parse error", async () => {
  const { fetchOrigin } = origin();
  const res = await handle(rpc("{not json"), fetchOrigin);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error.code, -32700);
});

test("MCP GET is 405 (no server-initiated stream) and OPTIONS allows browser clients", async () => {
  const { fetchOrigin } = origin();
  const getRes = await handle(get("/mcp", "text/event-stream"), fetchOrigin);
  assert.equal(getRes.status, 405);
  assert.equal(getRes.headers.get("Allow"), "POST, OPTIONS");
  const preflight = await handle(
    new Request(`${SITE}/mcp`, { method: "OPTIONS" }),
    fetchOrigin,
  );
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), "*");
  assert.match(
    header(preflight, "Access-Control-Allow-Headers"),
    /mcp-protocol-version/i,
  );
});

test("MCP prompts/list returns the prompts from /tools.json", async () => {
  const { body } = await call("prompts/list", {});
  assert.deepEqual(body.result.prompts, [
    {
      name: "deep-modules",
      title: "Deep Modules",
      description: "Measures module depth.",
    },
  ]);
});

test("MCP prompts/get returns the prompt's Markdown as a user message", async () => {
  const { body, calls } = await call("prompts/get", { name: "deep-modules" });
  assert.equal(body.result.description, "Measures module depth.");
  assert.deepEqual(body.result.messages, [
    { role: "user", content: { type: "text", text: "# Deep Modules" } },
  ]);
  assert.ok(calls.includes("/skills/deep-modules.md"));
});

test("MCP prompts/get on an unknown prompt is an invalid-params error", async () => {
  const { body } = await call("prompts/get", { name: "nope" });
  assert.equal(body.error.code, -32602);
});

// ── /mcp in a browser ──────────────────────────────────────────────

test("a browser visiting /mcp gets the page about the server, at the same URL", async () => {
  const { fetchOrigin, calls } = origin();
  const res = await handle(get("/mcp", BROWSER_ACCEPT), fetchOrigin);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "<h1>The Clairvoyance MCP server</h1>");
  assert.ok(varyIncludesAccept(res), "same URL, different representations");
  assert.ok(calls.includes("/mcp/"));
});

test("an agent asking /mcp for Markdown gets the page's Markdown twin", async () => {
  const { fetchOrigin } = origin();
  const res = await handle(get("/mcp", "text/markdown"), fetchOrigin);
  assert.equal(header(res, "Content-Type"), "text/markdown; charset=utf-8");
  assert.equal(await res.text(), "# The Clairvoyance MCP server");
});

test("an MCP client's GET for an event stream still gets 405", async () => {
  const { fetchOrigin, calls } = origin();
  const res = await handle(get("/mcp", "text/event-stream"), fetchOrigin);
  assert.equal(res.status, 405);
  assert.deepEqual(calls, []);
});

test("/mcp/ with a trailing slash is the same MCP endpoint", async () => {
  const { fetchOrigin } = origin();
  const req = new Request(`${SITE}/mcp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });
  const res = await handle(req, fetchOrigin);
  assert.deepEqual((await res.json()).result, {});
});
