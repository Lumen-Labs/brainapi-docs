import type { MetadataRoute } from "next";
import { getPublishedV2Pages, source } from "@/lib/source";
import { absoluteDocsUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [...source.getPages(), ...getPublishedV2Pages()];

  return pages
    .slice()
    .sort((a, b) => a.url.localeCompare(b.url))
    .map((page) => ({
      url: absoluteDocsUrl(page.url),
      lastModified: page.data.lastModified,
      changeFrequency: "weekly" as const,
      priority: page.url === "/v2" ? 1 : page.url.startsWith("/v2") ? 0.8 : 0.5,
    }));
}
