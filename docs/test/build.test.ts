// Checks the built site in dist/ (run `npm run build` first): the machine-
// readable signals agents look for, and the Markdown twins that the edge
// Worker (edge/worker.js) serves for content negotiation.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { execFileSync } from "node:child_process";
import { handle, negotiate } from "../edge/worker.ts";
import { registerWebMcpTools, type ModelContext } from "../src/utils/webmcp.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const SKILLS_DIR = path.resolve(ROOT, "..", "skills");
const SITE = "https://clairvoyance.fyi";
const MCP_URL = `${SITE}/mcp`;

const skillSlugs = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(
    (d) =>
      d.isDirectory() &&
      fs.existsSync(path.join(SKILLS_DIR, d.name, "SKILL.md")),
  )
  .map((d) => d.name);

function read(relativePath: string): string {
  return fs.readFileSync(path.join(DIST, relativePath), "utf-8");
}

function visibleText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mainText(html: string): string {
  const main = html.match(/<main[\s\S]*<\/main>/);
  return visibleText(main ? main[0] : html);
}

function jsonLd(html: string): Record<string, any>[] {
  return [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));
}

// The Markdown twins open with a flat YAML block whose values are JSON
// strings (valid YAML double-quoted scalars).
function frontmatter(md: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = md.match(/^---\n([\s\S]*?)\n---\n\n/);
  if (!match) throw new Error(`no frontmatter block: ${md.slice(0, 60)}`);
  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [, key, value] = line.match(/^([\w-]+): (.*)$/)!;
    data[key] = JSON.parse(value);
  }
  return { data, body: md.slice(match[0].length) };
}

function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function lastCommitDate(file: string): string {
  return execFileSync("git", ["log", "-1", "--format=%aI", "--", file], {
    encoding: "utf-8",
  }).trim();
}

function distPath(url: string): string {
  const { pathname } = new URL(url, SITE);
  if (pathname.endsWith("/")) return `${pathname}index.html`;
  return (pathname.split("/").pop() ?? "").includes(".")
    ? pathname
    : `${pathname}/index.html`;
}

interface DiscoveryIndex {
  $schema: string;
  skills: {
    name: string;
    type: string;
    description: string;
    url: string;
    digest: string;
  }[];
}

function discoveryIndex(): DiscoveryIndex {
  return JSON.parse(read(".well-known/agent-skills/index.json"));
}

function canonicalOf(html: string): string | undefined {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
}

// Serves dist/ the way GitHub Pages does: /x/ → x/index.html, files by path.
async function pagesOrigin(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  let file = path.join(DIST, decodeURIComponent(pathname));
  if (pathname.endsWith("/")) file = path.join(file, "index.html");
  if (
    !file.startsWith(DIST) ||
    !fs.existsSync(file) ||
    fs.statSync(file).isDirectory()
  ) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }
  const type = file.endsWith(".md")
    ? "text/markdown; charset=utf-8"
    : "text/html; charset=utf-8";
  return new Response(fs.readFileSync(file), {
    headers: { "Content-Type": type },
  });
}

test("dist/ exists (run `npm run build` first)", () => {
  assert.ok(fs.existsSync(path.join(DIST, "index.html")));
});

// ── Homepage metadata ───────────────────────────────────────────────

test("homepage declares lang, canonical, og:image and og:type", () => {
  const html = read("index.html");
  assert.match(html, /<html lang="en"/);
  assert.equal(canonicalOf(html), `${SITE}/`);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/clairvoyance\.fyi\/og\.png"/,
  );
  assert.match(html, /<meta property="og:type" content="website"/);
});

test("homepage has SoftwareApplication JSON-LD describing the project", () => {
  const blocks = jsonLd(read("index.html"));
  const app = blocks.find((b) => b["@type"] === "SoftwareApplication");
  assert.ok(app, "SoftwareApplication JSON-LD present");
  assert.equal(app["@context"], "https://schema.org");
  assert.equal(app.name, "Clairvoyance");
  assert.equal(app.url, `${SITE}/`);
  assert.ok(app.description.length > 20);
  assert.equal(app.applicationCategory, "DeveloperApplication");
  assert.equal(app.offers["@type"], "Offer");
  assert.equal(app.offers.price, "0");
  assert.equal(app.author["@type"], "Person");
  assert.ok(app.sameAs.includes("https://github.com/codybrom/clairvoyance"));
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, "..", "package.json"), "utf-8"),
  );
  assert.equal(app.softwareVersion, pkg.version);
});

// ── Trust pages ────────────────────────────────────────────────────

for (const page of ["about", "contact", "privacy"]) {
  test(`/${page} has at least 500 characters of content and a canonical URL`, () => {
    const html = read(`${page}/index.html`);
    assert.ok(
      mainText(html).length >= 500,
      `${page}: ${mainText(html).length} chars`,
    );
    assert.equal(canonicalOf(html), `${SITE}/${page}`);
  });
}

test("/contact gives a way to reach the maintainer", () => {
  const html = read("contact/index.html");
  assert.match(
    html,
    /href="https:\/\/github\.com\/codybrom\/clairvoyance\/issues/,
  );
  assert.match(html, /href="mailto:esp@clairvoyance\.fyi"/);
});

test("site footers link to About, Contact and Privacy", () => {
  for (const file of [
    "index.html",
    "skills/index.html",
    "skills/deep-modules/index.html",
  ]) {
    const html = read(file);
    for (const href of ["/about", "/contact", "/privacy"]) {
      assert.ok(html.includes(`href="${href}"`), `${file} links ${href}`);
    }
  }
});

