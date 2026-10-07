// Checks the built site in dist/ (run `npm run build` first): the machine-
// readable signals agents look for, and the Markdown twins that the edge
// Worker (edge/worker.js) serves for content negotiation.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { negotiate } from "../edge/worker.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const SKILLS_DIR = path.resolve(ROOT, "..", "skills");
const SITE = "https://clairvoyance.fyi";

const skillSlugs = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(
    (d) =>
      d.isDirectory() &&
      fs.existsSync(path.join(SKILLS_DIR, d.name, "SKILL.md")),
  )
  .map((d) => d.name);

function read(relativePath) {
  return fs.readFileSync(path.join(DIST, relativePath), "utf-8");
}

function visibleText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mainText(html) {
  const main = html.match(/<main[\s\S]*<\/main>/);
  return visibleText(main ? main[0] : html);
}

function jsonLd(html) {
  return [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));
}

function canonicalOf(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
}

// Serves dist/ the way GitHub Pages does: /x/ → x/index.html, files by path.
async function pagesOrigin(request) {
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
  const md = read("index.md");
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
    const firstHeading = source.match(/^#\s+.+$/m)[0];
    assert.ok(md.includes(firstHeading), slug);
    assert.ok(!md.startsWith("---"), `${slug}: frontmatter stripped`);
  }
});

test("the skills index has a Markdown twin listing every skill", () => {
  const md = read("skills.md");
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

// ── Edge Worker against the real build ─────────────────────────────

test("the Worker serves dist/index.md for the homepage when Markdown is requested", async () => {
  const req = new Request(`${SITE}/`, { headers: { Accept: "text/markdown" } });
  const res = await negotiate(req, pagesOrigin);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.match(res.headers.get("Vary"), /Accept/);
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
