import type { Metadata } from "next";
import { FiscalCalendarToolbar } from "@/components/fiscal-calendar-toolbar";
import { FiscalMiniCalendar } from "@/components/fiscal-mini-calendar";
import { createFiscalCalendar, parseFiscalCalendarState } from "@/lib/fiscal-calendar";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Fiscal Calendar Maker",
  description: "Create a fiscal calendar from your own inclusive start and end dates, with monthly accounting periods, quarters, optional fiscal weeks, holidays, printing, and CSV export.",
  alternates: { canonical: "/fiscal-calendar" },
};

type Props = { searchParams: Promise<SearchParams> };

export default async function FiscalCalendarPage({ searchParams }: Props) {
  const state = parseFiscalCalendarState(await searchParams);
  const fiscal = createFiscalCalendar(state);
  const formatter = new Intl.DateTimeFormat(state.locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const quarterGroups = fiscal.quarters.map((quarter) => ({
    quarter,
    sheets: fiscal.sheets.filter((sheet) => sheet.quarterNumber === quarter.number),
  }));

  return (
    <main className="calendar-page fiscal-page">
      <style>{`@page { size: ${state.paper} ${state.orientation}; margin: .35in; }`}</style>
      <div className="shell">
        <div className="page-title-row builder-title-row">
          <div>
            <span className="page-kicker">Fiscal calendar maker</span>
            <h1>{fiscal.label} fiscal calendar</h1>
            <p>Choose an exact fiscal range. Calendar Forge organizes its calendar months into accounting periods and quarters, while keeping partial first and last periods clear.</p>
          </div>
        </div>

        <div className="calendar-workspace builder-workspace fiscal-workspace">
          <FiscalCalendarToolbar state={state} />
          <div className="calendar-stage fiscal-stage">
            <section className="fiscal-summary no-print" aria-label="Fiscal calendar summary">
              <div><span>Inclusive range</span><strong>{formatDate(state.startDate, formatter)} – {formatDate(state.endDate, formatter)}</strong></div>
              <div><span>Calendar days</span><strong>{fiscal.dayCount}</strong></div>
              <div><span>Fiscal weeks</span><strong>{fiscal.weekCount}{state.showWeekNumbers ? " shown" : ""}</strong></div>
              <div><span>Periods</span><strong>{fiscal.periods.length}</strong></div>
            </section>

            <article className="calendar-sheet fiscal-overview" aria-label={`${fiscal.label} fiscal calendar overview`}>
              <header className="fiscal-overview-heading">
                <div><span>Fiscal year overview</span><h2>{fiscal.label}</h2></div>
                <p>{formatDate(state.startDate, formatter)} – {formatDate(state.endDate, formatter)}</p>
              </header>
              <div className="fiscal-quarter-groups">
                {quarterGroups.map(({ quarter, sheets }) => (
                  <section className="fiscal-quarter-group" key={quarter.number} aria-labelledby={`fiscal-quarter-${quarter.number}`}>
                    <header>
                      <div><span>Quarter</span><h3 id={`fiscal-quarter-${quarter.number}`}>Q{quarter.number}</h3></div>
                      <p>{formatDate(quarter.startDate, formatter)} – {formatDate(quarter.endDate, formatter)}</p>
                    </header>
                    <div className="fiscal-quarter-months">
                      {sheets.map((sheet) => (
                        <FiscalMiniCalendar
                          key={`${sheet.calendar.year}-${sheet.calendar.month}`}
                          sheet={sheet}
                          startDate={state.startDate}
                          endDate={state.endDate}
                          highlightWeekends={state.highlightWeekends}
                          showWeekNumbers={state.showWeekNumbers}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <p className="source-mark">Made with Calendar Forge</p>
            </article>

            <section className="fiscal-period-panel" aria-labelledby="fiscal-periods-heading">
              <div className="fiscal-period-heading">
                <div><span className="page-kicker">Accounting periods</span><h2 id="fiscal-periods-heading">Period schedule</h2></div>
                <p>Each period follows a calendar month. Boundary periods are shortened to the exact fiscal range.</p>
              </div>
              <div className="table-scroll">
                <table className="fiscal-period-table">
                  <thead><tr><th scope="col">Period</th><th scope="col">Quarter</th><th scope="col">Month</th><th scope="col">Starts</th><th scope="col">Ends</th><th scope="col">Coverage</th></tr></thead>
                  <tbody>
                    {fiscal.sheets.map((sheet, index) => {
                      const period = fiscal.periods[index];
                      if (!period) return null;
                      const fullMonthStart = `${sheet.calendar.year}-${String(sheet.calendar.month).padStart(2, "0")}-01`;
                      const fullMonthEnd = `${sheet.calendar.year}-${String(sheet.calendar.month).padStart(2, "0")}-${String(new Date(Date.UTC(sheet.calendar.year, sheet.calendar.month, 0)).getUTCDate()).padStart(2, "0")}`;
                      const partial = period.startDate !== fullMonthStart || period.endDate !== fullMonthEnd;
                      return <tr key={period.number}><td>{sheet.periodLabel}</td><td>{sheet.quarterLabel}</td><td>{sheet.calendar.label}</td><td>{formatDate(period.startDate, formatter)}</td><td>{formatDate(period.endDate, formatter)}</td><td><span className={`period-coverage ${partial ? "partial" : ""}`}>{partial ? "Partial" : "Full month"}</span></td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <section className="builder-copy no-print" aria-labelledby="fiscal-about">
          <span className="page-kicker">How this calendar works</span>
          <h2 id="fiscal-about">Your dates define the fiscal year</h2>
          <p>Both endpoints are included. Each intersecting calendar month becomes one accounting period, beginning with P01, and each group of three periods forms a quarter. The first and last periods may be partial; dates outside the selected range are muted and excluded from CSV output.</p>
        </section>
      </div>
    </main>
  );
}

function formatDate(date: string, formatter: Intl.DateTimeFormat): string {
  return formatter.format(new Date(`${date}T00:00:00Z`));
}
