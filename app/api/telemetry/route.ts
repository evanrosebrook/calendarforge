const allowedMetrics = new Set(["lcp", "cls", "ad_viewable", "calculator_result", "date_guide_action", "page_view", "print", "share", "export"]);
const allowedFormats = new Set(["pdf", "svg", "ics", "csv", "xlsx"]);
const allowedPlacements = new Set(["business_days", "calendar_after", "days_between", "open_calendar", "print_planner", "year_after"]);
const allowedSurfaces = new Set(["add_subtract", "age", "builder", "business_days", "calendar", "date_guide", "days_between", "days_until", "page_actions"]);

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 2_048) return new Response(null, { status: 413 });
  try {
    const metric = await request.json() as {
      name?: string;
      value?: number;
      path?: string;
      placement?: string;
      format?: string;
      surface?: string;
      source?: string;
    };
    if (!metric.name || !allowedMetrics.has(metric.name) || typeof metric.value !== "number" || !Number.isFinite(metric.value)) {
      return new Response(null, { status: 400 });
    }
    const event = {
      name: metric.name,
      value: metric.value,
      path: safePath(metric.path),
      placement: typeof metric.placement === "string" && allowedPlacements.has(metric.placement) ? metric.placement : undefined,
      format: typeof metric.format === "string" && allowedFormats.has(metric.format) ? metric.format : undefined,
      surface: typeof metric.surface === "string" && allowedSurfaces.has(metric.surface) ? metric.surface : undefined,
      source: safeSource(metric.source),
    };
    console.info("calendar_forge_metric", event);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return new Response(null, { status: 400 });
  }
}

function safePath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "";
  return value.split(/[?#]/, 1)[0]!.slice(0, 200);
}

function safeSource(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^[a-z0-9.-]+$/i.test(value)) return undefined;
  return value.slice(0, 100);
}
