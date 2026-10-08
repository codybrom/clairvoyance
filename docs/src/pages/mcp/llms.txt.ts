import type { APIRoute } from "astro";
import { mcpPageMarkdown } from "../../utils/tools";

// Scoped llms.txt for the MCP server: the /mcp page as plain Markdown.
export const GET: APIRoute = () =>
  new Response(mcpPageMarkdown().join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
