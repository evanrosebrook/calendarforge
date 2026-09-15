import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AddSubtractPage, { metadata } from "./page";

describe("add or subtract dates page", () => {
  it("renders a month-end result with concrete calculation guidance", async () => {
    const html = renderToStaticMarkup(await AddSubtractPage({ searchParams: Promise.resolve({
      date: "2026-01-31",
      months: "1",
      days: "0",
    }) }));

    expect(html).toContain("Saturday, February 28, 2026");
    expect(html).toContain("January 31 plus one month lands on February 28 in a non-leap year");
    expect(html).toContain("February 29 plus one year becomes February 28");
    expect(html).toContain('href="/date-calculator/business-days?mode=shift"');
    expect(html).toContain('href="/date-calculator/days-between"');
    expect(html).toContain('href="/date/2026-01-31"');
    expect(html).toContain('href="/date/2026-02-28"');
  });

  it("publishes an intent-focused title and canonical", () => {
    expect(metadata).toMatchObject({
      title: "Add or Subtract Days from a Date — Date Calculator",
      alternates: { canonical: "/date-calculator/add-subtract" },
    });
  });
});
