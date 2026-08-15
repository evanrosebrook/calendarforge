import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

describe("site header", () => {
  it("groups calendar tasks in desktop navigation", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain("<summary>Calendars");
    expect(html.match(/name="primary-navigation"/g)).toHaveLength(2);
    expect(html).toContain("Monthly calendar</a>");
    expect(html).toContain("Year calendar</a>");
    expect(html).toContain("Monday-start calendar</a>");
    expect(html).toContain('href="/fiscal-calendar">Fiscal calendar</a>');
    expect(html).toContain('href="/holidays">Holiday calendars</a>');
    expect(html).toContain("Moon phases</a>");
  });

  it("puts Today first and exposes every calculator task", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain("<summary>Calculators");
    expect(html.indexOf("Today’s date</a>")).toBeLessThan(html.indexOf("Days between</a>"));
    expect(html).toContain('href="/date-calculator/days-until">Days until</a>');
    expect(html).toContain('href="/date-calculator/business-days">Business days</a>');
    expect(html).toContain('href="/date-calculator/age">Age calculator</a>');
    expect(html).toContain('href="/today">Today’s date</a>');
    expect(html).toContain('href="/date-calculator">All date calculators</a>');
  });

  it("provides complete mobile navigation and a creation action", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain('<details class="mobile-nav"><summary>Menu');
    expect(html).toContain('aria-label="Calendars"');
    expect(html).toContain('aria-label="Calculators"');
    expect(html).toContain('class="button button-ink mobile-nav-cta" href="/make-calendar">Make a calendar</a>');
  });
});
