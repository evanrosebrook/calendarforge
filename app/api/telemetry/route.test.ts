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

  it("drops unapproved event dimensions", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await POST(request({
      name: "page_view",
      value: 1,
      path: "/today",
      format: "html",
      surface: "private_notes",
      source: "https://example.com/private?q=secret",
    }));

    expect(response.status).toBe(204);
    expect(info).toHaveBeenCalledWith("calendar_forge_metric", expect.objectContaining({
      path: "/today",
      format: undefined,
      surface: undefined,
      source: undefined,
    }));
  });
});

function request(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
