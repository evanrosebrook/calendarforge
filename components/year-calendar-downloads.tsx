"use client";

import type { CalendarSettings } from "@/lib/settings";
import { calendarPdfHref } from "@/lib/calendar-downloads";
import { reportTelemetry } from "@/lib/telemetry-client";
import { Download } from "./icons";
import { isSupportedHolidayYear } from "@/lib/calendar";

export function YearCalendarDownloads({ year, settings }: { year: number; settings: CalendarSettings }) {
  const holidayLabel = settings.showHolidays && isSupportedHolidayYear(year)
    ? settings.holidayCountry === "ca" ? "Canadian federal holidays" : "U.S. federal holidays"
    : settings.showHolidays ? "Holiday dates unavailable for this year" : "No holidays";
  return (
    <section className="year-downloads no-print" aria-label={`${year} calendar PDF downloads`}>
      <div className="year-download-grid">
        <article className="year-download-card">
          <span className="page-kicker">The whole year, together</span>
          <h2>Year on one page</h2>
          <p>A clear view of all twelve months for your wall, desk, or planner.</p>
          <a className="button button-ink" href={calendarPdfHref(year, settings, "year")} onClick={() => reportTelemetry("export", { format: "pdf", surface: "calendar", placement: "year_one_page" })}>
            <Download size={16} /> Download 1-page PDF
          </a>
        </article>
        <article className="year-download-card">
          <span className="page-kicker">More room for your plans</span>
          <h2>12 monthly pages</h2>
          <p>One month per sheet, with larger day boxes for writing things down.</p>
          <a className="button button-ghost" href={calendarPdfHref(year, settings, "monthly")} onClick={() => reportTelemetry("export", { format: "pdf", surface: "calendar", placement: "year_monthly_pack" })}>
            <Download size={16} /> Download 12-page PDF
          </a>
        </article>
      </div>
      <p className="year-download-settings">{settings.firstDayOfWeek === 1 ? "Monday" : "Sunday"} start · {holidayLabel} · {settings.paper === "a4" ? "A4" : "US Letter"} · {settings.orientation === "landscape" ? "Landscape" : "Portrait"}. Change these settings below.</p>
    </section>
  );
}
