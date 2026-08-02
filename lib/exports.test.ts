import { describe, expect, it } from "vitest";
import { createCalendarMonth, getUsFederalHolidays } from "./calendar";
import { calendarsToCsv, calendarsToIcs, calendarsToPdf, calendarsToXlsx } from "./exports";

const calendar = createCalendarMonth({ year: 2026, month: 7, showWeekNumbers: true, holidays: getUsFederalHolidays(2026) });

describe("calendar exports", () => {
  it("exports normalized data as CSV", () => {
    const csv = calendarsToCsv([calendar]);
    expect(csv).toContain("date,year,month,day,weekday,in_month,weekend,week_number,holidays");
    expect(csv).toContain("2026-07-04,2026,7,4,6,true,true,27,Independence Day");
  });

  it("exports unique all-day holiday events as ICS", () => {
    const ics = calendarsToIcs([calendar]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260704");
    expect(ics.split("\r\n").filter((line) => line === "SUMMARY:Independence Day")).toHaveLength(1);
    expect(ics).toContain("END:VCALENDAR");
  });

  it("creates a valid PDF document", async () => {
    const pdf = await calendarsToPdf([calendar], { orientation: "landscape", paper: "letter" });
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(1_000);
  });

  it("creates a valid XLSX workbook", async () => {
    const workbook = await calendarsToXlsx([calendar]);
    expect(workbook.subarray(0, 2).toString()).toBe("PK");
    expect(workbook.byteLength).toBeGreaterThan(5_000);
  });
});
