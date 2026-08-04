import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createCalendarMonth } from "../lib/calendar";
import { CalendarGrid } from "./calendar-grid";
import { MiniCalendar } from "./mini-calendar";

const march2027 = createCalendarMonth({ year: 2027, month: 3 });

describe("calendar date-guide links", () => {
  it("links every in-month day from the canonical month grid", () => {
    const html = renderToStaticMarkup(<CalendarGrid calendar={march2027} linkDates />);
    expect(html.match(/href="\/date\/2027-03-/g)).toHaveLength(31);
    expect(html).toContain('href="/date/2027-03-17"');
    expect(html).not.toContain('href="/date/2027-02-28"');
  });

  it("can keep builder-style grids non-navigational", () => {
    const html = renderToStaticMarkup(<CalendarGrid calendar={march2027} />);
    expect(html).not.toContain('href="/date/');
  });

  it("links in-month days from year-at-a-glance mini calendars", () => {
    const html = renderToStaticMarkup(<MiniCalendar calendar={march2027} />);
    expect(html.match(/href="\/date\/2027-03-/g)).toHaveLength(31);
    expect(html).toContain('aria-label="View date guide for 2027-03-17"');
    expect(html).not.toContain('href="/date/2027-02-28"');
  });
});