// ── Markdown twins ─────────────────────────────────────────────────

test("index.md summarizes the homepage: install commands and every skill", () => {
  const md = frontmatter(read("index.md")).body;
  assert.match(md, /^# Clairvoyance\n/);
  assert.ok(md.includes("/plugin marketplace add codybrom/clairvoyance"));
  assert.ok(md.includes("npx skills add codybrom/clairvoyance --skill '*'"));
  for (const slug of skillSlugs) {
    assert.ok(md.includes(`${SITE}/skills/${slug}`), `links ${slug}`);
  }
});

test("every skill page has a Markdown twin with the skill's body", () => {
  for (const slug of skillSlugs) {
    const md = read(`skills/${slug}.md`);
    const source = fs.readFileSync(
      path.join(SKILLS_DIR, slug, "SKILL.md"),
      "utf-8",
    );
    const firstHeading = source.match(/^#\s+.+$/m)![0];
    const twin = frontmatter(md);
    assert.ok(twin.body.startsWith(firstHeading), slug);
    assert.ok(
      !twin.body.includes("\nname: "),
      `${slug}: SKILL.md frontmatter stripped`,
    );
  }
});

test("the skills index has a Markdown twin listing every skill", () => {
  const md = frontmatter(read("skills.md")).body;
  assert.match(md, /^# /);
  for (const slug of skillSlugs)
    assert.ok(md.includes(`${SITE}/skills/${slug}`), slug);
});

for (const page of ["about", "contact", "privacy"]) {
  test(`/${page} has a Markdown twin carrying the same headings as the HTML`, () => {
    const md = read(`${page}.md`);
    const html = read(`${page}/index.html`);
    const mdHeadings = [...md.matchAll(/^#{1,2} (.+)$/gm)].map((m) =>
      m[1].trim(),
    );
    const htmlHeadings = [
      ...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/g),
    ].map((m) => visibleText(m[1]));
    assert.ok(mdHeadings.length >= 3, page);
    assert.deepEqual(mdHeadings, htmlHeadings);
  });
}

test("every Markdown twin opens with title, description and canonical frontmatter", () => {
  const twins = [
    ["index.md", `${SITE}/`],
    ["skills.md", `${SITE}/skills`],
    ["about.md", `${SITE}/about`],
    ["contact.md", `${SITE}/contact`],
    ["privacy.md", `${SITE}/privacy`],
    ...skillSlugs.map((s) => [`skills/${s}.md`, `${SITE}/skills/${s}`]),
  ];
  for (const [file, canonical] of twins) {
    const fm = frontmatter(read(file));
    assert.ok(fm, `${file} has frontmatter`);
    assert.ok(fm.data.title, `${file} title`);
    assert.ok(fm.data.description, `${file} description`);
    assert.equal(fm.data.canonical, canonical, file);
  }
});

test("skill twins carry the skill's last commit date", () => {
  for (const slug of skillSlugs) {
    const fm = frontmatter(read(`skills/${slug}.md`));
    const date = lastCommitDate(path.join(SKILLS_DIR, slug, "SKILL.md"));
    assert.equal(fm.data.last_updated, date, slug);
  }
});

test("every HTML page in the build has a Markdown twin", () => {
  const pages = fs
    .readdirSync(DIST, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith("index.html"))
    .map((f) => "/" + f.replace(/index\.html$/, ""));
  assert.ok(pages.length > 5);
  for (const page of pages) {
    const twin = (page.replace(/\/$/, "") || "/index") + ".md";
    assert.ok(fs.existsSync(path.join(DIST, twin)), `${page} → ${twin}`);
  }
});

// ── Links agents follow ────────────────────────────────────────────

test("llms.txt links each skill to its Markdown twin on this site", () => {
  const llms = read("llms.txt");
  for (const slug of skillSlugs) {
    assert.ok(llms.includes(`](${SITE}/skills/${slug}.md)`), slug);
  }
  assert.ok(!llms.includes("raw.githubusercontent.com"));
});

test("every clairvoyance.fyi link in llms.txt resolves in the build", () => {
  const llms = read("llms.txt");
  const links = [
    ...llms.matchAll(/\]\((https:\/\/clairvoyance\.fyi[^)]*)\)/g),
  ].map((m) => m[1]);
  assert.ok(links.length > skillSlugs.length);
  // /mcp is served by the edge Worker, not the static build.
  for (const link of new Set(links).difference(new Set([MCP_URL]))) {
    assert.ok(fs.existsSync(path.join(DIST, distPath(link))), link);
  }
});

test("skill pages advertise their on-site Markdown twin", () => {
  for (const slug of skillSlugs) {
    const html = read(`skills/${slug}/index.html`);
    const href = html.match(
      /<link rel="alternate" type="text\/markdown" href="([^"]+)"/,
    )?.[1];
    assert.equal(href, `${SITE}/skills/${slug}.md`, slug);
  }
});

