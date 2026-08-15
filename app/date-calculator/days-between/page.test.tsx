import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DaysBetweenPage, { metadata } from "./page";

describe("days-between calculator page", () => {
  it("renders the submitted result and links the surrounding date-tool cluster", async () => {
    const html = renderToStaticMarkup(await DaysBetweenPage({ searchParams: Promise.resolve({
      start: "2026-08-05",
      end: "2026-08-14",
    }) }));

    expect(html).toContain("9 days");
    expect(html).toContain('href="/date-calculator/business-days"');
    expect(html).toContain('href="/today"');
    expect(html).toContain('href="/date-calculator/age"');
    expect(html).toContain('href="/date-calculator/add-subtract"');
  });

  it("publishes an intent-focused title and canonical", () => {
    expect(metadata).toMatchObject({
      title: "Days Between Dates Calculator — Count Days & Weekdays",
      alternates: { canonical: "/date-calculator/days-between" },
    });
  });
});
