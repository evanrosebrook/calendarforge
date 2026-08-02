const allowedMetrics = new Set(["lcp", "cls", "ad_viewable"]);

export async function POST(request: Request) {
  try {
    const metric = await request.json() as { name?: string; value?: number; path?: string; placement?: string };
    if (!metric.name || !allowedMetrics.has(metric.name) || typeof metric.value !== "number" || !Number.isFinite(metric.value)) {
      return new Response(null, { status: 400 });
    }
    const event = {
      name: metric.name,
      value: metric.value,
      path: typeof metric.path === "string" ? metric.path.slice(0, 200) : "",
      placement: typeof metric.placement === "string" ? metric.placement.slice(0, 50) : undefined,
    };
    console.info("calendar_forge_metric", event);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
