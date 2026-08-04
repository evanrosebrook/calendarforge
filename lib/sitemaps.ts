import { HOLIDAY_CATALOGS } from "./calendar";
import { absoluteSiteUrl } from "./site-url";

export const SITEMAP_FIRST_YEAR = 2025;

export const SITEMAP_FAMILIES = ["static", "calendars", "holidays", "dates"] as const;

export type SitemapFamily = (typeof SITEMAP_FAMILIES)[number];

const STATIC_PATHS = [
  "/",
  "/make-calendar",
  "/today",
  "/date-calculator",
  "/date-calculator/add-subtract",
  "/date-calculator/days-between",
  "/privacy",
] as const;

export function sitemapLastYear(now = new Date()): number {
  return now.getUTCFullYear() + 3;
}

export function sitemapIndexUrls(): string[] {
  return SITEMAP_FAMILIES.map((family) => absoluteSiteUrl(`/sitemaps/${family}.xml`));
}

export function sitemapUrls(family: SitemapFamily, now = new Date()): string[] {
  const years = inclusiveYears(SITEMAP_FIRST_YEAR, sitemapLastYear(now));

  if (family === "static") return STATIC_PATHS.map(absoluteSiteUrl);

  if (family === "calendars") {
    return years.flatMap((year) => [
      absoluteSiteUrl(`/calendar/${year}`),
      ...Array.from({ length: 12 }, (_, index) => absoluteSiteUrl(`/calendar/${year}/${index + 1}`)),
    ]);
  }

  if (family === "holidays") {
    return [
      absoluteSiteUrl("/holidays"),
      ...years.flatMap((year) => HOLIDAY_CATALOGS.map((catalog) => absoluteSiteUrl(`/holidays/${catalog.slug}/${year}`))),
      ...HOLIDAY_CATALOGS.flatMap((catalog) =>
        catalog.holidays.map((holiday) => absoluteSiteUrl(`/holidays/${catalog.slug}/holiday/${holiday.id}`)),
      ),
    ];
  }

  return years.flatMap((year) => datePathsForYear(year).map(absoluteSiteUrl));
}

export function renderSitemapIndex(urls: readonly string[]): string {
  return `${xmlDeclaration()}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`;
}

export function renderUrlSet(urls: readonly string[]): string {
  return `${xmlDeclaration()}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
}

export function sitemapXmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

function inclusiveYears(first: number, last: number): number[] {
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
}

function datePathsForYear(year: number): string[] {
  const paths: string[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      paths.push(`/date/${year}-${pad(month)}-${pad(day)}`);
    }
  }
  return paths;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function xmlDeclaration(): string {
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
