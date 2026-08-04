import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  renderSitemapIndex,
  renderUrlSet,
  sitemapIndexUrls,
  sitemapLastYear,
  sitemapUrls,
} from "./sitemaps";

const now = new Date("2026-08-03T12:00:00Z");
const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

beforeAll(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://calendarforge.net";
});

afterAll(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("search sitemaps", () => {
  it("publishes a stable family index", () => {
    expect(sitemapIndexUrls()).toEqual([
      "https://calendarforge.net/sitemaps/static.xml",
      "https://calendarforge.net/sitemaps/calendars.xml",
      "https://calendarforge.net/sitemaps/holidays.xml",
      "https://calendarforge.net/sitemaps/dates.xml",
    ]);
  });

  it("includes every canonical static page", () => {
    expect(sitemapUrls("static", now)).toEqual([
      "https://calendarforge.net/",
      "https://calendarforge.net/make-calendar",
      "https://calendarforge.net/today",
      "https://calendarforge.net/date-calculator",
      "https://calendarforge.net/date-calculator/add-subtract",
      "https://calendarforge.net/date-calculator/days-between",
      "https://calendarforge.net/privacy",
    ]);
  });

  it("keeps the first publication year and grows three years ahead", () => {
    expect(sitemapLastYear(now)).toBe(2029);
    expect(sitemapUrls("calendars", now)).toHaveLength(5 * 13);
    expect(sitemapUrls("calendars", now)).toContain("https://calendarforge.net/calendar/2025/1");
    expect(sitemapUrls("calendars", now)).toContain("https://calendarforge.net/calendar/2029/12");
  });

  it("includes holiday hubs, country years, and holiday entities", () => {
    const urls = sitemapUrls("holidays", now);
    expect(urls).toContain("https://calendarforge.net/holidays");
    expect(urls).toContain("https://calendarforge.net/holidays/us/2029");
    expect(urls).toContain("https://calendarforge.net/holidays/canada/2025");
    expect(urls).toContain("https://calendarforge.net/holidays/us/holiday/independence-day");
    expect(urls).toContain("https://calendarforge.net/holidays/canada/holiday/canada-day");
  });

  it("includes every valid date from 2025 through 2029, including leap day", () => {
    const urls = sitemapUrls("dates", now);
    expect(urls).toHaveLength(1826);
    expect(urls[0]).toBe("https://calendarforge.net/date/2025-01-01");
    expect(urls).toContain("https://calendarforge.net/date/2028-02-29");
    expect(urls.at(-1)).toBe("https://calendarforge.net/date/2029-12-31");
  });

  it("renders valid sitemap index and URL-set envelopes", () => {
    const index = renderSitemapIndex(["https://calendarforge.net/sitemaps/a&b.xml"]);
    const urlSet = renderUrlSet(["https://calendarforge.net/calendar/2026?country=us&holidays=1"]);
    expect(index).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(index).toContain("a&amp;b.xml");
    expect(urlSet).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(urlSet).toContain("country=us&amp;holidays=1");
  });
});
