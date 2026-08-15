import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AgeCalculatorPage, { metadata } from "./page";

describe("age calculator page", () => {
  it("renders an exact age and shareable related-date links", async () => {
    const html = renderToStaticMarkup(await AgeCalculatorPage({ searchParams: Promise.resolve({
      birth: "1990-05-20",
      asOf: "2026-08-14",
    }) }));
    expect(html).toContain("36 years, 2 months, 25 days");
    expect(html).toContain("13,235");
    expect(html).toContain("May 20, 2027");
    expect(html).toContain('href="/date/1990-05-20"');
    expect(html).toContain("February 29 birthday uses February 28");
  });

  it("rejects an as-of date before the birth date", async () => {
    const html = renderToStaticMarkup(await AgeCalculatorPage({ searchParams: Promise.resolve({
      birth: "2026-08-15",
      asOf: "2026-08-14",
    }) }));
    expect(html).toContain("The birth date comes after the as-of date.");
  });

  it("publishes an intent-focused canonical", () => {
    expect(metadata).toMatchObject({
      title: "Age Calculator — Exact Age & Next Birthday",
      alternates: { canonical: "/date-calculator/age" },
    });
  });
});
