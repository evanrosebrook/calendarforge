import { describe, expect, it } from "vitest";
import {
  getCanadaFederalHolidays,
  getHolidayCatalog,
  getNationalHolidaysForRange,
  getUsFederalHolidays,
} from "./index";

function occurrence(holidays: ReturnType<typeof getUsFederalHolidays>, id: string, observed = false) {
  return holidays.find((holiday) => holiday.id === id && Boolean(holiday.observed) === observed);
}

describe("national holiday catalogs", () => {
  it("calculates U.S. fixed, observed, and movable federal holidays", () => {
    const holidays = getUsFederalHolidays(2026);
    expect(occurrence(holidays, "independence-day")).toMatchObject({ date: "2026-07-04", category: "national", country: "us" });
    expect(occurrence(holidays, "independence-day", true)).toMatchObject({ date: "2026-07-03", name: "Independence Day (observed)" });
    expect(occurrence(holidays, "thanksgiving-day")).toMatchObject({ date: "2026-11-26" });
  });

  it("calculates Canadian fixed, observed, and movable general holidays", () => {
    const holidays = getCanadaFederalHolidays(2026);
    expect(occurrence(holidays, "canada-day")).toMatchObject({ date: "2026-07-01", category: "national", country: "ca" });
    expect(occurrence(holidays, "good-friday")).toMatchObject({ date: "2026-04-03" });
    expect(occurrence(holidays, "victoria-day")).toMatchObject({ date: "2026-05-18" });
    expect(occurrence(holidays, "thanksgiving-day")).toMatchObject({ date: "2026-10-12" });
  });

  it("assigns non-colliding Canadian observed days after a weekend", () => {
    const holidays = getCanadaFederalHolidays(2021);
    expect(occurrence(holidays, "christmas-day", true)?.date).toBe("2021-12-27");
    expect(occurrence(holidays, "boxing-day", true)?.date).toBe("2021-12-28");
  });

  it("includes cross-year observed dates when building a calendar range", () => {
    const holidays = getNationalHolidaysForRange("us", 2021, 2021);
    expect(holidays).toContainEqual(expect.objectContaining({ id: "new-years-day", date: "2021-12-31", observed: true }));
  });

  it("resolves only supported country codes and slugs", () => {
    expect(getHolidayCatalog("us")?.name).toBe("United States");
    expect(getHolidayCatalog("canada")?.code).toBe("ca");
    expect(getHolidayCatalog("mexico")).toBeUndefined();
  });

  it("returns no projected holiday data outside the supported planning range", () => {
    expect(getUsFederalHolidays(1970)).toEqual([]);
    expect(getUsFederalHolidays(1971)).not.toEqual([]);
    expect(getCanadaFederalHolidays(2100)).not.toEqual([]);
    expect(getCanadaFederalHolidays(2101)).toEqual([]);
  });

  it("honors effective years for holidays added within the supported range", () => {
    expect(occurrence(getUsFederalHolidays(1985), "martin-luther-king-jr-day")).toBeUndefined();
    expect(occurrence(getUsFederalHolidays(1986), "martin-luther-king-jr-day")?.date).toBe("1986-01-20");
    expect(occurrence(getUsFederalHolidays(2020), "juneteenth")).toBeUndefined();
    expect(occurrence(getUsFederalHolidays(2021), "juneteenth")).toBeDefined();
    expect(occurrence(getCanadaFederalHolidays(2020), "truth-and-reconciliation-day")).toBeUndefined();
    expect(occurrence(getCanadaFederalHolidays(2021), "truth-and-reconciliation-day")).toBeDefined();
  });
});
