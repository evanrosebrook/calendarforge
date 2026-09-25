import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorResultTelemetry } from "@/components/calculator-result-telemetry";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { addUtcDays, toIsoDate } from "@/lib/calendar";
import { calculateDateDifference, formatCalendarDate, parseIsoCalendarDate } from "@/lib/date-calculators";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Days Between Dates Calculator — Count Days & Weekdays",
  description: "Count exact days between two dates, with weekday and weekend totals, full weeks, calendar years and months, and optional inclusive endpoints.",
  alternates: { canonical: "/date-calculator/days-between" },
};

type Props = { searchParams: Promise<SearchParams> };

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function durationLabel(duration: { years: number; months: number; days: number }): string {
  const parts = [
    duration.years ? `${duration.years} ${duration.years === 1 ? "year" : "years"}` : "",
    duration.months ? `${duration.months} ${duration.months === 1 ? "month" : "months"}` : "",
    duration.days || (!duration.years && !duration.months) ? `${duration.days} ${duration.days === 1 ? "day" : "days"}` : "",
  ].filter(Boolean);
  return parts.join(", ");
}

function calendarHref(date: Date): string {
  return `/calendar/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}`;
}

export default async function DaysBetweenPage({ searchParams }: Props) {
  const params = await searchParams;
  const today = new Date();
  const defaultStart = toIsoDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())));
  const defaultEnd = toIsoDate(addUtcDays(parseIsoCalendarDate(defaultStart)!, 30));
  const quickRanges = [7, 30, 90].map((days) => ({
    label: `Next ${days} days`,
    href: `/date-calculator/days-between?start=${defaultStart}&end=${toIsoDate(addUtcDays(parseIsoCalendarDate(defaultStart)!, days))}`,
  }));
  quickRanges.push({
    label: "Through year end",
    href: `/date-calculator/days-between?start=${defaultStart}&end=${today.getUTCFullYear()}-12-31`,
  });
  const startValue = valueOf(params.start) ?? defaultStart;
  const endValue = valueOf(params.end) ?? defaultEnd;
  const inclusive = valueOf(params.inclusive) === "1";
  const start = parseIsoCalendarDate(startValue);
  const end = parseIsoCalendarDate(endValue);
  const result = start && end ? calculateDateDifference(start, end, inclusive) : null;
  const submitted = params.start !== undefined || params.end !== undefined;

  return (
    <main className="calculator-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: "Date calculators", path: "/date-calculator" },
        { name: "Days between dates", path: "/date-calculator/days-between" },
      ]} />
      <div className="shell calculator-shell">
        <div className="calculator-hero-row">
          <header className="calculator-hero compact">
            <span className="page-kicker">Date-to-date calculator</span>
            <h1>Days between dates</h1>
            <p>Count the exact distance between two Gregorian calendar dates. Weekdays mean Monday through Friday and do not exclude holidays.</p>
          </header>
          <PageActions />
        </div>
        <nav className="date-range-shortcuts no-print" aria-label="Common date ranges">
          <span>Quick ranges from today</span>
          <div>{quickRanges.map(({ label, href }) => <Link key={label} className="button button-ghost" href={href}>{label}</Link>)}</div>
        </nav>
        <div className="calculator-workspace">
          <form className="calculator-form" action="/date-calculator/days-between" method="get">
            <div className="calculator-field"><label htmlFor="start-date">Start date</label><input id="start-date" name="start" type="date" min="0001-01-01" max="9999-12-31" defaultValue={startValue} required /></div>
            <div className="calculator-field"><label htmlFor="end-date">End date</label><input id="end-date" name="end" type="date" min="0001-01-01" max="9999-12-31" defaultValue={endValue} required /></div>
            <label className="calculator-check"><input name="inclusive" type="checkbox" value="1" defaultChecked={inclusive} /><span>Count both start and end dates</span></label>
            <button className="button button-ink" type="submit">Calculate difference</button>
          </form>

          <section className="calculator-results" aria-live="polite">
            {!result ? <div className="calculator-error"><strong>Enter two valid dates.</strong><p>Dates must use the Gregorian calendar and fall between years 0001 and 9999.</p></div> : <>
              {submitted && <CalculatorResultTelemetry surface="days_between" />}
              <span className="result-kicker">{result.direction < 0 ? "The end date comes before the start date" : inclusive ? "Counting both endpoints" : "Excluding the start date"}</span>
              <h2>{result.totalDays.toLocaleString("en-US")} {result.totalDays === 1 ? "day" : "days"}</h2>
              <p className="result-summary">From <strong>{formatCalendarDate(start!)}</strong> to <strong>{formatCalendarDate(end!)}</strong>.</p>
              <div className="metric-grid days-between-metric-grid">
                <Metric label="Monday–Friday weekdays" value={result.weekdays.toLocaleString("en-US")} />
                <Metric label="Weekend days" value={result.weekendDays.toLocaleString("en-US")} />
                <Metric label="Weeks and days" value={`${result.weeks.toLocaleString("en-US")}w ${result.remainingDays}d`} />
                <Metric label="Calendar span" value={durationLabel(result.duration)} />
              </div>
              <p className="calculation-note">{inclusive ? "Inclusive mode counts every date from the earlier endpoint through the later endpoint." : "Standard mode excludes the earlier endpoint and includes the later endpoint."} Reversed inputs keep the same absolute counts and are identified above.</p>
              <div className="result-actions no-print">
                <Link className="button button-ghost" href={calendarHref(start!)}>Start month</Link>
                <Link className="button button-ghost" href={calendarHref(end!)}>End month</Link>
              </div>
            </>}
          </section>
        </div>
        <section className="calculator-explainer no-print">
          <div><span className="page-kicker">Counting rules</span><h2>How the date difference is calculated</h2></div>
          <div className="calculator-explainer-grid">
            <article><h3>Standard counting</h3><p>The start date is excluded and the end date is included. March 1 to March 8 is therefore seven days—the amount of time that passes between the two dates.</p></article>
            <article><h3>Inclusive counting</h3><p>Turn on inclusive mode when both boundary dates belong in the count. March 1 through March 8 becomes eight days, which is useful for attendance, bookings, and event schedules.</p></article>
            <article><h3>Monday–Friday weekdays</h3><p>The weekday total counts Mondays through Fridays, but not public holidays. For holiday-aware deadlines, use the <Link href="/date-calculator/business-days">business-days calculator</Link>.</p></article>
            <article><h3>Calendar span</h3><p>The years, months, and days result advances through the calendar instead of treating every month as a fixed length. That is why it complements rather than replaces the exact day total.</p></article>
            <article><h3>Whole calendar dates</h3><p>Calculations use whole Gregorian dates in UTC. Daylight-saving changes therefore cannot turn a date-to-date count into a 23- or 25-hour day.</p></article>
            <article><h3>Reversed dates</h3><p>If the end date comes first, the calculator identifies the reversed direction and keeps the totals positive. You can compare the same two dates without rearranging them.</p></article>
            <article><h3>Choose the next calculation</h3><p>Start with <Link href="/today">today’s date</Link>, calculate an <Link href="/date-calculator/age">exact age</Link>, or <Link href="/date-calculator/add-subtract">find the date before or after a duration</Link>.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}
