import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("telemetry endpoint", () => {
  it("records an allowed event without query strings", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await POST(request({
      name: "export",
      value: 1,
      path: "/calendar/2027/1?title=Private#preview",
      format: "pdf",
      surface: "calendar",
      source: "example.com",
    }));

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(info).toHaveBeenCalledWith("calendar_forge_metric", expect.objectContaining({
      path: "/calendar/2027/1",
      format: "pdf",
      surface: "calendar",
      source: "example.com",
    }));
  });

  it("rejects unknown event names", async () => {
    const response = await POST(request({ name: "calendar_note", value: 1, path: "/make-calendar" }));
    expect(response.status).toBe(400);
  });

  it("accepts privacy-safe activation events without calculator inputs", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await POST(request({
      name: "calculator_result",
      value: 1,
      path: "/date-calculator/age?birth=private",
      surface: "age",
    }));

    expect(response.status).toBe(204);
    expect(info).toHaveBeenCalledWith("calendar_forge_metric", expect.objectContaining({
      name: "calculator_result",
      path: "/date-calculator/age",
      surface: "age",
    }));
  });

  it("accepts shift calendar activation without schedule inputs", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await POST(request({ name: "calculator_result", value: 1, path: "/shift-calendar?startDate=private", surface: "shift_calendar" }));
    expect(response.status).toBe(204);
    expect(info).toHaveBeenCalledWith("calendar_forge_metric", expect.objectContaining({ path: "/shift-calendar", surface: "shift_calendar" }));
  });

  it("drops unapproved event dimensions", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await POST(request({
      name: "page_view",
      value: 1,
      path: "/today",
      placement: "private_input",
      format: "html",
      surface: "private_notes",
      source: "https://example.com/private?q=secret",
    }));

    expect(response.status).toBe(204);
    expect(info).toHaveBeenCalledWith("calendar_forge_metric", expect.objectContaining({
      path: "/today",
      placement: undefined,
      format: undefined,
      surface: undefined,
      source: undefined,
    }));
  });

  it("silently drops automated traffic before logging", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await POST(request(
      { name: "page_view", value: 1, path: "/date/2026-08-21" },
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ));

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(info).not.toHaveBeenCalled();
  });
});

function request(body: Record<string, unknown>, userAgent = "Mozilla/5.0 Chrome/145.0.0.0"): Request {
  return new Request("http://localhost/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": userAgent },
    body: JSON.stringify(body),
  });
}
