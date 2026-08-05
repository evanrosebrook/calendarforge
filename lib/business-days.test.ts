import { describe, expect, it } from "vitest";
import { toIsoDate, utcDate } from "./calendar";
import {
  calculateBusinessDaysBetween,
  parseBusinessDayRegion,
  shiftBusinessDays,
} from "./business-days";

describe("business-day calculations", () => {
  it("separates U.S. business days, weekends, and observed holidays", () => {
    const result = calculateBusinessDaysBetween(utcDate(2026, 7, 1), utcDate(2026, 7, 7), "us");
    expect(result).toMatchObject({ businessDays: 4, weekendDays: 2, holidayDays: 1, calendarDays: 7 });
    expect(result?.entries.find((entry) => entry.isoDate === "2026-07-03")).toMatchObject({
      status: "holiday",
      holidayNames: ["Independence Day (observed)"],
    });
    expect(result?.entries.find((entry) => entry.isoDate === "2026-07-04")?.status).toBe("weekend");
  });

  it("handles consecutive Canadian observed holidays without double counting weekends", () => {
    const result = calculateBusinessDaysBetween(utcDate(2021, 12, 24), utcDate(2021, 12, 29), "ca");
    expect(result).toMatchObject({ businessDays: 2, weekendDays: 2, holidayDays: 2, calendarDays: 6 });
    expect(result?.entries.filter((entry) => entry.status === "holiday").map((entry) => entry.isoDate)).toEqual([
      "2021-12-27",
      "2021-12-28",
    ]);
  });

  it("applies start and end inclusion independently", () => {
    const start = utcDate(2026, 8, 3);
    const end = utcDate(2026, 8, 7);
    expect(calculateBusinessDaysBetween(start, end, "weekends", false, false)).toMatchObject({
      businessDays: 3,
      calendarDays: 3,
    });
    expect(calculateBusinessDaysBetween(start, start, "weekends", false, true)).toMatchObject({
      businessDays: 0,
      calendarDays: 0,
    });
  });

  it("adds business days across an observed holiday and weekend", () => {
    const result = shiftBusinessDays(utcDate(2026, 7, 2), 2, "add", "us");
    expect(toIsoDate(result!.target)).toBe("2026-07-07");
    expect(result).toMatchObject({ businessDays: 2, weekendDays: 2, holidayDays: 1, calendarDays: 5 });
  });

  it("subtracts business days and can count the starting date", () => {
    expect(toIsoDate(shiftBusinessDays(utcDate(2026, 7, 7), 2, "subtract", "us")!.target)).toBe("2026-07-02");
    expect(toIsoDate(shiftBusinessDays(utcDate(2026, 7, 6), 1, "add", "us", true)!.target)).toBe("2026-07-06");
  });

  it("keeps zero-day shifts on the starting date", () => {
    const result = shiftBusinessDays(utcDate(2026, 8, 4), 0, "add", "us");
    expect(toIsoDate(result!.target)).toBe("2026-08-04");
    expect(result).toMatchObject({ businessDays: 0, calendarDays: 0 });
  });

  it("rejects reversed ranges and holiday-aware dates outside the verified catalog", () => {
    expect(calculateBusinessDaysBetween(utcDate(2026, 8, 5), utcDate(2026, 8, 4), "us")).toBeNull();
    expect(calculateBusinessDaysBetween(utcDate(1970, 1, 1), utcDate(1970, 1, 2), "us")).toBeNull();
    expect(calculateBusinessDaysBetween(utcDate(1970, 1, 1), utcDate(1970, 1, 2), "weekends")).not.toBeNull();
  });

  it("bounds expensive ranges and shifts at the Gregorian year limits", () => {
    expect(calculateBusinessDaysBetween(utcDate(1, 1, 1), utcDate(9999, 12, 31), "weekends")).toBeNull();
    expect(shiftBusinessDays(utcDate(9999, 12, 31), 1, "add", "weekends")).toBeNull();
    expect(shiftBusinessDays(utcDate(1, 1, 1), 1, "subtract", "weekends")).toBeNull();
  });

  it("parses only supported region values", () => {
    expect(parseBusinessDayRegion("ca")).toBe("ca");
    expect(parseBusinessDayRegion("weekends")).toBe("weekends");
    expect(parseBusinessDayRegion("unknown")).toBe("us");
  });
});
