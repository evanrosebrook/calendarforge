import type { MetadataRoute } from "next";
import { HOLIDAY_CATALOGS } from "@/lib/calendar";
import { absoluteSiteUrl } from "@/lib/site-url";

type SitemapEntry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
  const currentYear = new Date().getUTCFullYear();
  const acquisitionYears = [currentYear, currentYear + 1, currentYear + 2];
  const entries: SitemapEntry[] = [
    entry("/", "weekly", 1),
    entry("/make-calendar", "monthly", 0.9),
    entry("/today", "daily", 0.7),
    entry("/date-calculator", "monthly", 0.7),
    entry("/date-calculator/add-subtract", "monthly", 0.8),
    entry("/date-calculator/days-between", "monthly", 0.8),
    entry("/holidays", "monthly", 0.8),
    entry("/privacy", "yearly", 0.2),
  ];

  for (const year of acquisitionYears) {
    entries.push(entry(`/calendar/${year}`, "monthly", 0.9));
    for (let month = 1; month <= 12; month += 1) {
      entries.push(entry(`/calendar/${year}/${month}`, "monthly", year === currentYear ? 0.9 : 0.8));
    }
    for (const catalog of HOLIDAY_CATALOGS) {
      entries.push(entry(`/holidays/${catalog.slug}/${year}`, "monthly", 0.8));
    }
  }

  for (const catalog of HOLIDAY_CATALOGS) {
    for (const holiday of catalog.holidays) {
      entries.push(entry(`/holidays/${catalog.slug}/holiday/${holiday.id}`, "yearly", 0.7));
    }
  }

  return entries;
}

function entry(pathname: string, changeFrequency: SitemapEntry["changeFrequency"], priority: number): SitemapEntry {
  return { url: absoluteSiteUrl(pathname), changeFrequency, priority };
}
