import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("not found"); },
}));

import DatePage, { generateMetadata } from "./page";

describe("date guide search intent", () => {
  it("publishes long and numeric date formats in search metadata", async () => {
    await expect(generateMetadata({ params: Promise.resolve({ date: "2026-08-05" }) })).resolves.toMatchObject({
      title: "August 5, 2026 (08/05/2026): Day, Week & Calendar",
      description: expect.stringContaining("05/08/2026 in day-first format"),
      alternates: { canonical: "/date/2026-08-05" },
    });
  });

  it("answers numeric ambiguity before the calendar and offers tracked actions", async () => {
    const html = renderToStaticMarkup(await DatePage({ params: Promise.resolve({ date: "2026-08-05" }) }));
    expect(html).toContain("08/05/2026");
    expect(html).toContain("05/08/2026");
    expect(html).toContain("in U.S. month-first notation");
    expect(html.indexOf("in U.S. month-first notation")).toBeLessThan(html.indexOf("August 2026 calendar"));
    expect(html).toContain('href="/date-calculator/days-between?start=2026-08-05"');
    expect(html).toContain('href="/date-calculator/business-days?mode=shift&amp;date=2026-08-05"');
    expect(html).toContain("Print daily planner");
  });
});
