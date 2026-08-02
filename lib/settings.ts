import { getUsFederalHolidaysForRange, type Holiday, type WeekStart } from "@/lib/calendar";

export type CalendarSettings = {
  firstDayOfWeek: WeekStart;
  showWeekNumbers: boolean;
  showHolidays: boolean;
  highlightWeekends: boolean;
  locale: string;
  orientation: "portrait" | "landscape";
  paper: "letter" | "a4";
  density: "compact" | "roomy";
  title: string;
  showNotes: boolean;
};

export type SearchParams = Record<string, string | string[] | undefined>;

function stringParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSettings(params: SearchParams): CalendarSettings {
  const start = stringParam(params.start);
  const orientation = stringParam(params.orientation);
  const paper = stringParam(params.paper);
  const density = stringParam(params.density);
  const title = stringParam(params.title)?.trim().slice(0, 80) ?? "";
  return {
    firstDayOfWeek: start === "monday" ? 1 : 0,
    showWeekNumbers: stringParam(params.weekNumbers) === "1",
    showHolidays: stringParam(params.holidays) !== "0",
    highlightWeekends: stringParam(params.weekends) !== "0",
    locale: "en-US",
    orientation: orientation === "landscape" ? "landscape" : "portrait",
    paper: paper === "a4" ? "a4" : "letter",
    density: density === "compact" ? "compact" : "roomy",
    title,
    showNotes: stringParam(params.notes) === "1",
  };
}

export function holidaysForSettings(settings: CalendarSettings, startYear: number, endYear: number): Holiday[] {
  return settings.showHolidays ? getUsFederalHolidaysForRange(startYear, endYear) : [];
}

export function settingsToParams(settings: CalendarSettings): URLSearchParams {
  const params = new URLSearchParams();
  if (settings.firstDayOfWeek === 1) params.set("start", "monday");
  if (settings.showWeekNumbers) params.set("weekNumbers", "1");
  if (!settings.showHolidays) params.set("holidays", "0");
  if (!settings.highlightWeekends) params.set("weekends", "0");
  if (settings.orientation === "landscape") params.set("orientation", "landscape");
  if (settings.paper === "a4") params.set("paper", "a4");
  if (settings.density === "compact") params.set("density", "compact");
  if (settings.title) params.set("title", settings.title);
  if (settings.showNotes) params.set("notes", "1");
  return params;
}
