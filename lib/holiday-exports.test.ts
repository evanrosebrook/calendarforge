import { describe, expect, it } from "vitest";
import { getCanadaFederalHolidays, getUsFederalHolidays } from "./calendar";
import { holidaysToCsv, holidaysToIcs } from "./holiday-exports";

describe("holiday-only exports", () => {
  it("creates stable holiday-only CSV rows with U.S. content isolated", () => {
    const holidays = getUsFederalHolidays(2026);
    const csv = holidaysToCsv(holidays, "en-US");
    expect(csv.split("\r\n")).toHaveLength(holidays.length + 1);
    expect(csv).toContain("date,weekday,name,category,observed");
    expect(csv).toContain("2026-07-04,Saturday,Independence Day,national,false");
    expect(csv).toContain("2026-07-03,Friday,Independence Day (observed),national,true");
    expect(csv).not.toContain("Canada Day");
  });

  it("creates valid holiday-only ICS events with Canadian content isolated", () => {
    const holidays = getCanadaFederalHolidays(2026);
    const ics = holidaysToIcs(holidays, "Canada National Holidays 2026");
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\nVERSION:2.0/);
    expect(ics).toMatch(/END:VCALENDAR\r\n$/);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(holidays.length);
    expect(ics).toContain("SUMMARY:Canada Day");
    expect(ics).toContain("CATEGORIES:NATIONAL");
    expect(ics).not.toContain("SUMMARY:Independence Day");
  });
});
