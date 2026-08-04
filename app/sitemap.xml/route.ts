import { renderSitemapIndex, sitemapIndexUrls, sitemapXmlResponse } from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return sitemapXmlResponse(renderSitemapIndex(sitemapIndexUrls()));
}
