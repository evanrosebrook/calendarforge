import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("not found"); },
}));

import DatePage, { generateMetadata } from "./page";

describe("date guide search intent", () => {
  it("answers day-of-week intent while preserving numeric date formats in search metadata", async () => {
    await expect(generateMetadata({ params: Promise.resolve({ date: "2026-08-05" }) })).resolves.toMatchObject({
      title: { absolute: "August 5, 2026 Is a Wednesday | Calendar Forge" },
      description: expect.stringContaining("05/08/2026 in day-first format"),
      alternates: { canonical: "/date/2026-08-05" },
      robots: undefined,
    });
  });

  it("contains date guides outside the acquisition window", async () => {
    await expect(generateMetadata({ params: Promise.resolve({ date: "2101-08-05" }) })).resolves.toMatchObject({
      alternates: { canonical: "/date/2101-08-05" },
      robots: { index: false, follow: false },
    });

    const html = renderToStaticMarkup(await DatePage({ params: Promise.resolve({ date: "2101-08-05" }) }));
    expect(html).not.toContain('href="/date/2101-08-04"');
    expect(html).not.toContain('href="/date/2101-08-06"');
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

  it("links only to holiday years that production can serve", async () => {
    const supported = renderToStaticMarkup(await DatePage({ params: Promise.resolve({ date: "2100-08-05" }) }));
    const unsupported = renderToStaticMarkup(await DatePage({ params: Promise.resolve({ date: "2101-08-05" }) }));

    expect(supported).toContain('href="/holidays/us/2100"');
    expect(supported).toContain('href="/holidays/canada/2100"');
    expect(unsupported).not.toContain('href="/holidays/us/2101"');
    expect(unsupported).not.toContain('href="/holidays/canada/2101"');
    expect(unsupported).toContain("Holiday calendars cover planning years 1971 through 2100.");
  });
});
