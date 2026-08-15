import {
  addUtcDays,
  createCalendarMonth,
  getNationalHolidaysForRange,
  toIsoDate,
  utcDate,
  weekdayOffset,
  type CalendarMonth,
  type HolidayCountry,
  type WeekStart,
} from "./calendar";
import { BUILDER_LOCALES, type BuilderLocale } from "./builder";
import type { SearchParams } from "./settings";

export const MAX_FISCAL_DAYS = 371;

export type FiscalYearLabel = "start" | "end";

export type FiscalCalendarState = {
  startDate: string;
  endDate: string;
  firstDayOfWeek: WeekStart;
  showHolidays: boolean;
  holidayCountry: HolidayCountry;
  highlightWeekends: boolean;
  showWeekNumbers: boolean;
  locale: BuilderLocale;
  labelBy: FiscalYearLabel;
  orientation: "portrait" | "landscape";
  paper: "letter" | "a4";
};

export type FiscalSegment = {
  number: number;
  startDate: string;
  endDate: string;
};

export type FiscalCalendarSheet = {
  calendar: CalendarMonth;
  periodNumber: number;
  quarterNumber: number;
  periodLabel: string;
  quarterLabel: string;
};

export type FiscalCalendar = {
  label: string;
  dayCount: number;
  weekCount: number;
  periods: FiscalSegment[];
  quarters: FiscalSegment[];
  sheets: FiscalCalendarSheet[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIsoDate(value: string | undefined): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const date = utcDate(year, month, day);
  return toIsoDate(date) === value ? date : undefined;
}

function isLocale(value: string | undefined): value is BuilderLocale {
  return BUILDER_LOCALES.includes(value as BuilderLocale);
}

function dayDifference(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function defaultEndForStart(start: Date): Date {
  if (start.getUTCFullYear() >= 9999) return utcDate(9999, 12, 31);
  return utcDate(start.getUTCFullYear() + 1, start.getUTCMonth() + 1, 0);
}

export function parseFiscalCalendarState(params: SearchParams, now = new Date()): FiscalCalendarState {
  const defaultStart = utcDate(now.getUTCFullYear(), 1, 1);
  const requestedStart = parseIsoDate(firstParam(params.startDate)) ?? defaultStart;
  const requestedEnd = parseIsoDate(firstParam(params.endDate)) ?? defaultEndForStart(requestedStart);
  const latestEnd = addUtcDays(requestedStart, MAX_FISCAL_DAYS - 1);
  const supportedEnd = utcDate(9999, 12, 31);
  const end = requestedEnd < requestedStart
    ? requestedStart
    : requestedEnd > latestEnd
      ? latestEnd
      : requestedEnd > supportedEnd ? supportedEnd : requestedEnd;
  const localeValue = firstParam(params.locale);

  return {
    startDate: toIsoDate(requestedStart),
    endDate: toIsoDate(end),
    firstDayOfWeek: firstParam(params.weekStart) === "monday" ? 1 : 0,
    showHolidays: firstParam(params.holidays) !== "0",
    holidayCountry: firstParam(params.country) === "ca" ? "ca" : "us",
    highlightWeekends: firstParam(params.weekends) !== "0",
    showWeekNumbers: firstParam(params.weekNumbers) === "1",
    locale: isLocale(localeValue) ? localeValue : "en-US",
    labelBy: firstParam(params.labelBy) === "start" ? "start" : "end",
    orientation: firstParam(params.orientation) === "portrait" ? "portrait" : "landscape",
    paper: firstParam(params.paper) === "a4" ? "a4" : "letter",
  };
}

export function fiscalCalendarStateToParams(state: FiscalCalendarState): URLSearchParams {
  const params = new URLSearchParams({ startDate: state.startDate, endDate: state.endDate });
  if (state.firstDayOfWeek === 1) params.set("weekStart", "monday");
  if (!state.showHolidays) params.set("holidays", "0");
  if (state.holidayCountry === "ca") params.set("country", "ca");
  if (!state.highlightWeekends) params.set("weekends", "0");
  if (state.showWeekNumbers) params.set("weekNumbers", "1");
  if (state.locale !== "en-US") params.set("locale", state.locale);
  if (state.labelBy === "start") params.set("labelBy", "start");
  if (state.orientation === "portrait") params.set("orientation", "portrait");
  if (state.paper === "a4") params.set("paper", "a4");
  return params;
}

function createMonthPeriods(start: Date, end: Date): FiscalSegment[] {
  const startIndex = start.getUTCFullYear() * 12 + start.getUTCMonth();
  const endIndex = end.getUTCFullYear() * 12 + end.getUTCMonth();
  return Array.from({ length: endIndex - startIndex + 1 }, (_, offset) => {
    const index = startIndex + offset;
    const year = Math.floor(index / 12);
    const month = index % 12 + 1;
    const monthStart = utcDate(year, month, 1);
    const monthEnd = utcDate(year, month + 1, 0);
    return {
      number: offset + 1,
      startDate: toIsoDate(monthStart < start ? start : monthStart),
      endDate: toIsoDate(monthEnd > end ? end : monthEnd),
    };
  });
}

function createQuarters(periods: FiscalSegment[]): FiscalSegment[] {
  const quarters: FiscalSegment[] = [];
  for (let index = 0; index < periods.length; index += 3) {
    const group = periods.slice(index, index + 3);
    const first = group[0];
    const last = group.at(-1);
    if (first && last) quarters.push({ number: Math.floor(index / 3) + 1, startDate: first.startDate, endDate: last.endDate });
  }
  return quarters;
}

export function fiscalWeekNumber(date: Date, fiscalStart: Date, firstDayOfWeek: WeekStart): number {
  const fiscalGridStart = addUtcDays(fiscalStart, -weekdayOffset(fiscalStart.getUTCDay(), firstDayOfWeek));
  const dateGridStart = addUtcDays(date, -weekdayOffset(date.getUTCDay(), firstDayOfWeek));
  return Math.floor(dayDifference(fiscalGridStart, dateGridStart) / 7) + 1;
}

export function createFiscalCalendar(state: FiscalCalendarState): FiscalCalendar {
  const start = parseIsoDate(state.startDate);
  const end = parseIsoDate(state.endDate);
  if (!start || !end || end < start || dayDifference(start, end) >= MAX_FISCAL_DAYS) {
    throw new RangeError(`Fiscal calendar dates must form an inclusive range of no more than ${MAX_FISCAL_DAYS} days.`);
  }

  const periods = createMonthPeriods(start, end);
  const quarters = createQuarters(periods);
  const labelYear = state.labelBy === "start" ? start.getUTCFullYear() : end.getUTCFullYear();
  const label = `FY${labelYear}`;
  const holidays = state.showHolidays
    ? getNationalHolidaysForRange(state.holidayCountry, start.getUTCFullYear(), end.getUTCFullYear())
    : [];
  const startIndex = start.getUTCFullYear() * 12 + start.getUTCMonth();
  const endIndex = end.getUTCFullYear() * 12 + end.getUTCMonth();

  const sheets = Array.from({ length: endIndex - startIndex + 1 }, (_, offset): FiscalCalendarSheet => {
    const index = startIndex + offset;
    const year = Math.floor(index / 12);
    const month = index % 12 + 1;
    const calendar = createCalendarMonth({
      year,
      month,
      locale: state.locale,
      firstDayOfWeek: state.firstDayOfWeek,
      weekendDays: [0, 6],
      holidays,
    });
    calendar.weeks = calendar.weeks.map((week) => {
      const activeDay = week.days.find((day) => day.inMonth && day.date >= state.startDate && day.date <= state.endDate);
      return {
        ...week,
        weekNumber: state.showWeekNumbers && activeDay
          ? fiscalWeekNumber(utcDate(activeDay.year, activeDay.month, activeDay.day), start, state.firstDayOfWeek)
          : undefined,
        days: week.days.map((day) => ({
          ...day,
          weekNumber: day.date >= state.startDate && day.date <= state.endDate
            ? fiscalWeekNumber(utcDate(day.year, day.month, day.day), start, state.firstDayOfWeek)
            : undefined,
        })),
      };
    });
    const periodNumber = offset + 1;
    const quarterNumber = Math.floor(offset / 3) + 1;
    return {
      calendar,
      periodNumber,
      quarterNumber,
      periodLabel: `P${String(periodNumber).padStart(2, "0")}`,
      quarterLabel: `Q${quarterNumber}`,
    };
  });

  return {
    label,
    dayCount: dayDifference(start, end) + 1,
    weekCount: fiscalWeekNumber(end, start, state.firstDayOfWeek),
    periods,
    quarters,
    sheets,
  };
}

function escapeCsv(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function fiscalCalendarToCsv(state: FiscalCalendarState, fiscal = createFiscalCalendar(state)): string {
  const headings = ["date", "fiscal_year", "quarter", "period", "fiscal_week", "weekday", "weekend", "holidays"];
  const rows = fiscal.sheets.flatMap((sheet) => sheet.calendar.weeks.flatMap((week) => week.days
    .filter((day) => day.inMonth && day.date >= state.startDate && day.date <= state.endDate)
    .map((day) => {
      const period = fiscal.periods.find((item) => item.startDate <= day.date && item.endDate >= day.date)?.number ?? "";
      const quarter = fiscal.quarters.find((item) => item.startDate <= day.date && item.endDate >= day.date)?.number ?? "";
      return [
        day.date,
        fiscal.label,
        quarter,
        period,
        day.weekNumber ?? "",
        day.weekday,
        day.isWeekend,
        day.holidays.map((holiday) => holiday.name).join("; "),
      ];
    })));
  return [headings, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}
