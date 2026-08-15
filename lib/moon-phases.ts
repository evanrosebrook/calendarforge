import { NextMoonQuarter, SearchMoonQuarter } from "astronomy-engine";
import { toIsoDate, utcDate } from "./calendar";

export const MOON_PHASE_FIRST_YEAR = 2025;
export const MOON_PHASE_FUTURE_YEARS = 3;

export const MOON_PHASE_DETAILS = [
  { id: "new-moon", name: "New Moon", shortName: "New", symbol: "●" },
  { id: "first-quarter", name: "First Quarter", shortName: "First", symbol: "◐" },
  { id: "full-moon", name: "Full Moon", shortName: "Full", symbol: "○" },
  { id: "last-quarter", name: "Last Quarter", shortName: "Last", symbol: "◑" },
] as const;

export type MoonQuarter = 0 | 1 | 2 | 3;
export type MoonPhaseId = (typeof MOON_PHASE_DETAILS)[number]["id"];

export type MoonPhaseEvent = {
  quarter: MoonQuarter;
  id: MoonPhaseId;
  name: string;
  shortName: string;
  symbol: string;
  date: string;
  instant: string;
};

export function supportedMoonPhaseYears(now = new Date()): number[] {
  const lastYear = now.getUTCFullYear() + MOON_PHASE_FUTURE_YEARS;
  return Array.from({ length: Math.max(0, lastYear - MOON_PHASE_FIRST_YEAR + 1) }, (_, index) => MOON_PHASE_FIRST_YEAR + index);
}

export function isSupportedMoonPhaseYear(year: number, now = new Date()): boolean {
  return Number.isInteger(year) && year >= MOON_PHASE_FIRST_YEAR && year <= now.getUTCFullYear() + MOON_PHASE_FUTURE_YEARS;
}

export function getMoonPhases(year: number): MoonPhaseEvent[] {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("Year must be an integer from 1 through 9999.");
  }

  const events: MoonPhaseEvent[] = [];
  let quarter = SearchMoonQuarter(utcDate(year, 1, 1));

  // A calendar year contains about 50 principal phases. The guard keeps a
  // third-party regression from turning static generation into an endless loop.
  for (let index = 0; index < 60 && quarter.time.date.getUTCFullYear() <= year; index += 1) {
    const instant = quarter.time.date;
    if (instant.getUTCFullYear() === year) {
      const quarterNumber = quarter.quarter as MoonQuarter;
      const details = MOON_PHASE_DETAILS[quarterNumber];
      events.push({
        quarter: quarterNumber,
        ...details,
        date: toIsoDate(instant),
        instant: instant.toISOString(),
      });
    }
    quarter = NextMoonQuarter(quarter);
  }

  return events;
}

export function moonPhasesByDate(events: readonly MoonPhaseEvent[]): Map<string, MoonPhaseEvent> {
  return new Map(events.map((event) => [event.date, event]));
}
