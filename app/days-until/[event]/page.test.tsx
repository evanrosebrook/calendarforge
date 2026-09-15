import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import CountdownEventPage, { generateMetadata, generateStaticParams } from "./page";

afterEach(() => {
  vi.useRealTimers();
});

describe("bounded countdown event pages", () => {
  it("generates only Christmas and Easter routes", () => {
    expect(generateStaticParams()).toEqual([{ event: "christmas" }, { event: "easter" }]);
  });

  it("renders Christmas as today on December 25 UTC", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-25T20:00:00Z"));
    const html = renderToStaticMarkup(await CountdownEventPage({ params: Promise.resolve({ event: "christmas" }) }));

    expect(html).toContain("How many days until Christmas?");
    expect(html).toContain("The target date is today");
    expect(html).toContain("Christmas is always December 25");
    expect(html).toContain("start=2026-12-25&amp;target=2026-12-25");
    expect(html).toContain("From December 24 to December 25 is one calendar day");
    expect(html).toContain("complete seven-day blocks and a remainder");
    expect(html).toContain('href="/date-calculator/business-days?mode=between"');
    expect(html).toContain('href="/calendar/2026/12"');
  });

  it("renders the computed Western Easter date and useful qualification", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    const html = renderToStaticMarkup(await CountdownEventPage({ params: Promise.resolve({ event: "easter" }) }));

    expect(html).toContain("35 days to go");
    expect(html).toContain("Sunday, April 5, 2026");
    expect(html).toContain("Orthodox Easter and local observances may use a different date");
    expect(html).toContain("always falls on a Sunday from March 22 through April 25");
  });

  it("publishes stable canonical metadata", async () => {
    await expect(generateMetadata({ params: Promise.resolve({ event: "easter" }) })).resolves.toMatchObject({
      title: "How Many Days Until Easter?",
      alternates: { canonical: "/days-until/easter" },
    });
  });
});
