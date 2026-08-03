import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import ExcelJS from "exceljs";
import type { CalendarMonth } from "@/lib/calendar";

export type ExportOptions = {
  orientation: "portrait" | "landscape";
  paper: "letter" | "a4";
  title?: string;
  dayNotes?: Record<string, string>;
  showNotesArea?: boolean;
  highlightWeekends?: boolean;
  theme?: "forge" | "linen" | "blueprint";
};

export type DataExportOptions = {
  dayNotes?: Record<string, string>;
  inMonthOnly?: boolean;
  calendarName?: string;
};

function escapeCsv(value: string | number | boolean | undefined): string {
  let text = value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function calendarsToCsv(calendars: CalendarMonth[], options: DataExportOptions = {}): string {
  const includeNotes = options.dayNotes !== undefined;
  const headings = ["date", "year", "month", "day", "weekday", "in_month", "weekend", "week_number", "holidays", ...(includeNotes ? ["note"] : [])];
  const rows = calendars.flatMap((calendar) => calendar.weeks.flatMap((week) => week.days
    .filter((day) => options.inMonthOnly ? day.inMonth : calendars.length === 1 || day.inMonth)
    .map((day) => [day.date, day.year, day.month, day.day, day.weekday, day.inMonth, day.isWeekend, day.weekNumber, day.holidays.map((holiday) => holiday.name).join("; "), ...(includeNotes ? [options.dayNotes?.[day.date] ?? ""] : [])])));
  return [headings, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

function escapeIcs(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n").replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

function pdfSafe(value: string): string {
  return value.normalize("NFKD").replaceAll(/[\u0300-\u036f]/g, "").replaceAll(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function wrapPdfText(value: string, maxCharacters: number): string[] {
  const lines: string[] = [];
  for (const word of value.replaceAll(/\s+/g, " ").trim().split(" ")) {
    if (word.length > maxCharacters) {
      for (let index = 0; index < word.length; index += maxCharacters) lines.push(word.slice(index, index + maxCharacters));
      continue;
    }
    const candidate = lines.at(-1) ? `${lines.at(-1)} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      if (lines.length) lines[lines.length - 1] = candidate;
      else lines.push(candidate);
    } else lines.push(word);
  }
  return lines;
}

export function calendarsToIcs(calendars: CalendarMonth[], options: DataExportOptions = {}): string {
  const seen = new Set<string>();
  const events: string[] = [];
  for (const calendar of calendars) {
    for (const day of calendar.weeks.flatMap((week) => week.days)) {
      if (options.inMonthOnly && !day.inMonth) continue;
      for (const holiday of day.holidays) {
        const key = `${holiday.date}-${holiday.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const date = holiday.date.replaceAll("-", "");
        events.push([
          "BEGIN:VEVENT",
          `UID:${date}-${simpleHash(holiday.name)}@calendarforge.net`,
          `DTSTART;VALUE=DATE:${date}`,
          `SUMMARY:${escapeIcs(holiday.name)}`,
          "TRANSP:TRANSPARENT",
          "END:VEVENT",
        ].join("\r\n"));
      }
      const note = options.dayNotes?.[day.date];
      const noteKey = `note-${day.date}`;
      if (note && !seen.has(noteKey)) {
        seen.add(noteKey);
        const date = day.date.replaceAll("-", "");
        events.push([
          "BEGIN:VEVENT",
          `UID:${date}-note-${simpleHash(note)}@calendarforge.net`,
          `DTSTART;VALUE=DATE:${date}`,
          `SUMMARY:${escapeIcs(note)}`,
          "CATEGORIES:CALENDAR NOTE",
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
    `X-WR-CALNAME:${escapeIcs(options.calendarName || "Calendar Forge")}`,
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
  const palette = options.theme === "blueprint"
    ? { accent: rgb(0.12, 0.31, 0.54), ink: rgb(0.07, 0.18, 0.3), line: rgb(0.64, 0.72, 0.8) }
    : options.theme === "linen"
      ? { accent: rgb(0.45, 0.32, 0.2), ink: rgb(0.19, 0.16, 0.12), line: rgb(0.76, 0.71, 0.62) }
      : { accent: rgb(0.78, 0.22, 0.14), ink: rgb(0.1, 0.1, 0.09), line: rgb(0.78, 0.77, 0.73) };
  const { accent, ink, line } = palette;
  const paperSize: [number, number] = options.paper === "a4" ? [595.28, 841.89] : [612, 792];
  const [width, height] = options.orientation === "landscape" ? [paperSize[1], paperSize[0]] : paperSize;

  for (const calendar of calendars) {
    const page = pdf.addPage([width, height]);
    const margin = 34;
    const top = height - margin;
    page.drawText(pdfSafe(options.title || calendar.label), { x: margin, y: top - 26, size: 26, font: bold, color: ink });
    if (options.title) page.drawText(pdfSafe(calendar.label.toUpperCase()), { x: margin, y: top - 43, size: 7, font: bold, color: accent });
    page.drawText("CALENDAR FORGE", { x: width - margin - 89, y: top - 23, size: 7, font: bold, color: rgb(.45, .45, .42) });
    const tableTop = top - 62;
    const weekColumn = calendar.weeks[0]?.weekNumber !== undefined ? 26 : 0;
    const usableWidth = width - margin * 2;
    const dayWidth = (usableWidth - weekColumn) / 7;
    const headerHeight = 24;
    const notesAreaHeight = options.showNotesArea ? 62 : 0;
    const cellHeight = (tableTop - margin - 16 - headerHeight - notesAreaHeight) / calendar.weeks.length;

    page.drawLine({ start: { x: margin, y: tableTop }, end: { x: width - margin, y: tableTop }, thickness: 1.5, color: ink });
    if (weekColumn) page.drawText("WK", { x: margin + 5, y: tableTop - 16, size: 6, font: bold, color: rgb(.45, .45, .42) });
    calendar.weekdayLabels.forEach((label, index) => {
      page.drawText(pdfSafe(label.toUpperCase()), { x: margin + weekColumn + index * dayWidth + 6, y: tableTop - 16, size: 7, font: bold, color: rgb(.35, .35, .33) });
    });
    page.drawLine({ start: { x: margin, y: tableTop - headerHeight }, end: { x: width - margin, y: tableTop - headerHeight }, thickness: .7, color: ink });

    calendar.weeks.forEach((week, row) => {
      const yTop = tableTop - headerHeight - row * cellHeight;
      const yBottom = yTop - cellHeight;
      if (weekColumn && week.weekNumber !== undefined) page.drawText(String(week.weekNumber), { x: margin + 7, y: yTop - 16, size: 7, font: regular, color: rgb(.55, .55, .52) });
      week.days.forEach((day, column) => {
        const x = margin + weekColumn + column * dayWidth;
        if (options.highlightWeekends === true && day.isWeekend && day.inMonth) {
          page.drawRectangle({ x, y: yBottom, width: dayWidth, height: cellHeight, color: options.theme === "blueprint" ? rgb(.92, .95, .98) : rgb(.96, .95, .91) });
        }
        if (column > 0 || weekColumn) page.drawLine({ start: { x, y: yTop }, end: { x, y: yBottom }, thickness: .4, color: line });
        const dayColor = day.inMonth ? ink : rgb(.68, .68, .65);
        page.drawText(String(day.day), { x: x + 6, y: yTop - 16, size: 9, font: bold, color: dayColor });
        day.holidays.slice(0, 2).forEach((holiday, holidayIndex) => {
          const maxChars = Math.max(8, Math.floor(dayWidth / 4.5));
          const label = holiday.name.length > maxChars ? `${holiday.name.slice(0, maxChars - 1)}…` : holiday.name;
          page.drawText(pdfSafe(label), { x: x + 6, y: yTop - 29 - holidayIndex * 10, size: 5.5, font: bold, color: accent });
        });
        const note = day.inMonth ? options.dayNotes?.[day.date] : undefined;
        if (note) {
          const maxChars = Math.max(8, Math.floor(dayWidth / 4.6));
          const label = note.length > maxChars ? `${note.slice(0, maxChars - 1)}…` : note;
          page.drawText(pdfSafe(label.replaceAll("\n", " ")), { x: x + 6, y: yBottom + 8, size: 5.5, font: regular, color: ink });
        }
      });
      page.drawLine({ start: { x: margin, y: yBottom }, end: { x: width - margin, y: yBottom }, thickness: .4, color: line });
    });
    if (options.showNotesArea) {
      const notesY = margin + 35;
      page.drawText("NOTES", { x: margin, y: notesY + 20, size: 7, font: bold, color: ink });
      page.drawLine({ start: { x: margin, y: notesY + 14 }, end: { x: width - margin, y: notesY + 14 }, thickness: .5, color: line });
      page.drawLine({ start: { x: margin, y: notesY }, end: { x: width - margin, y: notesY }, thickness: .5, color: line });
    }
    page.drawText("Made with Calendar Forge", { x: width - margin - 88, y: 18, size: 6, font: regular, color: rgb(.55, .55, .52) });
  }
  const datedNotes = Object.entries(options.dayNotes ?? {}).sort(([a], [b]) => a.localeCompare(b));
  if (datedNotes.length) {
    let notesPage = pdf.addPage([width, height]);
    let y = height - 48;
    const maxCharacters = Math.max(42, Math.floor((width - 68) / 5.2));
    notesPage.drawText("Date notes", { x: 34, y, size: 24, font: bold, color: ink });
    y -= 32;
    for (const [date, rawNote] of datedNotes) {
      const lines = wrapPdfText(pdfSafe(rawNote), maxCharacters);
      const needed = 20 + Math.max(1, lines.length) * 12;
      if (y - needed < 34) {
        notesPage = pdf.addPage([width, height]);
        y = height - 48;
        notesPage.drawText("Date notes (continued)", { x: 34, y, size: 20, font: bold, color: ink });
        y -= 32;
      }
      notesPage.drawText(date, { x: 34, y, size: 8, font: bold, color: accent });
      lines.forEach((lineText, index) => notesPage.drawText(lineText, { x: 108, y: y - index * 12, size: 9, font: regular, color: ink }));
      y -= needed;
      notesPage.drawLine({ start: { x: 34, y: y + 9 }, end: { x: width - 34, y: y + 9 }, thickness: .35, color: line });
    }
  }
  pdf.setTitle(options.title || calendars[0]?.label || "Calendar Forge calendar");
  pdf.setCreator("Calendar Forge");
  return pdf.save();
}

export type XlsxExportOptions = {
  title?: string;
  dayNotes?: Record<string, string>;
  highlightWeekends?: boolean;
  orientation?: "portrait" | "landscape";
  paper?: "letter" | "a4";
  theme?: "forge" | "linen" | "blueprint";
};

export async function calendarsToXlsx(calendars: CalendarMonth[], titleOrOptions?: string | XlsxExportOptions): Promise<Buffer> {
  const options: XlsxExportOptions = typeof titleOrOptions === "string" ? { title: titleOrOptions } : (titleOrOptions ?? {});
  const title = options.title;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Calendar Forge";
  workbook.created = new Date(0);
  workbook.modified = new Date(0);
  workbook.title = title || (calendars.length === 1 ? calendars[0]?.label : `${calendars[0]?.year} Calendar`);

  for (const calendar of calendars) {
    const sheet = workbook.addWorksheet(calendar.label.slice(0, 31), { pageSetup: { fitToPage: true, fitToWidth: 1, orientation: options.orientation ?? "landscape", paperSize: options.paper === "letter" ? undefined : 9 } });
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
        const noteText = day.inMonth ? options.dayNotes?.[day.date] : undefined;
        cell.value = `${day.day}${holidayText ? `\n${holidayText}` : ""}${noteText ? `\n${noteText}` : ""}`;
        cell.alignment = { vertical: "top", wrapText: true };
        cell.font = { bold: true, size: 9, color: { argb: day.inMonth ? (holidayText ? "FFC43E29" : "FF191A18") : "FFAAAAA5" } };
        const weekendColor = options.theme === "blueprint" ? "FFEAF2F8" : options.theme === "linen" ? "FFF1EBDD" : "FFF4F1E9";
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: options.highlightWeekends !== false && day.isWeekend && day.inMonth ? weekendColor : "FFFFFEFA" } };
        cell.border = { top: { style: "thin", color: { argb: "FFD9D9D2" } }, left: { style: "thin", color: { argb: "FFD9D9D2" } }, bottom: { style: "thin", color: { argb: "FFD9D9D2" } }, right: { style: "thin", color: { argb: "FFD9D9D2" } } };
      });
    });
    if (startColumn === 2) sheet.getColumn(1).width = 5;
    for (let column = startColumn; column <= endColumn; column += 1) sheet.getColumn(column).width = 16;
    sheet.headerFooter.oddFooter = "Made with Calendar Forge";
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
