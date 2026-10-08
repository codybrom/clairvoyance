// What the /mcp server (edge/mcp.ts) and the WebMCP script
// (src/utils/webmcp.ts) offer agents, published as /tools.json. The MCP server
// stands in for the plugin, so each skill is a tool (and a prompt) with the
// skill's own name and description: an agent sees the same trigger text either
// way. Tools are read-only and fetch Markdown this site publishes; `path` may
// contain `{argument}` placeholders. The version is the plugin's (kept in sync
// across manifests by scripts/bump-version.sh).
import {
  SUPPORTED_VERSIONS,
  type ToolDefinition,
  type ToolManifest,
} from "../../edge/mcp.ts";
import pkg from "../../package.json";
import {
  getAgents,
  getAllSkills,
  summaryOf,
  type Agent,
  type Skill,
} from "./skills";
import { REPO_URL, SITE_URL } from "./site";

export const MCP_URL = `${SITE_URL}/mcp`;

/**
 * The MCP server's identity, shared by its live serverInfo (via /tools.json),
 * its server card, the ARD / AI Catalog entry and the registry's server.json,
 * so none of them can contradict the others.
 */
/** The server's entry in the official MCP Registry (published from server.json). */
export const MCP_REGISTRY_URL =
  "https://registry.modelcontextprotocol.io/v0.1/servers/fyi.clairvoyance%2Fmcp/versions/latest";

export const MCP_SERVER = {
  name: "fyi.clairvoyance/mcp",
  title: "Clairvoyance",
  // The server card schema caps this at 100 characters.
  description:
    "Software design skills for AI coding agents, inspired by A Philosophy of Software Design.",
  websiteUrl: MCP_URL,
};
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

// Prose for the /mcp page and its Markdown twin, written once for both.
export const MCP_PAGE = {
  prompts:
    "Every skill is also an MCP prompt, so clients that support prompts offer it as a slash command. Claude Code, for example, lists them under the server's name, such as /mcp__clairvoyance__red-flags.",
  receives:
    "A request contains only the name of the skill, or of a skill's supporting file. The tools take no other input, so the server never receives your code, file paths or prompts. It doesn't store or log requests, and there are no accounts or cookies.",
  versusPlugin:
    "Where your agent supports plugins or skills, install those instead. The plugin also enforces each skill's allowed tools and runs the design-it-twice subagent itself; over MCP, the agent is given the subagent's brief and limits to follow.",
  details: `Streamable HTTP with JSON responses: stateless, no sign-in, and no server-initiated stream. It speaks MCP ${SUPPORTED_VERSIONS.join(", ")}, and its tool and prompt definitions are published at ${SITE_URL}/tools.json.`,
};

/** The MCP section of install.md. */
export function mcpInstallMarkdown(): string[] {
  return [
    "## MCP server",
    "",
    `${MCP_SUMMARY} The server is at ${MCP_URL} (Streamable HTTP). Supporting files load through its \`fetch-reference\` tool.`,
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

export function getToolManifest(): ToolManifest {
  const skills = getAllSkills();
  const withReferences = skills.filter((s) => s.references.length > 0);
  return {
    name: MCP_SERVER.name,
    title: MCP_SERVER.title,
    version: pkg.version,
    instructions: [
      "Clairvoyance: software design skills for AI coding agents, inspired by A Philosophy of Software Design.",
      "Each tool named after a skill returns that skill's instructions. Call it when its description matches what you're doing, then follow it.",
      "Skills that link files in a references/ folder say how to load them with fetch-reference.",
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
        name: "fetch-reference",
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
        "This skill links files in its `references/` folder. Load them with the `fetch-reference` tool:",
        "",
        ...skill.references.map(
          (file) =>
            `- \`references/${file}\`: call \`fetch-reference\` with \`{ skill: "${skill.slug}", file: "${file}" }\``,
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

/** The server card (draft MCP extension, v1 schema), at /mcp/server-card. */
export function serverCard() {
  return {
    $schema:
      "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    ...MCP_SERVER,
    version: pkg.version,
    icons: [
      {
        src: `${SITE_URL}/favicon.svg`,
        mimeType: "image/svg+xml",
        sizes: ["any"],
      },
      {
        src: `${SITE_URL}/apple-touch-icon.png`,
        mimeType: "image/png",
        sizes: ["180x180"],
      },
    ],
    remotes: [
      {
        type: "streamable-http",
        url: MCP_URL,
        supportedProtocolVersions: SUPPORTED_VERSIONS,
      },
    ],
    repository: { url: REPO_URL, source: "github" },
  };
}

/**
 * The ARD manifest (/.well-known/ard.json), also served at its predecessor
 * path /.well-known/ai-catalog.json: one entry pointing at the server card,
 * with the queries a registry indexes it by.
 */
export function discoveryCatalog() {
  return {
    specVersion: "1.0",
    entries: [
      {
        identifier: "urn:air:clairvoyance.fyi:mcp:clairvoyance",
        displayName: MCP_SERVER.title,
        type: "application/mcp-server-card+json",
        url: `${MCP_URL}/server-card`,
        description: MCP_SERVER.description,
        version: pkg.version,
        capabilities: getAllSkills().map((s) => s.slug),
        tags: ["software-design", "code-review", "agent-skills"],
        representativeQueries: [
          "review this module for software design problems",
          "find design red flags in this pull request",
          "is this interface too shallow for what it does",
          "compare two designs for this feature before I build it",
          "why does this code feel so hard to change",
        ],
      },
    ],
  };
}

/** The /mcp page as Markdown: its twin (/mcp.md) and /mcp/llms.txt share it. */
export function mcpPageMarkdown(): string[] {
  const { tools } = getToolManifest();
  return [
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
    `Listed in the official MCP Registry as [${MCP_SERVER.name}](${MCP_REGISTRY_URL}).`,
    "",
  ];
}
