import { describe, expect, it } from "vitest";
import { createCalendarMonth, getUsFederalHolidays, isoWeekNumber, toIsoDate, utcDate } from "./index";

describe("calendar engine", () => {
  it("handles Gregorian leap years and century boundaries", () => {
    const leap = createCalendarMonth({ year: 2000, month: 2 });
    const century = createCalendarMonth({ year: 1900, month: 2 });
    const futureCentury = createCalendarMonth({ year: 2100, month: 2 });
    expect(leap.weeks.flatMap((week) => week.days).some((day) => day.inMonth && day.day === 29)).toBe(true);
    expect(century.weeks.flatMap((week) => week.days).some((day) => day.inMonth && day.day === 29)).toBe(false);
    expect(futureCentury.weeks.flatMap((week) => week.days).some((day) => day.inMonth && day.day === 29)).toBe(false);
  });

  it("places months beginning on every weekday in the right column", () => {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      let found: { year: number; month: number } | undefined;
      for (let year = 2020; year <= 2030 && !found; year += 1) {
        for (let month = 1; month <= 12; month += 1) {
          if (utcDate(year, month, 1).getUTCDay() === weekday) { found = { year, month }; break; }
        }
      }
      expect(found).toBeDefined();
      const calendar = createCalendarMonth({ ...found!, firstDayOfWeek: 0 });
      expect(calendar.weeks[0]?.days[weekday]?.day).toBe(1);
      expect(calendar.weeks[0]?.days[weekday]?.inMonth).toBe(true);
    }
  });

  it("builds correct Sunday-start and Monday-start grids", () => {
    const sunday = createCalendarMonth({ year: 2024, month: 9, firstDayOfWeek: 0 });
    const monday = createCalendarMonth({ year: 2024, month: 9, firstDayOfWeek: 1 });
    expect(sunday.weeks[0]?.days[0]?.date).toBe("2024-09-01");
    expect(monday.weeks[0]?.days[0]?.date).toBe("2024-08-26");
    expect(sunday.weekdayLabels[0]).toMatch(/^Sun/);
    expect(monday.weekdayLabels[0]).toMatch(/^Mon/);
  });

  it("calculates ISO week numbers across year boundaries", () => {
    expect(isoWeekNumber(utcDate(2021, 1, 1))).toBe(53);
    expect(isoWeekNumber(utcDate(2021, 1, 4))).toBe(1);
    expect(isoWeekNumber(utcDate(2020, 12, 31))).toBe(53);
    const january = createCalendarMonth({ year: 2021, month: 1, firstDayOfWeek: 1, showWeekNumbers: true });
    expect(january.weeks.slice(0, 2).map((week) => week.weekNumber)).toEqual([53, 1]);
  });

  it("does not depend on the server's local time zone", () => {
    const original = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati";
    const first = JSON.stringify(createCalendarMonth({ year: 2026, month: 3, firstDayOfWeek: 1, showWeekNumbers: true }));
    process.env.TZ = "America/Adak";
    const second = JSON.stringify(createCalendarMonth({ year: 2026, month: 3, firstDayOfWeek: 1, showWeekNumbers: true }));
    process.env.TZ = original;
    expect(second).toBe(first);
  });

  it("serializes stable, complete day metadata", () => {
    const calendar = createCalendarMonth({ year: 2026, month: 7, holidays: getUsFederalHolidays(2026) });
    const serialized = JSON.stringify(calendar);
    const parsed = JSON.parse(serialized) as typeof calendar;
    const independenceDay = parsed.weeks.flatMap((week) => week.days).find((day) => day.date === "2026-07-04");
    expect(independenceDay).toMatchObject({ inMonth: true, isWeekend: true, year: 2026, month: 7, day: 4 });
    expect(independenceDay?.holidays[0]?.name).toBe("Independence Day");
    expect(parsed.weeks.every((week) => week.days.length === 7)).toBe(true);
  });

  it("uses padded ISO dates even for early years", () => {
    expect(toIsoDate(utcDate(9, 2, 3))).toBe("0009-02-03");
  });
});
