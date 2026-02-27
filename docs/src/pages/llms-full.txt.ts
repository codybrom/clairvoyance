import type { APIRoute } from "astro";
import { getAllSkills } from "../utils/skills";

export const GET: APIRoute = () => {
  const skills = getAllSkills();

  const sections = [
    "# Clairvoyance",
    "",
    "> ESP for AI Coding — Agent skills on the philosophy of software design, grounded in decades of engineering experience.",
    "",
    "Good software isn't written. It's designed. Clairvoyance is a collection of software design skills for AI coding agents. Each skill is a lens grounded in decades of engineering experience to helps your agent see through complexity and write code with intent.",
    "",
    "Clairvoyance works with Claude Code, Codex, OpenCode, and any agent platform that supports skills.",
    "",
    "Created by Cody Bromley. Inspired by *A Philosophy of Software Design* by John K. Ousterhout. Licensed under the MIT License (https://github.com/codybrom/clairvoyance/blob/main/LICENSE).",
    "",
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

  for (const skill of skills) {
    sections.push(
      "",
      "═".repeat(60),
      `SKILL: ${skill.title}`,
      `https://clairvoyance.fyi/skills/${skill.slug}`,
      skill.description,
      "═".repeat(60),
      "",
      skill.content.trim(),
      "",
    );
  }

  return new Response(sections.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
