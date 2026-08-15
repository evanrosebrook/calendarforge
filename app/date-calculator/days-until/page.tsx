import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorResultTelemetry } from "@/components/calculator-result-telemetry";
import { CountdownResult } from "@/components/countdown-result";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { toIsoDate, utcDate } from "@/lib/calendar";
import { getPopularCountdownTargets } from "@/lib/countdown";
import { parseIsoCalendarDate } from "@/lib/date-calculators";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "How Many Days Until? Countdown Calculator",
  description: "Count calendar days, full weeks, and Monday–Friday weekdays until any date with a clear UTC counting rule and shareable result URL.",
  alternates: { canonical: "/date-calculator/days-until" },
};

type Props = { searchParams: Promise<SearchParams> };

export default async function DaysUntilPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const today = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  const startValue = valueOf(params.start) ?? toIsoDate(today);
  const start = parseIsoCalendarDate(startValue);
  const popularTargets = start ? getPopularCountdownTargets(start) : [];
  const defaultTarget = popularTargets.find(({ event }) => event.id === "christmas")?.isoDate ?? "";
  const targetValue = valueOf(params.target) ?? defaultTarget;
  const target = parseIsoCalendarDate(targetValue);
  const submitted = params.start !== undefined || params.target !== undefined;

  return (
    <main className="calculator-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: "Date calculators", path: "/date-calculator" },
        { name: "Days until calculator", path: "/date-calculator/days-until" },
      ]} />
      <div className="shell calculator-shell">
        <div className="calculator-hero-row">
          <header className="calculator-hero compact">
            <span className="page-kicker">Date countdown</span>
            <h1>How many days until?</h1>
            <p>Choose any target date to see its calendar-day distance, full weeks, and Monday–Friday weekdays. Today defaults to the current Gregorian date in UTC.</p>
          </header>
          <PageActions />
        </div>

        {start && <nav className="countdown-shortcuts no-print" aria-label="Popular countdown targets">
          <span>Popular targets from {startValue}</span>
          <div>{popularTargets.map(({ event, isoDate }) => (
            <Link className="button button-ghost button-small" href={`/date-calculator/days-until?start=${startValue}&target=${isoDate}`} key={event.id}>{event.shortLabel} {isoDate.slice(0, 4)}</Link>
          ))}</div>
          <small>Spring and summer shortcuts use meteorological seasons, which begin March 1 and June 1.</small>
        </nav>}

        <div className="calculator-workspace">
          <form className="calculator-form" action="/date-calculator/days-until" method="get">
            <div className="calculator-field"><label htmlFor="countdown-start">Starting date</label><input id="countdown-start" name="start" type="date" min="0001-01-01" max="9999-12-31" defaultValue={startValue} required /></div>
            <div className="calculator-field"><label htmlFor="countdown-target">Target date</label><input id="countdown-target" name="target" type="date" min="0001-01-01" max="9999-12-31" defaultValue={targetValue} required /></div>
            <button className="button button-ink" type="submit">Calculate countdown</button>
          </form>

          {!start || !target
            ? <section className="calculator-results" aria-live="polite"><div className="calculator-error"><strong>Enter two valid dates.</strong><p>Dates must use the Gregorian calendar and fall between years 0001 and 9999.</p></div></section>
            : <>{submitted && <CalculatorResultTelemetry surface="days_until" />}<CountdownResult start={start} target={target} /></>}
        </div>

        <section className="calculator-explainer no-print">
          <div><span className="page-kicker">Counting rules</span><h2>What does the countdown include?</h2></div>
          <div className="calculator-explainer-grid">
            <article><h3>UTC calendar dates</h3><p>The default starting date is today in UTC. Once submitted, both dates stay in the URL so the result can be bookmarked and checked again exactly.</p></article>
            <article><h3>Standard countdown</h3><p>For a future target, today is day zero: the starting date is excluded and the target date is included. Matching dates return zero days.</p></article>
            <article><h3>Past targets</h3><p>A target before the starting date is labeled “ago.” Counts remain positive and use the absolute distance between the two dates.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
