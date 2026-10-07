import type { APIRoute } from "astro";
import { getAllSkills } from "../utils/skills";
import { MCP_URL } from "../utils/tools";
import {
  AGENT_SETUP_URL,
  INTRO,
  SITE_URL,
  SKILL_CHOOSER,
  TAGLINE,
} from "../utils/site";

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
        `- [${s.title}](${SITE_URL}/skills/${s.slug}.md): ${s.description}`,
    ),
    "",
    ...SKILL_CHOOSER,
    "",
    "## Links",
    "",
    "- [GitHub](https://github.com/codybrom/clairvoyance)",
    `- [Installation](${SITE_URL}/install.md)`,
    `- [Agent setup](${AGENT_SETUP_URL}): instructions your agent can follow to install Clairvoyance for you`,
    `- [MCP server](${MCP_URL}): read-only tools to list and fetch skills, for clients that connect over MCP`,
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
