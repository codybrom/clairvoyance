// Cloudflare Worker in front of the GitHub Pages origin for clairvoyance.fyi.
//
// GitHub Pages serves one representation per URL and can't set headers, so
// content negotiation (RFC 9110 §12.5.1) happens here. The Astro build emits a
// Markdown twin next to each page (`/` → `/index.md`, `/skills/x/` →
// `/skills/x.md`). A request for a page that prefers `text/markdown` gets that
// twin; everything else is proxied to the origin unchanged. Page responses
// always carry `Vary: Accept` so caches keep the two representations apart.

const SITE = "https://clairvoyance.fyi";
const MARKDOWN_TYPE = "text/markdown; charset=utf-8";

export default {
  fetch: (request) => negotiate(request, fetch),
};

/**
 * Serves `request`, choosing between the HTML page and its Markdown twin.
 * `fetchOrigin` fetches from the origin; it is `fetch` in production.
 */
export async function negotiate(request, fetchOrigin) {
  const url = new URL(request.url);
  if (!isPageRequest(request, url)) return fetchOrigin(request);

  const choice = chooseRepresentation(request.headers.get("Accept"));
  if (choice === "none") return notAcceptable();
  if (choice === "html") return withVaryAccept(await fetchOrigin(request));

  const markdown = await fetchOrigin(new Request(markdownUrl(url), request));
  if (markdown.ok) {
    const response = withVaryAccept(markdown);
    response.headers.set("Content-Type", MARKDOWN_TYPE);
    return response;
  }

  // No Markdown twin: either the page doesn't exist, or it's HTML-only. RFC
  // 9110 lets a server send a representation the client didn't prefer, and
  // HTML is more useful to an agent than a 406.
  const page = await fetchOrigin(request);
  if (page.status === 404)
    return markdownNotFound(url.pathname, request.method);
  return withVaryAccept(page);
}

// Only extensionless GET/HEAD paths are pages; files such as /llms.txt or
// /og.png have a single representation and pass straight through.
function isPageRequest(request, url) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const lastSegment = url.pathname.split("/").pop();
  return !lastSegment.includes(".");
}

// Returns "markdown", "html", or "none" (neither is acceptable). Ties go to
// HTML unless the client named text/markdown explicitly, so a bare `*/*` keeps
// getting HTML while an agent that lists `text/markdown, text/html` gets
// Markdown.
function chooseRepresentation(acceptHeader) {
  const ranges = parseAccept(acceptHeader || "*/*");
  const markdown = quality(ranges, "text", "markdown");
  const html = quality(ranges, "text", "html");

  if (markdown.q === 0 && html.q === 0) return "none";
  if (markdown.q > html.q) return "markdown";
  if (markdown.q === html.q && markdown.exact) return "markdown";
  return "html";
}

function parseAccept(header) {
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
function quality(ranges, type, subtype) {
  let best = { specificity: -1, q: 0 };
  for (const range of ranges) {
    let specificity;
    if (range.type === type && range.subtype === subtype) specificity = 2;
    else if (range.type === type && range.subtype === "*") specificity = 1;
    else if (range.type === "*" && range.subtype === "*") specificity = 0;
    else continue;
    if (specificity > best.specificity) best = { specificity, q: range.q };
  }
  return { q: best.q, exact: best.specificity === 2 };
}

// `/` → `/index.md`; `/skills/deep-modules/` → `/skills/deep-modules.md`.
function markdownUrl(url) {
  const path = url.pathname.replace(/\/+$/, "") || "/index";
  return new URL(`${path}.md`, url).href;
}

function withVaryAccept(response) {
  const copy = new Response(response.body, response);
  const vary = copy.headers.get("Vary");
  const varies = (vary ?? "").split(",").map((v) => v.trim().toLowerCase());
  if (!varies.includes("accept") && !varies.includes("*")) {
    copy.headers.set("Vary", vary ? `${vary}, Accept` : "Accept");
  }
  return copy;
}

function notAcceptable() {
  return new Response(
    "406 Not Acceptable. Pages on this site are available as text/html and text/markdown.\n",
    {
      status: 406,
      headers: { "Content-Type": "text/plain; charset=utf-8", Vary: "Accept" },
    },
  );
}

function markdownNotFound(pathname, method) {
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
