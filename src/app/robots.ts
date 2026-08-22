import type { MetadataRoute } from "next";
import { DOCS_BASE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/docs/" },
    sitemap: `${DOCS_BASE}/sitemap.xml`,
  };
}
