import { describe, expect, it } from "vitest";
import { buildGooglePageView, buildGoogleTelemetryEvent, isGoogleAnalyticsMeasurementId, safeAnalyticsPath } from "./google-analytics";

describe("Google Analytics telemetry", () => {
  it("accepts GA4 measurement IDs only", () => {
    expect(isGoogleAnalyticsMeasurementId("G-MMP15FDWR4")).toBe(true);
    expect(isGoogleAnalyticsMeasurementId("G-")).toBe(false);
    expect(isGoogleAnalyticsMeasurementId("UA-123")).toBe(false);
  });

  it("removes query strings and fragments from page locations", () => {
    expect(safeAnalyticsPath("/make-calendar?title=Private&note=Secret#preview")).toBe("/make-calendar");
    expect(safeAnalyticsPath("https://example.com/private")).toBe("/");
    expect(buildGooglePageView(
      "G-MMP15FDWR4",
      "https://calendarforge.net",
      "/make-calendar?note=Secret",
      "/calendar/2026/8?title=Private",
      "Make a calendar",
    )).toEqual({
      send_to: "G-MMP15FDWR4",
      page_location: "https://calendarforge.net/make-calendar",
      page_referrer: "https://calendarforge.net/calendar/2026/8",
      page_title: "Make a calendar",
    });
  });

  it("maps product events and rejects unapproved dimensions", () => {
    expect(buildGoogleTelemetryEvent(
      "G-MMP15FDWR4",
      "export",
      { format: "pdf", surface: "builder", placement: "private title" },
      "https://calendarforge.net",
      "/make-calendar?note=Secret",
      "Make a calendar",
    )).toEqual({
      name: "calendar_export",
      parameters: {
        send_to: "G-MMP15FDWR4",
        page_location: "https://calendarforge.net/make-calendar",
        page_title: "Make a calendar",
        format: "pdf",
        surface: "builder",
      },
    });
    expect(buildGoogleTelemetryEvent(
      "G-MMP15FDWR4",
      "calculator_result",
      { surface: "days_between", placement: "private_input" },
      "https://calendarforge.net",
      "/date-calculator/days-between?start=private",
      "Days between",
    )).toEqual({
      name: "calculator_result",
      parameters: {
        send_to: "G-MMP15FDWR4",
        page_location: "https://calendarforge.net/date-calculator/days-between",
        page_title: "Days between",
        surface: "days_between",
      },
    });
    expect(buildGoogleTelemetryEvent(
      "G-MMP15FDWR4",
      "date_guide_action",
      { surface: "date_guide", placement: "print_planner" },
      "https://calendarforge.net",
      "/date/2026-08-05",
      "August 5, 2026",
    )).toEqual({
      name: "date_guide_action",
      parameters: {
        send_to: "G-MMP15FDWR4",
        page_location: "https://calendarforge.net/date/2026-08-05",
        page_title: "August 5, 2026",
        surface: "date_guide",
        placement: "print_planner",
      },
    });
    expect(buildGoogleTelemetryEvent(
      "G-MMP15FDWR4",
      "lcp",
      { value: 1200 },
      "https://calendarforge.net",
      "/",
      "Calendar Forge",
    )).toBeNull();
  });
});
