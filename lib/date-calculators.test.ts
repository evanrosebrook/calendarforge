import { describe, expect, it } from "vitest";
import {
  adjustCalendarDate,
  calculateDateDifference,
  dateInTimeZone,
  getDateFacts,
  getTodayFacts,
  parseIsoCalendarDate,
  parseSupportedTimeZone,
} from "./date-calculators";
import { toIsoDate, utcDate } from "./calendar";

describe("date calculators", () => {
  it("derives stable facts for a dedicated date page", () => {
    expect(getDateFacts(utcDate(2027, 3, 17))).toMatchObject({
      isoDate: "2027-03-17",
      longDate: "Wednesday, March 17, 2027",
      weekday: "Wednesday",
      dayOfYear: 76,
      isoWeek: 11,
      quarter: 1,
      leapYear: false,
      daysInYear: 365,
      daysRemainingAfterDate: 289,
    });
    expect(getDateFacts(utcDate(2028, 12, 31))).toMatchObject({ dayOfYear: 366, quarter: 4, leapYear: true, daysRemainingAfterDate: 0 });
  });

  it("accepts only real padded Gregorian dates", () => {
    expect(toIsoDate(parseIsoCalendarDate("2024-02-29")!)).toBe("2024-02-29");
    expect(parseIsoCalendarDate("2026-02-29")).toBeNull();
    expect(parseIsoCalendarDate("2026-2-03")).toBeNull();
    expect(parseIsoCalendarDate("0000-01-01")).toBeNull();
  });

  it("calculates leap-day spans, weekday counts, and inclusive endpoints", () => {
    const start = utcDate(2024, 2, 28);
    const end = utcDate(2024, 3, 1);
    expect(calculateDateDifference(start, end)).toMatchObject({ totalDays: 2, weekdays: 2, weeks: 0, remainingDays: 2, duration: { years: 0, months: 0, days: 2 } });
    expect(calculateDateDifference(start, end, true)).toMatchObject({ totalDays: 3, weekdays: 3, duration: { years: 0, months: 0, days: 3 } });
  });

  it("handles reversed and identical ranges deterministically", () => {
    const first = utcDate(2026, 8, 1);
    const second = utcDate(2026, 8, 12);
    expect(calculateDateDifference(second, first)).toMatchObject({ direction: -1, totalDays: 11 });
    expect(calculateDateDifference(first, first)).toMatchObject({ direction: 0, totalDays: 0, weekdays: 0 });
    expect(calculateDateDifference(first, first, true)).toMatchObject({ totalDays: 1, weekdays: 0 });
  });

  it("decomposes calendar spans with month-end clamping", () => {
    expect(calculateDateDifference(utcDate(2024, 1, 31), utcDate(2024, 3, 1)).duration).toEqual({ years: 0, months: 1, days: 1 });
    expect(calculateDateDifference(utcDate(2024, 2, 29), utcDate(2025, 2, 28)).duration).toEqual({ years: 1, months: 0, days: 0 });
  });

  it("adds and subtracts calendar units in a documented order", () => {
    expect(toIsoDate(adjustCalendarDate(utcDate(2024, 3, 31), { years: 0, months: 1, weeks: 0, days: 0 }, "subtract")!)).toBe("2024-02-29");
    expect(toIsoDate(adjustCalendarDate(utcDate(2024, 2, 29), { years: 1, months: 0, weeks: 0, days: 0 }, "add")!)).toBe("2025-02-28");
    expect(toIsoDate(adjustCalendarDate(utcDate(2026, 1, 31), { years: 0, months: 1, weeks: 1, days: 2 }, "add")!)).toBe("2026-03-09");
  });

  it("rejects adjustments outside supported calendar years", () => {
    expect(adjustCalendarDate(utcDate(9999, 12, 31), { years: 0, months: 0, weeks: 0, days: 1 }, "add")).toBeNull();
    expect(adjustCalendarDate(utcDate(1, 1, 1), { years: 1, months: 0, weeks: 0, days: 0 }, "subtract")).toBeNull();
  });

  it("derives the calendar date from an explicit timezone", () => {
    const instant = new Date("2026-08-02T00:30:00Z");
    expect(toIsoDate(dateInTimeZone(instant, "America/Los_Angeles"))).toBe("2026-08-01");
    expect(toIsoDate(dateInTimeZone(instant, "Asia/Tokyo"))).toBe("2026-08-02");
    expect(parseSupportedTimeZone("not/a-zone")).toBe("UTC");
  });

  it("reports stable today facts around leap day", () => {
    const facts = getTodayFacts(new Date("2024-02-29T12:00:00Z"), "UTC");
    expect(facts).toMatchObject({ isoDate: "2024-02-29", dayOfYear: 60, isoWeek: 9, leapYear: true, daysRemainingAfterToday: 306 });
    expect(facts.quickDates.map(({ days, date }) => [days, toIsoDate(date)])).toContainEqual([30, "2024-03-30"]);
  });
});
