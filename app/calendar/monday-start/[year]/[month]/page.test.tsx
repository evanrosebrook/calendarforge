import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("not found"); },
  usePathname: () => "/calendar/monday-start/2026/8",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import MondayStartMonthPage, { generateMetadata } from "./page";

describe("Monday-start monthly calendar", () => {
  it("renders Monday first with dedicated adjacent-month links", async () => {
    const html = renderToStaticMarkup(await MondayStartMonthPage({
      params: Promise.resolve({ year: "2026", month: "8" }),
      searchParams: Promise.resolve({}),
    }));
    expect(html).toContain("Monday-start monthly calendar");
    expect(html).toContain("Mon");
    expect(html.indexOf("Mon")).toBeLessThan(html.indexOf("Sun"));
    expect(html).toContain('href="/calendar/monday-start/2026/7"');
    expect(html).toContain('href="/calendar/monday-start/2026/9"');
    expect(html).toContain('href="/calendar/2026/8"');
  });

  it("publishes a self-canonical page and noindexes customized variants", async () => {
    const base = { params: Promise.resolve({ year: "2026", month: "8" }) };
    await expect(generateMetadata({ ...base, searchParams: Promise.resolve({}) })).resolves.toMatchObject({
      title: "August 2026 Monday-Start Calendar",
      alternates: { canonical: "/calendar/monday-start/2026/8" },
    });
    await expect(generateMetadata({ ...base, searchParams: Promise.resolve({ holidays: "0" }) })).resolves.toMatchObject({
      robots: { index: false, follow: true },
    });
    await expect(generateMetadata({ params: Promise.resolve({ year: "2101", month: "8" }), searchParams: Promise.resolve({}) })).resolves.toMatchObject({
      robots: { index: false, follow: false },
    });
  });
});
