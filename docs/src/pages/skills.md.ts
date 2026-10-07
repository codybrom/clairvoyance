import type { APIRoute } from "astro";
import { SITE_URL, markdownResponse, skillCatalog } from "../utils/site";

// /skills as Markdown, served by the edge Worker for `Accept: text/markdown`.
export const GET: APIRoute = () =>
  markdownResponse([
    "# All Skills",
    "",
    "Clairvoyance software design skills for AI coding agents, organized by pillar.",
    "",
    ...skillCatalog(2),
    `Every skill in one file: ${SITE_URL}/llms-full.txt`,
    "",
  ]);
