// The install guide, parsed from the README's Installation and Updating
// sections so the README, /install and /install.md never drift apart. Each
// `### Platform` heading in the README becomes one platform.
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import { REPO_ROOT } from "./skills";
import { REPO_URL } from "./site";

export interface InstallPlatform {
  /** GitHub-style heading anchor, e.g. "claude-code", "skillssh". */
  id: string;
  name: string;
  /** The heading as written in the README, links included. */
  heading: string;
  markdown: string;
  html: string;
}

export interface InstallGuide {
  intro: string;
  platforms: InstallPlatform[];
  updating: string;
}

const marked = new Marked();

let _cache: InstallGuide | null = null;

export function getInstallGuide(): InstallGuide {
  if (_cache) return _cache;
  const readme = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf-8");
  const installation = absolutizeLinks(section(readme, "Installation"));
  const [intro, ...platformBlocks] = installation.split(/^### /m);

  const platforms = platformBlocks.map((block) => {
    const newline = block.indexOf("\n");
    const heading = block.slice(0, newline).trim();
    const markdown = block.slice(newline).trim();
    const name = heading.replace(/^\[([^\]]+)\]\([^)]*\)$/, "$1");
    return {
      id: anchorId(name),
      name,
      heading,
      markdown,
      html: marked.parse(markdown) as string,
    };
  });

  _cache = {
    intro: intro.replace(/^## Installation\s*/, "").trim(),
    platforms,
    updating: absolutizeLinks(section(readme, "Updating"))
      .replace(/^## Updating\s*/, "")
      .trim(),
  };
  return _cache;
}

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}

// The README section under `## heading`, heading line included.
function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(`\n## ${heading}\n`);
  if (start === -1) throw new Error(`README has no "## ${heading}" section`);
  const end = markdown.indexOf("\n## ", start + 1);
  return markdown.slice(start + 1, end === -1 ? undefined : end).trim();
}

// README links are relative to the repo root; on this site they must point
// at GitHub. In-page anchors (#claude-code) and absolute URLs stay as they are.
function absolutizeLinks(markdown: string): string {
  return markdown.replace(
    /\]\((?!https?:|#|mailto:)([^)]+)\)/g,
    (_, target: string) =>
      `](${REPO_URL}/blob/main/${target.replace(/^\.\//, "")})`,
  );
}

// GitHub's heading anchors: lowercase, punctuation dropped, spaces to hyphens.
function anchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/ /g, "-");
}
