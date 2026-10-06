import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorResultTelemetry } from "@/components/calculator-result-telemetry";
import { PayPeriodCalendarToolbar } from "@/components/pay-period-calendar-toolbar";
import { PayPeriodMiniCalendar } from "@/components/pay-period-mini-calendar";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { createPayPeriodCalendar, parsePayPeriodCalendarState } from "@/lib/pay-period-calendar";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Biweekly Pay Period Calendar Generator",
  description: "Generate a biweekly pay-period calendar from one known payday. See pay periods, adjusted paydays, three-paycheck months, and export to print, ICS, or CSV.",
  alternates: { canonical: "/pay-period-calendar" },
};

type Props = { searchParams: Promise<SearchParams> };

export default async function PayPeriodCalendarPage({ searchParams }: Props) {
  const params = await searchParams;
  const state = parsePayPeriodCalendarState(params);
  const schedule = createPayPeriodCalendar(state);
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const formatDate = (date: string) => formatter.format(new Date(`${date}T00:00:00Z`));
  const threePaycheckLabel = schedule.threePaycheckMonths.length
    ? schedule.threePaycheckMonths.map((month) => month.label).join(" and ")
    : "None in this cycle";

  return (
    <main className="calendar-page pay-period-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: "Biweekly pay-period calendar", path: "/pay-period-calendar" },
      ]} />
      <style>{"@page { size: letter landscape; margin: .35in; }"}</style>
      {Object.keys(params).length > 0 && <CalculatorResultTelemetry surface="pay_period" />}
      <div className="shell">
        <div className="page-title-row builder-title-row">
          <div>
            <span className="page-kicker">Biweekly pay-period calendar</span>
            <h1>{state.year} pay-period calendar</h1>
            <p>Start with one known payday to map every 14-day pay period, see three-paycheck months, adjust dates around weekends and U.S. federal holidays, and export the schedule without an account.</p>
          </div>
        </div>

        <div className="calendar-workspace builder-workspace pay-period-workspace">
          <PayPeriodCalendarToolbar state={state} />
          <div className="calendar-stage pay-period-stage">
            <section className="fiscal-summary pay-period-summary no-print" aria-label="Pay-period calendar summary">
              <div><span>Known payday</span><strong>{formatDate(state.knownPayday)}</strong></div>
              <div><span>Paydays in {state.year}</span><strong>{schedule.payPeriods.length}</strong></div>
              <div><span>Three-paycheck months</span><strong>{threePaycheckLabel}</strong></div>
              <div><span>Period length</span><strong>14 calendar days</strong></div>
            </section>

            <article className="calendar-sheet pay-period-overview" aria-label={`${state.year} biweekly payday calendar`}>
              <header className="pay-period-overview-heading">
                <div><span>Biweekly payroll overview</span><h2>{state.year} paydays</h2></div>
                <p>{schedule.payPeriods.length} paydays · anchor {formatDate(state.knownPayday)}</p>
              </header>
              <div className="pay-period-legend">
                <span><i className="pay-period-swatch" /> Payday</span>
                <span><i className="pay-period-swatch adjusted" /> Adjusted payday</span>
                <span><i className="pay-period-swatch holiday" /> Federal holiday</span>
              </div>
              <div className="pay-period-month-grid">
                {schedule.calendars.map((calendar) => (
                  <PayPeriodMiniCalendar
                    key={calendar.month}
                    calendar={calendar}
                    payDateNumbers={schedule.payDateNumbers}
                    adjustedPayDates={schedule.adjustedPayDates}
                  />
                ))}
              </div>
              <p className="source-mark">Made with Calendar Forge</p>
            </article>

            <section className="pay-period-table-panel" aria-labelledby="pay-period-table-heading">
              <div className="fiscal-period-heading">
                <div><span className="page-kicker">Pay-period schedule</span><h2 id="pay-period-table-heading">Every period and payday</h2></div>
                <p>Adjusted dates use the selected planning rule. Your employer’s processing calendar remains authoritative.</p>
              </div>
              <div className="table-scroll">
                <table className="pay-period-table">
                  <thead><tr><th scope="col">Period</th><th scope="col">Starts</th><th scope="col">Ends</th><th scope="col">Scheduled payday</th><th scope="col">Payday</th><th scope="col">Status</th></tr></thead>
                  <tbody>
                    {schedule.payPeriods.map((period) => (
                      <tr key={period.number}>
                        <td>{period.number}</td>
                        <td>{formatDate(period.periodStart)}</td>
                        <td>{formatDate(period.periodEnd)}</td>
                        <td>{formatDate(period.scheduledPayDate)}</td>
                        <td>{formatDate(period.payDate)}</td>
                        <td><span className={`payday-status ${period.adjusted ? "adjusted" : ""}`}>{period.adjusted ? "Adjusted" : "Scheduled"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <section className="builder-copy no-print" aria-labelledby="pay-period-about">
          <span className="page-kicker">How the generator works</span>
          <h2 id="pay-period-about">One real payday anchors the whole year</h2>
          <p>Calendar Forge moves forward and backward in exact 14-day steps from the known payday. The payroll lag sets each period’s ending date; the starting date is thirteen days earlier.</p>
          <div className="builder-copy-grid">
            <article><h3>Find three-paycheck months</h3><p>A biweekly cycle usually produces 26 paydays, but the way dates fall can create months with three checks and, occasionally, a 27th payday in a year.</p></article>
            <article><h3>Model holiday handling</h3><p>Choose whether a weekend or U.S. federal holiday moves the payday earlier, later, or not at all. This is a planning rule, not payroll or banking advice.</p></article>
            <article><h3>Use the schedule elsewhere</h3><p>Print or save a PDF, add paydays to Apple, Google, or Outlook Calendar with ICS, or use CSV for a spreadsheet and budget plan.</p></article>
            <article><h3>Keep dates private</h3><p>No account is required. The shared URL contains only calendar settings—not earnings, employer details, or other payroll information.</p></article>
            <article><h3>Check business days</h3><p>Need to count working days around a payroll cutoff? Use the <Link href="/date-calculator/business-days">business-day calculator</Link> with U.S. federal holidays.</p></article>
            <article><h3>Build another calendar</h3><p>For holidays, notes, and custom printable ranges, open the <Link href="/make-calendar">custom calendar maker</Link>.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
