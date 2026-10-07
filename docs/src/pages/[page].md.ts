import type { APIRoute, GetStaticPaths } from "astro";
import {
  getInfoPages,
  infoPageMarkdown,
  type InfoPage,
} from "../utils/info-pages";
import { markdownResponse } from "../utils/site";

export const getStaticPaths: GetStaticPaths = () =>
  getInfoPages().map((page) => ({
    params: { page: page.slug },
    props: { page },
  }));

export const GET: APIRoute = ({ props }) =>
  markdownResponse(infoPageMarkdown((props as { page: InfoPage }).page));
