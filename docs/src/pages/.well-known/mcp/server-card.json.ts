import type { APIRoute } from "astro";
import { serverCard } from "../../../utils/tools";

// Also served at /mcp/server-card, the reserved location (edge/worker.ts).
export const GET: APIRoute = () =>
  new Response(JSON.stringify(serverCard(), null, 2), {
    headers: { "Content-Type": "application/json" },
  });
