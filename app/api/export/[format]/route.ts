import { createCalendarMonth, createCalendarYear } from "@/lib/calendar";
import { calendarsToCsv, calendarsToIcs, calendarsToPdf, calendarsToXlsx } from "@/lib/exports";
import { holidaysForSettings, parseSettings, type SearchParams } from "@/lib/settings";

type Context = { params: Promise<{ format: string }> };

export async function GET(request: Request, context: Context) {
  const { format } = await context.params;
  if (!["pdf", "ics", "csv", "xlsx"].includes(format)) return new Response("Unsupported export format", { status: 404 });
  const url = new URL(request.url);
  const rawParams = Object.fromEntries(url.searchParams.entries()) as SearchParams;
  const year = Number(url.searchParams.get("year"));
  const monthValue = url.searchParams.get("month");
  const month = monthValue ? Number(monthValue) : undefined;
  if (!Number.isInteger(year) || year < 1 || year > 9999 || (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12))) {
    return new Response("Invalid year or month", { status: 400 });
  }
  const settings = parseSettings(rawParams);
  const base = {
    year,
    locale: settings.locale,
    firstDayOfWeek: settings.firstDayOfWeek,
    weekendDays: [0, 6],
    showWeekNumbers: settings.showWeekNumbers,
    holidays: holidaysForSettings(settings, year, year),
  };
  const calendars = month ? [createCalendarMonth({ ...base, month })] : createCalendarYear(base);
  const stem = `calendar-forge-${year}${month ? `-${String(month).padStart(2, "0")}` : ""}`;

  if (format === "ics") return fileResponse(calendarsToIcs(calendars), "text/calendar; charset=utf-8", `${stem}.ics`);
  if (format === "csv") return fileResponse(`\uFEFF${calendarsToCsv(calendars)}`, "text/csv; charset=utf-8", `${stem}.csv`);
  if (format === "pdf") {
    const bytes = await calendarsToPdf(calendars, { orientation: settings.orientation, paper: settings.paper, title: settings.title });
    return fileResponse(new Uint8Array(bytes).buffer, "application/pdf", `${stem}.pdf`);
  }
  const workbook = await calendarsToXlsx(calendars, settings.title);
  return fileResponse(new Uint8Array(workbook).buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `${stem}.xlsx`);
}

function fileResponse(body: BodyInit, contentType: string, filename: string) {
  return new Response(body, { headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "public, max-age=3600" } });
}
