export type TelemetryName = "ad_viewable" | "cls" | "export" | "lcp" | "page_view" | "print" | "share";

type TelemetryDetails = {
  value?: number;
  placement?: string;
  format?: string;
  surface?: string;
  source?: string;
};

export function reportTelemetry(name: TelemetryName, details: TelemetryDetails = {}) {
  const event = {
    name,
    value: details.value ?? 1,
    path: location.pathname,
    placement: details.placement,
    format: details.format,
    surface: details.surface,
    source: details.source,
  };
  const body = JSON.stringify(event);
  if (navigator.sendBeacon?.("/api/telemetry", body)) return;
  void fetch("/api/telemetry", { method: "POST", body, keepalive: true }).catch(() => undefined);
}

export function referringSource(): string {
  if (!document.referrer) return "direct";
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === location.origin ? "internal" : referrer.hostname;
  } catch {
    return "unknown";
  }
}
