import { createCalendarMonth, getNationalHolidaysForRange, toIsoDate, utcDate, type CalendarMonth, type HolidayCountry, type WeekStart } from "./calendar";
import type { SearchParams } from "./settings";

export const BUILDER_MONTH_COUNTS = [1, 3, 6, 12] as const;
export const BUILDER_LOCALES = ["en-US", "en-CA", "fr-CA"] as const;
export const BUILDER_THEMES = ["forge", "linen", "blueprint"] as const;
export const MAX_DAY_NOTES = 24;
export const MAX_NOTE_LENGTH = 120;
export const MAX_NOTES_TOTAL_LENGTH = 1_500;

export type BuilderMonthCount = (typeof BUILDER_MONTH_COUNTS)[number];
export type BuilderLocale = (typeof BUILDER_LOCALES)[number];
export type BuilderTheme = (typeof BUILDER_THEMES)[number];
export type DayNotes = Record<string, string>;

export type BuilderState = {
  startYear: number;
  startMonth: number;
  monthCount: BuilderMonthCount;
  firstDayOfWeek: WeekStart;
  showWeekNumbers: boolean;
  showHolidays: boolean;
  holidayCountry: HolidayCountry;
  highlightWeekends: boolean;
  locale: BuilderLocale;
  orientation: "portrait" | "landscape";
  paper: "letter" | "a4";
  title: string;
  showNotesArea: boolean;
  theme: BuilderTheme;
  dayNotes: DayNotes;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function allParams(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  if (!/^\d+$/.test(value ?? "")) return fallback;
  return Math.min(max, Math.max(min, Number(value)));
}

function isMonthCount(value: number): value is BuilderMonthCount {
  return BUILDER_MONTH_COUNTS.includes(value as BuilderMonthCount);
}

function isLocale(value: string | undefined): value is BuilderLocale {
  return BUILDER_LOCALES.includes(value as BuilderLocale);
}

function isTheme(value: string | undefined): value is BuilderTheme {
  return BUILDER_THEMES.includes(value as BuilderTheme);
}

function isRealIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  return toIsoDate(utcDate(year, month, day)) === value;
}

export function builderRange(state: Pick<BuilderState, "startYear" | "startMonth" | "monthCount">) {
  const startIndex = (state.startYear - 1) * 12 + state.startMonth - 1;
  const endIndex = startIndex + state.monthCount - 1;
  return {
    startYear: state.startYear,
    startMonth: state.startMonth,
    endYear: Math.floor(endIndex / 12) + 1,
    endMonth: endIndex % 12 + 1,
  };
}

function dateInBuilderRange(date: string, state: Pick<BuilderState, "startYear" | "startMonth" | "monthCount">): boolean {
  if (!isRealIsoDate(date)) return false;
  const monthIndex = (Number(date.slice(0, 4)) - 1) * 12 + Number(date.slice(5, 7)) - 1;
  const startIndex = (state.startYear - 1) * 12 + state.startMonth - 1;
  return monthIndex >= startIndex && monthIndex < startIndex + state.monthCount;
}

function parseDayNotes(values: string[], range: Pick<BuilderState, "startYear" | "startMonth" | "monthCount">): DayNotes {
  const notes: DayNotes = {};
  let totalLength = 0;
  for (const value of values) {
    if (Object.keys(notes).length >= MAX_DAY_NOTES) break;
    const separator = value.indexOf("~");
    if (separator < 0) continue;
    const date = value.slice(0, separator);
    const note = value.slice(separator + 1).trim().slice(0, MAX_NOTE_LENGTH);
    if (!note || notes[date] !== undefined || !dateInBuilderRange(date, range)) continue;
    const available = MAX_NOTES_TOTAL_LENGTH - totalLength;
    if (available <= 0) break;
    const bounded = note.slice(0, available);
    if (!bounded) break;
    notes[date] = bounded;
    totalLength += bounded.length;
  }
  return notes;
}

