import { addUtcDays, createCalendarMonth, toIsoDate, utcDate, type CalendarMonth, type WeekStart } from "./calendar";
import type { SearchParams } from "./settings";

export const SHIFT_MONTH_COUNTS = [1, 3, 6, 12] as const;
export const MAX_SHIFT_BLOCK_DAYS = 14;

export type ShiftPreset = "4-4" | "2-2" | "7-7" | "custom";
export type ShiftDayType = "work" | "off";

export type ShiftCalendarState = {
  startDate: string;
  preset: ShiftPreset;
  workDays: number;
  offDays: number;
  monthCount: (typeof SHIFT_MONTH_COUNTS)[number];
  firstDayOfWeek: WeekStart;
  includeOffDays: boolean;
};

export type ShiftCalendarDay = {
  date: string;
  type: ShiftDayType;
  cycleDay: number;
};

export type ShiftCalendarSheet = {
  calendar: CalendarMonth;
  assignments: Record<string, ShiftDayType>;
};

export type ShiftCalendar = {
  startDate: string;
  endDate: string;
  days: ShiftCalendarDay[];
  workDayCount: number;
  offDayCount: number;
  sheets: ShiftCalendarSheet[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIsoDate(value: string | undefined): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return undefined;
  const date = utcDate(Number(match[1]), Number(match[2]), Number(match[3]));
  return toIsoDate(date) === value && date.getUTCFullYear() >= 1 && date.getUTCFullYear() <= 9999 ? date : undefined;
}

function boundedInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_SHIFT_BLOCK_DAYS ? parsed : fallback;
}

function isMonthCount(value: number): value is ShiftCalendarState["monthCount"] {
  return SHIFT_MONTH_COUNTS.includes(value as ShiftCalendarState["monthCount"]);
}

function presetFor(value: string | undefined): ShiftPreset {
  return value === "2-2" || value === "7-7" || value === "custom" ? value : "4-4";
}

function countsForPreset(preset: ShiftPreset): [number, number] | undefined {
  if (preset === "4-4") return [4, 4];
  if (preset === "2-2") return [2, 2];
  if (preset === "7-7") return [7, 7];
  return undefined;
}

export function parseShiftCalendarState(params: SearchParams, now = new Date()): ShiftCalendarState {
  const fallbackDate = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  const start = parseIsoDate(firstParam(params.startDate)) ?? fallbackDate;
  const preset = presetFor(firstParam(params.pattern));
  const presetCounts = countsForPreset(preset);
  const requestedMonths = Number(firstParam(params.months));
  const parsedMonthCount = isMonthCount(requestedMonths) ? requestedMonths : 3;
  const availableMonths = start.getUTCFullYear() === 9999 ? 12 - start.getUTCMonth() : 12;

  return {
    startDate: toIsoDate(start),
    preset,
    workDays: presetCounts?.[0] ?? boundedInteger(firstParam(params.workDays), 4),
    offDays: presetCounts?.[1] ?? boundedInteger(firstParam(params.offDays), 4),
    monthCount: parsedMonthCount <= availableMonths ? parsedMonthCount : 1,
    firstDayOfWeek: firstParam(params.weekStart) === "monday" ? 1 : 0,
    includeOffDays: firstParam(params.includeOff) === "1",
  };
}

export function shiftCalendarStateToParams(state: ShiftCalendarState): URLSearchParams {
  const params = new URLSearchParams({ startDate: state.startDate, pattern: state.preset, months: String(state.monthCount) });
  if (state.preset === "custom") {
    params.set("workDays", String(state.workDays));
    params.set("offDays", String(state.offDays));
  }
  if (state.firstDayOfWeek === 1) params.set("weekStart", "monday");
  if (state.includeOffDays) params.set("includeOff", "1");
  return params;
}

export function createShiftCalendar(state: ShiftCalendarState): ShiftCalendar {
  const start = parseIsoDate(state.startDate);
  if (!start) throw new RangeError("Shift calendar start date must be a valid ISO date.");
  if (!Number.isInteger(state.workDays) || !Number.isInteger(state.offDays) || state.workDays < 1 || state.offDays < 1 || state.workDays > MAX_SHIFT_BLOCK_DAYS || state.offDays > MAX_SHIFT_BLOCK_DAYS) {
    throw new RangeError(`Shift blocks must contain 1 through ${MAX_SHIFT_BLOCK_DAYS} days.`);
  }
  if (!SHIFT_MONTH_COUNTS.includes(state.monthCount)) throw new RangeError("Shift calendar month count is unsupported.");

  const startMonthIndex = start.getUTCFullYear() * 12 + start.getUTCMonth();
  const lastMonthIndex = startMonthIndex + state.monthCount - 1;
  const lastYear = Math.floor(lastMonthIndex / 12);
  if (lastYear > 9999) throw new RangeError("Shift calendar range exceeds the supported year.");
  const end = utcDate(lastYear, lastMonthIndex % 12 + 2, 0);
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const cycleLength = state.workDays + state.offDays;
  const days = Array.from({ length: dayCount }, (_, index): ShiftCalendarDay => {
    const date = addUtcDays(start, index);
    const cycleIndex = index % cycleLength;
    return { date: toIsoDate(date), type: cycleIndex < state.workDays ? "work" : "off", cycleDay: cycleIndex + 1 };
  });
  const assignmentMap = Object.fromEntries(days.map((day) => [day.date, day.type]));
  const sheets = Array.from({ length: state.monthCount }, (_, offset): ShiftCalendarSheet => {
    const index = startMonthIndex + offset;
    const calendar = createCalendarMonth({ year: Math.floor(index / 12), month: index % 12 + 1, firstDayOfWeek: state.firstDayOfWeek });
    return { calendar, assignments: assignmentMap };
  });

  return {
    startDate: state.startDate,
    endDate: toIsoDate(end),
    days,
    workDayCount: days.filter((day) => day.type === "work").length,
    offDayCount: days.filter((day) => day.type === "off").length,
    sheets,
  };
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function shiftCalendarToCsv(state: ShiftCalendarState, calendar = createShiftCalendar(state)): string {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
  const rows = calendar.days.map((day) => [
    day.date,
    weekday.format(new Date(`${day.date}T00:00:00Z`)),
    day.type,
    day.type === "work" ? "Work" : "Off",
    day.cycleDay,
    `${state.workDays} on / ${state.offDays} off`,
  ]);
  return [["date", "weekday", "type", "label", "cycle_day", "pattern"], ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

export function shiftCalendarToIcs(state: ShiftCalendarState, calendar = createShiftCalendar(state)): string {
  const events = calendar.days
    .filter((day) => state.includeOffDays || day.type === "work")
    .map((day) => {
      const start = day.date.replaceAll("-", "");
      const nextDate = addUtcDays(new Date(`${day.date}T00:00:00Z`), 1);
      const endLine = nextDate.getUTCFullYear() <= 9999 ? [`DTEND;VALUE=DATE:${toIsoDate(nextDate).replaceAll("-", "")}`] : [];
      const label = day.type === "work" ? "Work" : "Off";
      return [
        "BEGIN:VEVENT",
        `UID:${start}-${day.type}-${state.workDays}on${state.offDays}off@calendarforge.net`,
        `DTSTART;VALUE=DATE:${start}`,
        ...endLine,
        `SUMMARY:${label}`,
        `CATEGORIES:${day.type === "work" ? "WORK" : "OFF"}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      ].join("\r\n");
    });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calendar Forge//Shift Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${state.workDays} on / ${state.offDays} off shift calendar`,
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
