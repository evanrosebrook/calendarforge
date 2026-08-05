import {
  MAX_SUPPORTED_HOLIDAY_YEAR,
  MIN_SUPPORTED_HOLIDAY_YEAR,
  addUtcDays,
  getNationalHolidaysForRange,
  toIsoDate,
  utcDate,
  type HolidayCountry,
} from "./calendar";

export type BusinessDayRegion = HolidayCountry | "weekends";
export type BusinessDayStatus = "business" | "weekend" | "holiday";
export const MAX_BUSINESS_DAY_RANGE_DAYS = 50_000;

export type BusinessDayEntry = {
  date: Date;
  isoDate: string;
  status: BusinessDayStatus;
  holidayNames: string[];
};

export type BusinessDaySummary = {
  businessDays: number;
  weekendDays: number;
  holidayDays: number;
  calendarDays: number;
  entries: BusinessDayEntry[];
};

export type BusinessDayRangeResult = BusinessDaySummary & {
  start: Date;
  end: Date;
  includeStart: boolean;
  includeEnd: boolean;
};

export type BusinessDayShiftResult = BusinessDaySummary & {
  start: Date;
  target: Date;
  amount: number;
  direction: "add" | "subtract";
  includeStart: boolean;
};

export function parseBusinessDayRegion(value: string | undefined): BusinessDayRegion {
  return value === "ca" || value === "weekends" ? value : "us";
}

export function calculateBusinessDaysBetween(
  start: Date,
  end: Date,
  region: BusinessDayRegion,
  includeStart = true,
  includeEnd = true,
): BusinessDayRangeResult | null {
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);
  if (normalizedEnd.getTime() < normalizedStart.getTime()) return null;
  if ((normalizedEnd.getTime() - normalizedStart.getTime()) / 86_400_000 > MAX_BUSINESS_DAY_RANGE_DAYS) return null;
  if (!supportsHolidayDates(region, normalizedStart, normalizedEnd)) return null;

  const first = includeStart ? normalizedStart : addUtcDays(normalizedStart, 1);
  const last = includeEnd ? normalizedEnd : addUtcDays(normalizedEnd, -1);
  const holidayMap = holidayMapForRange(region, normalizedStart.getUTCFullYear(), normalizedEnd.getUTCFullYear());
  const entries: BusinessDayEntry[] = [];

  if (first.getTime() <= last.getTime()) {
    for (let cursor = first; cursor.getTime() <= last.getTime(); cursor = addUtcDays(cursor, 1)) {
      entries.push(classifyBusinessDate(cursor, holidayMap));
    }
  }

  return {
    start: normalizedStart,
    end: normalizedEnd,
    includeStart,
    includeEnd,
    ...summarizeEntries(entries),
  };
}

export function shiftBusinessDays(
  start: Date,
  amount: number,
  direction: "add" | "subtract",
  region: BusinessDayRegion,
  includeStart = false,
): BusinessDayShiftResult | null {
  const normalizedStart = normalizeDate(start);
  if (!Number.isSafeInteger(amount) || amount < 0 || !supportsHolidayDate(region, normalizedStart)) return null;
  if (amount === 0) {
    return {
      start: normalizedStart,
      target: normalizedStart,
      amount,
      direction,
      includeStart,
      ...summarizeEntries([]),
    };
  }

  const step = direction === "subtract" ? -1 : 1;
  const holidayYears = new Map<number, Map<string, string[]>>();
  const entries: BusinessDayEntry[] = [];
  let cursor = includeStart ? normalizedStart : addUtcDays(normalizedStart, step);
  let counted = 0;

  while (counted < amount) {
    if (!supportsHolidayDate(region, cursor)) return null;
    const year = cursor.getUTCFullYear();
    let holidayMap = holidayYears.get(year);
    if (!holidayMap) {
      holidayMap = holidayMapForRange(region, year, year);
      holidayYears.set(year, holidayMap);
    }
    const entry = classifyBusinessDate(cursor, holidayMap);
    entries.push(entry);
    if (entry.status === "business") counted += 1;
    if (counted < amount) cursor = addUtcDays(cursor, step);
  }

  return {
    start: normalizedStart,
    target: cursor,
    amount,
    direction,
    includeStart,
    ...summarizeEntries(entries),
  };
}

function holidayMapForRange(region: BusinessDayRegion, startYear: number, endYear: number): Map<string, string[]> {
  const result = new Map<string, string[]>();
  if (region === "weekends") return result;
  for (const holiday of getNationalHolidaysForRange(region, startYear, endYear)) {
    result.set(holiday.date, [...(result.get(holiday.date) ?? []), holiday.name]);
  }
  return result;
}

function classifyBusinessDate(date: Date, holidayMap: Map<string, string[]>): BusinessDayEntry {
  const normalized = normalizeDate(date);
  const isoDate = toIsoDate(normalized);
  const weekday = normalized.getUTCDay();
  const holidayNames = [...new Set(holidayMap.get(isoDate) ?? [])];
  const status: BusinessDayStatus = weekday === 0 || weekday === 6
    ? "weekend"
    : holidayNames.length > 0
      ? "holiday"
      : "business";
  return { date: normalized, isoDate, status, holidayNames };
}

function summarizeEntries(entries: BusinessDayEntry[]): BusinessDaySummary {
  return {
    businessDays: entries.filter((entry) => entry.status === "business").length,
    weekendDays: entries.filter((entry) => entry.status === "weekend").length,
    holidayDays: entries.filter((entry) => entry.status === "holiday").length,
    calendarDays: entries.length,
    entries,
  };
}

function supportsHolidayDates(region: BusinessDayRegion, first: Date, last: Date): boolean {
  return supportsHolidayDate(region, first) && supportsHolidayDate(region, last);
}

function supportsHolidayDate(region: BusinessDayRegion, date: Date): boolean {
  const year = date.getUTCFullYear();
  if (year < 1 || year > 9999) return false;
  if (region === "weekends") return true;
  return year >= MIN_SUPPORTED_HOLIDAY_YEAR && year <= MAX_SUPPORTED_HOLIDAY_YEAR;
}

function normalizeDate(date: Date): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}
