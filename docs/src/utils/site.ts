// Facts about the project that appear on more than one page, plus the shared
// Markdown sections used by llms.txt, llms-full.txt and the Markdown twins
// that the edge Worker serves (see edge/worker.js).
import pkg from "../../package.json";
import { getSkillsByPillar } from "./skills";

export const SITE_URL = "https://clairvoyance.fyi";
export const REPO_URL = "https://github.com/codybrom/clairvoyance";
export const AUTHOR = {
  name: "Cody Bromley",
  url: "https://github.com/codybrom",
};

export const DEFAULT_DESCRIPTION =
  "ESP for AI Coding. Agent skills on the philosophy of software design, grounded in decades of engineering experience.";

export const TAGLINE =
  "ESP for AI Coding — Agent skills on the philosophy of software design, grounded in decades of engineering experience.";

export const INTRO = [
  "Good software isn't written. It's designed. Clairvoyance is a collection of software design skills for AI coding agents. Each skill is a lens grounded in decades of engineering experience to help your agent see through complexity and write code with intent.",
  "",
  "Clairvoyance works with Claude Code, Codex, Cursor, OpenCode, Antigravity, and any agent platform that supports the Agent Skills open standard.",
];

// What the "Set up with your agent" button copies. The agent fetches the
// instructions and runs the install itself (see src/pages/agent-setup.md.ts).
export const AGENT_SETUP_URL = `${SITE_URL}/agent-setup.md`;
export const AGENT_SETUP_PROMPT = `Fetch and follow the instructions at ${AGENT_SETUP_URL} to install Clairvoyance for me.`;

// For llms.txt: the jobs Clairvoyance is right for, how an agent loads a
// skill, and what it isn't for. Skill names map each job to where to start.
export const WHEN_TO_USE = [
  "## When to use Clairvoyance",
  "",
  "Reach for a Clairvoyance skill when the job is judging or improving the design of code, not just whether it works:",
  "",
  "- Reviewing a file, module or pull request for design quality before it ships (design-review, red-flags, code-evolution)",
  "- Working out why code feels hard to change or understand (complexity-recognition, diagnose)",
  "- Checking whether an interface is deep enough, too specialized, or leaking its internals (deep-modules, general-vs-special, information-hiding)",
  "- Choosing between designs, or writing a design doc or RFC (design-it-twice)",
  "- Deciding where module boundaries, configuration and error handling belong (module-boundaries, pull-complexity-down, error-design)",
  "- Making names and comments carry the design (naming-obviousness, comments-docs)",
  "",
  "How to load one: with the plugin installed, skills load on their own when their description matches, or run one directly as /clairvoyance:<skill>. Over the MCP server, call the tool named after the skill. Without either, read the skill's Markdown from the links below.",
  "",
  "Not for: fixing a specific bug or failing test, style and lint rules, performance tuning, or choosing libraries and frameworks.",
];

export const INSTALL = {
  claudeStep1: "/plugin marketplace add codybrom/clairvoyance",
  claudeStep2: "/plugin install clairvoyance@clairvoyance-plugins",
  skillsSh: "npx skills add codybrom/clairvoyance --skill '*'",
};

