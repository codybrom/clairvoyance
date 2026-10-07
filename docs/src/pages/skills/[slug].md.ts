import type { APIRoute, GetStaticPaths } from "astro";
import { getAllSkills, type Skill } from "../../utils/skills";
import { markdownResponse } from "../../utils/site";

// Each skill page as Markdown (the SKILL.md body without frontmatter), served
// by the edge Worker for `Accept: text/markdown`.
export const getStaticPaths: GetStaticPaths = () =>
  getAllSkills().map((skill) => ({
    params: { slug: skill.slug },
    props: { skill },
  }));

export const GET: APIRoute = ({ props }) => {
  const { skill } = props as { skill: Skill };
  return markdownResponse([skill.content.trim(), ""]);
};
