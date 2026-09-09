import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TodayPage, { metadata } from "./page";

describe("today page", () => {
  it("explains its timezone and calendar metrics and links to next-step calculators", async () => {
    const html = renderToStaticMarkup(await TodayPage({ searchParams: Promise.resolve({ tz: "America/New_York" }) }));

    expect(html).toContain("The timezone sets the date");
    expect(html).toContain("ISO weeks start Monday");
    expect(html).toMatch(/Day \d+ of (365|366)/);
    expect(html).toContain('href="/date-calculator/days-between?start=');
    expect(html).toContain('href="/date-calculator/business-days?mode=shift&amp;date=');
  });

  it("publishes an intent-focused canonical", () => {
    expect(metadata).toMatchObject({
      title: "Today's Date — Day, Week Number & Date Formats",
      alternates: { canonical: "/today" },
    });
  });
});
