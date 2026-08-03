import { builderRange, createBuilderCalendars, parseBuilderState } from "@/lib/builder";
import { calendarsToSvg } from "@/lib/builder-svg";
import { calendarsToCsv, calendarsToIcs, calendarsToPdf, calendarsToXlsx } from "@/lib/exports";
import type { SearchParams } from "@/lib/settings";

type Context = { params: Promise<{ format: string }> };

export async function GET(request: Request, context: Context) {
  const { format } = await context.params;
  if (!["pdf", "svg", "ics", "csv", "xlsx"].includes(format)) return new Response("Unsupported export format", { status: 404 });
  const url = new URL(request.url);
  const state = parseBuilderState(toSearchParams(url.searchParams));
  const calendars = createBuilderCalendars(state);
  const range = builderRange(state);
  const stem = `calendar-forge-${state.startYear}-${String(state.startMonth).padStart(2, "0")}-to-${range.endYear}-${String(range.endMonth).padStart(2, "0")}`;
  const calendarName = state.title || "Calendar Forge custom calendar";

  if (format === "ics") return fileResponse(calendarsToIcs(calendars, { dayNotes: state.dayNotes, inMonthOnly: true, calendarName }), "text/calendar; charset=utf-8", `${stem}.ics`);
  if (format === "csv") return fileResponse(`\uFEFF${calendarsToCsv(calendars, { dayNotes: state.dayNotes, inMonthOnly: true })}`, "text/csv; charset=utf-8", `${stem}.csv`);
  if (format === "svg") return fileResponse(calendarsToSvg(calendars, state), "image/svg+xml; charset=utf-8", `${stem}.svg`);
  if (format === "pdf") {
    const bytes = await calendarsToPdf(calendars, {
      orientation: state.orientation,
      paper: state.paper,
      title: state.title,
      dayNotes: state.dayNotes,
      showNotesArea: state.showNotesArea,
      highlightWeekends: state.highlightWeekends,
      theme: state.theme,
    });
    return fileResponse(new Uint8Array(bytes).buffer, "application/pdf", `${stem}.pdf`);
  }
  const workbook = await calendarsToXlsx(calendars, {
    title: state.title,
    dayNotes: state.dayNotes,
    highlightWeekends: state.highlightWeekends,
    orientation: state.orientation,
    paper: state.paper,
    theme: state.theme,
  });
  return fileResponse(new Uint8Array(workbook).buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `${stem}.xlsx`);
}

function toSearchParams(params: URLSearchParams): SearchParams {
  const result: SearchParams = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

function fileResponse(body: BodyInit, contentType: string, filename: string) {
  return new Response(body, { headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
