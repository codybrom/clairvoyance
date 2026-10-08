import type { APIRoute } from "astro";
import { getSkillsByPillar } from "../../utils/skills";
import { SITE_URL, TAGLINE } from "../../utils/site";

// Scoped llms.txt for the skill catalog: every skill by pillar, linked to its
// Markdown, without the rest of the site.
export const GET: APIRoute = () => {
  const lines = [
    "# Clairvoyance skills",
    "",
    `> ${TAGLINE}`,
    "",
    ...getSkillsByPillar().flatMap((pillar) => [
      `## ${pillar.name}`,
      "",
      ...pillar.skills.map((s) => `- [${s.title}](${SITE_URL}/skills/${s.slug}.md): ${s.description}`),
      "",
    ]),
    `Every skill in one file: ${SITE_URL}/llms-full.txt`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
