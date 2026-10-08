import type { APIRoute } from "astro";
import { getAllSkills } from "../utils/skills";
import { MCP_URL } from "../utils/tools";
import {
  AGENT_SETUP_URL,
  INTRO,
  SITE_URL,
  SKILL_CHOOSER,
  TAGLINE,
  WHEN_TO_USE,
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
    ...WHEN_TO_USE,
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
    `- [MCP server](${MCP_URL}): every skill as an MCP tool, for clients that can't install the plugin`,
    `- [Skills index](${SITE_URL}/skills/llms.txt): just the skill catalog`,
    `- [MCP server details](${SITE_URL}/mcp/llms.txt): connecting, tools, and what the server receives`,
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
