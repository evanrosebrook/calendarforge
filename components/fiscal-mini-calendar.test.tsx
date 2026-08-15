import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createFiscalCalendar, parseFiscalCalendarState } from "@/lib/fiscal-calendar";
import { FiscalMiniCalendar } from "./fiscal-mini-calendar";

describe("fiscal mini calendar", () => {
  it("labels accounting periods and mutes dates outside a partial boundary period", () => {
    const state = parseFiscalCalendarState({
      startDate: "2026-07-15",
      endDate: "2026-09-30",
      holidays: "0",
    });
    const sheet = createFiscalCalendar(state).sheets[0];
    expect(sheet).toBeDefined();
    const html = renderToStaticMarkup(<FiscalMiniCalendar sheet={sheet!} startDate={state.startDate} endDate={state.endDate} highlightWeekends showWeekNumbers={false} />);

    expect(html).toContain("July 2026");
    expect(html).toContain("P01");
    expect(html).toContain('data-date');
    expect(html).not.toContain('class="week-col" scope="col">W</th>');
    expect(html).toContain('dateTime="2026-07-14"');
    expect(html).toContain("range-outside");
  });

  it("shows the fiscal week column when enabled", () => {
    const state = parseFiscalCalendarState({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      weekStart: "monday",
      weekNumbers: "1",
      holidays: "0",
    });
    const sheet = createFiscalCalendar(state).sheets[0];
    expect(sheet).toBeDefined();
    const html = renderToStaticMarkup(<FiscalMiniCalendar sheet={sheet!} startDate={state.startDate} endDate={state.endDate} highlightWeekends showWeekNumbers />);

    expect(html).toContain('class="week-col" scope="col">W</th>');
    expect(html).toContain('class="week-col">1</td>');
  });
});
