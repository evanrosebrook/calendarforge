import { parseShiftCalendarState, shiftCalendarToCsv, shiftCalendarToIcs } from "@/lib/shift-calendar";
import type { SearchParams } from "@/lib/settings";

type Context = { params: Promise<{ format: string }> };

export async function GET(request: Request, context: Context) {
  const { format } = await context.params;
  if (format !== "csv" && format !== "ics") return new Response("Unsupported shift calendar export format", { status: 404 });
  const state = parseShiftCalendarState(Object.fromEntries(new URL(request.url).searchParams.entries()) as SearchParams);
  const stem = `calendar-forge-shift-${state.startDate}-${state.workDays}on-${state.offDays}off`;
  const body = format === "csv" ? `\uFEFF${shiftCalendarToCsv(state)}` : shiftCalendarToIcs(state);
  return new Response(body, { headers: {
    "Cache-Control": "private, no-store",
    "Content-Disposition": `attachment; filename="${stem}.${format}"`,
    "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "text/calendar; charset=utf-8",
  } });
}
