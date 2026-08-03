import { utcDate, type HolidayOccurrence } from "./calendar";

const CSV_COLUMNS = ["date", "weekday", "name", "category", "observed"] as const;

function escapeCsv(value: string | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function dateFromIso(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return utcDate(year!, month!, day!);
}

export function holidaysToCsv(holidays: HolidayOccurrence[], locale: string): string {
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  const rows = holidays.map((holiday) => [
    holiday.date,
    weekdayFormatter.format(dateFromIso(holiday.date)),
    holiday.name,
    holiday.category,
    Boolean(holiday.observed),
  ]);
  return [CSV_COLUMNS, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

function escapeIcs(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

export function holidaysToIcs(holidays: HolidayOccurrence[], calendarName: string): string {
  const events = holidays.map((holiday) => {
    const date = holiday.date.replaceAll("-", "");
    return [
      "BEGIN:VEVENT",
      `UID:${date}-${holiday.country}-${holiday.id}-${holiday.observed ? "observed" : "actual"}@calendarforge.net`,
      `DTSTART;VALUE=DATE:${date}`,
      `SUMMARY:${escapeIcs(holiday.name)}`,
      `CATEGORIES:${holiday.category.toUpperCase()}`,
      `X-CALENDARFORGE-OBSERVED:${holiday.observed ? "TRUE" : "FALSE"}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ].join("\r\n");
  });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calendar Forge//National Holiday Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