test("install.md covers each platform from the README", () => {
  const fm = frontmatter(read("install.md"));
  assert.equal(fm.data.canonical, `${SITE}/install`);
  for (const platform of [
    "Claude Code",
    "Codex",
    "Cursor",
    "OpenCode",
    "Antigravity",
  ]) {
    assert.match(fm.body, new RegExp(`^### .*${platform}`, "m"), platform);
  }
  const relative = [
    ...fm.body.matchAll(/\]\((?![a-z][a-z0-9+.-]*:|#)([^)]*)\)/g),
  ].map((m) => m[1]);
  assert.deepEqual(relative, [], "no repo-relative links");
});

// ── /install ───────────────────────────────────────────────────────

const installPlatforms = () =>
  [...frontmatter(read("install.md")).body.matchAll(/^### (.+)$/gm)].map(
    (m) => {
      const name = m[1].replace(/^\[([^\]]+)\]\([^)]*\)$/, "$1");
      return {
        name,
        id: name
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, "")
          .replace(/ /g, "-"),
      };
    },
  );

test("/install has a canonical URL and a panel for every platform in install.md", () => {
  const html = read("install/index.html");
  assert.equal(canonicalOf(html), `${SITE}/install`);
  const platforms = installPlatforms();
  assert.ok(platforms.length >= 10);
  for (const { id, name } of platforms) {
    assert.match(html, new RegExp(`id="${id}"[^>]*role="tabpanel"`), id);
    assert.match(
      html,
      new RegExp(
        `href="#${id}"[^>]*>\\s*(?:<svg[\\s\\S]*?</svg>)?\\s*${name}\\s*<`,
      ),
      `${id} chip`,
    );
  }
  assert.ok(
    platforms.some((p) => p.id === "llmstxt"),
    "llms.txt option",
  );
  const ids = platforms.map((p) => p.id);
  assert.deepEqual(ids, [...new Set(ids)], "one panel per platform");
});

test("/install shows every install command from the README", () => {
  const html = read("install/index.html");
  const readme = fs.readFileSync(path.join(ROOT, "..", "README.md"), "utf-8");
  const install = readme.slice(
    readme.indexOf("\n## Installation"),
    readme.indexOf("\n## ", readme.indexOf("\n## Installation") + 1),
  );
  const commands = [...install.matchAll(/```bash\n([\s\S]*?)```/g)].flatMap(
    (m) => m[1].trim().split("\n"),
  );
  assert.ok(commands.length >= 10);
  const text = html
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  for (const command of commands) assert.ok(text.includes(command), command);
});

test("/install lists every skill with its pillar and a link to its page", () => {
  const html = read("install/index.html");
  for (const slug of skillSlugs)
    assert.ok(html.includes(`href="/skills/${slug}"`), slug);
});

test("the homepage hero links agent chips into /install", () => {
  const home = read("index.html");
  const install = read("install/index.html");
  const chips = [...home.matchAll(/href="\/install#([a-z0-9-]+)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(chips, [
    "claude-code",
    "codex",
    "cursor",
    "opencode",
    "antigravity",
    "skillssh",
  ]);
  for (const id of chips) assert.match(install, new RegExp(`id="${id}"`), id);
  assert.ok(home.includes('href="/install"'), "More… chip");
  assert.ok(!home.includes("install-box"), "old install box removed");
});

test("agent chips show a logo for every agent that has one", () => {
  const logos = fs
    .readdirSync(path.join(ROOT, "src/assets/agents"))
    .map((f) => f.replace(/\.svg$/, ""));
  assert.ok(logos.length >= 6);
  const install = read("install/index.html");
  const home = read("index.html");
  const chip = (html: string, href: string) =>
    html.match(new RegExp(`<a href="${href}"[^>]*>([\\s\\S]*?)</a>`))?.[1] ??
    "";
  for (const id of [...logos, "skillssh", "llmstxt"]) {
    assert.match(chip(install, `#${id}`), /<svg/, `/install chip ${id}`);
  }
  for (const id of [
    "claude-code",
    "codex",
    "cursor",
    "opencode",
    "antigravity",
    "skillssh",
  ]) {
    assert.match(chip(home, `/install#${id}`), /<svg/, `hero chip ${id}`);
  }
});

test("the retired Gemini CLI is no longer offered as an install option", () => {
  for (const file of [
    "install.md",
    "install/index.html",
    "agent-setup.md",
    "index.html",
    "index.md",
    "llms.txt",
    "about/index.html",
  ]) {
    assert.ok(!read(file).includes("Gemini CLI"), file);
  }
});

test("llms.txt points agents at the on-site install guide", () => {
  assert.ok(read("llms.txt").includes(`(${SITE}/install.md)`));
});

// ── Agent setup prompt ─────────────────────────────────────────────

const SETUP_URL = `${SITE}/agent-setup.md`;

