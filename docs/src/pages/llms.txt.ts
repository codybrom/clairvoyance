import type { APIRoute } from "astro";
import { getAllSkills } from "../utils/skills";
import { INTRO, SKILL_CHOOSER, TAGLINE } from "../utils/site";

export const GET: APIRoute = () => {
  const skills = getAllSkills();

  const lines = [
    "# Clairvoyance",
    "",
    `> ${TAGLINE}`,
    "",
    ...INTRO,
    "",
    "## Skills",
    "",
    ...skills.map(
      (s) =>
        `- [${s.title}](https://raw.githubusercontent.com/codybrom/clairvoyance/main/skills/${s.slug}/SKILL.md): ${s.description}`,
    ),
    "",
    ...SKILL_CHOOSER,
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
