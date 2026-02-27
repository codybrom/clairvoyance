import type { APIRoute } from "astro";
import { getAllSkills } from "../utils/skills";

export const GET: APIRoute = () => {
  const skills = getAllSkills();

  const lines = [
    "# Clairvoyance",
    "",
    "> ESP for AI Coding — Agent skills inspired by A Philosophy of Software Design",
    "",
    "Good software isn't written. It's designed. Clairvoyance is a collection of software design skills for AI coding agents. Each skill is a lens grounded in decades of engineering experience to helps your agent see through complexity and write code with intent.",
    "",
    "Clairvoyance works with Claude Code, Codex, OpenCode, and any agent platform that supports skills.",
    "",
    "## Skills",
    "",
    ...skills.map(
      (s) =>
        `- [${s.title}](https://raw.githubusercontent.com/codybrom/clairvoyance/main/skills/${s.slug}/SKILL.md): ${s.description}`,
    ),
    "",
    "## Links",
    "",
    "- [GitHub](https://github.com/codybrom/clairvoyance)",
    "- [Installation](https://github.com/codybrom/clairvoyance#installation)",
    "- [Full content](https://clairvoyance.fyi/llms-full.txt)",
    "",
    "## Source & License",
    "",
    "Created by [Cody Bromley](https://github.com/codybrom). Inspired by *A Philosophy of Software Design* by John K. Ousterhout. Licensed under the [MIT License](https://github.com/codybrom/clairvoyance/blob/main/LICENSE).",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
