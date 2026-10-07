import fs from "node:fs";
import path from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";
import { REPO_ROOT, getAllSkills } from "../../../../utils/skills";

// A skill's references/ files, verbatim, for links in the Markdown twins and
// the MCP server's fetchReference tool.
export const getStaticPaths: GetStaticPaths = () =>
  getAllSkills().flatMap((skill) =>
    skill.references.map((file) => ({ params: { slug: skill.slug, file } })),
  );

export const GET: APIRoute = ({ params }) =>
  new Response(
    fs.readFileSync(
      path.join(REPO_ROOT, "skills", params.slug!, "references", params.file!),
      "utf-8",
    ),
    { headers: { "Content-Type": "text/markdown; charset=utf-8" } },
  );
