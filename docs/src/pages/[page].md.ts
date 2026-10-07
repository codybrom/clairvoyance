import type { APIRoute, GetStaticPaths } from "astro";
import {
  getInfoPages,
  infoPageMarkdown,
  type InfoPage,
} from "../utils/info-pages";
import { DEFAULT_DESCRIPTION, SITE_URL, markdownResponse } from "../utils/site";

export const getStaticPaths: GetStaticPaths = () =>
  getInfoPages().map((page) => ({
    params: { page: page.slug },
    props: { page },
  }));

export const GET: APIRoute = ({ props }) => {
  const { page } = props as { page: InfoPage };
  return markdownResponse(
    {
      title: page.title,
      description: page.description ?? DEFAULT_DESCRIPTION,
      canonical: `${SITE_URL}/${page.slug}`,
    },
    infoPageMarkdown(page),
  );
};
