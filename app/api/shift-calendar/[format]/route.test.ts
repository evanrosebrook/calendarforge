import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("shift calendar export route", () => {
  it("returns a private CSV download", async () => {
    const response = await GET(new Request("http://localhost/api/shift-calendar/csv?startDate=2026-08-30&pattern=2-2&months=1"), { params: Promise.resolve({ format: "csv" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toContain("calendar-forge-shift-2026-08-30-2on-2off.csv");
    expect(await response.text()).toContain("2026-08-30,Sunday,work");
  });

  it("returns an ICS download and rejects unknown formats", async () => {
    const response = await GET(new Request("http://localhost/api/shift-calendar/ics?startDate=2026-08-30&pattern=2-2&months=1"), { params: Promise.resolve({ format: "ics" }) });
    expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(await response.text()).toMatch(/^BEGIN:VCALENDAR\r\nVERSION:2.0/);
    const missing = await GET(new Request("http://localhost/api/shift-calendar/pdf"), { params: Promise.resolve({ format: "pdf" }) });
    expect(missing.status).toBe(404);
  });
});
