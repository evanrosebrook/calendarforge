import type { Metadata } from "next";
import { CalendarBuilderToolbar } from "@/components/calendar-builder-toolbar";
import { CalendarGrid } from "@/components/calendar-grid";
import { createBuilderCalendars, parseBuilderState } from "@/lib/builder";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Custom Calendar Maker",
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
          <h2 id="builder-about">One link, your complete calendar</h2>
          <p>Calendar settings and date notes are encoded in the share link. Nothing requires an account, and note text is excluded from telemetry and advertising. PDF and spreadsheet downloads use the same date range you see above.</p>
        </section>
      </div>
    </main>
  );
}
