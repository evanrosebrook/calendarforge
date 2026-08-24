import { describe, expect, it } from "vitest";
import {
  acquisitionFirstYear,
  acquisitionLastYear,
  acquisitionYears,
  isAcquisitionYear,
  robotsForYear,
} from "./acquisition";

const now = new Date("2026-08-24T12:00:00Z");

describe("acquisition year bounds", () => {
  it("publishes the current UTC year plus two years", () => {
    expect(acquisitionFirstYear(now)).toBe(2026);
    expect(acquisitionLastYear(now)).toBe(2028);
    expect(acquisitionYears(now)).toEqual([2026, 2027, 2028]);
    expect(isAcquisitionYear(2025, now)).toBe(false);
    expect(isAcquisitionYear(2026, now)).toBe(true);
    expect(isAcquisitionYear(2028, now)).toBe(true);
    expect(isAcquisitionYear(2029, now)).toBe(false);
  });

  it("keeps canonical acquisition pages indexable and contains other crawl paths", () => {
    expect(robotsForYear(2026, false)).toBeUndefined();
    expect(robotsForYear(2026, true)).toEqual({ index: false, follow: true });
    expect(robotsForYear(2025, false)).toEqual({ index: false, follow: false });
    expect(robotsForYear(2029, true)).toEqual({ index: false, follow: false });
  });
});
