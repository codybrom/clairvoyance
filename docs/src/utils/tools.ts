// The tools agents can call, shared by the /mcp server (edge/mcp.ts) and the
// WebMCP script (src/utils/webmcp.ts) through /tools.json. Each tool is
// read-only and fetches a Markdown file this site already publishes; `path`
// may contain `{argument}` placeholders. The version is the plugin's (kept in
// sync across manifests by scripts/bump-version.sh), so the MCP server always
// reports what's deployed.
import type { ToolManifest } from "../../edge/mcp.ts";
import pkg from "../../package.json";
import { getAllSkills } from "./skills";
import { SITE_URL } from "./site";

export const MCP_URL = `${SITE_URL}/mcp`;
const MCP_NAME = "clairvoyance";

/** One-click and CLI ways to add the MCP server, in each client's own format. */
export const MCP_INSTALL = {
  vscode: `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: MCP_NAME, type: "http", url: MCP_URL }))}`,
  cursor: `cursor://anysphere.cursor-deeplink/mcp/install?name=${MCP_NAME}&config=${encodeURIComponent(btoa(JSON.stringify({ url: MCP_URL })))}`,
  claudeCode: `claude mcp add --transport http ${MCP_NAME} ${MCP_URL}`,
  codex: `codex mcp add ${MCP_NAME} --url ${MCP_URL}`,
};

export const MCP_SUMMARY =
  "Clients that can't install the plugin can still use Clairvoyance through its read-only MCP server: no sign-in, served over Streamable HTTP. Installed as a plugin, skills activate on their own; through MCP, your agent calls them when it decides to.";

/** The MCP section of install.md. */
export function mcpInstallMarkdown(): string[] {
  return [
    "## MCP server",
    "",
    `${MCP_SUMMARY} The server is at ${MCP_URL} and offers these tools:`,
    "",
    ...getToolManifest().tools.map((t) => `- \`${t.name}\`: ${t.description}`),
    "",
    `- VS Code: [Add to VS Code](${MCP_INSTALL.vscode})`,
    `- Cursor: [Add to Cursor](${MCP_INSTALL.cursor})`,
    `- Claude Code: \`${MCP_INSTALL.claudeCode}\``,
    `- Codex: \`${MCP_INSTALL.codex}\``,
    `- Any other client: add \`${MCP_URL}\` as a remote (HTTP) MCP server.`,
  ];
}

export function getToolManifest(): ToolManifest {
  return {
    version: pkg.version,
    tools: [
      {
        name: "listSkills",
        title: "List Clairvoyance skills",
        description:
          "List every Clairvoyance software design skill, grouped by pillar, with a one-line description of when to use each. Returns Markdown.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        readOnly: true,
        path: "/skills.md",
      },
      {
        name: "fetchSkill",
        title: "Fetch a Clairvoyance skill",
        description:
          "Fetch the full instructions for one Clairvoyance skill as Markdown, ready to apply to the code you're reviewing or writing.",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "Skill name, e.g. 'deep-modules' or 'red-flags'",
              enum: getAllSkills().map((s) => s.slug),
            },
          },
          required: ["slug"],
          additionalProperties: false,
        },
        readOnly: true,
        path: "/skills/{slug}.md",
      },
      {
        name: "getInstallInstructions",
        title: "Get Clairvoyance install instructions",
        description:
          "How to install and update Clairvoyance in Claude Code, Codex, Cursor, OpenCode, Antigravity and other agents. Returns Markdown.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        readOnly: true,
        path: "/install.md",
      },
    ],
  };
}
