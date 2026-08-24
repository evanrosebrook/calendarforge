import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createShiftCalendar, parseShiftCalendarState } from "@/lib/shift-calendar";
import { ShiftMiniCalendar } from "./shift-mini-calendar";

describe("shift mini calendar", () => {
  it("marks work and off days while muting dates before the schedule starts", () => {
    const state = parseShiftCalendarState({ startDate: "2028-02-27", pattern: "2-2", months: "1", weekStart: "monday" });
    const sheet = createShiftCalendar(state).sheets[0];
    expect(sheet).toBeDefined();
    const html = renderToStaticMarkup(<ShiftMiniCalendar sheet={sheet!} startDate={state.startDate} />);
    expect(html).toContain("February 2028 shift schedule");
    expect(html).toMatch(/class="[^"]*range-outside[^"]*" data-date="2028-02-26"/);
    expect(html).toMatch(/class="[^"]*shift-work[^"]*" data-date="2028-02-27"/);
    expect(html).toMatch(/class="[^"]*shift-off[^"]*" data-date="2028-02-29"/);
    expect(html).toContain('title="Work day"');
    expect(html).toContain('title="Off day"');
  });
});
