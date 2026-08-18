import type { MetadataRoute } from "next";
import { absoluteSiteUrl, getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["meta-externalagent", "ClaudeBot"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: getSiteUrl().origin,
  };
}
