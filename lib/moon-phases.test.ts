import { describe, expect, it } from "vitest";
import { getMoonPhases, isSupportedMoonPhaseYear, moonPhasesByDate, supportedMoonPhaseYears } from "./moon-phases";

const fixedNow = new Date("2026-08-05T12:00:00Z");

describe("principal moon phases", () => {
  it("enumerates every 2026 quarter phase in chronological order", () => {
    const events = getMoonPhases(2026);

    expect(events).toHaveLength(50);
    expect(events.map((event) => event.quarter).slice(0, 8)).toEqual([2, 3, 0, 1, 2, 3, 0, 1]);
    expect(events[0]).toMatchObject({ name: "Full Moon", date: "2026-01-03" });
    expect(events.at(-1)).toMatchObject({ name: "Last Quarter", date: "2026-12-30" });
    expect(events.every((event, index) => index === 0 || event.instant > events[index - 1]!.instant)).toBe(true);
  });

  it("stays within three minutes of published USNO times", () => {
    const events = getMoonPhases(2026);
    expectCloseToUtc(events.find((event) => event.date === "2026-01-03")!.instant, "2026-01-03T10:03:00Z");
    expectCloseToUtc(events.find((event) => event.date === "2026-01-18")!.instant, "2026-01-18T19:52:00Z");
    expectCloseToUtc(events.find((event) => event.date === "2026-05-31")!.instant, "2026-05-31T08:45:00Z");
    expectCloseToUtc(events.find((event) => event.date === "2026-06-29")!.instant, "2026-06-29T23:56:00Z");
  });

  it("indexes events by their UTC calendar date", () => {
    const phases = moonPhasesByDate(getMoonPhases(2026));
    expect(phases.get("2026-03-03")?.name).toBe("Full Moon");
    expect(phases.get("2026-03-04")).toBeUndefined();
  });

  it("matches the bounded acquisition-year window", () => {
    expect(supportedMoonPhaseYears(fixedNow)).toEqual([2025, 2026, 2027, 2028, 2029]);
    expect(isSupportedMoonPhaseYear(2025, fixedNow)).toBe(true);
    expect(isSupportedMoonPhaseYear(2029, fixedNow)).toBe(true);
    expect(isSupportedMoonPhaseYear(2030, fixedNow)).toBe(false);
  });

  it("rejects years outside the calendar engine bounds", () => {
    expect(() => getMoonPhases(0)).toThrow(RangeError);
    expect(() => getMoonPhases(10000)).toThrow(RangeError);
  });
});

function expectCloseToUtc(actual: string, expected: string) {
  expect(Math.abs(Date.parse(actual) - Date.parse(expected))).toBeLessThanOrEqual(3 * 60_000);
}
