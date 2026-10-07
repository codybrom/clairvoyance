import type { APIRoute } from "astro";
import { discoveryIndex } from "../../../utils/agent-skills";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(discoveryIndex(), null, 2), {
    headers: { "Content-Type": "application/json" },
  });
