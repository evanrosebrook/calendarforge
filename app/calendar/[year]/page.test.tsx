import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import YearPage, { generateMetadata } from "./page";

vi.mock("@/components/calendar-toolbar", () => ({ CalendarToolbar: () => <aside>Calendar settings</aside> }));
vi.mock("@/components/page-actions", () => ({ PageActions: () => null }));

describe("yearly printable calendar page", () => {
  it("offers distinct PDF layouts and preserves selected settings in both downloads", async () => {
    const html = renderToStaticMarkup(await YearPage({ params: Promise.resolve({ year: "2027" }), searchParams: Promise.resolve({ start: "monday", country: "ca", paper: "a4", orientation: "landscape", holidays: "0", title: "Family plans", weekNumbers: "1" }) }));
    expect(html).toContain("Download 1-page PDF");
    expect(html).toContain("Download 12-page PDF");
    const downloads = [...html.matchAll(/href="(\/api\/export\/pdf\?[^"]+)"/g)].map((match) => new URL(match[1]!.replaceAll("&amp;", "&"), "https://calendarforge.net"));
    expect(downloads).toHaveLength(2);
    for (const url of downloads) {
      expect(Object.fromEntries(url.searchParams)).toMatchObject({ year: "2027", start: "monday", country: "ca", paper: "a4", orientation: "landscape", holidays: "0", title: "Family plans", weekNumbers: "1" });
    }
    expect(downloads[0]!.searchParams.get("layout")).toBe("year");
    expect(downloads[1]!.searchParams.has("layout")).toBe(false);
    expect(html).toContain("Monday start · No holidays · A4 · Landscape");
    expect(html).toContain('href="/holidays/canada/2027"');
    expect(html).toContain('aria-label="Open December 2027 calendar"');
    expect(html).toContain("months=12");
  });

  it("keeps preset variants canonical to the existing yearly page and noindexed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T12:00:00Z"));
    try {
      const metadata = await generateMetadata({ params: Promise.resolve({ year: "2027" }), searchParams: Promise.resolve({ holidays: "0" }) });
      expect(metadata).toMatchObject({ alternates: { canonical: "/calendar/2027" }, robots: { index: false, follow: true } });
      expect(metadata.description).toContain("one-page yearly PDF or 12 monthly pages");
    } finally { vi.useRealTimers(); }
  });

  it("does not advertise unavailable holiday dates for years outside coverage", async () => {
    const html = renderToStaticMarkup(await YearPage({ params: Promise.resolve({ year: "1900" }), searchParams: Promise.resolve({}) }));
    expect(html).toContain("Holiday dates unavailable for this year");
    expect(html).not.toContain('href="/holidays/us/1900"');
  });
});
