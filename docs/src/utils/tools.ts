// What the /mcp server (edge/mcp.ts) and the WebMCP script
// (src/utils/webmcp.ts) offer agents, published as /tools.json. The MCP server
// stands in for the plugin, so each skill is a tool (and a prompt) with the
// skill's own name and description: an agent sees the same trigger text either
// way. Tools are read-only and fetch Markdown this site publishes; `path` may
// contain `{argument}` placeholders. The version is the plugin's (kept in sync
// across manifests by scripts/bump-version.sh).
import type { ToolDefinition, ToolManifest } from "../../edge/mcp.ts";
import pkg from "../../package.json";
import { getAgents, getAllSkills, type Agent, type Skill } from "./skills";
import { SITE_URL } from "./site";

export const MCP_URL = `${SITE_URL}/mcp`;
const MCP_NAME = "clairvoyance";

/** One-click and CLI ways to add the MCP server, in each client's own format. */
export const MCP_INSTALL = {
  vscode: `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: MCP_NAME, type: "http", url: MCP_URL }))}`,
  cursor: `cursor://anysphere.cursor-deeplink/mcp/install?name=${MCP_NAME}&config=${encodeURIComponent(btoa(JSON.stringify({ url: MCP_URL })))}`,
  claudeCode: `claude mcp add --transport http ${MCP_NAME} ${MCP_URL}`,
  codex: `codex mcp add ${MCP_NAME} --url ${MCP_URL}`,
  vscodeCli: `code --add-mcp '${JSON.stringify({ name: MCP_NAME, type: "http", url: MCP_URL })}'`,
  cursorConfig: `"${MCP_NAME}": { "url": "${MCP_URL}" }`,
};

export const MCP_SUMMARY =
  "The MCP server gives any MCP client the same skills as the plugin, with no sign-in. Each skill is a tool with the same name and description it has in the plugin, and clients that support MCP prompts also offer each skill as a slash command.";

/** The MCP section of install.md. */
export function mcpInstallMarkdown(): string[] {
  return [
    "## MCP server",
    "",
    `${MCP_SUMMARY} The server is at ${MCP_URL} (Streamable HTTP). Supporting files load through its \`fetchReference\` tool.`,
    "",
    `- VS Code: [Add to VS Code](${MCP_INSTALL.vscode})`,
    `- Cursor: [Add to Cursor](${MCP_INSTALL.cursor})`,
    `- Claude Code: \`${MCP_INSTALL.claudeCode}\``,
    `- Codex: \`${MCP_INSTALL.codex}\``,
    `- Any other client: add \`${MCP_URL}\` as a remote (HTTP) MCP server.`,
  ];
}

// Tools take no input: a request names the skill and nothing else, so the
// server never sees the user's code, paths or prompts.
const NO_INPUT: ToolDefinition["inputSchema"] = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

const summaryOf = (description: string) =>
  description.split(/\.\s*Use when/i)[0] + ".";

export function getToolManifest(): ToolManifest {
  const skills = getAllSkills();
  const withReferences = skills.filter((s) => s.references.length > 0);
  return {
    version: pkg.version,
    instructions: [
      "Clairvoyance: software design skills for AI coding agents, drawn from A Philosophy of Software Design.",
      "Each tool named after a skill returns that skill's instructions. Call it when its description matches what you're doing, then follow it.",
      "Skills that link files in a references/ folder say how to load them with fetchReference.",
      "",
      "Skills:",
      ...skills.map((s) => `- ${s.slug}: ${summaryOf(s.description)}`),
    ].join("\n"),
    tools: [
      ...skills.map((s) => ({
        name: s.slug,
        title: s.title,
        description: s.description,
        inputSchema: NO_INPUT,
        readOnly: true,
        path: skillToolPath(s),
      })),
      {
        name: "fetchReference",
        title: "Fetch a skill's supporting file",
        description: `Fetch a supporting file from a Clairvoyance skill's references/ folder, when the skill's instructions point to one. Available: ${withReferences
          .map((s) => `${s.slug} (${s.references.join(", ")})`)
          .join("; ")}.`,
        inputSchema: {
          type: "object",
          properties: {
            skill: {
              type: "string",
              description: "The skill the file belongs to",
              enum: withReferences.map((s) => s.slug),
            },
            file: {
              type: "string",
              description:
                "The file name inside the skill's references/ folder",
              enum: [
                ...new Set(withReferences.flatMap((s) => s.references)),
              ].sort(),
            },
          },
          required: ["skill", "file"],
          additionalProperties: false,
        },
        readOnly: true,
        path: "/skills/{skill}/references/{file}",
      },
    ],
    prompts: skills.map((s) => ({
      name: s.slug,
      title: s.title,
      description: s.description,
      path: skillToolPath(s),
    })),
  };
}

// What the plugin would enforce for a dispatched agent, stated as instructions
// for the caller's own subagent: its tool limits and model come from the
// agent's frontmatter.
function agentDispatchNote(agent: Agent): string {
  const limits = [
    agent.tools && `limit it to these tools: ${agent.tools}`,
    agent.model && `run it on ${agent.model} if you can choose the model`,
  ].filter(Boolean);
  return [
    `This skill dispatches the \`${agent.name}\` agent (${agent.description.replace(/\.$/, "")}).`,
    "It isn't installed through MCP, so if you can start subagents, start one subagent with the brief below as its instructions and give it only what the skill says to dispatch it with.",
    limits.length ? `Then ${limits.join(", and ")}.` : "",
    "If you can't start subagents, follow the skill's fallback for runtimes without agents.",
  ]
    .filter(Boolean)
    .join(" ");
}

function skillToolPath(skill: Skill): string {
  return `/tools/skills/${skill.slug}.md`;
}

/**
 * A skill as an MCP tool returns it: the SKILL.md body, then what the plugin
 * would otherwise provide. That's how to load its references/ files, and the
 * brief for any agent it dispatches, which the caller runs as its own subagent.
 */
export function skillToolMarkdown(skill: Skill): string {
  // Skills say "When invoked with $ARGUMENTS, …", which Claude Code fills on
  // the user's machine. Tools take no input, so name the kind of argument
  // instead ("When invoked with a file or module path, …") and let the agent
  // match it against the request it already has.
  const parts = [
    skill.content
      .trim()
      .replaceAll("$ARGUMENTS", `a ${skill.argumentHint ?? "target"}`),
  ];

  if (skill.references.length > 0) {
    parts.push(
      [
        "## Supporting files",
        "",
        "This skill links files in its `references/` folder. Load them with the `fetchReference` tool:",
        "",
        ...skill.references.map(
          (file) =>
            `- \`references/${file}\`: \`fetchReference({ skill: "${skill.slug}", file: "${file}" })\``,
        ),
      ].join("\n"),
    );
  }

  for (const agent of getAgents().filter((a) =>
    skill.content.includes(`\`${a.name}\``),
  )) {
    parts.push(
      [
        `## The \`${agent.name}\` agent`,
        "",
        agentDispatchNote(agent),
        "",
        "### Brief",
        "",
        // Nest the brief's own headings under "Brief".
        agent.brief.replace(
          /^(#+) /gm,
          (_, h: string) => `${"#".repeat(Math.min(h.length + 2, 6))} `,
        ),
      ].join("\n"),
    );
  }

  return parts.join("\n\n") + "\n";
}
