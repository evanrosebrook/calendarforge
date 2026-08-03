import { getHolidayCatalog, getNationalHolidays, isSupportedHolidayYear } from "@/lib/calendar";
import { holidaysToCsv, holidaysToIcs } from "@/lib/holiday-exports";

type Context = { params: Promise<{ format: string }> };

export async function GET(request: Request, context: Context) {
  const { format } = await context.params;
  if (format !== "csv" && format !== "ics") return new Response("Unsupported holiday export format", { status: 404 });

  const url = new URL(request.url);
  const yearValue = url.searchParams.get("year") ?? "";
  const year = Number(yearValue);
  const catalog = getHolidayCatalog(url.searchParams.get("country") ?? "");
  if (!/^\d{4}$/.test(yearValue) || !isSupportedHolidayYear(year) || !catalog) {
    return new Response("Invalid year or country", { status: 400 });
  }

  const holidays = getNationalHolidays(catalog.code, year);
  const stem = `calendar-forge-${catalog.code}-holidays-${year}`;
  if (format === "csv") {
    return fileResponse(`\uFEFF${holidaysToCsv(holidays, catalog.locale)}`, "text/csv; charset=utf-8", `${stem}.csv`);
  }
  return fileResponse(
    holidaysToIcs(holidays, `${catalog.name} National Holidays ${year}`),
    "text/calendar; charset=utf-8",
    `${stem}.ics`,
  );
}

function fileResponse(body: BodyInit, contentType: string, filename: string) {
  return new Response(body, { headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "public, max-age=3600" } });
}
