import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import ExcelJS from "exceljs";
import type { CalendarMonth } from "@/lib/calendar";

export type ExportOptions = {
  orientation: "portrait" | "landscape";
  paper: "letter" | "a4";
  title?: string;
};

function escapeCsv(value: string | number | boolean | undefined): string {
  const text = value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function calendarsToCsv(calendars: CalendarMonth[]): string {
  const headings = ["date", "year", "month", "day", "weekday", "in_month", "weekend", "week_number", "holidays"];
  const rows = calendars.flatMap((calendar) => calendar.weeks.flatMap((week) => week.days
    .filter((day) => calendars.length === 1 || day.inMonth)
    .map((day) => [day.date, day.year, day.month, day.day, day.weekday, day.inMonth, day.isWeekend, day.weekNumber, day.holidays.map((holiday) => holiday.name).join("; ")])));
  return [headings, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

function escapeIcs(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

export function calendarsToIcs(calendars: CalendarMonth[]): string {
  const seen = new Set<string>();
  const events: string[] = [];
  for (const calendar of calendars) {
    for (const day of calendar.weeks.flatMap((week) => week.days)) {
      for (const holiday of day.holidays) {
        const key = `${holiday.date}-${holiday.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const date = holiday.date.replaceAll("-", "");
        events.push([
          "BEGIN:VEVENT",
          `UID:${date}-${simpleHash(holiday.name)}@calendarforge.app`,
          `DTSTART;VALUE=DATE:${date}`,
          `SUMMARY:${escapeIcs(holiday.name)}`,
          "TRANSP:TRANSPARENT",
          "END:VEVENT",
        ].join("\r\n"));
      }
    }
  }
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calendar Forge//Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Calendar Forge",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function simpleHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash.toString(16);
}

export async function calendarsToPdf(calendars: CalendarMonth[], options: ExportOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const accent = rgb(0.78, 0.22, 0.14);
  const ink = rgb(0.1, 0.1, 0.09);
  const line = rgb(0.78, 0.77, 0.73);
  const paperSize: [number, number] = options.paper === "a4" ? [595.28, 841.89] : [612, 792];
  const [width, height] = options.orientation === "landscape" ? [paperSize[1], paperSize[0]] : paperSize;

  for (const calendar of calendars) {
    const page = pdf.addPage([width, height]);
    const margin = 34;
    const top = height - margin;
    page.drawText(options.title || calendar.label, { x: margin, y: top - 26, size: 26, font: bold, color: ink });
    if (options.title) page.drawText(calendar.label.toUpperCase(), { x: margin, y: top - 43, size: 7, font: bold, color: accent });
    page.drawText("CALENDAR FORGE", { x: width - margin - 89, y: top - 23, size: 7, font: bold, color: rgb(.45, .45, .42) });
    const tableTop = top - 62;
    const weekColumn = calendar.weeks[0]?.weekNumber !== undefined ? 26 : 0;
    const usableWidth = width - margin * 2;
    const dayWidth = (usableWidth - weekColumn) / 7;
    const headerHeight = 24;
    const cellHeight = (tableTop - margin - 16 - headerHeight) / calendar.weeks.length;

    page.drawLine({ start: { x: margin, y: tableTop }, end: { x: width - margin, y: tableTop }, thickness: 1.5, color: ink });
    if (weekColumn) page.drawText("WK", { x: margin + 5, y: tableTop - 16, size: 6, font: bold, color: rgb(.45, .45, .42) });
    calendar.weekdayLabels.forEach((label, index) => {
      page.drawText(label.toUpperCase(), { x: margin + weekColumn + index * dayWidth + 6, y: tableTop - 16, size: 7, font: bold, color: rgb(.35, .35, .33) });
    });
    page.drawLine({ start: { x: margin, y: tableTop - headerHeight }, end: { x: width - margin, y: tableTop - headerHeight }, thickness: .7, color: ink });

    calendar.weeks.forEach((week, row) => {
      const yTop = tableTop - headerHeight - row * cellHeight;
      const yBottom = yTop - cellHeight;
      if (weekColumn && week.weekNumber !== undefined) page.drawText(String(week.weekNumber), { x: margin + 7, y: yTop - 16, size: 7, font: regular, color: rgb(.55, .55, .52) });
      week.days.forEach((day, column) => {
        const x = margin + weekColumn + column * dayWidth;
        if (column > 0 || weekColumn) page.drawLine({ start: { x, y: yTop }, end: { x, y: yBottom }, thickness: .4, color: line });
        const dayColor = day.inMonth ? ink : rgb(.68, .68, .65);
        page.drawText(String(day.day), { x: x + 6, y: yTop - 16, size: 9, font: bold, color: dayColor });
        day.holidays.slice(0, 2).forEach((holiday, holidayIndex) => {
          const maxChars = Math.max(8, Math.floor(dayWidth / 4.5));
          const label = holiday.name.length > maxChars ? `${holiday.name.slice(0, maxChars - 1)}…` : holiday.name;
          page.drawText(label, { x: x + 6, y: yTop - 29 - holidayIndex * 10, size: 5.5, font: bold, color: accent });
        });
      });
      page.drawLine({ start: { x: margin, y: yBottom }, end: { x: width - margin, y: yBottom }, thickness: .4, color: line });
    });
    page.drawText("Made with Calendar Forge", { x: width - margin - 88, y: 18, size: 6, font: regular, color: rgb(.55, .55, .52) });
  }
  pdf.setTitle(options.title || calendars[0]?.label || "Calendar Forge calendar");
  pdf.setCreator("Calendar Forge");
  return pdf.save();
}

export async function calendarsToXlsx(calendars: CalendarMonth[], title?: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Calendar Forge";
  workbook.created = new Date(0);
  workbook.modified = new Date(0);
  workbook.title = title || (calendars.length === 1 ? calendars[0]?.label : `${calendars[0]?.year} Calendar`);

  for (const calendar of calendars) {
    const sheet = workbook.addWorksheet(calendar.label.slice(0, 31), { pageSetup: { fitToPage: true, fitToWidth: 1, orientation: "landscape", paperSize: 9 } });
    const startColumn = calendar.weeks[0]?.weekNumber !== undefined ? 2 : 1;
    const endColumn = startColumn + 6;
    sheet.mergeCells(1, 1, 1, endColumn);
    const heading = sheet.getCell(1, 1);
    heading.value = title || calendar.label;
    heading.font = { bold: true, size: 20, color: { argb: "FF191A18" } };
    heading.alignment = { vertical: "middle" };
    sheet.getRow(1).height = 34;
    if (startColumn === 2) sheet.getCell(2, 1).value = "Wk";
    calendar.weekdayLabels.forEach((label, index) => { sheet.getCell(2, startColumn + index).value = label; });
    sheet.getRow(2).font = { bold: true, color: { argb: "FF686B65" }, size: 9 };
    sheet.getRow(2).alignment = { horizontal: "left", vertical: "middle" };

    calendar.weeks.forEach((week, rowIndex) => {
      const row = sheet.getRow(rowIndex + 3);
      row.height = 64;
      if (startColumn === 2) row.getCell(1).value = week.weekNumber;
      week.days.forEach((day, columnIndex) => {
        const cell = row.getCell(startColumn + columnIndex);
        const holidayText = day.holidays.map((holiday) => holiday.name).join("\n");
        cell.value = `${day.day}${holidayText ? `\n${holidayText}` : ""}`;
        cell.alignment = { vertical: "top", wrapText: true };
        cell.font = { bold: true, size: 9, color: { argb: day.inMonth ? (holidayText ? "FFC43E29" : "FF191A18") : "FFAAAAA5" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: day.isWeekend && day.inMonth ? "FFF4F1E9" : "FFFFFEFA" } };
        cell.border = { top: { style: "thin", color: { argb: "FFD9D9D2" } }, left: { style: "thin", color: { argb: "FFD9D9D2" } }, bottom: { style: "thin", color: { argb: "FFD9D9D2" } }, right: { style: "thin", color: { argb: "FFD9D9D2" } } };
      });
    });
    if (startColumn === 2) sheet.getColumn(1).width = 5;
    for (let column = startColumn; column <= endColumn; column += 1) sheet.getColumn(column).width = 16;
    sheet.headerFooter.oddFooter = "Made with Calendar Forge";
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
