import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getNationalHolidays } from "@/lib/calendar";
import DatePage from "@/app/date/[date]/page";
import CountryHolidayYearPage from "./[country]/[year]/page";
import HolidayDetailPage from "./[country]/holiday/[holiday]/page";

describe("holiday internal links", () => {
  it("links 2027 U.S. holiday dates to date guides and names to holiday guides", async () => {
    const page = await CountryHolidayYearPage({ params: Promise.resolve({ country: "us", year: "2027" }) });
    const html = renderToStaticMarkup(page);
    const dateGuideLinks = html.match(/href="\/date\/2027-[^"]+"/g) ?? [];

    expect(html).toContain('href="/calendar/2027?scope=national"');
    expect(html).toContain('href="/date/2027-01-01"');
    expect(dateGuideLinks).toHaveLength(getNationalHolidays("us", 2027).length);
    expect(html).toContain('href="/holidays/us/holiday/new-years-day"');
    expect(html).toContain('"@type":"BreadcrumbList"');
  });

  it("links holiday occurrences to their exact date guides", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T12:00:00Z"));

    try {
      const page = await HolidayDetailPage({ params: Promise.resolve({ country: "us", holiday: "independence-day" }) });
      const html = renderToStaticMarkup(page);

      expect(html).toContain('href="/date/2027-07-04"');
      expect(html).toContain('href="/date/2027-07-05"');
      expect(html).toContain('"@type":"BreadcrumbList"');
    } finally {
      vi.useRealTimers();
    }
  });

  it("links a holiday date guide back to the permanent holiday guide", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T12:00:00Z"));

    try {
      const page = await DatePage({ params: Promise.resolve({ date: "2027-07-04" }) });
      const html = renderToStaticMarkup(page);

      expect(html).toContain('href="/holidays/us/holiday/independence-day"');
      expect(html).toContain('"@type":"BreadcrumbList"');
    } finally {
      vi.useRealTimers();
    }
  });
});
