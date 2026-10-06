import { describe, expect, it } from "vitest";
import {
  createPayPeriodCalendar,
  parsePayPeriodCalendarState,
  payPeriodCalendarStateToParams,
  payPeriodCalendarToCsv,
  payPeriodCalendarToIcs,
} from "./pay-period-calendar";

describe("pay-period calendar", () => {
  it("parses bounded state and keeps share URLs deterministic", () => {
    const state = parsePayPeriodCalendarState({ year: "2027", payday: "2027-01-08", lag: "6", adjust: "next", weekStart: "monday" });
    expect(state).toEqual({ year: 2027, knownPayday: "2027-01-08", lagDays: 6, adjustment: "next", firstDayOfWeek: 1 });
    expect(payPeriodCalendarStateToParams(state).toString()).toBe("year=2027&payday=2027-01-08&lag=6&adjust=next&weekStart=monday");
  });

  it("uses the next planning year from October and sanitizes invalid input", () => {
    const state = parsePayPeriodCalendarState({ year: "9999", payday: "2027-02-30", lag: "99", adjust: "sideways" }, new Date("2026-10-06T12:00:00Z"));
    expect(state).toEqual({ year: 2027, knownPayday: "2027-01-08", lagDays: 6, adjustment: "previous", firstDayOfWeek: 0 });
  });

  it("builds 26 biweekly periods and identifies three-paycheck months", () => {
    const state = parsePayPeriodCalendarState({ year: "2027", payday: "2027-01-08", lag: "6", adjust: "none" });
    const calendar = createPayPeriodCalendar(state);
    expect(calendar.payPeriods).toHaveLength(26);
    expect(calendar.payPeriods[0]).toMatchObject({ periodStart: "2026-12-20", periodEnd: "2027-01-02", payDate: "2027-01-08" });
    expect(calendar.payPeriods.at(-1)?.payDate).toBe("2027-12-24");
    expect(calendar.threePaycheckMonths.map((month) => month.label)).toEqual(["April", "October"]);
  });

  it("supports years with 27 scheduled biweekly paydays", () => {
    const state = parsePayPeriodCalendarState({ year: "2027", payday: "2027-01-01", lag: "6", adjust: "none" });
    expect(createPayPeriodCalendar(state).payPeriods).toHaveLength(27);
  });

  it("moves a federal-holiday payday to the previous business day", () => {
    const state = parsePayPeriodCalendarState({ year: "2026", payday: "2026-01-09", lag: "6", adjust: "previous" });
    const christmas = createPayPeriodCalendar(state).payPeriods.find((period) => period.scheduledPayDate === "2026-12-25");
    expect(christmas).toMatchObject({ payDate: "2026-12-24", adjusted: true });
  });

  it("exports spreadsheet rows and all-day payday events", () => {
    const state = parsePayPeriodCalendarState({ year: "2027", payday: "2027-01-08", lag: "6", adjust: "none" });
    const csv = payPeriodCalendarToCsv(state);
    const ics = payPeriodCalendarToIcs(state);
    expect(csv).toContain("1,2026-12-20,2027-01-02,2027-01-08,2027-01-08,false");
    expect(ics).toContain("DTSTART;VALUE=DATE:20270108");
    expect(ics).toContain("DESCRIPTION:Pay period 1: 2026-12-20 through 2027-01-02");
  });
});
