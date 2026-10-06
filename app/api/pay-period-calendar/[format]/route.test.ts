import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("pay-period calendar export route", () => {
  it("returns a private CSV download", async () => {
    const response = await GET(new Request("http://localhost/api/pay-period-calendar/csv?year=2027&payday=2027-01-08&lag=6&adjust=none"), { params: Promise.resolve({ format: "csv" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toContain("calendar-forge-biweekly-pay-periods-2027.csv");
    expect(await response.text()).toContain("1,2026-12-20,2027-01-02,2027-01-08,2027-01-08,false");
  });

  it("returns an ICS download and rejects unknown formats", async () => {
    const response = await GET(new Request("http://localhost/api/pay-period-calendar/ics?year=2027&payday=2027-01-08&lag=6&adjust=none"), { params: Promise.resolve({ format: "ics" }) });
    expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(await response.text()).toMatch(/^BEGIN:VCALENDAR\r\nVERSION:2.0/);
    const missing = await GET(new Request("http://localhost/api/pay-period-calendar/pdf"), { params: Promise.resolve({ format: "pdf" }) });
    expect(missing.status).toBe(404);
  });
});
