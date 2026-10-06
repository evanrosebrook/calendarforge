import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PayPeriodCalendarPage, { metadata } from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/pay-period-calendar",
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("pay-period calendar page", () => {
  it("publishes focused metadata", () => {
    expect(metadata).toMatchObject({
      title: "Biweekly Pay Period Calendar Generator",
      alternates: { canonical: "/pay-period-calendar" },
    });
  });

  it("renders a configured schedule with calendar and table output", async () => {
    const html = renderToStaticMarkup(await PayPeriodCalendarPage({ searchParams: Promise.resolve({
      year: "2027",
      payday: "2027-01-08",
      lag: "6",
      adjust: "none",
    }) }));
    expect(html).toContain("2027 pay-period calendar");
    expect(html).toContain("26 paydays");
    expect(html).toContain("April and October");
    expect(html).toContain("Every period and payday");
    expect(html).toContain("Jan 8, 2027");
    expect(html).toContain("Download ICS");
    expect(html).toContain("Download CSV");
  });
});
