import type { APIRoute } from "astro";
import { getInstallGuide } from "../utils/install";
import { MCP_INSTALL, MCP_URL } from "../utils/tools";

// Install instructions written for an agent to carry out, not a person to
// read: the prompt behind the "Set up with your agent" button points here.
// Built from the same README sections as /install, adjusted where a person's
// step isn't something an agent can run.
const AGENT_ADJUSTMENTS: Record<string, (markdown: string) => string> = {
  // Slash commands only work when typed into Claude Code; the same commands
  // exist as `claude plugin ...` for a shell.
  "claude-code": (markdown) =>
    markdown.replace(/^\/plugin /gm, "claude plugin ") +
    "\n\nThen tell the user to run `/reload-plugins` inside Claude Code to load the skills.",
  // Run without interactive prompts, installed for every project.
  skillssh: (markdown) =>
    markdown.replace(
      "npx skills add codybrom/clairvoyance --skill '*'",
      "npx -y skills add codybrom/clairvoyance --skill '*' --yes --global",
    ),
};

export const GET: APIRoute = () => {
  const { platforms, updating } = getInstallGuide();
  const lines = [
    "# Install Clairvoyance",
    "",
    "These are the official instructions for installing Clairvoyance, a set of software design skills for AI coding agents, from https://clairvoyance.fyi.",
    "",
    "Run the commands yourself; don't ask the user to run them. When a step can only happen inside your own interface (a slash command, a restart, a settings screen), tell the user exactly what to do.",
    "",
    "1. Work out which agent you are and follow only that section below.",
    "2. If your agent isn't listed, use the skills.sh section. If it can't install plugins or skills at all but can connect to MCP servers, add the MCP server instead (last section).",
    "3. If Clairvoyance is already installed, update it instead, using the Updating section at the end.",
    "",
    "---",
    "",
    ...platforms.flatMap((p) => [
      `### ${p.heading}`,
      "",
      (AGENT_ADJUSTMENTS[p.id] ?? ((m: string) => m))(p.markdown),
      "",
    ]),
    "## Updating",
    "",
    updating,
    "",
    "## MCP server (fallback)",
    "",
    `Only for agents that can't install the plugin or skills above. Clairvoyance's MCP server at ${MCP_URL} needs no sign-in and offers every skill as a tool with the same name and description it has in the plugin.`,
    "",
    "- Claude Code: `" + MCP_INSTALL.claudeCode + "`",
    "- Codex: `" + MCP_INSTALL.codex + "`",
    "- VS Code: `" + MCP_INSTALL.vscodeCli + "`",
    "- Cursor: add `" +
      MCP_INSTALL.cursorConfig +
      '` under `"mcpServers"` in `~/.cursor/mcp.json`',
    `- Anything else: register ${MCP_URL} as a remote (Streamable HTTP) MCP server in your MCP config.`,
    "",
    "Then tell the user to restart or reload the agent so it connects.",
    "",
    "---",
    "",
    "Once done, tell the user:",
    "",
    "```",
    "Clairvoyance installed for <your agent>",
    "  <restart or reload step, if the section above had one>",
    '  Try it: ask for a "red flags scan" of any file.',
    "```",
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
