export type WeekStart = 0 | 1;

export type Holiday = {
  date: string;
  name: string;
  observed?: boolean;
};

export type CalendarDay = {
  date: string;
  year: number;
  month: number;
  day: number;
  weekday: number;
  inMonth: boolean;
  isWeekend: boolean;
  weekNumber?: number;
  holidays: Holiday[];
};

export type CalendarWeek = {
  weekNumber?: number;
  days: CalendarDay[];
};

export type CalendarMonth = {
  year: number;
  month: number;
  locale: string;
  label: string;
  firstDayOfWeek: WeekStart;
  weekdayLabels: string[];
  weeks: CalendarWeek[];
};

export type CalendarOptions = {
  year: number;
  month: number;
  locale?: string;
  firstDayOfWeek?: WeekStart;
  weekendDays?: number[];
  showWeekNumbers?: boolean;
  holidays?: Holiday[];
};
