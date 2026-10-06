import {
  addUtcDays,
  createCalendarYear,
  getUsFederalHolidays,
  getUsFederalHolidaysForRange,
  toIsoDate,
  utcDate,
  type CalendarMonth,
  type WeekStart,
} from "./calendar";
import type { SearchParams } from "./settings";

export const MIN_PAY_PERIOD_YEAR = 1971;
export const MAX_PAY_PERIOD_YEAR = 2100;
export const MAX_PAYROLL_LAG_DAYS = 21;

export type PaydayAdjustment = "none" | "previous" | "next";

export type PayPeriodCalendarState = {
  year: number;
  knownPayday: string;
  lagDays: number;
  adjustment: PaydayAdjustment;
  firstDayOfWeek: WeekStart;
};

export type PayPeriod = {
  number: number;
  periodStart: string;
  periodEnd: string;
  scheduledPayDate: string;
  payDate: string;
  adjusted: boolean;
};

export type ThreePaycheckMonth = {
  month: number;
  label: string;
  payDates: string[];
};

export type PayPeriodCalendar = {
  year: number;
  payPeriods: PayPeriod[];
  payDateNumbers: Record<string, number>;
  adjustedPayDates: Set<string>;
  threePaycheckMonths: ThreePaycheckMonth[];
  calendars: CalendarMonth[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIsoDate(value: string | undefined): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return undefined;
  const date = utcDate(Number(match[1]), Number(match[2]), Number(match[3]));
  return toIsoDate(date) === value ? date : undefined;
}

function planningYear(now: Date): number {
  const year = now.getUTCFullYear() + (now.getUTCMonth() >= 9 ? 1 : 0);
  return Math.min(MAX_PAY_PERIOD_YEAR, Math.max(MIN_PAY_PERIOD_YEAR, year));
}

function firstFriday(year: number): Date {
  const first = utcDate(year, 1, 1);
  let friday = addUtcDays(first, (5 - first.getUTCDay() + 7) % 7);
  const holidays = new Set(getUsFederalHolidays(year).map((holiday) => holiday.date));
  while (holidays.has(toIsoDate(friday))) friday = addUtcDays(friday, 7);
  return friday;
}

function parseYear(value: string | undefined, fallback: number): number {
  const year = Number(value);
  return Number.isInteger(year) && year >= MIN_PAY_PERIOD_YEAR && year <= MAX_PAY_PERIOD_YEAR ? year : fallback;
}

function parseLag(value: string | undefined): number {
  const lag = Number(value);
  return Number.isInteger(lag) && lag >= 0 && lag <= MAX_PAYROLL_LAG_DAYS ? lag : 6;
}

function parseAdjustment(value: string | undefined): PaydayAdjustment {
  return value === "none" || value === "next" ? value : "previous";
}

export function parsePayPeriodCalendarState(params: SearchParams, now = new Date()): PayPeriodCalendarState {
  const year = parseYear(firstParam(params.year), planningYear(now));
  const knownPayday = parseIsoDate(firstParam(params.payday)) ?? firstFriday(year);
  return {
    year,
    knownPayday: toIsoDate(knownPayday),
    lagDays: parseLag(firstParam(params.lag)),
    adjustment: parseAdjustment(firstParam(params.adjust)),
    firstDayOfWeek: firstParam(params.weekStart) === "monday" ? 1 : 0,
  };
}

export function payPeriodCalendarStateToParams(state: PayPeriodCalendarState): URLSearchParams {
  const params = new URLSearchParams({
    year: String(state.year),
    payday: state.knownPayday,
    lag: String(state.lagDays),
    adjust: state.adjustment,
  });
  if (state.firstDayOfWeek === 1) params.set("weekStart", "monday");
  return params;
}

export function createPayPeriodCalendar(state: PayPeriodCalendarState): PayPeriodCalendar {
  if (!Number.isInteger(state.year) || state.year < MIN_PAY_PERIOD_YEAR || state.year > MAX_PAY_PERIOD_YEAR) {
    throw new RangeError(`Pay-period calendar year must be from ${MIN_PAY_PERIOD_YEAR} through ${MAX_PAY_PERIOD_YEAR}.`);
  }
  const anchor = parseIsoDate(state.knownPayday);
  if (!anchor) throw new RangeError("Known payday must be a valid ISO date.");
  if (!Number.isInteger(state.lagDays) || state.lagDays < 0 || state.lagDays > MAX_PAYROLL_LAG_DAYS) {
    throw new RangeError(`Payroll lag must be from 0 through ${MAX_PAYROLL_LAG_DAYS} days.`);
  }

  const yearStart = utcDate(state.year, 1, 1);
  const yearEnd = utcDate(state.year, 12, 31);
  const federalHolidays = getUsFederalHolidaysForRange(state.year - 1, state.year + 1);
  const holidayDates = new Set(federalHolidays.map((holiday) => holiday.date));
  const daysFromAnchor = Math.floor((yearStart.getTime() - anchor.getTime()) / 86_400_000);
  const firstCycle = Math.floor(daysFromAnchor / 14) - 2;
  const candidates = Array.from({ length: 34 }, (_, index) => addUtcDays(anchor, (firstCycle + index) * 14));

  const payPeriods = candidates
    .map((scheduledPayday) => {
      const payday = adjustPayday(scheduledPayday, state.adjustment, holidayDates);
      const periodEnd = addUtcDays(scheduledPayday, -state.lagDays);
      return {
        periodStart: toIsoDate(addUtcDays(periodEnd, -13)),
        periodEnd: toIsoDate(periodEnd),
        scheduledPayDate: toIsoDate(scheduledPayday),
        payDate: toIsoDate(payday),
        adjusted: payday.getTime() !== scheduledPayday.getTime(),
      };
    })
    .filter((period) => period.payDate >= toIsoDate(yearStart) && period.payDate <= toIsoDate(yearEnd))
    .sort((a, b) => a.payDate.localeCompare(b.payDate))
    .map((period, index): PayPeriod => ({ number: index + 1, ...period }));

  const monthlyPaydays = new Map<number, string[]>();
  for (const period of payPeriods) {
    const month = Number(period.payDate.slice(5, 7));
    monthlyPaydays.set(month, [...(monthlyPaydays.get(month) ?? []), period.payDate]);
  }
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
  const threePaycheckMonths = [...monthlyPaydays.entries()]
    .filter(([, dates]) => dates.length >= 3)
    .map(([month, payDates]) => ({ month, label: monthFormatter.format(utcDate(state.year, month, 1)), payDates }));

  return {
    year: state.year,
    payPeriods,
    payDateNumbers: Object.fromEntries(payPeriods.map((period) => [period.payDate, period.number])),
    adjustedPayDates: new Set(payPeriods.filter((period) => period.adjusted).map((period) => period.payDate)),
    threePaycheckMonths,
    calendars: createCalendarYear({
      year: state.year,
      firstDayOfWeek: state.firstDayOfWeek,
      holidays: getUsFederalHolidays(state.year),
    }),
  };
}

function adjustPayday(date: Date, adjustment: PaydayAdjustment, holidayDates: Set<string>): Date {
  if (adjustment === "none") return date;
  const direction = adjustment === "previous" ? -1 : 1;
  let candidate = date;
  for (let attempts = 0; attempts < 10; attempts += 1) {
    const weekend = candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6;
    if (!weekend && !holidayDates.has(toIsoDate(candidate))) return candidate;
    candidate = addUtcDays(candidate, direction);
  }
  return candidate;
}

function escapeCsv(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function payPeriodCalendarToCsv(state: PayPeriodCalendarState, calendar = createPayPeriodCalendar(state)): string {
  const rows = calendar.payPeriods.map((period) => [
    period.number,
    period.periodStart,
    period.periodEnd,
    period.scheduledPayDate,
    period.payDate,
    period.adjusted,
  ]);
  return [["pay_period", "period_start", "period_end", "scheduled_payday", "payday", "adjusted"], ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
}

export function payPeriodCalendarToIcs(state: PayPeriodCalendarState, calendar = createPayPeriodCalendar(state)): string {
  const events = calendar.payPeriods.map((period) => {
    const start = period.payDate.replaceAll("-", "");
    const end = toIsoDate(addUtcDays(new Date(`${period.payDate}T00:00:00Z`), 1)).replaceAll("-", "");
    return [
      "BEGIN:VEVENT",
      `UID:${state.year}-biweekly-pay-${period.number}-${start}@calendarforge.net`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      "SUMMARY:Payday",
      `DESCRIPTION:Pay period ${period.number}: ${period.periodStart} through ${period.periodEnd}`,
      "CATEGORIES:PAYROLL",
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ].join("\r\n");
  });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calendar Forge//Biweekly Pay Period Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${state.year} biweekly payday calendar`,
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
