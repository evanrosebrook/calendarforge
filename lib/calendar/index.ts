import { addUtcDays, isoWeekNumber, toIsoDate, utcDate, weekdayOffset } from "./date";
import type { CalendarDay, CalendarMonth, CalendarOptions, CalendarWeek } from "./types";

export * from "./date";
export * from "./holidays";
export * from "./types";

export function createCalendarMonth(options: CalendarOptions): CalendarMonth {
  const {
    year,
    month,
    locale = "en-US",
    firstDayOfWeek = 0,
    weekendDays = [0, 6],
    showWeekNumbers = false,
    holidays = [],
  } = options;

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("Year must be an integer from 1 through 9999.");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("Month must be an integer from 1 through 12.");
  }

  const firstOfMonth = utcDate(year, month, 1);
  const gridStart = addUtcDays(firstOfMonth, -weekdayOffset(firstOfMonth.getUTCDay(), firstDayOfWeek));
  const holidayMap = new Map<string, typeof holidays>();
  for (const holiday of holidays) {
    holidayMap.set(holiday.date, [...(holidayMap.get(holiday.date) ?? []), holiday]);
  }

  const lastOfMonth = utcDate(year, month + 1, 0);
  const occupiedCells = weekdayOffset(firstOfMonth.getUTCDay(), firstDayOfWeek) + lastOfMonth.getUTCDate();
  const rowCount = Math.max(5, Math.ceil(occupiedCells / 7));
  const weeks: CalendarWeek[] = [];

  for (let weekIndex = 0; weekIndex < rowCount; weekIndex += 1) {
    const days: CalendarDay[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addUtcDays(gridStart, weekIndex * 7 + dayIndex);
      const isoDate = toIsoDate(date);
      const weekday = date.getUTCDay();
      days.push({
        date: isoDate,
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        weekday,
        inMonth: date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month,
        isWeekend: weekendDays.includes(weekday),
        weekNumber: showWeekNumbers ? isoWeekNumber(date) : undefined,
        holidays: holidayMap.get(isoDate) ?? [],
      });
    }
    const isoReferenceDay = days[firstDayOfWeek === 0 ? 1 : 0];
    weeks.push({
      weekNumber: showWeekNumbers && isoReferenceDay
        ? isoWeekNumber(utcDate(isoReferenceDay.year, isoReferenceDay.month, isoReferenceDay.day))
        : undefined,
      days,
    });
  }

  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    weekdayFormatter.format(addUtcDays(utcDate(2024, 1, 7 + firstDayOfWeek), index)),
  );
  const label = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(firstOfMonth);

  return { year, month, locale, label, firstDayOfWeek, weekdayLabels, weeks };
}

export function createCalendarYear(options: Omit<CalendarOptions, "month">): CalendarMonth[] {
  return Array.from({ length: 12 }, (_, index) => createCalendarMonth({ ...options, month: index + 1 }));
}
