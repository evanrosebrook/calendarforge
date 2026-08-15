import { fiscalCalendarToCsv, parseFiscalCalendarState } from "@/lib/fiscal-calendar";
import type { SearchParams } from "@/lib/settings";

export function GET(request: Request) {
  const url = new URL(request.url);
  const state = parseFiscalCalendarState(toSearchParams(url.searchParams));
  const csv = `\uFEFF${fiscalCalendarToCsv(state)}`;
  const stem = `calendar-forge-fiscal-${state.startDate}-to-${state.endDate}.csv`;
  return new Response(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${stem}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

function toSearchParams(params: URLSearchParams): SearchParams {
  return Object.fromEntries(params.entries());
}
