import { easterSunday, toIsoDate, utcDate } from "./calendar";

export const COUNTDOWN_EVENT_IDS = ["christmas", "new-year", "spring", "summer", "easter"] as const;

export type CountdownEventId = (typeof COUNTDOWN_EVENT_IDS)[number];

export type CountdownEvent = {
  id: CountdownEventId;
  label: string;
  shortLabel: string;
  minimumYear: number;
  dateForYear: (year: number) => Date;
};

export type CountdownTarget = {
  event: CountdownEvent;
  date: Date;
  isoDate: string;
};

const COUNTDOWN_EVENTS: readonly CountdownEvent[] = [
  {
    id: "christmas",
    label: "Christmas Day",
    shortLabel: "Christmas",
    minimumYear: 1,
    dateForYear: (year) => utcDate(year, 12, 25),
  },
  {
    id: "new-year",
    label: "New Year’s Day",
    shortLabel: "New Year",
    minimumYear: 1,
    dateForYear: (year) => utcDate(year, 1, 1),
  },
  {
    id: "spring",
    label: "Meteorological spring",
    shortLabel: "Spring (March 1)",
    minimumYear: 1,
    dateForYear: (year) => utcDate(year, 3, 1),
  },
  {
    id: "summer",
    label: "Meteorological summer",
    shortLabel: "Summer (June 1)",
    minimumYear: 1,
    dateForYear: (year) => utcDate(year, 6, 1),
  },
  {
    id: "easter",
    label: "Easter Sunday",
    shortLabel: "Easter",
    minimumYear: 1583,
    dateForYear: easterSunday,
  },
] as const;

export function getCountdownEvent(id: string): CountdownEvent | undefined {
  return COUNTDOWN_EVENTS.find((event) => event.id === id);
}

export function getNextCountdownTarget(id: CountdownEventId, start: Date): CountdownTarget | null {
  const event = getCountdownEvent(id)!;
  const firstYear = Math.max(start.getUTCFullYear(), event.minimumYear);
  const candidate = event.dateForYear(firstYear);
  const year = candidate.getTime() >= start.getTime() ? firstYear : firstYear + 1;
  if (year > 9999) return null;
  const date = event.dateForYear(year);
  return { event, date, isoDate: toIsoDate(date) };
}

export function getPopularCountdownTargets(start: Date): CountdownTarget[] {
  return COUNTDOWN_EVENT_IDS
    .map((id) => getNextCountdownTarget(id, start))
    .filter((target): target is CountdownTarget => target !== null);
}
