import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorNav } from "@/components/calculator-nav";
import { toIsoDate, utcDate } from "@/lib/calendar";
import { adjustCalendarDate, calculateDateDifference, formatCalendarDate, parseBoundedAmount, parseIsoCalendarDate, type DateOperation } from "@/lib/date-calculators";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Add or Subtract Dates",
  description: "Add or subtract years, months, weeks, and days from a date with predictable leap-year and month-end rules.",
  alternates: { canonical: "/date-calculator/add-subtract" },
};

type Props = { searchParams: Promise<SearchParams> };

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddSubtractPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const defaultDate = toIsoDate(utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()));
  const dateValue = valueOf(params.date) ?? defaultDate;
  const operation: DateOperation = valueOf(params.operation) === "subtract" ? "subtract" : "add";
  const values = {
    years: parseBoundedAmount(valueOf(params.years), 9998),
    months: parseBoundedAmount(valueOf(params.months), 1200),
    weeks: parseBoundedAmount(valueOf(params.weeks), 9999),
    days: params.days === undefined ? 30 : parseBoundedAmount(valueOf(params.days), 9999),
  };
  const base = parseIsoCalendarDate(dateValue);
  const result = base ? adjustCalendarDate(base, values, operation) : null;
  const totalDays = base && result ? calculateDateDifference(base, result).totalDays : null;

  return (
    <main className="calculator-page">
      <div className="shell calculator-shell">
        <CalculatorNav current="/date-calculator/add-subtract" />
        <header className="calculator-hero compact">
          <span className="page-kicker">Date arithmetic</span>
          <h1>Add or subtract dates</h1>
          <p>Move a date by calendar units. Years are applied first, then months, then weeks and days; invalid month-end dates clamp to that month’s final day.</p>
        </header>
        <div className="calculator-workspace">
          <form className="calculator-form" action="/date-calculator/add-subtract" method="get">
            <div className="calculator-field"><label htmlFor="base-date">Starting date</label><input id="base-date" name="date" type="date" min="0001-01-01" max="9999-12-31" defaultValue={dateValue} required /></div>
            <div className="calculator-field"><label htmlFor="operation">Operation</label><select id="operation" name="operation" defaultValue={operation}><option value="add">Add</option><option value="subtract">Subtract</option></select></div>
            <div className="amount-grid">
              <AmountField name="years" label="Years" value={values.years} max={9998} />
              <AmountField name="months" label="Months" value={values.months} max={1200} />
              <AmountField name="weeks" label="Weeks" value={values.weeks} max={9999} />
              <AmountField name="days" label="Days" value={values.days} max={9999} />
            </div>
            <button className="button button-ink" type="submit">Calculate date</button>
          </form>

          <section className="calculator-results" aria-live="polite">
            {!base ? <div className="calculator-error"><strong>Enter a valid starting date.</strong><p>The supported range is year 0001 through 9999.</p></div> : !result ? <div className="calculator-error"><strong>The result is outside the supported range.</strong><p>Reduce the adjustment so the result remains between years 0001 and 9999.</p></div> : <>
              <span className="result-kicker">Result</span>
              <h2>{formatCalendarDate(result)}</h2>
              <p className="result-summary"><strong>{operation === "add" ? "Added to" : "Subtracted from"}</strong> {formatCalendarDate(base)}.</p>
              <div className="metric-grid">
                <Metric label="ISO date" value={toIsoDate(result)} />
                <Metric label="Weekday" value={new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(result)} />
                <Metric label="Absolute day distance" value={(totalDays ?? 0).toLocaleString("en-US")} />
              </div>
              <p className="calculation-note">Month-end clamping happens after years and again after months. For example, subtracting one month from March 31 lands on February 28 or 29.</p>
              <div className="result-actions no-print"><Link className="button button-ghost" href={`/calendar/${result.getUTCFullYear()}/${result.getUTCMonth() + 1}`}>Open result month</Link></div>
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}

function AmountField({ name, label, value, max }: { name: string; label: string; value: number; max: number }) {
  return <div className="calculator-field"><label htmlFor={`amount-${name}`}>{label}</label><input id={`amount-${name}`} name={name} type="number" min="0" max={max} step="1" defaultValue={value} /></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}
