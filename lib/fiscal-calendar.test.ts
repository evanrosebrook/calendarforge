import { describe, expect, it } from "vitest";
import { utcDate } from "./calendar";
import {
  MAX_FISCAL_DAYS,
  createFiscalCalendar,
  fiscalCalendarToCsv,
  fiscalCalendarStateToParams,
  fiscalWeekNumber,
  parseFiscalCalendarState,
} from "./fiscal-calendar";

function recordFromParams(params: URLSearchParams): Record<string, string> {
  return Object.fromEntries(params.entries());
}

describe("fiscal calendar state", () => {
  const fixedNow = new Date("2026-08-09T12:00:00Z");

  it("defaults to the current calendar year and an end-year label", () => {
    expect(parseFiscalCalendarState({}, fixedNow)).toMatchObject({
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      labelBy: "end",
      firstDayOfWeek: 0,
      showWeekNumbers: false,
      orientation: "landscape",
    });
  });

  it("round-trips supported URL settings", () => {
    const state = parseFiscalCalendarState({
      startDate: "2026-07-01",
      endDate: "2027-06-30",
      weekStart: "monday",
      holidays: "0",
      country: "ca",
      weekends: "0",
      weekNumbers: "1",
      locale: "fr-CA",
      labelBy: "start",
      orientation: "portrait",
      paper: "a4",
    }, fixedNow);

    expect(parseFiscalCalendarState(recordFromParams(fiscalCalendarStateToParams(state)), fixedNow)).toEqual(state);
  });

  it("normalizes reversed and overlong ranges", () => {
    expect(parseFiscalCalendarState({ startDate: "2026-07-01", endDate: "2026-06-30" }, fixedNow).endDate).toBe("2026-07-01");
    const bounded = parseFiscalCalendarState({ startDate: "2026-01-01", endDate: "2028-12-31" }, fixedNow);
    expect(bounded.endDate).toBe("2027-01-06");
    const calendar = createFiscalCalendar(bounded);
    expect(calendar.dayCount).toBe(MAX_FISCAL_DAYS);
  });

  it("defaults a mid-month start to the end of the preceding month next year", () => {
    expect(parseFiscalCalendarState({ startDate: "2026-07-15" }, fixedNow).endDate).toBe("2027-06-30");
  });
});

describe("fiscal calendar calculations", () => {
  it("anchors fiscal weeks to the selected week start, including a partial first week", () => {
    const fiscalStart = utcDate(2026, 7, 1); // Wednesday
    expect(fiscalWeekNumber(utcDate(2026, 7, 1), fiscalStart, 1)).toBe(1);
    expect(fiscalWeekNumber(utcDate(2026, 7, 5), fiscalStart, 1)).toBe(1);
    expect(fiscalWeekNumber(utcDate(2026, 7, 6), fiscalStart, 1)).toBe(2);
  });

  it("creates calendar-month accounting periods and groups them into quarters", () => {
    const state = parseFiscalCalendarState({
      startDate: "2026-07-15",
      endDate: "2027-06-30",
      weekStart: "monday",
      holidays: "0",
    });
    const fiscal = createFiscalCalendar(state);

    expect(fiscal.label).toBe("FY2027");
    expect(fiscal.periods[0]).toEqual({ number: 1, startDate: "2026-07-15", endDate: "2026-07-31" });
    expect(fiscal.periods[1]).toEqual({ number: 2, startDate: "2026-08-01", endDate: "2026-08-31" });
    expect(fiscal.quarters[0]).toEqual({ number: 1, startDate: "2026-07-15", endDate: "2026-09-30" });
    expect(fiscal.quarters.at(-1)).toEqual({ number: 4, startDate: "2027-04-01", endDate: "2027-06-30" });
    expect(fiscal.sheets[0]).toMatchObject({ periodNumber: 1, quarterNumber: 1, periodLabel: "P01", quarterLabel: "Q1" });
    expect(fiscal.sheets).toHaveLength(12);
  });

  it("shows fiscal rather than ISO week numbers only when requested", () => {
    const state = parseFiscalCalendarState({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      weekStart: "monday",
      weekNumbers: "1",
      holidays: "0",
    });
    const july = createFiscalCalendar(state).sheets[0]?.calendar;

    expect(july?.weeks.map((week) => week.weekNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(july?.weeks[0]?.days.find((day) => day.date === "2026-06-30")?.weekNumber).toBeUndefined();
    expect(july?.weeks[0]?.days.find((day) => day.date === "2026-07-01")?.weekNumber).toBe(1);

    const hidden = createFiscalCalendar({ ...state, showWeekNumbers: false }).sheets[0]?.calendar;
    expect(hidden?.weeks.every((week) => week.weekNumber === undefined)).toBe(true);
    expect(hidden?.weeks[0]?.days.find((day) => day.date === "2026-07-01")?.weekNumber).toBe(1);
  });

  it("exports only selected fiscal dates with fiscal coordinates", () => {
    const state = parseFiscalCalendarState({
      startDate: "2026-07-31",
      endDate: "2026-08-01",
      holidays: "0",
    });
    const csv = fiscalCalendarToCsv(state);

    expect(csv.split("\r\n")).toHaveLength(3);
    expect(csv).toContain("date,fiscal_year,quarter,period,fiscal_week,weekday,weekend,holidays");
    expect(csv).toContain("2026-07-31,FY2026,1,1,1,5,false,");
    expect(csv).toContain("2026-08-01,FY2026,1,2,1,6,true,");
    expect(csv).not.toContain("2026-07-30");
    expect(csv).not.toContain("2026-08-02");
  });
});
