import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://clairvoyance.fyi",
  integrations: [sitemap()],
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Instrument Serif",
        cssVariable: "--font-serif",
        weights: [400],
        styles: ["normal", "italic"],
      },
      {
        provider: fontProviders.google(),
        name: "IBM Plex Mono",
        cssVariable: "--font-mono",
        weights: [300, 400, 500],
      },
      {
        provider: fontProviders.google(),
        name: "Outfit",
        cssVariable: "--font-sans",
        weights: [200, 300, 400, 500],
      },
    ],
  },
});
