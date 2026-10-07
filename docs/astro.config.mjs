import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Last commit date of the source behind a page, for the sitemap's <lastmod>.
// Needs full git history (deploy.yml checks out with fetch-depth: 0).
function lastCommitDate(...paths) {
  const date = execFileSync(
    "git",
    ["log", "-1", "--format=%aI", "--", ...paths],
    {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    },
  ).trim();
  return date || undefined;
}

function sourceOf(pathname) {
  const skill = pathname.match(/^\/skills\/([^/]+)\/$/);
  if (skill) return [`skills/${skill[1]}/SKILL.md`];
  if (pathname === "/install/") return ["README.md"];
  const info = pathname.match(/^\/(about|contact|privacy)\/$/);
  if (info) return [`docs/src/content/info/${info[1]}.md`];
  // The homepage and /skills list every skill, so they change when any does.
  return ["skills", "docs/src"];
}

export default defineConfig({
  site: "https://clairvoyance.fyi",
  integrations: [
    sitemap({
      serialize(item) {
        item.lastmod = lastCommitDate(...sourceOf(new URL(item.url).pathname));
        return item;
      },
    }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Instrument Serif",
      cssVariable: "--font-serif",
      weights: [400],
      styles: ["normal", "italic"],
    },
    {
      provider: fontProviders.google(),
      name: "IBM Plex Mono",
      cssVariable: "--font-mono",
      weights: [300, 400, 500],
    },
    {
      provider: fontProviders.google(),
      name: "Outfit",
      cssVariable: "--font-sans",
      weights: [200, 300, 400, 500],
    },
  ],
});