export function parseBuilderState(params: SearchParams, now = new Date()): BuilderState {
  const defaultYear = now.getUTCFullYear();
  const defaultMonth = now.getUTCMonth() + 1;
  const rawCount = boundedInteger(firstParam(params.months), 1, 1, 12);
  const monthCount: BuilderMonthCount = isMonthCount(rawCount) ? rawCount : 1;
  let startYear = boundedInteger(firstParam(params.year), defaultYear, 1, 9999);
  let startMonth = boundedInteger(firstParam(params.month), defaultMonth, 1, 12);

  // Keep the complete range inside the calendar engine's supported year bounds.
  const maxStartIndex = 9999 * 12 - monthCount;
  const requestedStartIndex = (startYear - 1) * 12 + startMonth - 1;
  const startIndex = Math.min(requestedStartIndex, maxStartIndex);
  startYear = Math.floor(startIndex / 12) + 1;
  startMonth = startIndex % 12 + 1;

  const localeValue = firstParam(params.locale);
  const themeValue = firstParam(params.theme);
  const range = { startYear, startMonth, monthCount };
  return {
    ...range,
    firstDayOfWeek: firstParam(params.start) === "monday" ? 1 : 0,
    showWeekNumbers: firstParam(params.weekNumbers) === "1",
    showHolidays: firstParam(params.holidays) !== "0",
    holidayCountry: firstParam(params.country) === "ca" ? "ca" : "us",
    highlightWeekends: firstParam(params.weekends) !== "0",
    locale: isLocale(localeValue) ? localeValue : "en-US",
    orientation: firstParam(params.orientation) === "landscape" ? "landscape" : "portrait",
    paper: firstParam(params.paper) === "a4" ? "a4" : "letter",
    title: (firstParam(params.title) ?? "").trim().slice(0, 80),
    showNotesArea: firstParam(params.notesArea) === "1",
    theme: isTheme(themeValue) ? themeValue : "forge",
    dayNotes: parseDayNotes(allParams(params.note), range),
  };
}

export function builderStateToParams(state: BuilderState): URLSearchParams {
  const params = new URLSearchParams({
    year: String(state.startYear),
    month: String(state.startMonth),
    months: String(state.monthCount),
  });
  if (state.firstDayOfWeek === 1) params.set("start", "monday");
  if (state.showWeekNumbers) params.set("weekNumbers", "1");
  if (!state.showHolidays) params.set("holidays", "0");
  if (state.holidayCountry === "ca") params.set("country", "ca");
  if (!state.highlightWeekends) params.set("weekends", "0");
  if (state.locale !== "en-US") params.set("locale", state.locale);
  if (state.orientation === "landscape") params.set("orientation", "landscape");
  if (state.paper === "a4") params.set("paper", "a4");
  if (state.title) params.set("title", state.title);
  if (state.showNotesArea) params.set("notesArea", "1");
  if (state.theme !== "forge") params.set("theme", state.theme);
  for (const [date, note] of Object.entries(state.dayNotes).sort(([a], [b]) => a.localeCompare(b))) {
    params.append("note", `${date}~${note}`);
  }
  return params;
}

export function createBuilderCalendars(state: BuilderState): CalendarMonth[] {
  const range = builderRange(state);
  const holidays = state.showHolidays
    ? getNationalHolidaysForRange(state.holidayCountry, range.startYear, range.endYear)
    : [];
  return Array.from({ length: state.monthCount }, (_, offset) => {
    const index = (state.startYear - 1) * 12 + state.startMonth - 1 + offset;
    return createCalendarMonth({
      year: Math.floor(index / 12) + 1,
      month: index % 12 + 1,
      locale: state.locale,
      firstDayOfWeek: state.firstDayOfWeek,
      weekendDays: [0, 6],
      showWeekNumbers: state.showWeekNumbers,
      holidays,
    });
  });
}
