import { describe, expect, it } from "vitest";
import {
  MAX_DAY_NOTES,
  MAX_NOTE_LENGTH,
  MAX_NOTES_TOTAL_LENGTH,
  builderRange,
  builderStateToParams,
  createBuilderCalendars,
  parseBuilderState,
} from "./builder";
import type { SearchParams } from "./settings";

const fixedNow = new Date("2026-08-01T12:00:00Z");

function recordFromParams(params: URLSearchParams): SearchParams {
  const result: SearchParams = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

describe("custom calendar builder state", () => {
  it("parses and serializes every supported setting and repeated date notes", () => {
    const state = parseBuilderState({
      year: "2026", month: "11", months: "3", start: "monday", weekNumbers: "1", holidays: "0",
      country: "ca", weekends: "0", locale: "fr-CA", orientation: "landscape", paper: "a4",
      title: "Projet <important>", notesArea: "1", theme: "blueprint",
      note: ["2026-11-05~Launch <review>", "2027-01-02~Follow up"],
    }, fixedNow);
    expect(state).toMatchObject({
      startYear: 2026, startMonth: 11, monthCount: 3, firstDayOfWeek: 1, showWeekNumbers: true,
      showHolidays: false, holidayCountry: "ca", highlightWeekends: false, locale: "fr-CA",
      orientation: "landscape", paper: "a4", title: "Projet <important>", showNotesArea: true,
      theme: "blueprint", dayNotes: { "2026-11-05": "Launch <review>", "2027-01-02": "Follow up" },
    });
    expect(parseBuilderState(recordFromParams(builderStateToParams(state)), fixedNow)).toEqual(state);
  });

  it("validates invalid choices and clamps the complete range to supported calendar years", () => {
    const state = parseBuilderState({ year: "12000", month: "99", months: "12", locale: "xx", theme: "glitter" }, fixedNow);
    expect(state).toMatchObject({ startYear: 9999, startMonth: 1, monthCount: 12, locale: "en-US", theme: "forge" });
    expect(builderRange(state)).toEqual({ startYear: 9999, startMonth: 1, endYear: 9999, endMonth: 12 });
    expect(parseBuilderState({ year: "oops", month: "-2", months: "2" }, fixedNow)).toMatchObject({ startYear: 2026, startMonth: 8, monthCount: 1 });
  });

  it("accepts only real in-range dates and enforces note count, item, and total caps", () => {
    const noteValues = [
      `2026-08-01~${"a".repeat(MAX_NOTE_LENGTH + 20)}`,
      "2026-02-30~not real",
      "2026-09-01~outside range",
      "2026-08-01~duplicate",
      ...Array.from({ length: MAX_DAY_NOTES + 5 }, (_, index) => `2026-08-${String(index + 2).padStart(2, "0")}~${"b".repeat(100)}`),
    ];
    const state = parseBuilderState({ year: "2026", month: "8", months: "1", note: noteValues }, fixedNow);
    expect(state.dayNotes["2026-08-01"]).toHaveLength(MAX_NOTE_LENGTH);
    expect(state.dayNotes["2026-02-30"]).toBeUndefined();
    expect(state.dayNotes["2026-09-01"]).toBeUndefined();
    expect(Object.keys(state.dayNotes).length).toBeLessThanOrEqual(MAX_DAY_NOTES);
    expect(Object.values(state.dayNotes).reduce((total, note) => total + note.length, 0)).toBeLessThanOrEqual(MAX_NOTES_TOTAL_LENGTH);
  });

  it("builds exact cross-year month sequences with the selected locale and holidays", () => {
    const state = parseBuilderState({ year: "2026", month: "11", months: "3", country: "ca", locale: "fr-CA" }, fixedNow);
    const calendars = createBuilderCalendars(state);
    expect(calendars.map(({ year, month }) => [year, month])).toEqual([[2026, 11], [2026, 12], [2027, 1]]);
    expect(calendars[0]?.label).toMatch(/novembre/i);
    expect(calendars[2]?.weeks.flatMap((week) => week.days).find((day) => day.date === "2027-01-01")?.holidays.map((holiday) => holiday.name)).toContain("New Year’s Day");
  });
});
