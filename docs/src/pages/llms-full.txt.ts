import type { APIRoute } from "astro";
import { getAllSkills } from "../utils/skills";

export const GET: APIRoute = () => {
  const skills = getAllSkills();

  const sections = [
    "# Clairvoyance — Full Skill Reference",
    "",
    "> ESP for AI Coding — Agent skills inspired by A Philosophy of Software Design",
    "",
    "Good software isn't written. It's designed. Clairvoyance is a collection of software design skills for AI coding agents. Each skill is a lens grounded in decades of engineering experience to helps your agent see through complexity and write code with intent.",
    "",
    "Clairvoyance works with Claude Code, Codex, OpenCode, and any agent platform that supports skills.",
    "",
    "Created by Cody Bromley. Inspired by *A Philosophy of Software Design* by John K. Ousterhout. Licensed under the MIT License (https://github.com/codybrom/clairvoyance/blob/main/LICENSE).",
  ];

  for (const skill of skills) {
    sections.push(
      "",
      "═".repeat(60),
      `SKILL: ${skill.title}`,
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
