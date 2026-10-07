import type { APIRoute, GetStaticPaths } from "astro";
import {
  getSkillArtifacts,
  type SkillArtifact,
} from "../../../../utils/agent-skills";

export const getStaticPaths: GetStaticPaths = () =>
  getSkillArtifacts()
    .filter((artifact) => artifact.type === "skill-md")
    .map((artifact) => ({
      params: { name: artifact.name },
      props: { artifact },
    }));

export const GET: APIRoute = ({ props }) =>
  new Response(
    new Uint8Array((props as { artifact: SkillArtifact }).artifact.bytes),
    {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    },
  );
