import type { MoonPhaseEvent } from "./moon-phases";

function escapeIcs(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

function compactUtc(instant: string): string {
  return instant.replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}/, "");
}

export function moonPhasesToIcs(events: readonly MoonPhaseEvent[], year: number): string {
  const calendarName = `${year} Moon Phases — Calendar Forge`;
  const eventLines = events.map((event) => [
    "BEGIN:VEVENT",
    `UID:${event.instant}-${event.id}@calendarforge.net`,
    `DTSTART:${compactUtc(event.instant)}`,
    `SUMMARY:${escapeIcs(event.name)}`,
    `DESCRIPTION:${escapeIcs(`${event.name} occurs at ${event.instant.slice(0, 16).replace("T", " ")} UTC.`)}`,
    "CATEGORIES:MOON PHASE",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ].join("\r\n"));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calendar Forge//Moon Phase Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    ...eventLines,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
