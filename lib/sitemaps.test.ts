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
      "https://calendarforge.net/fiscal-calendar",
      "https://calendarforge.net/today",
      "https://calendarforge.net/date-calculator",
      "https://calendarforge.net/date-calculator/days-until",
      "https://calendarforge.net/date-calculator/add-subtract",
      "https://calendarforge.net/date-calculator/days-between",
      "https://calendarforge.net/date-calculator/business-days",
      "https://calendarforge.net/date-calculator/age",
      "https://calendarforge.net/days-until/christmas",
      "https://calendarforge.net/days-until/easter",
      "https://calendarforge.net/privacy",
    ]);
  });

  it("publishes the current year plus two years", () => {
    expect(sitemapLastYear(now)).toBe(2028);
    expect(sitemapUrls("calendars", now)).toHaveLength(3 * 26);
    expect(sitemapUrls("calendars", now)).toContain("https://calendarforge.net/calendar/2026/1");
    expect(sitemapUrls("calendars", now)).toContain("https://calendarforge.net/calendar/2028/12");
    expect(sitemapUrls("calendars", now)).toContain("https://calendarforge.net/calendar/monday-start/2028/12");
    expect(sitemapUrls("calendars", now)).not.toContain("https://calendarforge.net/calendar/2029/12");
    expect(sitemapUrls("calendars", now)).toContain("https://calendarforge.net/moon-phases/2026");
  });

  it("includes holiday hubs, country years, and holiday entities", () => {
    const urls = sitemapUrls("holidays", now);
    expect(urls).toContain("https://calendarforge.net/holidays");
    expect(urls).toContain("https://calendarforge.net/holidays/us/2028");
    expect(urls).toContain("https://calendarforge.net/holidays/canada/2026");
    expect(urls).toContain("https://calendarforge.net/holidays/us/holiday/independence-day");
    expect(urls).toContain("https://calendarforge.net/holidays/canada/holiday/canada-day");
  });

  it("includes every valid date from 2026 through 2028, including leap day", () => {
    const urls = sitemapUrls("dates", now);
    expect(urls).toHaveLength(1096);
    expect(urls[0]).toBe("https://calendarforge.net/date/2026-01-01");
    expect(urls).toContain("https://calendarforge.net/date/2028-02-29");
    expect(urls.at(-1)).toBe("https://calendarforge.net/date/2028-12-31");
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
