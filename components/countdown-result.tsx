import Link from "next/link";
import { calculateDateDifference, formatCalendarDate } from "@/lib/date-calculators";
import { toIsoDate } from "@/lib/calendar";

type Props = {
  start: Date;
  target: Date;
  calculatorHref?: string;
};

export function CountdownResult({ start, target, calculatorHref }: Props) {
  const result = calculateDateDifference(start, target);
  const directionLabel = result.direction > 0
    ? "Time until the target date"
    : result.direction < 0
      ? "Time since the target date"
      : "The target date is today";
  const headline = result.direction === 0
    ? "Today"
    : `${pluralize(result.totalDays, "day")} ${result.direction < 0 ? "ago" : "to go"}`;

  return (
    <section className="calculator-results" aria-live="polite">
      <span className="result-kicker">{directionLabel}</span>
      <h2>{headline}</h2>
      <p className="result-summary">From <strong>{formatCalendarDate(start)}</strong> to <strong>{formatCalendarDate(target)}</strong>.</p>
      <div className="metric-grid">
        <Metric label="Calendar-day distance" value={result.totalDays.toLocaleString("en-US")} />
        <Metric label="Full weeks and days" value={`${result.weeks.toLocaleString("en-US")}w ${result.remainingDays}d`} />
        <Metric label="Monday–Friday weekdays" value={result.weekdays.toLocaleString("en-US")} />
      </div>
      <p className="calculation-note">Calendar-day distance is absolute: it excludes the earlier date and includes the later date. Weekdays use the same endpoints, count Monday through Friday, and do not remove holidays.</p>
      <div className="result-actions no-print">
        <Link className="button button-ghost" href={`/date/${toIsoDate(target)}`}>Open target date</Link>
        {calculatorHref && <Link className="button button-ghost" href={calculatorHref}>Change the dates</Link>}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function pluralize(value: number, unit: string): string {
  return `${value.toLocaleString("en-US")} ${unit}${value === 1 ? "" : "s"}`;
}
