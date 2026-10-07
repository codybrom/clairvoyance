import type { APIRoute } from "astro";
import {
  MCP_INSTALL,
  MCP_PAGE,
  MCP_SUMMARY,
  MCP_URL,
  getToolManifest,
} from "../utils/tools";
import { markdownResponse } from "../utils/site";

// The /mcp page as Markdown, served by the edge Worker when an agent GETs /mcp
// asking for text/markdown (MCP clients POST and get the server instead).
export const GET: APIRoute = () => {
  const { tools } = getToolManifest();
  return markdownResponse(
    {
      title: "Clairvoyance MCP server",
      description: MCP_SUMMARY,
      canonical: MCP_URL,
    },
    [
      "# Clairvoyance MCP server",
      "",
      MCP_SUMMARY,
      "",
      `Server URL: ${MCP_URL}`,
      "",
      "## Add it to your client",
      "",
      `- VS Code: [Add to VS Code](${MCP_INSTALL.vscode}), or \`${MCP_INSTALL.vscodeCli}\``,
      `- Cursor: [Add to Cursor](${MCP_INSTALL.cursor}), or add \`${MCP_INSTALL.cursorConfig}\` under \`"mcpServers"\` in \`~/.cursor/mcp.json\``,
      `- Claude Code: \`${MCP_INSTALL.claudeCode}\``,
      `- Codex: \`${MCP_INSTALL.codex}\``,
      `- Any other client: add ${MCP_URL} as a remote (HTTP) MCP server.`,
      "",
      "## Tools",
      "",
      ...tools.map((t) => `- \`${t.name}\`: ${t.description}`),
      "",
      "## Prompts",
      "",
      MCP_PAGE.prompts,
      "",
      "## What it receives",
      "",
      MCP_PAGE.receives,
      "",
      "## MCP or the plugin?",
      "",
      MCP_PAGE.versusPlugin,
      "",
      "## Details",
      "",
      MCP_PAGE.details,
      "",
    ],
  );
};
