import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MakeCalendarPage, { metadata } from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/make-calendar",
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("custom calendar maker page", () => {
  it("explains its range, print, export, sharing, and privacy capabilities", async () => {
    const html = renderToStaticMarkup(await MakeCalendarPage({ searchParams: Promise.resolve({
      year: "2026",
      month: "9",
      months: "3",
    }) }));

    expect(html).toContain("Build once, use it anywhere");
    expect(html).toContain("Choose the right range");
    expect(html).toContain("Prepare a print-ready page");
    expect(html).toContain("Pick a useful file format");
    expect(html).toContain("Share the configured calendar");
    expect(html).toContain("Keep control of your plans");
  });

  it("publishes specific calendar-maker metadata", () => {
    expect(metadata).toMatchObject({
      title: "Free Custom Calendar Maker — Print & Export",
      alternates: { canonical: "/make-calendar" },
    });
  });
});
