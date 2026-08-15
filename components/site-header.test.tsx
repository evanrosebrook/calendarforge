import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

describe("site header", () => {
  it("links the dedicated fiscal calendar from primary navigation", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain('href="/fiscal-calendar">Fiscal calendar</a>');
  });

  it("puts calculator navigation in the primary Calculators menu", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain("<summary>Calculators");
    expect(html).toContain('href="/date-calculator">All date calculators</a>');
    expect(html).toContain('href="/date-calculator/days-until">Days until</a>');
    expect(html).toContain('href="/date-calculator/business-days">Business days</a>');
    expect(html).toContain('href="/today">Today</a>');
  });
});
