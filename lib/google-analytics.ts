import type { TelemetryDetails, TelemetryName } from "./telemetry-client";

export const GOOGLE_ANALYTICS_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

type Gtag = (...args: unknown[]) => void;

type GoogleEvent = {
  name: string;
  parameters: Record<string, string>;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const googleEventNames: Partial<Record<TelemetryName, string>> = {
  ad_viewable: "ad_viewable",
  export: "calendar_export",
  print: "calendar_print",
  share: "calendar_share",
};

const allowedFormats = new Set(["pdf", "svg", "ics", "csv", "xlsx"]);
const allowedSurfaces = new Set(["builder", "calendar", "page_actions"]);

export function isGoogleAnalyticsMeasurementId(value: string): boolean {
  return /^G-[A-Z0-9]+$/.test(value);
}

export function safeAnalyticsPath(value: string): string {
  if (!value.startsWith("/")) return "/";
  return value.split(/[?#]/, 1)[0]!.slice(0, 200) || "/";
}

export function buildGooglePageView(
  measurementId: string,
  origin: string,
  pathname: string,
  previousPath: string,
  title: string,
): Record<string, string> | null {
  if (!isGoogleAnalyticsMeasurementId(measurementId)) return null;
  return {
    send_to: measurementId,
    page_location: `${origin}${safeAnalyticsPath(pathname)}`,
    page_referrer: `${origin}${safeAnalyticsPath(previousPath)}`,
    page_title: title.slice(0, 300),
  };
}

export function buildGoogleTelemetryEvent(
  measurementId: string,
  name: TelemetryName,
  details: TelemetryDetails,
  origin: string,
  pathname: string,
  title: string,
): GoogleEvent | null {
  const googleName = googleEventNames[name];
  if (!googleName || !isGoogleAnalyticsMeasurementId(measurementId)) return null;
  const parameters: Record<string, string> = {
    send_to: measurementId,
    page_location: `${origin}${safeAnalyticsPath(pathname)}`,
    page_title: title.slice(0, 300),
  };
  if (details.format && allowedFormats.has(details.format)) parameters.format = details.format;
  if (details.surface && allowedSurfaces.has(details.surface)) parameters.surface = details.surface;
  const placement = safeDimension(details.placement);
  if (placement) parameters.placement = placement;
  return { name: googleName, parameters };
}

export function reportGooglePageView(pathname: string, previousPath: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  const parameters = buildGooglePageView(
    GOOGLE_ANALYTICS_MEASUREMENT_ID,
    location.origin,
    pathname,
    previousPath,
    document.title,
  );
  if (parameters) window.gtag("event", "page_view", parameters);
}

export function reportGoogleTelemetry(name: TelemetryName, details: TelemetryDetails) {
  if (typeof window === "undefined" || !window.gtag) return;
  const event = buildGoogleTelemetryEvent(
    GOOGLE_ANALYTICS_MEASUREMENT_ID,
    name,
    details,
    location.origin,
    location.pathname,
    document.title,
  );
  if (event) window.gtag("event", event.name, event.parameters);
}

function safeDimension(value: string | undefined): string | undefined {
  if (!value || !/^[a-z0-9_-]{1,50}$/i.test(value)) return undefined;
  return value;
}
