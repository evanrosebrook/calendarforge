import { describe, expect, it } from "vitest";
import { holidaysForSettings, parseSettings, settingsToParams } from "./settings";

describe("calendar holiday settings", () => {
  it("defaults to U.S. national holidays", () => {
    const settings = parseSettings({});
    expect(settings).toMatchObject({ showHolidays: true, holidayCountry: "us", holidayScope: "national" });
    expect(holidaysForSettings(settings, 2026, 2026)).toContainEqual(expect.objectContaining({ id: "independence-day", country: "us" }));
  });

  it("parses and serializes the selected Canadian national scope", () => {
    const settings = parseSettings({ country: "ca", scope: "national" });
    const params = settingsToParams(settings);
    expect(settings).toMatchObject({ holidayCountry: "ca", holidayScope: "national" });
    expect(params.get("country")).toBe("ca");
    expect(params.get("scope")).toBe("national");
    expect(holidaysForSettings(settings, 2026, 2026)).toContainEqual(expect.objectContaining({ id: "canada-day", country: "ca" }));
  });

  it("does not return holiday data when holidays are disabled", () => {
    const settings = parseSettings({ holidays: "0", country: "ca" });
    expect(holidaysForSettings(settings, 2026, 2026)).toEqual([]);
  });

  it("does not project modern holiday rules onto legacy calendar years", () => {
    expect(holidaysForSettings(parseSettings({}), 1970, 1970)).toEqual([]);
  });
});
