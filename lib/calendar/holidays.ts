import { addUtcDays, toIsoDate, utcDate } from "./date";
import type { Holiday, HolidayCategory, HolidayCountry } from "./types";

export const MIN_SUPPORTED_HOLIDAY_YEAR = 1971;
export const MAX_SUPPORTED_HOLIDAY_YEAR = 2100;

export function isSupportedHolidayYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_SUPPORTED_HOLIDAY_YEAR && year <= MAX_SUPPORTED_HOLIDAY_YEAR;
}

export function supportedHolidayYears(): number[] {
  return Array.from(
    { length: MAX_SUPPORTED_HOLIDAY_YEAR - MIN_SUPPORTED_HOLIDAY_YEAR + 1 },
    (_, index) => MIN_SUPPORTED_HOLIDAY_YEAR + index,
  );
}

export type HolidayDefinition = {
  id: string;
  name: string;
  category: HolidayCategory;
  description: string;
  since?: number;
  dateForYear: (year: number) => Date;
  observed: "none" | "us-weekend" | "canada-weekend";
};

export type HolidayOccurrence = Holiday & {
  id: string;
  country: HolidayCountry;
  category: HolidayCategory;
};

export type HolidayCatalog = {
  code: HolidayCountry;
  slug: string;
  name: string;
  demonym: string;
  locale: string;
  calendarLabel: string;
  sourceUrl: string;
  sourceLabel: string;
  observedNote: string;
  holidays: readonly HolidayDefinition[];
};

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

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

const fixed = (month: number, day: number) => (year: number) => utcDate(year, month, day);

const US_HOLIDAYS: readonly HolidayDefinition[] = [
  { id: "new-years-day", name: "New Year’s Day", category: "national", description: "The first day of the Gregorian calendar year.", dateForYear: fixed(1, 1), observed: "us-weekend" },
  { id: "martin-luther-king-jr-day", name: "Birthday of Martin Luther King, Jr.", category: "national", description: "A federal holiday honoring the life and work of Dr. Martin Luther King, Jr.", since: 1986, dateForYear: (year) => nthWeekday(year, 1, 1, 3), observed: "none" },
  { id: "washingtons-birthday", name: "Washington’s Birthday", category: "national", description: "A federal holiday marking the birthday of George Washington.", dateForYear: (year) => nthWeekday(year, 2, 1, 3), observed: "none" },
  { id: "memorial-day", name: "Memorial Day", category: "national", description: "A day of remembrance for U.S. military personnel who died in service.", dateForYear: (year) => lastWeekday(year, 5, 1), observed: "none" },
  { id: "juneteenth", name: "Juneteenth National Independence Day", category: "national", description: "A federal holiday commemorating the end of slavery in the United States.", since: 2021, dateForYear: fixed(6, 19), observed: "us-weekend" },
  { id: "independence-day", name: "Independence Day", category: "national", description: "The U.S. national holiday commemorating the Declaration of Independence.", dateForYear: fixed(7, 4), observed: "us-weekend" },
  { id: "labor-day", name: "Labor Day", category: "national", description: "A federal holiday recognizing workers and their contributions.", dateForYear: (year) => nthWeekday(year, 9, 1, 1), observed: "none" },
  { id: "columbus-day", name: "Columbus Day", category: "national", description: "The federal holiday designated for the second Monday in October.", dateForYear: (year) => nthWeekday(year, 10, 1, 2), observed: "none" },
  { id: "veterans-day", name: "Veterans Day", category: "national", description: "A federal holiday honoring people who served in the U.S. armed forces.", dateForYear: fixed(11, 11), observed: "us-weekend" },
  { id: "thanksgiving-day", name: "Thanksgiving Day", category: "national", description: "A national day of thanksgiving observed on the fourth Thursday in November.", dateForYear: (year) => nthWeekday(year, 11, 4, 4), observed: "none" },
  { id: "christmas-day", name: "Christmas Day", category: "national", description: "The federal holiday observed on December 25.", dateForYear: fixed(12, 25), observed: "us-weekend" },
];

const CANADA_HOLIDAYS: readonly HolidayDefinition[] = [
  { id: "new-years-day", name: "New Year’s Day", category: "national", description: "The first day of the Gregorian calendar year.", dateForYear: fixed(1, 1), observed: "canada-weekend" },
  { id: "good-friday", name: "Good Friday", category: "national", description: "The Friday before Easter Sunday.", dateForYear: (year) => addUtcDays(easterSunday(year), -2), observed: "none" },
  { id: "victoria-day", name: "Victoria Day", category: "national", description: "A Canadian general holiday on the Monday before May 25.", dateForYear: (year) => lastWeekday(year, 5, 1).getUTCDate() >= 25 ? addUtcDays(lastWeekday(year, 5, 1), -7) : lastWeekday(year, 5, 1), observed: "none" },
  { id: "canada-day", name: "Canada Day", category: "national", description: "Canada’s national day, marking Confederation.", dateForYear: fixed(7, 1), observed: "canada-weekend" },
  { id: "labour-day", name: "Labour Day", category: "national", description: "A general holiday recognizing workers and their contributions.", dateForYear: (year) => nthWeekday(year, 9, 1, 1), observed: "none" },
  { id: "truth-and-reconciliation-day", name: "National Day for Truth and Reconciliation", category: "national", description: "A federal general holiday for commemoration and reflection on the residential school system.", since: 2021, dateForYear: fixed(9, 30), observed: "canada-weekend" },
  { id: "thanksgiving-day", name: "Thanksgiving Day", category: "national", description: "A Canadian general holiday on the second Monday in October.", dateForYear: (year) => nthWeekday(year, 10, 1, 2), observed: "none" },
  { id: "remembrance-day", name: "Remembrance Day", category: "national", description: "A day honoring members of the armed forces who died in service.", dateForYear: fixed(11, 11), observed: "canada-weekend" },
  { id: "christmas-day", name: "Christmas Day", category: "national", description: "A Canadian general holiday observed on December 25.", dateForYear: fixed(12, 25), observed: "canada-weekend" },
  { id: "boxing-day", name: "Boxing Day", category: "national", description: "A Canadian general holiday observed on December 26.", dateForYear: fixed(12, 26), observed: "canada-weekend" },
];

