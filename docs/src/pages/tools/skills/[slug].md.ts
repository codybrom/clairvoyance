import type { APIRoute, GetStaticPaths } from "astro";
import { getAllSkills, type Skill } from "../../../utils/skills";
import { skillToolMarkdown } from "../../../utils/tools";

// What each skill's MCP tool (and prompt) returns; see skillToolMarkdown.
export const getStaticPaths: GetStaticPaths = () =>
  getAllSkills().map((skill) => ({
    params: { slug: skill.slug },
    props: { skill },
  }));

export const GET: APIRoute = ({ props }) =>
  new Response(skillToolMarkdown((props as { skill: Skill }).skill), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
