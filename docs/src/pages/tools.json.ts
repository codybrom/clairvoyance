import type { APIRoute } from "astro";
import { getToolManifest } from "../utils/tools";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(getToolManifest(), null, 2), {
    headers: { "Content-Type": "application/json" },
  });
