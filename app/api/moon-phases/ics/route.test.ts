import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => {
  vi.useRealTimers();
});

describe("moon phase ICS endpoint", () => {
  it("downloads a complete annual calendar", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    const response = GET(new Request("https://calendarforge.net/api/moon-phases/ics?year=2026"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain("moon-phases-2026.ics");
    expect(body.match(/BEGIN:VEVENT/g)).toHaveLength(50);
  });

  it("rejects malformed and unsupported years", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    expect(GET(new Request("https://calendarforge.net/api/moon-phases/ics?year=2024")).status).toBe(400);
    expect(GET(new Request("https://calendarforge.net/api/moon-phases/ics?year=nope")).status).toBe(400);
  });
});
