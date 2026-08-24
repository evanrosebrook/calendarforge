import type { Metadata } from "next";
import { CalculatorResultTelemetry } from "@/components/calculator-result-telemetry";
import { ShiftCalendarToolbar } from "@/components/shift-calendar-toolbar";
import { ShiftMiniCalendar } from "@/components/shift-mini-calendar";
import { createShiftCalendar, parseShiftCalendarState } from "@/lib/shift-calendar";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Shift Calendar Generator",
  description: "Generate a repeating work shift calendar with 4-on/4-off, 2-on/2-off, 7-on/7-off, or custom rotations. Preview, print, share, or export to ICS and CSV.",
  alternates: { canonical: "/shift-calendar" },
};

type Props = { searchParams: Promise<SearchParams> };

export default async function ShiftCalendarPage({ searchParams }: Props) {
  const params = await searchParams;
  const state = parseShiftCalendarState(params);
  const schedule = createShiftCalendar(state);
  const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const formatDate = (date: string) => dateFormatter.format(new Date(`${date}T00:00:00Z`));

  return (
    <main className="calendar-page shift-page">
      <style>{"@page { size: letter landscape; margin: .35in; }"}</style>
      {Object.keys(params).length > 0 && <CalculatorResultTelemetry surface="shift_calendar" />}
      <div className="shell">
        <div className="page-title-row builder-title-row">
          <div>
            <span className="page-kicker">Shift calendar generator</span>
            <h1>{state.workDays} on / {state.offDays} off shift calendar</h1>
            <p>Set the first day of your work block, choose a repeating rotation, and get a clean schedule you can print, share, or add to another calendar.</p>
          </div>
        </div>

        <div className="calendar-workspace builder-workspace shift-workspace">
          <ShiftCalendarToolbar state={state} />
          <div className="calendar-stage shift-stage">
            <section className="fiscal-summary shift-summary no-print" aria-label="Shift calendar summary">
              <div><span>Schedule range</span><strong>{formatDate(schedule.startDate)} – {formatDate(schedule.endDate)}</strong></div>
              <div><span>Rotation</span><strong>{state.workDays} on / {state.offDays} off</strong></div>
              <div><span>Work days</span><strong>{schedule.workDayCount}</strong></div>
              <div><span>Off days</span><strong>{schedule.offDayCount}</strong></div>
            </section>

            <article className="calendar-sheet shift-overview" aria-label={`${state.workDays} on, ${state.offDays} off shift calendar`}>
              <header className="shift-overview-heading">
                <div><span>Repeating rotation</span><h2>{state.workDays} on / {state.offDays} off</h2></div>
                <p>{formatDate(schedule.startDate)} – {formatDate(schedule.endDate)}</p>
              </header>
              <div className="shift-legend"><span><i className="shift-work" /> Work</span><span><i className="shift-off" /> Off</span></div>
              <div className={`shift-month-grid range-${state.monthCount}`}>
                {schedule.sheets.map((sheet) => <ShiftMiniCalendar key={`${sheet.calendar.year}-${sheet.calendar.month}`} sheet={sheet} startDate={state.startDate} />)}
              </div>
              <p className="source-mark">Made with Calendar Forge</p>
            </article>
          </div>
        </div>

        <section className="builder-copy no-print" aria-labelledby="shift-about">
          <span className="page-kicker">How the generator works</span>
          <h2 id="shift-about">One start date, one repeating cycle</h2>
          <p>Your start date is cycle day one and always begins a work block. Calendar Forge repeats the selected work and off blocks through the preview range. The settings remain in the share link; no account or stored roster is required.</p>
        </section>
      </div>
    </main>
  );
}
