import type { APIRoute } from "astro";
import { getInstallGuide } from "../utils/install";
import { mcpInstallMarkdown } from "../utils/tools";
import { SITE_URL, markdownResponse } from "../utils/site";

// /install as Markdown, served by the edge Worker for `Accept: text/markdown`.
export const GET: APIRoute = () => {
  const guide = getInstallGuide();
  return markdownResponse(
    {
      title: "Install Clairvoyance",
      description:
        "How to install and update Clairvoyance in Claude Code, Codex, Cursor, OpenCode, Antigravity and other agents.",
      canonical: `${SITE_URL}/install`,
    },
    [
      "# Install Clairvoyance",
      "",
      guide.intro,
      "",
      ...guide.platforms.flatMap((p) => [
        `### ${p.heading}`,
        "",
        p.markdown,
        "",
      ]),
      "## Updating",
      "",
      guide.updating,
      "",
      ...mcpInstallMarkdown(),
      "",
    ],
  );
};