test("agent-setup.md tells the agent to run the install itself, per platform", () => {
  const md = read("agent-setup.md");
  assert.match(md, /^# Install Clairvoyance\n/);
  assert.match(md, /run(ning)? the commands yourself/i);
  assert.match(md, /^## Updating$/m);
  assert.ok(
    md.includes("/plugin update clairvoyance"),
    "update commands included",
  );
  for (const { name } of installPlatforms()) {
    assert.match(
      md,
      new RegExp(`^### .*${name.replace(/[.]/g, "\\.")}`, "m"),
      name,
    );
  }
});

test("agent-setup.md gives Claude Code shell commands, not slash commands", () => {
  const md = read("agent-setup.md");
  const claude = md.slice(
    md.indexOf("### Claude Code"),
    md.indexOf("\n### ", md.indexOf("### Claude Code") + 1),
  );
  assert.ok(
    claude.includes("claude plugin marketplace add codybrom/clairvoyance"),
  );
  assert.ok(
    claude.includes("claude plugin install clairvoyance@clairvoyance-plugins"),
  );
  assert.ok(!/^\/plugin /m.test(claude), "no slash commands to run");
  assert.ok(
    claude.includes("/reload-plugins"),
    "tells the user how to activate",
  );
});

test("agent-setup.md offers the MCP server as a fallback, with commands an agent can run", () => {
  const md = read("agent-setup.md");
  assert.match(
    md,
    /can't install plugins or skills.*MCP/i,
    "the steps point at the fallback",
  );
  const section = md.slice(md.indexOf("## MCP server"));
  assert.ok(md.includes("## MCP server"), "has an MCP section");
  for (const expected of [
    MCP_URL,
    `claude mcp add --transport http clairvoyance ${MCP_URL}`,
    `codex mcp add clairvoyance --url ${MCP_URL}`,
    `code --add-mcp '{"name":"clairvoyance","type":"http","url":"${MCP_URL}"}'`,
    `"clairvoyance": { "url": "${MCP_URL}" }`,
  ]) {
    assert.ok(section.includes(expected), expected);
  }
});

test("the hero and /install offer the copy-prompt setup button", () => {
  for (const file of ["index.html", "install/index.html"]) {
    const html = read(file);
    const prompt = html.match(/data-prompt="([^"]+)"/)?.[1];
    assert.ok(prompt, `${file} has the button`);
    assert.ok(
      prompt.includes(SETUP_URL),
      `${file} prompt points at agent-setup.md`,
    );
  }
  assert.ok(fs.existsSync(path.join(DIST, "agent-setup.md")));
});

test("llms.txt links the agent setup instructions", () => {
  assert.ok(read("llms.txt").includes(`(${SETUP_URL})`));
});

// ── MCP server ─────────────────────────────────────────────────────

async function mcp(method: string, params: unknown) {
  const req = new Request(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await handle(req, pagesOrigin)).json();
}

test("the MCP server lists the same tools as /tools.json", async () => {
  const { tools } = JSON.parse(read("tools.json"));
  const { result } = await mcp("tools/list", {});
  assert.deepEqual(
    result.tools.map((t: { name: string }) => t.name),
    tools.map((t: { name: string }) => t.name),
  );
});

test("the MCP server reports the Claude Code plugin's version", async () => {
  const plugin = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "..", ".claude-plugin", "plugin.json"),
      "utf-8",
    ),
  );
  const { result } = await mcp("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
  });
  assert.equal(result.serverInfo.version, plugin.version);
});

// The skills' own frontmatter, which the plugin exposes to agents.
const skillMeta = Object.fromEntries(
  skillSlugs.map((slug) => {
    const raw = fs.readFileSync(
      path.join(SKILLS_DIR, slug, "SKILL.md"),
      "utf-8",
    );
    return [
      slug,
      matter(raw).data as {
        name: string;
        description: string;
        "argument-hint": string;
      },
    ];
  }),
);

const referenceFiles = Object.fromEntries(
  skillSlugs.map((slug) => {
    const dir = path.join(SKILLS_DIR, slug, "references");
    return [slug, fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []];
  }),
);

test("the MCP server offers each skill as a tool with the skill's own name and description, plus fetch-reference", async () => {
  const { result } = await mcp("tools/list", {});
  const tools = result.tools as {
    name: string;
    description: string;
    annotations: { readOnlyHint: boolean };
  }[];
  assert.deepEqual(
    tools.map((t) => t.name).sort(),
    [...skillSlugs, "fetch-reference"].sort(),
  );
  for (const slug of skillSlugs) {
    const tool = tools.find((t) => t.name === slug)!;
    assert.equal(tool.description, skillMeta[slug].description, slug);
    assert.equal(tool.annotations.readOnlyHint, true, slug);
  }
});

