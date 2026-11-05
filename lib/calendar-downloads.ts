import { settingsToParams, type CalendarSettings } from "./settings";

export type CalendarPdfLayout = "year" | "monthly";

export function calendarPdfHref(year: number, settings: CalendarSettings, layout: CalendarPdfLayout): string {
  const params = settingsToParams(settings);
  params.set("year", String(year));
  if (layout === "year") params.set("layout", "year");
  return `/api/export/pdf?${params}`;
}
