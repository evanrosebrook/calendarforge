import { describe, expect, it } from "vitest";
import { easterSunday, toIsoDate, utcDate } from "./calendar";
import { getNextCountdownTarget, getPopularCountdownTargets } from "./countdown";

describe("countdown targets", () => {
  it("calculates Western Easter Sunday deterministically", () => {
    expect(toIsoDate(easterSunday(2024))).toBe("2024-03-31");
    expect(toIsoDate(easterSunday(2025))).toBe("2025-04-20");
    expect(toIsoDate(easterSunday(2026))).toBe("2026-04-05");
  });

  it("keeps an event occurring today and advances one that has passed", () => {
    expect(getNextCountdownTarget("christmas", utcDate(2026, 12, 25))?.isoDate).toBe("2026-12-25");
    expect(getNextCountdownTarget("christmas", utcDate(2026, 12, 26))?.isoDate).toBe("2027-12-25");
    expect(getNextCountdownTarget("new-year", utcDate(2026, 1, 2))?.isoDate).toBe("2027-01-01");
  });

  it("labels deterministic meteorological seasons and returns every popular target", () => {
    const targets = getPopularCountdownTargets(utcDate(2026, 4, 1));
    expect(targets.map(({ event, isoDate }) => [event.shortLabel, isoDate])).toEqual([
      ["Christmas", "2026-12-25"],
      ["New Year", "2027-01-01"],
      ["Spring (March 1)", "2027-03-01"],
      ["Summer (June 1)", "2026-06-01"],
      ["Easter", "2026-04-05"],
    ]);
  });

  it("does not generate dates outside the supported calendar", () => {
    expect(getNextCountdownTarget("christmas", utcDate(9999, 12, 26))).toBeNull();
  });
});