test("each skill tool returns the skill", async () => {
  for (const slug of skillSlugs) {
    const { result } = await mcp("tools/call", { name: slug, arguments: {} });
    const text: string = result.content[0].text;
    assert.equal(text, read(`tools/skills/${slug}.md`), slug);
    const source = fs.readFileSync(
      path.join(SKILLS_DIR, slug, "SKILL.md"),
      "utf-8",
    );
    assert.ok(text.includes(source.match(/^#\s+.+$/m)![0]), `${slug} body`);
  }
});

test("skill tools point at fetch-reference for every supporting file", async () => {
  for (const [slug, files] of Object.entries(referenceFiles)) {
    const text = read(`tools/skills/${slug}.md`);
    for (const file of files) {
      assert.ok(
        text.includes(`skill: "${slug}", file: "${file}"`),
        `${slug} → ${file}`,
      );
    }
  }
});

test("fetch-reference returns each reference file verbatim", async () => {
  for (const [slug, files] of Object.entries(referenceFiles)) {
    for (const file of files) {
      const { result } = await mcp("tools/call", {
        name: "fetch-reference",
        arguments: { skill: slug, file },
      });
      const source = fs.readFileSync(
        path.join(SKILLS_DIR, slug, "references", file),
        "utf-8",
      );
      assert.equal(result.content[0].text, source, `${slug}/${file}`);
    }
  }
});

test("design-it-twice's tool hands the agent the clean-room-alternative brief to run as its own subagent", async () => {
  const text = read("tools/skills/design-it-twice.md");
  const agent = matter(
    fs.readFileSync(
      path.join(ROOT, "..", "agents", "clean-room-alternative.md"),
      "utf-8",
    ),
  );
  const brief = agent.content
    .trim()
    .replace(
      /^(#+) /gm,
      (_, h: string) => `${"#".repeat(Math.min(h.length + 2, 6))} `,
    );
  assert.ok(
    text.includes(`### Brief\n\n${brief}`),
    "brief included, headings nested under it",
  );
  assert.match(text, /start (a|one) subagent/i);
  assert.ok(
    text.includes(`limit it to these tools: ${agent.data.tools}`),
    "tool limits come from the agent's frontmatter",
  );
  assert.ok(
    text.includes(agent.data.model),
    "model comes from the agent's frontmatter",
  );
  assert.ok(!text.includes("limit it to reading files"), "nothing hardcoded");
  assert.ok(
    text.includes("pre-mortem-fallback.md"),
    "fallback when subagents aren't available",
  );
});

test("the privacy policy covers the MCP server instead of denying it exists", () => {
  const privacy = read("privacy.md");
  assert.ok(privacy.includes(MCP_URL), "names the server");
  assert.match(
    privacy,
    /only the name of the skill/,
    "says what a request carries",
  );
  assert.ok(!privacy.includes("arguments"), "no free-text input to describe");
  for (const claim of [
    "has no MCP servers",
    "does not operate any servers",
    "Last updated: February 27, 2026",
  ]) {
    assert.ok(!privacy.includes(claim), claim);
  }
  assert.ok(!read("about.md").includes("runs no servers"), "About page agrees");
});

test("skill tools and prompts take no input, so a request carries only the skill's name", async () => {
  const tools = (await mcp("tools/list", {})).result.tools;
  const prompts = (await mcp("prompts/list", {})).result.prompts;
  for (const slug of skillSlugs) {
    const tool = tools.find((t: { name: string }) => t.name === slug);
    assert.deepEqual(tool.inputSchema.properties, {}, `${slug} tool`);
    const prompt = prompts.find((p: { name: string }) => p.name === slug);
    assert.ok(!prompt.arguments?.length, `${slug} prompt`);
  }
});

test("the MCP version of each skill fills $ARGUMENTS with its argument-hint at build time", () => {
  for (const slug of skillSlugs) {
    const text = read(`tools/skills/${slug}.md`);
    assert.ok(!text.includes("$ARGUMENTS"), slug);
    const hint = skillMeta[slug]["argument-hint"].replace(/^\[|\]$/g, "");
    assert.ok(text.includes(`When invoked with a ${hint},`), slug);
  }
});

test("the MCP server offers each skill as a prompt for slash-command clients", async () => {
  const list = await mcp("prompts/list", {});
  assert.deepEqual(
    list.result.prompts.map((p: { name: string }) => p.name).sort(),
    [...skillSlugs].sort(),
  );
  const got = await mcp("prompts/get", { name: "red-flags", arguments: {} });
  const message = got.result.messages[0];
  assert.equal(message.role, "user");
  assert.equal(message.content.text, read("tools/skills/red-flags.md"));
});

test("the MCP server's instructions list every skill and don't send agents elsewhere to install", async () => {
  const { result } = await mcp("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
  });
  for (const slug of skillSlugs)
    assert.ok(result.instructions.includes(slug), slug);
  assert.doesNotMatch(result.instructions, /install/i);
  assert.deepEqual(result.capabilities, { tools: {}, prompts: {} });
});

test("skill pages' Markdown twins link reference files by absolute URL", () => {
  for (const [slug, files] of Object.entries(referenceFiles)) {
    const md = read(`skills/${slug}.md`);
    assert.ok(
      !md.includes("](references/"),
      `${slug} has no relative reference links`,
    );
    for (const file of files) {
      assert.ok(
        fs.existsSync(path.join(DIST, "skills", slug, "references", file)),
        `${slug}/${file} published`,
      );
    }
  }
  assert.ok(
    read("skills/comments-docs.md").includes(
      `](${SITE}/skills/comments-docs/references/comments-first-workflow.md)`,
    ),
  );
});

test("/install offers one-click MCP installs for VS Code and Cursor, and CLI commands", () => {
  const html = read("install/index.html").replace(/&amp;/g, "&");
  const vscode = html.match(/href="vscode:mcp\/install\?([^"]+)"/)?.[1];
  assert.ok(vscode, "VS Code link");
  assert.deepEqual(JSON.parse(decodeURIComponent(vscode)), {
    name: "clairvoyance",
    type: "http",
    url: MCP_URL,
  });
  const cursor = html.match(
    /href="cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?([^"]+)"/,
  )?.[1];
  assert.ok(cursor, "Cursor link");
  const query = new URLSearchParams(cursor);
  assert.equal(query.get("name"), "clairvoyance");
  assert.deepEqual(
    JSON.parse(Buffer.from(query.get("config") ?? "", "base64").toString()),
    { url: MCP_URL },
  );
  for (const command of [
    `claude mcp add --transport http clairvoyance ${MCP_URL}`,
    `codex mcp add clairvoyance --url ${MCP_URL}`,
  ]) {
    assert.ok(html.includes(command), command);
  }
});

