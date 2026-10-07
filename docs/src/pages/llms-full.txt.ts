import type { APIRoute } from "astro";
import { getAllSkills } from "../utils/skills";
import { INTRO, SKILL_CHOOSER, TAGLINE } from "../utils/site";

export const GET: APIRoute = () => {
  const skills = getAllSkills();

  const sections = [
    "# Clairvoyance",
    "",
    `> ${TAGLINE}`,
    "",
    ...INTRO,
    "",
    "Created by Cody Bromley. Inspired by *A Philosophy of Software Design* by John K. Ousterhout. Licensed under the MIT License (https://github.com/codybrom/clairvoyance/blob/main/LICENSE).",
    "",
    ...SKILL_CHOOSER,
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
