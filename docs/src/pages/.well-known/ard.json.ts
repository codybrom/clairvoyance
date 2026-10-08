import type { APIRoute } from "astro";
import { discoveryCatalog } from "../../utils/tools";

// ARD manifest; the same document is served at ard.json and, for older
// consumers, at its predecessor path ai-catalog.json.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(discoveryCatalog(), null, 2), {
    headers: { "Content-Type": "application/json" },
  });