test("install.md and llms.txt point agents at the MCP server", () => {
  const md = frontmatter(read("install.md")).body;
  assert.match(md, /^## MCP server$/m);
  assert.ok(md.includes(MCP_URL));
  assert.ok(read("llms.txt").includes(`(${MCP_URL})`));
});

test("the README documents the MCP server with the same commands the site generates", () => {
  const readme = fs.readFileSync(path.join(ROOT, "..", "README.md"), "utf-8");
  const section = readme.slice(
    readme.indexOf("\n## MCP server\n"),
    readme.indexOf("\n## ", readme.indexOf("\n## MCP server\n") + 1),
  );
  assert.ok(section.length > 100, "README has a top-level MCP server section");
  const commands = [
    ...frontmatter(read("install.md")).body.matchAll(
      /^- (?:Claude Code|Codex): `([^`]+)`/gm,
    ),
    ...read("agent-setup.md").matchAll(
      /^- (?:VS Code|Cursor): (?:add )?`([^`]+)`/gm,
    ),
  ].map((m) => m[1]);
  assert.equal(commands.length, 4);
  for (const command of commands) assert.ok(section.includes(command), command);
  assert.ok(
    !installPlatforms().some((p) => p.id === "mcp-server"),
    "not parsed as an install platform",
  );
  assert.match(
    frontmatter(read("install.md")).body,
    /MCP server:.*nothing to update/i,
    "Updating mentions it",
  );
});

// ── /mcp page ──────────────────────────────────────────────────────

test("/mcp has a page about the server listing every tool, with install options", () => {
  const html = read("mcp/index.html").replace(/&amp;/g, "&");
  assert.equal(canonicalOf(html), MCP_URL);
  const { tools } = JSON.parse(read("tools.json"));
  for (const tool of tools as { name: string }[]) {
    assert.match(
      html,
      new RegExp(`<code class="tool-name"[^>]*>${tool.name}</code>`),
      tool.name,
    );
  }
  assert.match(html, /href="vscode:mcp\/install\?/);
  assert.match(
    html,
    /href="cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?/,
  );
  assert.ok(
    html.includes(`claude mcp add --transport http clairvoyance ${MCP_URL}`),
  );
  assert.match(mainText(html), /only the name of the skill/);
  assert.ok(
    !/[^.]\.\.(?!\.)/.test(mainText(html)),
    "no doubled periods in summaries",
  );
  assert.ok(html.includes('href="/privacy"'));
});

test("/mcp has a Markdown twin, and /install links to the page", () => {
  const md = frontmatter(read("mcp.md"));
  assert.equal(md.data.canonical, MCP_URL);
  assert.ok(
    md.body.includes(`claude mcp add --transport http clairvoyance ${MCP_URL}`),
  );
  assert.ok(read("install/index.html").includes('href="/mcp"'));
});

test("the Worker serves the /mcp page to browsers and its twin to agents", async () => {
  const browser = await handle(
    new Request(MCP_URL, { headers: { Accept: "text/html" } }),
    pagesOrigin,
  );
  assert.equal(await browser.text(), read("mcp/index.html"));
  const agent = await handle(
    new Request(MCP_URL, { headers: { Accept: "text/markdown" } }),
    pagesOrigin,
  );
  assert.equal(await agent.text(), read("mcp.md"));
});

// ── MCP discovery: server card, ARD / AI Catalog, registry ─────────

const pluginVersion = () =>
  JSON.parse(fs.readFileSync(path.join(ROOT, "..", ".claude-plugin", "plugin.json"), "utf-8")).version;

test("the server card follows the v1 schema and matches the live server", async () => {
  const card = JSON.parse(read(".well-known/mcp/server-card.json"));
  assert.equal(card.$schema, "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json");
  assert.match(card.name, /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
  assert.ok(card.title && card.title.length <= 100);
  assert.ok(card.description.length > 0 && card.description.length <= 100, `${card.description.length} chars`);
  assert.equal(card.version, pluginVersion());
  assert.equal(card.tools, undefined, "agents trust the live tools/list");
  assert.deepEqual(card.remotes.map((r: { type: string; url: string }) => [r.type, r.url]), [["streamable-http", MCP_URL]]);
  assert.ok(card.icons.length > 0);
  for (const icon of card.icons) assert.ok(fs.existsSync(path.join(DIST, new URL(icon.src).pathname)), icon.src);
  const { result } = await mcp("initialize", { protocolVersion: "2025-11-25", capabilities: {} });
  assert.equal(result.serverInfo.name, card.name, "card and serverInfo agree");
  assert.equal(result.serverInfo.version, card.version);
  assert.deepEqual(card.remotes[0].supportedProtocolVersions[0], result.protocolVersion);
});

test("ARD and AI Catalog documents list the MCP server's card", () => {
  const ard = JSON.parse(read(".well-known/ard.json"));
  assert.deepEqual(JSON.parse(read(".well-known/ai-catalog.json")), ard, "one document at both paths");
  assert.equal(ard.specVersion, "1.0");
  const [entry] = ard.entries;
  assert.match(entry.identifier, /^urn:air:clairvoyance\.fyi:[a-z0-9-]+:[a-z0-9-]+$/);
  assert.ok(entry.displayName);
  assert.equal(entry.type, "application/mcp-server-card+json");
  assert.equal(entry.url, `${MCP_URL}/server-card`);
  assert.ok(entry.representativeQueries.length >= 2 && entry.representativeQueries.length <= 5);
  assert.deepEqual([...entry.capabilities].sort(), [...skillSlugs].sort());
  assert.match(read("index.html"), /<link rel="ard" href="\/\.well-known\/ard\.json"/);
});

test("server.json is ready for the MCP Registry and matches the server card", () => {
  const server = JSON.parse(fs.readFileSync(path.join(ROOT, "..", "server.json"), "utf-8"));
  const card = JSON.parse(read(".well-known/mcp/server-card.json"));
  assert.match(server.$schema, /^https:\/\/static\.modelcontextprotocol\.io\/schemas\/\d{4}-\d{2}-\d{2}\/server\.schema\.json$/);
  for (const key of ["name", "title", "description", "version", "websiteUrl"]) {
    assert.equal(server[key], card[key], key);
  }
  assert.deepEqual(server.remotes, [{ type: "streamable-http", url: MCP_URL }]);
  assert.match(fs.readFileSync(path.join(ROOT, "..", "scripts", "bump-version.sh"), "utf-8"), /"server\.json\|\.version"/);
});

// ── Agent guidance and structured data ─────────────────────────────

test("llms.txt says when to use Clairvoyance, and when not to", () => {
  const llms = read("llms.txt");
  const section = llms.slice(llms.indexOf("## When to use Clairvoyance"));
  assert.ok(llms.includes("## When to use Clairvoyance"));
  assert.ok((section.match(/^- /gm) ?? []).length >= 5, "names concrete jobs");
  assert.match(section, /Not for/i);
  assert.ok(llms.includes(`(${SITE}/skills/llms.txt)`) && llms.includes(`(${SITE}/mcp/llms.txt)`), "links the scoped files");
});

test("scoped llms.txt files cover the skills and the MCP server", () => {
  const skills = read("skills/llms.txt");
  assert.match(skills, /^# /);
  for (const slug of skillSlugs) assert.ok(skills.includes(`(${SITE}/skills/${slug}.md)`), slug);
  const mcpLlms = read("mcp/llms.txt");
  assert.match(mcpLlms, /^# /);
  assert.ok(mcpLlms.includes(MCP_URL));
  assert.ok(mcpLlms.includes("fetch-reference"));
});

test("skill pages carry TechArticle and BreadcrumbList JSON-LD", () => {
  for (const slug of skillSlugs) {
    const blocks = jsonLd(read(`skills/${slug}/index.html`));
    const article = blocks.find((b) => b["@type"] === "TechArticle")!;
    assert.ok(article, `${slug} article`);
    assert.equal(article.url, `${SITE}/skills/${slug}`);
    assert.equal(article.description, skillMeta[slug].description);
    assert.equal(article.dateModified, lastCommitDate(path.join(SKILLS_DIR, slug, "SKILL.md")));
    const crumbs = blocks.find((b) => b["@type"] === "BreadcrumbList")!;
    assert.deepEqual(
      crumbs.itemListElement.map((i: { position: number; item: string }) => [i.position, i.item]),
      [[1, `${SITE}/`], [2, `${SITE}/skills`], [3, `${SITE}/skills/${slug}`]],
    );
  }
});

// ── Sitemap ────────────────────────────────────────────────────────

test("every sitemap entry has a lastmod, and skill pages use the skill's commit date", () => {
  const xml = read("sitemap-0.xml");
  const entries = [
    ...xml.matchAll(
      /<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g,
    ),
  ];
  assert.ok(entries.length > skillSlugs.length);
  for (const [, loc, lastmod] of entries) assert.ok(lastmod, `${loc} lastmod`);
  const install = entries.find(([, loc]) => loc === `${SITE}/install/`);
  assert.equal(
    new Date(install![2]).getTime(),
    new Date(lastCommitDate(path.join(ROOT, "..", "README.md"))).getTime(),
  );
  for (const slug of skillSlugs) {
    const entry = entries.find(([, loc]) => loc === `${SITE}/skills/${slug}/`);
    const expected = new Date(
      lastCommitDate(path.join(SKILLS_DIR, slug, "SKILL.md")),
    );
    assert.equal(new Date(entry![2]).getTime(), expected.getTime(), slug);
  }
});

// ── Agent Skills discovery (agentskills.io discovery v0.2.0) ───────

test("/.well-known/agent-skills/index.json lists every skill per the v0.2.0 schema", () => {
  const index = discoveryIndex();
  assert.equal(
    index.$schema,
    "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  );
  assert.deepEqual(
    index.skills.map((s) => s.name).sort(),
    [...skillSlugs].sort(),
  );
  for (const skill of index.skills) {
    assert.match(
      skill.name,
      /^(?!-)(?!.*--)[a-z0-9-]{1,64}(?<!-)$/,
      skill.name,
    );
    assert.ok(
      skill.description.length > 0 && skill.description.length <= 1024,
      skill.name,
    );
    const hasResources =
      fs.readdirSync(path.join(SKILLS_DIR, skill.name)).length > 1;
    assert.equal(skill.type, hasResources ? "archive" : "skill-md", skill.name);
    assert.match(skill.digest, /^sha256:[0-9a-f]{64}$/);
  }
});

test("each index entry's digest matches the artifact served at its url", () => {
  const index = discoveryIndex();
  for (const skill of index.skills) {
    const file = path.join(
      DIST,
      new URL(skill.url, `${SITE}/.well-known/agent-skills/index.json`)
        .pathname,
    );
    assert.equal(
      `sha256:${sha256(fs.readFileSync(file))}`,
      skill.digest,
      skill.name,
    );
  }
});

test("skill-md artifacts are the SKILL.md source byte for byte", () => {
  const index = discoveryIndex();
  for (const skill of index.skills.filter((s) => s.type === "skill-md")) {
    const served = fs.readFileSync(path.join(DIST, skill.url));
    const source = fs.readFileSync(
      path.join(SKILLS_DIR, skill.name, "SKILL.md"),
    );
    assert.ok(served.equals(source), skill.name);
  }
});

test("archive artifacts hold the skill directory at their root", () => {
  const index = discoveryIndex();
  const archives = index.skills.filter((s) => s.type === "archive");
  assert.ok(archives.length > 0);
  for (const skill of archives) {
    assert.match(skill.url, /\.tar\.gz$/);
    const members = execFileSync("tar", ["-tzf", path.join(DIST, skill.url)], {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .sort();
    const expected = fs
      .readdirSync(path.join(SKILLS_DIR, skill.name), {
        recursive: true,
        encoding: "utf8",
      })
      .filter((f) => fs.statSync(path.join(SKILLS_DIR, skill.name, f)).isFile())
      .sort();
    assert.deepEqual(members, expected, skill.name);
    const extracted = execFileSync("tar", [
      "-xzOf",
      path.join(DIST, skill.url),
      "SKILL.md",
    ]);
    assert.ok(
      extracted.equals(
        fs.readFileSync(path.join(SKILLS_DIR, skill.name, "SKILL.md")),
      ),
    );
  }
});

// ── WebMCP ─────────────────────────────────────────────────────────

// Runs the WebMCP registration against a fake modelContext and a fetch backed
// by dist/, returning the tools it registered.
async function loadWebMcp() {
  const registered: Parameters<NonNullable<ModelContext["registerTool"]>>[0][] = [];
  const modelContext: ModelContext = {
    registerTool: (tool) => registered.push(tool),
  };
  await registerWebMcpTools({
    modelContext,
    fetch: (async (url: URL) => {
      const file = path.join(DIST, distPath(url.href));
      if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
      return new Response(fs.readFileSync(file));
    }) as typeof fetch,
    origin: SITE,
  });
  return registered;
}

test("pages load the WebMCP script", () => {
  for (const file of ["index.html", "skills/index.html", "about/index.html"]) {
    const html = read(file);
    const bundles = [
      ...html.matchAll(/<script type="module" src="(\/_astro\/[^"]+\.js)"/g),
    ].map((m) => read(m[1]));
    const inline = [
      ...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g),
    ].map((m) => m[1]);
    assert.ok(
      [...bundles, ...inline].some((code) => {
        const doc = code.indexOf("document.modelContext");
        const nav = code.indexOf("navigator.modelContext");
        return doc !== -1 && nav > doc;
      }),
      `${file} includes the WebMCP registration`,
    );
  }
});

test("WebMCP registers the same tools as the MCP server via document.modelContext", async () => {
  const tools = await loadWebMcp();
  assert.deepEqual(
    tools.map((t) => t.name).sort(),
    [...skillSlugs, "fetch-reference"].sort(),
  );
  for (const tool of tools) {
    assert.equal(tool.inputSchema.type, "object", tool.name);
    assert.equal(tool.annotations.readOnlyHint, true, tool.name);
  }
  for (const slug of skillSlugs) {
    assert.equal(
      tools.find((t) => t.name === slug)!.description,
      skillMeta[slug].description,
      slug,
    );
  }
});

test("WebMCP registers nothing in browsers without it", async () => {
  await registerWebMcpTools({ modelContext: undefined, fetch, origin: SITE });
});
test("WebMCP skill tools return the skill", async () => {
  const tools = await loadWebMcp();
  for (const slug of skillSlugs) {
    const result = await tools.find((t) => t.name === slug)!.execute({});
    assert.ok(!result.isError, slug);
    assert.equal(result.content[0].text, read(`tools/skills/${slug}.md`), slug);
  }
});

test("WebMCP reports a failed fetch as a tool error", async () => {
  const fetchReference = (await loadWebMcp()).find(
    (t) => t.name === "fetch-reference",
  )!;
  const result = await fetchReference.execute({
    skill: "red-flags",
    file: "no-such-file.md",
  });
  assert.equal(result.isError, true);
});

// ── Edge Worker against the real build ─────────────────────────────

test("the Worker serves dist/index.md for the homepage when Markdown is requested", async () => {
  const req = new Request(`${SITE}/`, { headers: { Accept: "text/markdown" } });
  const res = await negotiate(req, pagesOrigin);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.match(res.headers.get("Vary") ?? "", /Accept/);
  assert.equal(await res.text(), read("index.md"));
});

test("the Worker serves dist/index.html for the homepage when HTML is requested", async () => {
  const req = new Request(`${SITE}/`, { headers: { Accept: "text/html" } });
  const res = await negotiate(req, pagesOrigin);
  assert.equal(await res.text(), read("index.html"));
});

test("the Worker serves Markdown twins for every page in the build", async () => {
  const pages = [
    "/about/",
    "/contact/",
    "/privacy/",
    "/skills/",
    ...skillSlugs.map((s) => `/skills/${s}/`),
  ];
  for (const page of pages) {
    const req = new Request(SITE + page, {
      headers: { Accept: "text/markdown" },
    });
    const res = await negotiate(req, pagesOrigin);
    assert.equal(res.status, 200, page);
    assert.equal(
      res.headers.get("Content-Type"),
      "text/markdown; charset=utf-8",
      page,
    );
  }
});

test("the Worker answers unknown paths with a Markdown 404", async () => {
  const req = new Request(`${SITE}/__ora-404-probe`, {
    headers: { Accept: "text/markdown" },
  });
  const res = await negotiate(req, pagesOrigin);
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.ok((await res.text()).includes(`${SITE}/llms.txt`));
});
