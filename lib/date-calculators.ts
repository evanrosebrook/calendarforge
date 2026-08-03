import { addUtcDays, daysInMonth, isoWeekNumber, toIsoDate, utcDate } from "./calendar";

const DAY_MS = 86_400_000;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;

export const SUPPORTED_TIME_ZONES = [
  { id: "UTC", label: "UTC" },
  { id: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { id: "America/Denver", label: "Mountain Time (US & Canada)" },
  { id: "America/Chicago", label: "Central Time (US & Canada)" },
  { id: "America/New_York", label: "Eastern Time (US & Canada)" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Australia/Sydney", label: "Sydney" },
] as const;

export type SupportedTimeZone = (typeof SUPPORTED_TIME_ZONES)[number]["id"];
export type DateOperation = "add" | "subtract";

export type DateAdjustment = {
  years: number;
  months: number;
  weeks: number;
  days: number;
};

export type CalendarDuration = {
  years: number;
  months: number;
  days: number;
};

export type DateDifference = {
  direction: -1 | 0 | 1;
  totalDays: number;
  weekdays: number;
  weeks: number;
  remainingDays: number;
  duration: CalendarDuration;
  earlier: Date;
  later: Date;
  inclusive: boolean;
};

export type TodayFacts = {
  date: Date;
  isoDate: string;
  longDate: string;
  weekday: string;
  dayOfYear: number;
  isoWeek: number;
  leapYear: boolean;
  daysRemainingAfterToday: number;
  localDateTime: string;
  quickDates: Array<{ days: number; date: Date }>;
};

export function parseIsoCalendarDate(value: string | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = utcDate(year, month, day);
  return toIsoDate(date) === value ? date : null;
}

export function parseBoundedAmount(value: string | undefined, maximum = 9999): number {
  if (!/^\d+$/.test(value ?? "")) return 0;
  return Math.min(maximum, Number(value));
}

export function parseSupportedTimeZone(value: string | undefined): SupportedTimeZone {
  return SUPPORTED_TIME_ZONES.some((zone) => zone.id === value) ? value as SupportedTimeZone : "UTC";
}

export function calculateDateDifference(start: Date, end: Date, inclusive = false): DateDifference {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const direction: -1 | 0 | 1 = endTime === startTime ? 0 : endTime > startTime ? 1 : -1;
  const earlier = startTime <= endTime ? start : end;
  const later = startTime <= endTime ? end : start;
  const countedEnd = inclusive ? addUtcDays(later, 1) : later;
  const totalDays = Math.round((countedEnd.getTime() - earlier.getTime()) / DAY_MS);
  return {
    direction,
    totalDays,
    weekdays: countWeekdays(earlier, later, inclusive),
    weeks: Math.floor(totalDays / 7),
    remainingDays: totalDays % 7,
    duration: decomposeCalendarDuration(earlier, countedEnd),
    earlier,
    later,
    inclusive,
  };
}

export function adjustCalendarDate(base: Date, adjustment: DateAdjustment, operation: DateOperation): Date | null {
  const values = [adjustment.years, adjustment.months, adjustment.weeks, adjustment.days];
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) return null;
  const sign = operation === "subtract" ? -1 : 1;
  const targetYear = base.getUTCFullYear() + sign * adjustment.years;
  if (targetYear < MIN_YEAR || targetYear > MAX_YEAR) return null;

  let result = utcDate(targetYear, base.getUTCMonth() + 1, Math.min(base.getUTCDate(), daysInMonth(targetYear, base.getUTCMonth() + 1)));
  const monthIndex = (result.getUTCFullYear() - 1) * 12 + result.getUTCMonth() + sign * adjustment.months;
  if (monthIndex < 0 || monthIndex >= MAX_YEAR * 12) return null;
  const monthYear = Math.floor(monthIndex / 12) + 1;
  const month = monthIndex % 12 + 1;
  result = utcDate(monthYear, month, Math.min(result.getUTCDate(), daysInMonth(monthYear, month)));

  const dayAmount = sign * (adjustment.weeks * 7 + adjustment.days);
  result = addUtcDays(result, dayAmount);
  const resultYear = result.getUTCFullYear();
  return resultYear >= MIN_YEAR && resultYear <= MAX_YEAR ? result : null;
}

export function dateInTimeZone(now: Date, timeZone: SupportedTimeZone): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return utcDate(Number(values.year), Number(values.month), Number(values.day));
}

export function getTodayFacts(now: Date, timeZone: SupportedTimeZone): TodayFacts {
  const date = dateInTimeZone(now, timeZone);
  const year = date.getUTCFullYear();
  const startOfYear = utcDate(year, 1, 1);
  const endOfYear = utcDate(year, 12, 31);
  const dateFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  return {
    date,
    isoDate: toIsoDate(date),
    longDate: dateFormatter.format(date),
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date),
    dayOfYear: Math.round((date.getTime() - startOfYear.getTime()) / DAY_MS) + 1,
    isoWeek: isoWeekNumber(date),
    leapYear: daysInMonth(year, 2) === 29,
    daysRemainingAfterToday: Math.round((endOfYear.getTime() - date.getTime()) / DAY_MS),
    localDateTime: new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "long", timeZone }).format(now),
    quickDates: [7, 14, 30, 60, 90, 120].map((days) => ({ days, date: addUtcDays(date, days) })),
  };
}

export function formatCalendarDate(date: Date, style: "long" | "medium" = "long"): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: style === "long" ? "long" : undefined,
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function countWeekdays(earlier: Date, later: Date, inclusive: boolean): number {
  const first = inclusive ? earlier : addUtcDays(earlier, 1);
  if (first.getTime() > later.getTime()) return 0;
  const dayCount = Math.round((later.getTime() - first.getTime()) / DAY_MS) + 1;
  const fullWeeks = Math.floor(dayCount / 7);
  let result = fullWeeks * 5;
  const remainder = dayCount % 7;
  for (let offset = 0; offset < remainder; offset += 1) {
    const weekday = addUtcDays(first, offset).getUTCDay();
    if (weekday !== 0 && weekday !== 6) result += 1;
  }
  return result;
}

function decomposeCalendarDuration(start: Date, end: Date): CalendarDuration {
  if (end.getTime() <= start.getTime()) return { years: 0, months: 0, days: 0 };
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let cursor = dateWithClampedDay(start.getUTCFullYear() + years, start.getUTCMonth() + 1, start.getUTCDate());
  if (cursor.getTime() > end.getTime()) {
    years -= 1;
    cursor = dateWithClampedDay(start.getUTCFullYear() + years, start.getUTCMonth() + 1, start.getUTCDate());
  }

  let months = (end.getUTCFullYear() - cursor.getUTCFullYear()) * 12 + end.getUTCMonth() - cursor.getUTCMonth();
  let monthCursor = addMonthsClampedUnchecked(cursor, months);
  if (monthCursor.getTime() > end.getTime()) {
    months -= 1;
    monthCursor = addMonthsClampedUnchecked(cursor, months);
  }
  const days = Math.round((end.getTime() - monthCursor.getTime()) / DAY_MS);
  return { years, months, days };
}

function dateWithClampedDay(year: number, month: number, day: number): Date {
  return utcDate(year, month, Math.min(day, daysInMonth(year, month)));
}

function addMonthsClampedUnchecked(date: Date, amount: number): Date {
  const index = date.getUTCFullYear() * 12 + date.getUTCMonth() + amount;
  const year = Math.floor(index / 12);
  const month = index % 12 + 1;
  return dateWithClampedDay(year, month, date.getUTCDate());
}