export const HOLIDAY_CATALOGS: readonly HolidayCatalog[] = [
  {
    code: "us",
    slug: "us",
    name: "United States",
    demonym: "U.S.",
    locale: "en-US",
    calendarLabel: "Federal holidays",
    sourceUrl: "https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/",
    sourceLabel: "U.S. Office of Personnel Management",
    observedNote: "For a standard Monday–Friday federal schedule, a Saturday holiday is observed on Friday and a Sunday holiday on Monday.",
    holidays: US_HOLIDAYS,
  },
  {
    code: "ca",
    slug: "canada",
    name: "Canada",
    demonym: "Canadian",
    locale: "en-CA",
    calendarLabel: "Federal general holidays",
    sourceUrl: "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html",
    sourceLabel: "Government of Canada",
    observedNote: "For calendar planning, weekend fixed-date holidays are shown on the next available weekday. An employer’s substitute day can differ under the Canada Labour Code.",
    holidays: CANADA_HOLIDAYS,
  },
] as const;

export function getHolidayCatalog(value: string): HolidayCatalog | undefined {
  const normalized = value.toLowerCase();
  return HOLIDAY_CATALOGS.find((catalog) => catalog.code === normalized || catalog.slug === normalized);
}

export function getHolidayDefinition(country: HolidayCountry, id: string): HolidayDefinition | undefined {
  return getHolidayCatalog(country)?.holidays.find((holiday) => holiday.id === id);
}

function nextAvailableWeekday(date: Date, occupied: Set<string>): Date {
  let candidate = addUtcDays(date, 1);
  while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6 || occupied.has(toIsoDate(candidate))) {
    candidate = addUtcDays(candidate, 1);
  }
  return candidate;
}

export function getNationalHolidays(country: HolidayCountry, year: number): HolidayOccurrence[] {
  if (!isSupportedHolidayYear(year)) return [];
  const catalog = getHolidayCatalog(country);
  if (!catalog) return [];
  const definitions = catalog.holidays.filter((definition) => !definition.since || year >= definition.since);
  const actualDates = new Set(definitions.map((definition) => toIsoDate(definition.dateForYear(year))));
  const occupiedObservedDates = new Set(actualDates);
  const occurrences: HolidayOccurrence[] = [];

  for (const definition of definitions) {
    const actualDate = definition.dateForYear(year);
    occurrences.push({
      id: definition.id,
      country,
      category: definition.category,
      date: toIsoDate(actualDate),
      name: definition.name,
    });

    let observedDate: Date | undefined;
    if (definition.observed === "us-weekend" && actualDate.getUTCDay() === 6) observedDate = addUtcDays(actualDate, -1);
    if (definition.observed === "us-weekend" && actualDate.getUTCDay() === 0) observedDate = addUtcDays(actualDate, 1);
    if (definition.observed === "canada-weekend" && (actualDate.getUTCDay() === 0 || actualDate.getUTCDay() === 6)) {
      observedDate = nextAvailableWeekday(actualDate, occupiedObservedDates);
    }
    if (observedDate) {
      occupiedObservedDates.add(toIsoDate(observedDate));
      occurrences.push({
        id: definition.id,
        country,
        category: definition.category,
        date: toIsoDate(observedDate),
        name: `${definition.name} (observed)`,
        observed: true,
      });
    }
  }

  return occurrences.sort((a, b) => a.date.localeCompare(b.date) || Number(Boolean(a.observed)) - Number(Boolean(b.observed)));
}

export function getNationalHolidaysForRange(country: HolidayCountry, startYear: number, endYear: number): HolidayOccurrence[] {
  if (endYear < MIN_SUPPORTED_HOLIDAY_YEAR || startYear > MAX_SUPPORTED_HOLIDAY_YEAR) return [];
  const holidays: HolidayOccurrence[] = [];
  const firstYear = Math.max(MIN_SUPPORTED_HOLIDAY_YEAR, startYear - 1);
  const lastYear = Math.min(MAX_SUPPORTED_HOLIDAY_YEAR, endYear + 1);
  for (let year = firstYear; year <= lastYear; year += 1) {
    holidays.push(...getNationalHolidays(country, year));
  }
  return holidays;
}

export function getHolidayOccurrences(country: HolidayCountry, id: string, startYear: number, endYear: number): HolidayOccurrence[] {
  return getNationalHolidaysForRange(country, startYear, endYear)
    .filter((holiday) => holiday.id === id && Number(holiday.date.slice(0, 4)) >= startYear && Number(holiday.date.slice(0, 4)) <= endYear);
}

export function getUsFederalHolidays(year: number): HolidayOccurrence[] {
  return getNationalHolidays("us", year);
}

export function getUsFederalHolidaysForRange(startYear: number, endYear: number): HolidayOccurrence[] {
  return getNationalHolidaysForRange("us", startYear, endYear);
}

export function getCanadaFederalHolidays(year: number): HolidayOccurrence[] {
  return getNationalHolidays("ca", year);
}

export function getCanadaFederalHolidaysForRange(startYear: number, endYear: number): HolidayOccurrence[] {
  return getNationalHolidaysForRange("ca", startYear, endYear);
}
