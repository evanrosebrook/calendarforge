import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { utcDate, type CalendarMonth, type Holiday } from "./calendar";
import { pdfSafe, wrapPdfCellLabel, type ExportOptions } from "./exports";

type YearPdfOptions = Pick<ExportOptions, "paper" | "orientation" | "title" | "highlightWeekends"> & {
  holidayLabel: string;
};

function wrapTitle(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const character of text) {
    if (line && font.widthOfTextAtSize(line + character, size) > width) {
      const space = line.lastIndexOf(" ");
      lines.push(space > 0 ? line.slice(0, space) : line);
      line = (space > 0 ? line.slice(space + 1) + character : character).trimStart();
    } else line += character;
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

/** The yearly download is a separate layout; monthly exports keep one month per page. */
export async function yearCalendarToPdf(calendars: CalendarMonth[], options: YearPdfOptions): Promise<Uint8Array> {
  const year = calendars[0]?.year;
  if (calendars.length !== 12 || calendars.some((calendar, index) => calendar.year !== year || calendar.month !== index + 1)) {
    throw new RangeError("A yearly PDF requires January through December of one year.");
  }
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const paper: [number, number] = options.paper === "a4" ? [595.28, 841.89] : [612, 792];
  const [width, height] = options.orientation === "landscape" ? [paper[1], paper[0]] : paper;
  const page = pdf.addPage([width, height]);
  const ink = rgb(.12, .13, .11);
  const muted = rgb(.4, .42, .38);
  const accent = rgb(.64, .18, .12);
  const rule = rgb(.79, .79, .75);
  const margin = 32;
  const usable = width - margin * 2;
  const columns = options.orientation === "landscape" ? 4 : 3;
  const rows = 12 / columns;
  const gap = 16;
  const monthWidth = (usable - (columns - 1) * gap) / columns;

  let titleSize = options.title ? 25 : 44;
  let titleLines = [String(year)];
  if (options.title) {
    const title = pdfSafe(options.title.trim().slice(0, 80));
    titleLines = wrapTitle(title, serif, titleSize, usable - 100);
    while (titleLines.length > 2 && titleSize > 11) titleLines = wrapTitle(title, serif, --titleSize, usable - 100);
  }
  const titleBaseline = height - margin - (options.title ? titleSize : 38);
  const titleLeading = titleSize * 1.15;
  titleLines.forEach((text, index) => page.drawText(text, {
    x: margin, y: titleBaseline - index * titleLeading,
    size: titleSize, font: serif, color: ink,
  }));
  page.drawText("CALENDAR FORGE", { x: width - margin - 82, y: height - margin - 16, size: 7, font: bold, color: muted });
  const subtitleY = titleBaseline - (titleLines.length - 1) * titleLeading - 18;
  page.drawText(`${options.title ? `${year}  /  ` : ""}YEAR AT A GLANCE  /  ${calendars[0]!.firstDayOfWeek === 1 ? "MONDAY" : "SUNDAY"} START`, {
    x: margin, y: subtitleY, size: 7, font: bold, color: muted,
  });

  // Only in-year occurrences belong in the legend, including adjacent-year observed days.
  const uniqueHolidays = new Map<string, Holiday>();
  for (const calendar of calendars) for (const week of calendar.weeks) for (const day of week.days) {
    if (day.inMonth) for (const holiday of day.holidays) uniqueHolidays.set(`${holiday.date}:${holiday.name}`, holiday);
  }
  const holidays = [...uniqueHolidays.values()].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  const legendColumns = 3;
  const legendWidth = (usable - gap * (legendColumns - 1)) / legendColumns;
  const perColumn = Math.ceil(holidays.length / legendColumns);
  const legend = holidays.map((holiday) => {
    const [y, m, d] = holiday.date.split("-").map(Number) as [number, number, number];
    const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(utcDate(y, m, d));
    return wrapPdfCellLabel(`${date}  ${holiday.name}`, regular, 7, legendWidth, 4);
  });
  const legendHeights = Array.from({ length: legendColumns }, (_, column) =>
    legend.slice(column * perColumn, (column + 1) * perColumn).reduce((sum, lines) => sum + lines.length * 9 + 4, 0));
  const legendHeight = holidays.length ? 21 + Math.max(...legendHeights) : 0;
  const legendTop = 34 + legendHeight;
  const gridBottom = holidays.length ? legendTop + 20 : margin + 12;
  const gridTop = subtitleY - 22;
  const monthHeight = (gridTop - gridBottom - (rows - 1) * gap) / rows;

  for (const [index, calendar] of calendars.entries()) {
    const x = margin + (index % columns) * (monthWidth + gap);
    const top = gridTop - Math.floor(index / columns) * (monthHeight + gap);
    const monthName = new Intl.DateTimeFormat(calendar.locale, { month: "long", timeZone: "UTC" }).format(utcDate(calendar.year, calendar.month, 1));
    page.drawLine({ start: { x, y: top }, end: { x: x + monthWidth, y: top }, thickness: 1.2, color: ink });
    page.drawText(pdfSafe(monthName), { x, y: top - 17, size: 14, font: serif, color: ink });
    const weekWidth = calendar.weeks[0]?.weekNumber !== undefined ? 16 : 0;
    const cellWidth = (monthWidth - weekWidth) / 7;
    const daysTop = top - 38;
    const cellHeight = (monthHeight - 38) / 6;
    if (weekWidth) page.drawText("W", { x: x + 3, y: top - 31, size: 6, font: bold, color: muted });
    calendar.weekdayLabels.forEach((label, dayIndex) => {
      const text = pdfSafe(label.slice(0, 2).toUpperCase());
      page.drawText(text, { x: x + weekWidth + dayIndex * cellWidth + (cellWidth - bold.widthOfTextAtSize(text, 6)) / 2, y: top - 31, size: 6, font: bold, color: muted });
    });
    calendar.weeks.forEach((week, row) => {
      const bottom = daysTop - (row + 1) * cellHeight;
      const baseline = bottom + (cellHeight - 8) / 2 + 1.5;
      if (weekWidth && week.weekNumber !== undefined && week.days.some((day) => day.inMonth)) page.drawText(String(week.weekNumber), { x: x + 2, y: baseline, size: 6, font: regular, color: muted });
      week.days.forEach((day, column) => {
        if (!day.inMonth) return;
        const left = x + weekWidth + column * cellWidth;
        if (options.highlightWeekends && day.isWeekend) page.drawRectangle({ x: left + 1, y: bottom + 1, width: cellWidth - 2, height: cellHeight - 2, color: rgb(.95, .95, .93) });
        const holiday = day.holidays.length > 0;
        if (holiday) page.drawCircle({ x: left + cellWidth / 2, y: baseline + 3, size: Math.min(6.4, (cellHeight - 2) / 2), color: rgb(.98, .9, .86) });
        const font = holiday ? bold : regular;
        const text = String(day.day);
        page.drawText(text, { x: left + (cellWidth - font.widthOfTextAtSize(text, 8)) / 2, y: baseline, size: 8, font, color: holiday ? accent : ink });
      });
    });
  }

  if (holidays.length) {
    page.drawLine({ start: { x: margin, y: legendTop }, end: { x: width - margin, y: legendTop }, thickness: .6, color: rule });
    page.drawText(pdfSafe(`${options.holidayLabel} - highlighted above`), { x: margin, y: legendTop - 13, size: 7, font: bold, color: accent });
    legend.forEach((lines, index) => {
      const column = Math.floor(index / perColumn);
      const precedingHeight = legend.slice(column * perColumn, index).reduce((sum, entry) => sum + entry.length * 9 + 4, 0);
      lines.forEach((text, line) => page.drawText(text, {
        x: margin + column * (legendWidth + gap), y: legendTop - 27 - precedingHeight - line * 9,
        size: 7, font: regular, color: ink,
      }));
    });
  }
  page.drawText("Made with Calendar Forge  /  calendarforge.net", { x: margin, y: 18, size: 6, font: regular, color: muted });
  return pdf.save();
}
