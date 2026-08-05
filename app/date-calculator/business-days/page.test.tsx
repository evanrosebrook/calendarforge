import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BusinessDaysPage, { metadata } from "./page";

describe("business days calculator page", () => {
  it("renders an observed-holiday-aware range with shareable state", async () => {
    const html = renderToStaticMarkup(await BusinessDaysPage({ searchParams: Promise.resolve({
      start: "2026-07-01",
      end: "2026-07-07",
      region: "us",
      submitted: "1",
      includeStart: "1",
      includeEnd: "1",
    }) }));
    expect(html).toContain("4 business days");
    expect(html).toContain("Independence Day (observed)");
    expect(html).toContain('href="/date/2026-07-03"');
    expect(html).toContain("Both endpoints are eligible to count.");
  });

  it("renders add mode across a holiday weekend", async () => {
    const html = renderToStaticMarkup(await BusinessDaysPage({ searchParams: Promise.resolve({
      mode: "shift",
      date: "2026-07-02",
      days: "2",
      direction: "add",
      region: "us",
    }) }));
    expect(html).toContain("Tuesday, July 7, 2026");
    expect(html).toContain("The starting date is not counted");
    expect(html).toContain("Holiday weekdays");
  });

  it("publishes a canonical, intent-focused title", () => {
    expect(metadata).toMatchObject({
      title: "Business Days Calculator — Count or Add Workdays",
      alternates: { canonical: "/date-calculator/business-days" },
    });
  });
});
