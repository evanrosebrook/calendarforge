import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorNav } from "@/components/calculator-nav";
import { addUtcDays, toIsoDate } from "@/lib/calendar";
import { calculateDateDifference, formatCalendarDate, parseIsoCalendarDate } from "@/lib/date-calculators";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Days Between Dates Calculator",
  description: "Calculate calendar days, weekdays, weeks, and calendar duration between two dates with clear endpoint rules.",
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
  const startValue = valueOf(params.start) ?? defaultStart;
  const endValue = valueOf(params.end) ?? defaultEnd;
  const inclusive = valueOf(params.inclusive) === "1";
  const start = parseIsoCalendarDate(startValue);
  const end = parseIsoCalendarDate(endValue);
  const result = start && end ? calculateDateDifference(start, end, inclusive) : null;

  return (
    <main className="calculator-page">
      <div className="shell calculator-shell">
        <CalculatorNav current="/date-calculator/days-between" />
        <header className="calculator-hero compact">
          <span className="page-kicker">Date-to-date calculator</span>
          <h1>Days between dates</h1>
          <p>Count the distance between two Gregorian calendar dates. Weekdays mean Monday through Friday and do not exclude holidays.</p>
        </header>
        <div className="calculator-workspace">
          <form className="calculator-form" action="/date-calculator/days-between" method="get">
            <div className="calculator-field"><label htmlFor="start-date">Start date</label><input id="start-date" name="start" type="date" min="0001-01-01" max="9999-12-31" defaultValue={startValue} required /></div>
            <div className="calculator-field"><label htmlFor="end-date">End date</label><input id="end-date" name="end" type="date" min="0001-01-01" max="9999-12-31" defaultValue={endValue} required /></div>
            <label className="calculator-check"><input name="inclusive" type="checkbox" value="1" defaultChecked={inclusive} /><span>Count both start and end dates</span></label>
            <button className="button button-ink" type="submit">Calculate difference</button>
          </form>

          <section className="calculator-results" aria-live="polite">
            {!result ? <div className="calculator-error"><strong>Enter two valid dates.</strong><p>Dates must use the Gregorian calendar and fall between years 0001 and 9999.</p></div> : <>
              <span className="result-kicker">{result.direction < 0 ? "The end date comes before the start date" : inclusive ? "Counting both endpoints" : "Excluding the start date"}</span>
              <h2>{result.totalDays.toLocaleString("en-US")} {result.totalDays === 1 ? "day" : "days"}</h2>
              <p className="result-summary">From <strong>{formatCalendarDate(start!)}</strong> to <strong>{formatCalendarDate(end!)}</strong>.</p>
              <div className="metric-grid">
                <Metric label="Monday–Friday weekdays" value={result.weekdays.toLocaleString("en-US")} />
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
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}
