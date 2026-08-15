import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DaysUntilPage, { metadata } from "./page";

describe("days until calculator page", () => {
  it("renders a leap-day-spanning future countdown with shareable GET state", async () => {
    const html = renderToStaticMarkup(await DaysUntilPage({ searchParams: Promise.resolve({
      start: "2024-02-28",
      target: "2024-03-01",
    }) }));

    expect(html).toContain("2 days to go");
    expect(html).toContain("Friday, March 1, 2024");
    expect(html).toContain('name="start"');
    expect(html).toContain('name="target"');
    expect(html).toContain("Spring and summer shortcuts use meteorological seasons");
  });

  it("labels past and matching target dates clearly", async () => {
    const pastHtml = renderToStaticMarkup(await DaysUntilPage({ searchParams: Promise.resolve({ start: "2026-08-04", target: "2026-08-01" }) }));
    const todayHtml = renderToStaticMarkup(await DaysUntilPage({ searchParams: Promise.resolve({ start: "2026-08-04", target: "2026-08-04" }) }));

    expect(pastHtml).toContain("3 days ago");
    expect(pastHtml).toContain("Time since the target date");
    expect(todayHtml).toContain("The target date is today");
    expect(todayHtml).toContain("<h2>Today</h2>");
  });

  it("rejects invalid Gregorian dates", async () => {
    const html = renderToStaticMarkup(await DaysUntilPage({ searchParams: Promise.resolve({ start: "2026-08-04", target: "2026-02-29" }) }));
    expect(html).toContain("Enter two valid dates.");
  });

  it("publishes canonical intent-focused metadata", () => {
    expect(metadata).toMatchObject({
      title: "How Many Days Until? Countdown Calculator",
      alternates: { canonical: "/date-calculator/days-until" },
    });
  });
});
