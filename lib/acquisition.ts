export const ACQUISITION_YEARS_AHEAD = 2;

export function acquisitionFirstYear(now = new Date(Date.now())): number {
  return now.getUTCFullYear();
}

export function acquisitionLastYear(now = new Date(Date.now())): number {
  return acquisitionFirstYear(now) + ACQUISITION_YEARS_AHEAD;
}

export function acquisitionYears(now = new Date(Date.now())): number[] {
  const first = acquisitionFirstYear(now);
  return Array.from({ length: ACQUISITION_YEARS_AHEAD + 1 }, (_, index) => first + index);
}

export function isAcquisitionYear(year: number, now = new Date(Date.now())): boolean {
  return year >= acquisitionFirstYear(now) && year <= acquisitionLastYear(now);
}

export function robotsForYear(year: number, customized = false): { index: false; follow: boolean } | undefined {
  const indexable = isAcquisitionYear(year);
  if (!customized && indexable) return undefined;
  return { index: false, follow: indexable };
}
