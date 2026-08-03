import { describe, expect, it } from "vitest";
import { holidayExportPath } from "./navigation";

describe("holiday export navigation", () => {
  it("builds explicit U.S. and Canadian national holiday export URLs", () => {
    expect(holidayExportPath("csv", "us", 2026)).toBe("/api/holidays/csv?year=2026&country=us");
    expect(holidayExportPath("ics", "ca", 2027)).toBe("/api/holidays/ics?year=2027&country=ca");
  });
});
