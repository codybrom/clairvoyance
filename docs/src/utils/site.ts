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

export const TAGLINE =
  "ESP for AI Coding — Agent skills on the philosophy of software design, grounded in decades of engineering experience.";

export const INTRO = [
  "Good software isn't written. It's designed. Clairvoyance is a collection of software design skills for AI coding agents. Each skill is a lens grounded in decades of engineering experience to helps your agent see through complexity and write code with intent.",
  "",
  "Clairvoyance works with Claude Code, Codex, Cursor, OpenCode, Gemini CLI, and any agent platform that supports the Agent Skills open standard.",
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
  description:
    "ESP for AI Coding. Agent skills on the philosophy of software design, grounded in decades of engineering experience.",
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

export function markdownResponse(lines: string[]): Response {
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
