import type { APIRoute, GetStaticPaths } from "astro";
import { getAllSkills, type Skill } from "../../utils/skills";
import { SITE_URL, markdownResponse } from "../../utils/site";

// Each skill page as Markdown (the SKILL.md body without frontmatter), served
// by the edge Worker for `Accept: text/markdown`.
export const getStaticPaths: GetStaticPaths = () =>
  getAllSkills().map((skill) => ({
    params: { slug: skill.slug },
    props: { skill },
  }));

export const GET: APIRoute = ({ props }) => {
  const { skill } = props as { skill: Skill };
  return markdownResponse(
    {
      title: skill.title,
      description: skill.description,
      canonical: `${SITE_URL}/skills/${skill.slug}`,
      lastUpdated: skill.lastUpdated,
    },
    // references/ links are relative to SKILL.md; from /skills/<slug>.md they
    // would resolve to /skills/references/, so point them at the real files.
    [
      skill.content
        .trim()
        .replaceAll(
          "](references/",
          `](${SITE_URL}/skills/${skill.slug}/references/`,
        ),
      "",
    ],
  );
};
