// The site's plain-prose pages (about, contact, privacy). Each is authored once
// as Markdown in src/content/info/ and published twice: as HTML at /<slug> and
// verbatim at /<slug>.md for agents (see edge/worker.js).
import matter from "gray-matter";
import { Marked } from "marked";

export interface InfoPage {
  slug: string;
  title: string;
  description?: string;
  updated?: string;
  body: string;
  html: string;
}

const sources = import.meta.glob<string>("../content/info/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const marked = new Marked();

export function getInfoPages(): InfoPage[] {
  return Object.entries(sources).map(([file, raw]) => {
    const { data, content } = matter(raw);
    return {
      slug: file.split("/").pop()!.replace(/\.md$/, ""),
      title: data.title,
      description: data.description,
      updated: data.updated,
      body: content.trim(),
      html: marked.parse(content) as string,
    };
  });
}

/** The whole page as a Markdown document, mirroring the HTML layout. */
export function infoPageMarkdown(page: InfoPage): string[] {
  return [
    `# ${page.title}`,
    "",
    ...(page.updated ? [`_Last updated: ${page.updated}_`, ""] : []),
    page.body,
    "",
  ];
}
