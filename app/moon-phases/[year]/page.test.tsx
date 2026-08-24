import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import MoonPhasesPage, { generateMetadata, generateStaticParams, parseMoonPhaseYear } from "./page";

afterEach(() => {
  vi.useRealTimers();
});

describe("annual moon phase page", () => {
  it("generates the supported calculation years", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    expect(generateStaticParams()).toEqual([
      { year: "2025" }, { year: "2026" }, { year: "2027" }, { year: "2028" }, { year: "2029" },
    ]);
  });

  it("renders the annual grid, UTC qualification, exact dates, and export", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    const html = renderToStaticMarkup(await MoonPhasesPage({ params: Promise.resolve({ year: "2026" }) }));

    expect(html).toContain("Moon phases 2026");
    expect(html).toContain("2026 moon calendar");
    expect(html).toContain("May 31");
    expect(html).toContain("08:45 UTC");
    expect(html).toContain('href="/api/moon-phases/ics?year=2026"');
    expect(html).toContain("The local date can differ depending on your timezone");
  });

  it("publishes stable canonical metadata and rejects unsupported years", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    await expect(generateMetadata({ params: Promise.resolve({ year: "2026" }) })).resolves.toMatchObject({
      title: "Moon Phases 2026 — Printable Lunar Calendar",
      alternates: { canonical: "/moon-phases/2026" },
    });
    await expect(generateMetadata({ params: Promise.resolve({ year: "2029" }) })).resolves.toMatchObject({
      robots: { index: false, follow: false },
    });
    expect(parseMoonPhaseYear("2024")).toBeNull();
    expect(parseMoonPhaseYear("not-a-year")).toBeNull();
  });
});
