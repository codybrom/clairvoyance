// Cloudflare Worker in front of the GitHub Pages origin for clairvoyance.fyi.
//
// GitHub Pages serves one representation per URL and can't set headers, so
// content negotiation (RFC 9110 §12.5.1) happens here. The Astro build emits a
// Markdown twin next to each page (`/` → `/index.md`, `/skills/x/` →
// `/skills/x.md`). A request for a page that prefers `text/markdown` gets that
// twin; everything else is proxied to the origin unchanged. Page responses
// always carry `Vary: Accept` so caches keep the two representations apart,
// and successful ones a `Link` header naming the other representation.
//
// It also serves the read-only MCP server at /mcp (see mcp.ts).

import { handleMcp } from "./mcp.ts";

/** Fetches from the GitHub Pages origin; `fetch` in production. */
export type FetchOrigin = (request: Request) => Promise<Response>;

type Representation = "markdown" | "html";

const SITE = "https://clairvoyance.fyi";
const MARKDOWN_TYPE = "text/markdown; charset=utf-8";

export default {
  fetch: (request: Request) => handle(request, fetch),
};

/** Routes `request`: /mcp to the MCP server, everything else through content negotiation. */
export async function handle(
  request: Request,
  fetchOrigin: FetchOrigin,
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/mcp/server-card")
    return serverCard(request, url, fetchOrigin);
  if (url.pathname === "/mcp" || url.pathname === "/mcp/") {
    // One URL for both audiences: a browser (or an agent asking for Markdown)
    // gets the page about the server, served from /mcp/ without a redirect so
    // the address stays copyable; MCP clients, which POST or GET an event
    // stream, get the server.
    const isRead = request.method === "GET" || request.method === "HEAD";
    if (
      isRead &&
      chooseRepresentation(request.headers.get("Accept")) !== "none"
    ) {
      return negotiate(
        new Request(new URL("/mcp/", url), request),
        fetchOrigin,
      );
    }
    return handleMcp(request, fetchOrigin);
  }
  const response = await negotiate(request, fetchOrigin);
  const type = MEDIA_TYPES[url.pathname];
  if (!type || !response.ok) return response;
  const typed = new Response(response.body, response);
  typed.headers.set("Content-Type", type);
  return typed;
}

// Discovery documents GitHub Pages can only serve as application/json.
const MEDIA_TYPES: Record<string, string> = {
  "/.well-known/mcp/server-card.json": "application/mcp-server-card+json",
  "/.well-known/ai-catalog.json": "application/ai-catalog+json",
};

// The server card's reserved location is <server URL>/server-card; the build
// publishes it as /.well-known/mcp/server-card.json.
async function serverCard(
  request: Request,
  url: URL,
  fetchOrigin: FetchOrigin,
): Promise<Response> {
  const card = await fetchOrigin(
    new Request(new URL("/.well-known/mcp/server-card.json", url), request),
  );
  if (!card.ok) return card;
  const response = new Response(card.body, card);
  response.headers.set("Content-Type", "application/mcp-server-card+json");
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

/** Serves `request`, choosing between the HTML page and its Markdown twin. */
export async function negotiate(
  request: Request,
  fetchOrigin: FetchOrigin,
): Promise<Response> {
  const url = new URL(request.url);
  if (!isPageRequest(request, url)) return fetchOrigin(request);

  const choice = chooseRepresentation(request.headers.get("Accept"));
  if (choice === "none") return notAcceptable();
  if (choice === "html") {
    const page = await fetchOrigin(request);
    return withLinks(withVaryAccept(page), url, "markdown");
  }

  const markdownUrl = new URL(markdownPath(url.pathname), url);
  const markdown = await fetchOrigin(new Request(markdownUrl, request));
  if (markdown.ok) {
    const response = withVaryAccept(markdown);
    response.headers.set("Content-Type", MARKDOWN_TYPE);
    return withLinks(response, url, "html");
  }

  // No Markdown twin: either the page doesn't exist, or it's HTML-only. RFC
  // 9110 lets a server send a representation the client didn't prefer, and
  // HTML is more useful to an agent than a 406.
  const page = await fetchOrigin(request);
  if (page.status === 404)
    return markdownNotFound(url.pathname, request.method);
  return withLinks(withVaryAccept(page), url, null);
}

// Only extensionless GET/HEAD paths are pages; files such as /llms.txt or
// /og.png have a single representation and pass straight through.
function isPageRequest(request: Request, url: URL): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const lastSegment = url.pathname.split("/").pop() ?? "";
  return !lastSegment.includes(".");
}

