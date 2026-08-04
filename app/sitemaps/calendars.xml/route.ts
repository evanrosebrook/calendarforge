import { renderUrlSet, sitemapUrls, sitemapXmlResponse } from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return sitemapXmlResponse(renderUrlSet(sitemapUrls("calendars")));
}
