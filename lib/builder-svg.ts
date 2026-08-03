import type { CalendarMonth } from "./calendar";
import type { BuilderState } from "./builder";

type SvgOptions = Pick<BuilderState, "title" | "theme" | "orientation" | "paper" | "highlightWeekends" | "showNotesArea" | "dayNotes">;

const PALETTES = {
  forge: { paper: "#fffefa", ink: "#191a18", muted: "#686b65", line: "#d9d9d2", accent: "#c43e29", weekend: "#f4f1e9" },
  linen: { paper: "#fffdf6", ink: "#30281f", muted: "#776b5c", line: "#cfc5b4", accent: "#765436", weekend: "#f1ebdd" },
  blueprint: { paper: "#f8fbfe", ink: "#122e4d", muted: "#526c85", line: "#a5b8ca", accent: "#1e4f8a", weekend: "#eaf2f8" },
} as const;

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function oneLine(value: string, max: number): string {
  const clean = value.replaceAll(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function wrapLines(value: string, maxCharacters: number): string[] {
  const words = value.replaceAll(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  for (const word of words) {
    if (word.length > maxCharacters) {
      if (lines.at(-1)) lines.push("");
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

export function calendarsToSvg(calendars: CalendarMonth[], options: SvgOptions): string {
  const palette = PALETTES[options.theme];
  const landscape = options.orientation === "landscape";
  const pageWidth = landscape ? (options.paper === "a4" ? 1123 : 1100) : (options.paper === "a4" ? 794 : 816);
  const pageHeight = landscape ? (options.paper === "a4" ? 794 : 850) : (options.paper === "a4" ? 1123 : 1056);
  const gap = 28;
  const totalHeight = calendars.length * pageHeight + Math.max(0, calendars.length - 1) * gap;
  const monthSvgs = calendars.map((calendar, calendarIndex) => {
    const pageY = calendarIndex * (pageHeight + gap);
    const margin = 44;
    const tableX = margin;
    const tableY = pageY + 120;
    const tableWidth = pageWidth - margin * 2;
    const weekWidth = calendar.weeks[0]?.weekNumber !== undefined ? 34 : 0;
    const dayWidth = (tableWidth - weekWidth) / 7;
    const headerHeight = 34;
    const notesHeight = options.showNotesArea ? 80 : 0;
    const footerSpace = 46;
    const cellHeight = (pageHeight - (tableY - pageY) - headerHeight - notesHeight - footerSpace) / calendar.weeks.length;
    const parts: string[] = [
      `<rect x="0" y="${pageY}" width="${pageWidth}" height="${pageHeight}" fill="${palette.paper}"/>`,
      `<text x="${margin}" y="${pageY + 65}" fill="${palette.ink}" font-family="Georgia,serif" font-size="34" font-weight="600">${escapeXml(options.title || calendar.label)}</text>`,
      options.title ? `<text x="${margin}" y="${pageY + 91}" fill="${palette.accent}" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="1.5">${escapeXml(calendar.label.toUpperCase())}</text>` : "",
      `<text x="${pageWidth - margin}" y="${pageY + 60}" text-anchor="end" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="1.2">CALENDAR FORGE</text>`,
      `<line x1="${tableX}" y1="${tableY}" x2="${tableX + tableWidth}" y2="${tableY}" stroke="${palette.ink}" stroke-width="2"/>`,
    ];
    if (weekWidth) parts.push(`<text x="${tableX + 7}" y="${tableY + 22}" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="9" font-weight="700">WK</text>`);
    calendar.weekdayLabels.forEach((label, index) => {
      parts.push(`<text x="${tableX + weekWidth + index * dayWidth + 8}" y="${tableY + 22}" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing=".8">${escapeXml(label.toUpperCase())}</text>`);
    });
    parts.push(`<line x1="${tableX}" y1="${tableY + headerHeight}" x2="${tableX + tableWidth}" y2="${tableY + headerHeight}" stroke="${palette.ink}"/>`);

    calendar.weeks.forEach((week, row) => {
      const y = tableY + headerHeight + row * cellHeight;
      if (weekWidth && week.weekNumber !== undefined) parts.push(`<text x="${tableX + 10}" y="${y + 20}" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="9">${week.weekNumber}</text>`);
      week.days.forEach((day, column) => {
        const x = tableX + weekWidth + column * dayWidth;
        if (options.highlightWeekends && day.isWeekend && day.inMonth) parts.push(`<rect x="${x}" y="${y}" width="${dayWidth}" height="${cellHeight}" fill="${palette.weekend}"/>`);
        if (column > 0 || weekWidth) parts.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + cellHeight}" stroke="${palette.line}"/>`);
        parts.push(`<text x="${x + 8}" y="${y + 20}" fill="${day.inMonth ? palette.ink : palette.muted}" opacity="${day.inMonth ? 1 : .48}" font-family="Arial,sans-serif" font-size="12" font-weight="700">${day.day}</text>`);
        day.holidays.slice(0, 2).forEach((holiday, index) => parts.push(`<text x="${x + 8}" y="${y + 38 + index * 13}" fill="${palette.accent}" font-family="Arial,sans-serif" font-size="8" font-weight="700">${escapeXml(oneLine(holiday.name, Math.max(10, Math.floor(dayWidth / 5))))}</text>`));
        const note = day.inMonth ? options.dayNotes[day.date] : undefined;
        if (note) {
          const lines = wrapLines(note, Math.max(10, Math.floor(dayWidth / 5.4)));
          const startY = y + cellHeight - 9 - (lines.length - 1) * 10;
          parts.push(`<text aria-label="${escapeXml(note)}" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="8.5">${lines.map((line, index) => `<tspan x="${x + 8}" y="${startY + index * 10}">${escapeXml(line)}</tspan>`).join("")}</text>`);
        }
      });
      parts.push(`<line x1="${tableX}" y1="${y + cellHeight}" x2="${tableX + tableWidth}" y2="${y + cellHeight}" stroke="${palette.line}"/>`);
    });
    if (options.showNotesArea) {
      const notesY = pageY + pageHeight - notesHeight - 28;
      parts.push(`<text x="${margin}" y="${notesY}" fill="${palette.ink}" font-family="Georgia,serif" font-size="13" font-style="italic">Notes</text>`);
      parts.push(`<line x1="${margin}" y1="${notesY + 18}" x2="${pageWidth - margin}" y2="${notesY + 18}" stroke="${palette.line}"/>`);
      parts.push(`<line x1="${margin}" y1="${notesY + 46}" x2="${pageWidth - margin}" y2="${notesY + 46}" stroke="${palette.line}"/>`);
    }
    parts.push(`<text x="${pageWidth - margin}" y="${pageY + pageHeight - 17}" text-anchor="end" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="1">MADE WITH CALENDAR FORGE</text>`);
    return parts.join("");
  });
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${totalHeight}" viewBox="0 0 ${pageWidth} ${totalHeight}" role="img" aria-label="${escapeXml(options.title || "Custom calendar")}">${monthSvgs.join("")}</svg>`;
}
