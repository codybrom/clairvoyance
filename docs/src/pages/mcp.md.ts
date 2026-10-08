import type { APIRoute } from "astro";
import { MCP_SUMMARY, MCP_URL, mcpPageMarkdown } from "../utils/tools";
import { markdownResponse } from "../utils/site";

// The /mcp page as Markdown, served by the edge Worker when an agent GETs /mcp
// asking for text/markdown (MCP clients POST and get the server instead).
export const GET: APIRoute = () => {
  return markdownResponse(
    {
      title: "Clairvoyance MCP server",
      description: MCP_SUMMARY,
      canonical: MCP_URL,
    },
    mcpPageMarkdown(),
  );
};
