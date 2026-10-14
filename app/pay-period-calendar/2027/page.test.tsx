import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PayPeriodGuide2027Page, { metadata } from "./page";

describe("2027 pay-period guide", () => {
  it("has one canonical URL and a focused search description", () => {
    expect(metadata).toMatchObject({
      title: "2027 Biweekly Pay Calendar — Three-Paycheck Months",
      alternates: { canonical: "/pay-period-calendar/2027" },
    });
  });

  it("renders calculated example cycles and links to the configured generator", () => {
    const html = renderToStaticMarkup(<PayPeriodGuide2027Page />);

    expect(html).toContain("Which months have three paychecks in 2027?");
    expect(html).toContain("April and October");
    expect(html).toContain("January, July, and December");
    expect(html).toContain("26 paydays fall in 2027");
    expect(html).toContain("27 paydays fall in 2027");
    expect(html).toContain("Jan 1 · Jan 15 · Jan 29");
    expect(html).toContain("/pay-period-calendar?year=2027&amp;payday=2027-01-08&amp;lag=6&amp;adjust=none");
    expect(html).toContain("/pay-period-calendar?year=2027&amp;payday=2027-01-15&amp;lag=6&amp;adjust=none");
    expect(html).toContain("An employer that moves that payday into December 2026");
    expect(html).toContain("This guide and generator model biweekly schedules only.");
  });
});