export const SKILL_CHOOSER = [
  "## Which Skill Do I Need?",
  "",
  "Start with what bothers you:",
  "",
  "- Something smells but I can't pinpoint it",
  "  ↳ It works, but I'd hate to maintain it → [/complexity-recognition](https://clairvoyance.fyi/skills/complexity-recognition) (+ [/red-flags](https://clairvoyance.fyi/skills/red-flags))",
  '  ↳ Every small change breaks something unexpected → see "structure" below',
  "- Every change turns into a scavenger hunt",
  "  ↳ I end up editing five files for one feature",
  "    ↳ The same internal details are hardcoded everywhere → [/information-hiding](https://clairvoyance.fyi/skills/information-hiding)",
  "    ↳ I keep copying the same logic around → [/code-evolution](https://clairvoyance.fyi/skills/code-evolution)",
  "    ↳ Things that belong together live in different places → [/module-boundaries](https://clairvoyance.fyi/skills/module-boundaries)",
  "  ↳ There are layers that just pass data through → [/abstraction-quality](https://clairvoyance.fyi/skills/abstraction-quality) (+ [/deep-modules](https://clairvoyance.fyi/skills/deep-modules))",
  "  ↳ I can't tell which module owns what → [/module-boundaries](https://clairvoyance.fyi/skills/module-boundaries)",
  "- This API is painful to use",
  "  ↳ Callers need too much boilerplate to use it → [/pull-complexity-down](https://clairvoyance.fyi/skills/pull-complexity-down)",
  "  ↳ It only works for one specific use case → [/general-vs-special](https://clairvoyance.fyi/skills/general-vs-special)",
  "  ↳ The abstraction isn't saving me any work → [/deep-modules](https://clairvoyance.fyi/skills/deep-modules)",
  "- The code is hard to read or understand",
  "  ↳ I can't come up with a good name for this → [/naming-obviousness](https://clairvoyance.fyi/skills/naming-obviousness) (+ [/design-it-twice](https://clairvoyance.fyi/skills/design-it-twice))",
  "  ↳ The comments are useless or nonexistent → [/comments-docs](https://clairvoyance.fyi/skills/comments-docs)",
  "  ↳ There are try/catch blocks and error paths everywhere → [/error-design](https://clairvoyance.fyi/skills/error-design)",
  "- I'm starting fresh or need a second opinion",
  "  ↳ I don't know where to begin → [/diagnose](https://clairvoyance.fyi/skills/diagnose)",
  "  ↳ I'm designing something from scratch → [/design-it-twice](https://clairvoyance.fyi/skills/design-it-twice) (+ [/comments-docs](https://clairvoyance.fyi/skills/comments-docs))",
  "  ↳ This was hacked together and it shows → [/strategic-mindset](https://clairvoyance.fyi/skills/strategic-mindset) (+ [/code-evolution](https://clairvoyance.fyi/skills/code-evolution))",
  "  ↳ I need to review this before it ships → [/design-review](https://clairvoyance.fyi/skills/design-review)",
];

/** Every skill, linked to its page and grouped under a heading per pillar. */
export function skillCatalog(headingLevel: number): string[] {
  const hashes = "#".repeat(headingLevel);
  return getSkillsByPillar().flatMap((pillar) => [
    `${hashes} ${pillar.name}`,
    "",
    ...pillar.skills.map(
      (s) => `- [${s.title}](${SITE_URL}/skills/${s.slug}): ${s.description}`,
    ),
    "",
  ]);
}

/** schema.org identity for the homepage, rendered as JSON-LD by Layout. */
export const SOFTWARE_APPLICATION = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Clairvoyance",
  url: `${SITE_URL}/`,
  description: DEFAULT_DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  softwareVersion: pkg.version,
  license: `${REPO_URL}/blob/main/LICENSE`,
  isAccessibleForFree: true,
  image: `${SITE_URL}/og.png`,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", ...AUTHOR },
  sameAs: [REPO_URL, "https://skills.sh/codybrom/clairvoyance"],
};

export interface MarkdownMeta {
  title: string;
  description: string;
  canonical: string;
  lastUpdated?: string | null;
}

/**
 * A Markdown twin: a frontmatter block (so agents get the page's metadata
 * without scraping) followed by `lines`. Values are written as JSON strings,
 * which YAML reads as double-quoted scalars.
 */
export function markdownResponse(
  meta: MarkdownMeta,
  lines: string[],
): Response {
  const fields: [string, string | null | undefined][] = [
    ["title", meta.title],
    ["description", meta.description],
    ["canonical", meta.canonical],
    ["last_updated", meta.lastUpdated],
  ];
  const frontmatter = fields
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return new Response(["---", ...frontmatter, "---", "", ...lines].join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
