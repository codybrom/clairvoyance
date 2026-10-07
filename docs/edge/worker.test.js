import { test } from "node:test";
import assert from "node:assert/strict";
import { negotiate } from "./worker.js";

const SITE = "https://clairvoyance.fyi";
const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

// Stands in for GitHub Pages: serves a fixed set of paths, 404s everything else.
function fakeOrigin(files) {
  const calls = [];
  const fetchOrigin = async (request) => {
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

const html = (body) => ({ body, type: "text/html; charset=utf-8" });
const md = (body) => ({ body, type: "text/markdown; charset=utf-8" });

const origin = () =>
  fakeOrigin({
    "/": html("<h1>Home</h1>"),
    "/index.md": md("# Clairvoyance\n\nHome in Markdown."),
    "/skills/deep-modules/": html("<h1>Deep Modules</h1>"),
    "/skills/deep-modules.md": md("# Deep Modules"),
    "/about/": html("<h1>About</h1>"),
    "/llms.txt": { body: "# Clairvoyance", type: "text/plain; charset=utf-8" },
    "/og.png": { body: "PNG", type: "image/png" },
  });

function get(path, accept, method = "GET") {
  const headers = accept === undefined ? {} : { Accept: accept };
  return new Request(SITE + path, { method, headers });
}

function varyIncludesAccept(response) {
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
  assert.match(res.headers.get("Vary"), /accept-encoding/i);
});

test("serves HTML with Vary: Accept when HTML is requested", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", "text/html"), fetchOrigin);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Content-Type"), /^text\/html/);
  assert.ok(varyIncludesAccept(res));
  assert.equal(await res.text(), "<h1>Home</h1>");
});

test("serves HTML to a typical browser Accept header", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(get("/", BROWSER_ACCEPT), fetchOrigin);
  assert.match(res.headers.get("Content-Type"), /^text\/html/);
});

test("serves HTML for wildcard-only or missing Accept headers", async () => {
  for (const accept of ["*/*", "text/*", undefined]) {
    const { fetchOrigin } = origin();
    const res = await negotiate(get("/", accept), fetchOrigin);
    assert.match(
      res.headers.get("Content-Type"),
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
    assert.match(res.headers.get("Content-Type"), /^text\/html/);
  }
  {
    const { fetchOrigin } = origin();
    const res = await negotiate(
      get("/", "text/html;q=0.5, text/markdown"),
      fetchOrigin,
    );
    assert.match(res.headers.get("Content-Type"), /^text\/markdown/);
  }
  {
    const { fetchOrigin } = origin();
    const res = await negotiate(
      get("/", "text/markdown;q=0, */*"),
      fetchOrigin,
    );
    assert.match(res.headers.get("Content-Type"), /^text\/html/);
  }
});

test("prefers Markdown when the client lists it alongside HTML at equal weight", async () => {
  const { fetchOrigin } = origin();
  const res = await negotiate(
    get("/", "text/markdown, text/html"),
    fetchOrigin,
  );
  assert.match(res.headers.get("Content-Type"), /^text\/markdown/);
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
