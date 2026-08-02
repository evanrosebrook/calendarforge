import { addUtcDays, toIsoDate, utcDate } from "./date";
import type { Holiday } from "./types";

function nthWeekday(year: number, month: number, weekday: number, occurrence: number): Date {
  const first = utcDate(year, month, 1);
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return utcDate(year, month, 1 + offset + (occurrence - 1) * 7);
}

function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = utcDate(year, month + 1, 0);
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return addUtcDays(last, -offset);
}

function fixedHoliday(year: number, month: number, day: number, name: string): Holiday[] {
  const date = utcDate(year, month, day);
  const result: Holiday[] = [{ date: toIsoDate(date), name }];
  if (date.getUTCDay() === 6) {
    result.push({ date: toIsoDate(addUtcDays(date, -1)), name: `${name} (observed)`, observed: true });
  } else if (date.getUTCDay() === 0) {
    result.push({ date: toIsoDate(addUtcDays(date, 1)), name: `${name} (observed)`, observed: true });
  }
  return result;
}

export function getUsFederalHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [
    ...fixedHoliday(year, 1, 1, "New Year’s Day"),
    { date: toIsoDate(nthWeekday(year, 1, 1, 3)), name: "Martin Luther King Jr. Day" },
    { date: toIsoDate(nthWeekday(year, 2, 1, 3)), name: "Presidents’ Day" },
    { date: toIsoDate(lastWeekday(year, 5, 1)), name: "Memorial Day" },
    ...fixedHoliday(year, 6, 19, "Juneteenth"),
    ...fixedHoliday(year, 7, 4, "Independence Day"),
    { date: toIsoDate(nthWeekday(year, 9, 1, 1)), name: "Labor Day" },
    { date: toIsoDate(nthWeekday(year, 10, 1, 2)), name: "Columbus Day" },
    ...fixedHoliday(year, 11, 11, "Veterans Day"),
    { date: toIsoDate(nthWeekday(year, 11, 4, 4)), name: "Thanksgiving Day" },
    ...fixedHoliday(year, 12, 25, "Christmas Day"),
  ];

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

export function getUsFederalHolidaysForRange(startYear: number, endYear: number): Holiday[] {
  const holidays: Holiday[] = [];
  for (let year = startYear - 1; year <= endYear + 1; year += 1) {
    holidays.push(...getUsFederalHolidays(year));
  }
  return holidays;
}
