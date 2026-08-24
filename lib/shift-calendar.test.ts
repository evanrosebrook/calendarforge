import { describe, expect, it } from "vitest";
import { createShiftCalendar, parseShiftCalendarState, shiftCalendarStateToParams, shiftCalendarToCsv, shiftCalendarToIcs } from "./shift-calendar";

describe("shift calendar", () => {
  it("parses presets and keeps URL state deterministic", () => {
    const state = parseShiftCalendarState({ startDate: "2028-02-27", pattern: "2-2", months: "1", weekStart: "monday", includeOff: "1" });
    expect(state).toMatchObject({ startDate: "2028-02-27", preset: "2-2", workDays: 2, offDays: 2, monthCount: 1, firstDayOfWeek: 1, includeOffDays: true });
    expect(shiftCalendarStateToParams(state).toString()).toBe("startDate=2028-02-27&pattern=2-2&months=1&weekStart=monday&includeOff=1");
  });

  it("sanitizes invalid custom values and unsupported ranges", () => {
    const state = parseShiftCalendarState({ startDate: "2026-02-30", pattern: "custom", workDays: "99", offDays: "0", months: "99" }, new Date("2026-08-24T12:00:00Z"));
    expect(state).toMatchObject({ startDate: "2026-08-24", workDays: 4, offDays: 4, monthCount: 3 });
    expect(parseShiftCalendarState({ startDate: "9999-12-31", months: "12" }).monthCount).toBe(1);
  });

  it("repeats the cycle across leap day and ends at the last displayed month", () => {
    const state = parseShiftCalendarState({ startDate: "2028-02-27", pattern: "2-2", months: "1" });
    const calendar = createShiftCalendar(state);
    expect(calendar.endDate).toBe("2028-02-29");
    expect(calendar.days).toEqual([
      { date: "2028-02-27", type: "work", cycleDay: 1 },
      { date: "2028-02-28", type: "work", cycleDay: 2 },
      { date: "2028-02-29", type: "off", cycleDay: 3 },
    ]);
  });

  it("exports both CSV rows and work-only calendar events by default", () => {
    const state = parseShiftCalendarState({ startDate: "2026-08-30", pattern: "2-2", months: "1" });
    const calendar = createShiftCalendar(state);
    const csv = shiftCalendarToCsv(state, calendar);
    const ics = shiftCalendarToIcs(state, calendar);
    expect(csv).toContain("2026-08-30,Sunday,work,Work,1,2 on / 2 off");
    expect(csv).toContain("2026-08-31,Monday,work,Work,2,2 on / 2 off");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260830");
    expect(ics).toContain("DTEND;VALUE=DATE:20260831");
    expect(ics).not.toContain("CATEGORIES:OFF");
  });

  it("can include off days in ICS exports", () => {
    const state = parseShiftCalendarState({ startDate: "2026-08-28", pattern: "2-2", months: "1", includeOff: "1" });
    expect(shiftCalendarToIcs(state)).toContain("CATEGORIES:OFF");
  });
});
