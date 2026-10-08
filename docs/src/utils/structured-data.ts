// schema.org JSON-LD for pages other than the homepage (whose
// SoftwareApplication lives in site.ts). Rendered by Layout's jsonLd prop.
import type { Skill } from "./skills";
import { AUTHOR, SITE_URL } from "./site";

/** A skill page: the skill as a TechArticle, plus its place in the site. */
export function skillJsonLd(skill: Skill): object[] {
  const url = `${SITE_URL}/skills/${skill.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: skill.title,
      description: skill.description,
      url,
      ...(skill.lastUpdated && { dateModified: skill.lastUpdated }),
      author: { "@type": "Person", ...AUTHOR },
      image: `${SITE_URL}/og.png`,
      isPartOf: { "@type": "SoftwareApplication", name: "Clairvoyance", url: `${SITE_URL}/` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Clairvoyance", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Skills", item: `${SITE_URL}/skills` },
        { "@type": "ListItem", position: 3, name: skill.title, item: url },
      ],
    },
  ];
}
