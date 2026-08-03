import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createBuilderCalendars, parseBuilderState } from "./builder";
import { calendarsToSvg } from "./builder-svg";
import { calendarsToCsv, calendarsToIcs, calendarsToPdf } from "./exports";

const state = parseBuilderState({
  year: "2026", month: "12", months: "3", start: "monday", weekends: "0", theme: "blueprint",
  title: "Team <Launch>", note: ["2027-01-12~Review <script>alert(1)</script> & ship"],
}, new Date("2026-08-01T00:00:00Z"));
const calendars = createBuilderCalendars(state);

describe("custom calendar exports", () => {
  it("exports exactly the selected range to CSV, including safe plain-text notes", () => {
    const csv = calendarsToCsv(calendars, { dayNotes: state.dayNotes, inMonthOnly: true });
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(91); // header + 31 days + 31 days + 28 days
    expect(csv).toContain("2026-12-01");
    expect(csv).toContain("2027-02-28");
    expect(csv).not.toContain("2026-11-30");
    expect(csv).not.toContain("2027-03-01");
    expect(csv).toContain("Review <script>alert(1)</script> & ship");
  });

  it("adds notes as all-day ICS events without leaking dates outside the range", () => {
    const ics = calendarsToIcs(calendars, { dayNotes: state.dayNotes, inMonthOnly: true, calendarName: state.title });
    expect(ics).toContain("DTSTART;VALUE=DATE:20270112");
    expect(ics).toContain("SUMMARY:Review <script>alert(1)</script> & ship");
    expect(ics).not.toContain("DTSTART;VALUE=DATE:202703");
  });

  it("creates a complete multi-month SVG and XML-escapes user content", () => {
    const svg = calendarsToSvg(calendars, state);
    expect(svg).toContain("<svg");
    expect(svg).toContain("DECEMBER 2026");
    expect(svg).toContain("FEBRUARY 2027");
    expect(svg).toContain("Team &lt;Launch&gt;");
    expect(svg).toContain("Review &lt;script&gt;alert(1)&lt;/script&gt; &amp; ship");
    expect(svg).not.toContain("Team <Launch>");
    expect(svg.match(/CALENDAR FORGE/g)).toHaveLength(6); // header and source mark for each month
  });

  it("keeps complete date notes in a PDF appendix", async () => {
    const pdfBytes = await calendarsToPdf(calendars, {
      orientation: state.orientation, paper: state.paper, title: state.title, dayNotes: state.dayNotes,
      highlightWeekends: state.highlightWeekends, theme: state.theme,
    });
    const pdf = await PDFDocument.load(pdfBytes);
    expect(pdf.getPageCount()).toBe(4); // one page per month plus the date-notes appendix
  });
});