// Returns "markdown", "html", or "none" (neither is acceptable). Ties go to
// HTML unless the client named text/markdown explicitly, so a bare `*/*` keeps
// getting HTML while an agent that lists `text/markdown, text/html` gets
// Markdown.
function chooseRepresentation(
  acceptHeader: string | null,
): Representation | "none" {
  const ranges = parseAccept(acceptHeader || "*/*");
  const markdown = quality(ranges, "text", "markdown");
  const html = quality(ranges, "text", "html");

  if (markdown.q === 0 && html.q === 0) return "none";
  if (markdown.q > html.q) return "markdown";
  if (markdown.q === html.q && markdown.exact) return "markdown";
  return "html";
}

interface MediaRange {
  type: string;
  subtype: string;
  q: number;
}

function parseAccept(header: string): MediaRange[] {
  return header
    .split(",")
    .map((part) => {
      const [mediaRange, ...params] = part.split(";").map((s) => s.trim());
      const [type, subtype] = mediaRange.toLowerCase().split("/");
      let q = 1;
      for (const param of params) {
        const [name, value] = param.split("=").map((s) => s.trim());
        if (name.toLowerCase() === "q") q = Number.parseFloat(value);
      }
      return { type, subtype, q: Number.isNaN(q) ? 0 : q };
    })
    .filter((range) => range.type && range.subtype);
}

// The most specific matching range wins (RFC 9110 §12.5.1): an exact type
// beats `type/*`, which beats `*/*`. No match means q = 0.
function quality(
  ranges: MediaRange[],
  type: string,
  subtype: string,
): { q: number; exact: boolean } {
  let best = { specificity: -1, q: 0 };
  for (const range of ranges) {
    let specificity: number;
    if (range.type === type && range.subtype === subtype) specificity = 2;
    else if (range.type === type && range.subtype === "*") specificity = 1;
    else if (range.type === "*" && range.subtype === "*") specificity = 0;
    else continue;
    if (specificity > best.specificity) best = { specificity, q: range.q };
  }
  return { q: best.q, exact: best.specificity === 2 };
}

// `/` → `/index.md`; `/skills/deep-modules/` → `/skills/deep-modules.md`.
function markdownPath(pathname: string): string {
  return `${pathname.replace(/\/+$/, "") || "/index"}.md`;
}

// Matches the <link rel="canonical"> in each page: no trailing slash.
function canonicalUrl(pathname: string): string {
  return SITE + (pathname.replace(/\/+$/, "") || "/");
}

// RFC 8288 Link header on a successful page response: its canonical URL, the
// other representation (`alternate` names the type that wasn't served, or is
// null when there is none), and the sitemap.
function withLinks(
  response: Response,
  url: URL,
  alternate: Representation | null,
): Response {
  if (response.status !== 200) return response;
  const links = [`<${canonicalUrl(url.pathname)}>; rel="canonical"`];
  if (alternate === "markdown") {
    links.push(
      `<${SITE}${markdownPath(url.pathname)}>; rel="alternate"; type="text/markdown"`,
    );
  } else if (alternate === "html") {
    links.push(
      `<${canonicalUrl(url.pathname)}>; rel="alternate"; type="text/html"`,
    );
  }
  links.push(`<${SITE}/sitemap-index.xml>; rel="sitemap"`);
  links.push(`<${SITE}/.well-known/ard.json>; rel="ard"`);
  response.headers.append("Link", links.join(", "));
  return response;
}

function withVaryAccept(response: Response): Response {
  const copy = new Response(response.body, response);
  const vary = copy.headers.get("Vary");
  const varies = (vary ?? "").split(",").map((v) => v.trim().toLowerCase());
  if (!varies.includes("accept") && !varies.includes("*")) {
    copy.headers.set("Vary", vary ? `${vary}, Accept` : "Accept");
  }
  return copy;
}

function notAcceptable(): Response {
  return new Response(
    "406 Not Acceptable. Pages on this site are available as text/html and text/markdown.\n",
    {
      status: 406,
      headers: { "Content-Type": "text/plain; charset=utf-8", Vary: "Accept" },
    },
  );
}

function markdownNotFound(pathname: string, method: string): Response {
  const body = `# 404: Page not found

There is no page at \`${pathname}\` on clairvoyance.fyi.

- [Home](${SITE}/): what Clairvoyance is and how to install it
- [All skills](${SITE}/skills): the full catalog of software design skills
- [llms.txt](${SITE}/llms.txt): a Markdown index of the site for agents
- [llms-full.txt](${SITE}/llms-full.txt): every skill in one file
- [Sitemap](${SITE}/sitemap-index.xml)
`;
  return new Response(method === "HEAD" ? null : body, {
    status: 404,
    headers: { "Content-Type": MARKDOWN_TYPE, Vary: "Accept" },
  });
}
