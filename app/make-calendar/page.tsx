import type { Metadata } from "next";
import { CalendarBuilderToolbar } from "@/components/calendar-builder-toolbar";
import { CalendarGrid } from "@/components/calendar-grid";
import { createBuilderCalendars, parseBuilderState } from "@/lib/builder";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Free Custom Calendar Maker — Print & Export",
  description: "Build a clean 1, 3, 6, or 12-month calendar with holidays, date notes, print layouts, and shareable settings. No account required.",
  alternates: { canonical: "/make-calendar" },
};

type Props = { searchParams: Promise<SearchParams> };

export default async function MakeCalendarPage({ searchParams }: Props) {
  const state = parseBuilderState(await searchParams);
  const calendars = createBuilderCalendars(state);

  return (
    <main className="calendar-page builder-page">
      <style>{`@page { size: ${state.paper} ${state.orientation}; margin: .35in; }`}</style>
      <div className="shell">
        <div className="page-title-row builder-title-row">
          <div>
            <span className="page-kicker">Custom calendar maker</span>
            <h1>Build a calendar for your plans</h1>
            <p>Choose a range, add notes, and print or export it—all without an account.</p>
          </div>
        </div>
        <div className="calendar-workspace builder-workspace">
          <CalendarBuilderToolbar state={state} />
          <div className="calendar-stage builder-stage">
            <div className="builder-range-summary no-print" aria-live="polite"><strong>{calendars.length}</strong> {calendars.length === 1 ? "month" : "months"} · {calendars[0]?.label}{calendars.length > 1 ? ` through ${calendars.at(-1)?.label}` : ""}</div>
            <div className={`builder-sheets range-${state.monthCount}`}>
              {calendars.map((calendar) => (
                <CalendarGrid
                  key={`${calendar.year}-${calendar.month}`}
                  calendar={calendar}
                  compact={state.monthCount > 1}
                  highlightWeekends={state.highlightWeekends}
                  title={state.title}
                  showNotes={state.showNotesArea}
                  dayNotes={state.dayNotes}
                  theme={state.theme}
                />
              ))}
            </div>
          </div>
        </div>
        <section className="builder-copy no-print" aria-labelledby="builder-about">
          <span className="page-kicker">Made to stay useful</span>
          <h2 id="builder-about">Build once, use it anywhere</h2>
          <p>Choose the date range and layout that fit the job, then print, download, or share the exact same calendar. Every option is available without an account.</p>
          <div className="builder-copy-grid">
            <article><h3>Choose the right range</h3><p>Build one, three, six, or twelve consecutive months starting in any month. Switch between Sunday and Monday starts and add week numbers when the schedule depends on numbered weeks.</p></article>
            <article><h3>Prepare a print-ready page</h3><p>Use Letter or A4 paper in portrait or landscape orientation. Weekend shading, a notes area, and three visual themes help the printed calendar match its purpose.</p></article>
            <article><h3>Add holidays and date notes</h3><p>Include U.S. or Canadian national holidays and place short notes on specific dates. Notes appear on the matching calendar day and stay with supported downloads.</p></article>
            <article><h3>Pick a useful file format</h3><p>PDF is ready to print, SVG is suited to design tools, ICS imports calendar events, and CSV or XLSX works well for lists and spreadsheets.</p></article>
            <article><h3>Share the configured calendar</h3><p>The share link contains the selected range, layout, title, and date notes. Someone opening it sees the same configuration and can make their own copy.</p></article>
            <article><h3>Keep control of your plans</h3><p>No account or saved profile is required. Calendar settings live in the URL, while note text is excluded from analytics and advertising telemetry.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
