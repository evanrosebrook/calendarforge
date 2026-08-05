import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorNav } from "@/components/calculator-nav";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import {
  calculateBusinessDaysBetween,
  MAX_BUSINESS_DAY_RANGE_DAYS,
  parseBusinessDayRegion,
  shiftBusinessDays,
  type BusinessDayEntry,
  type BusinessDayRegion,
  type BusinessDaySummary,
} from "@/lib/business-days";
import {
  MAX_SUPPORTED_HOLIDAY_YEAR,
  MIN_SUPPORTED_HOLIDAY_YEAR,
  addUtcDays,
  getHolidayCatalog,
  toIsoDate,
  utcDate,
} from "@/lib/calendar";
import { formatCalendarDate, parseIsoCalendarDate } from "@/lib/date-calculators";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Business Days Calculator — Count or Add Workdays",
  description: "Count business days between dates or add and subtract workdays. Exclude weekends and verified U.S. or Canadian national holidays.",
  alternates: { canonical: "/date-calculator/business-days" },
};

type Props = { searchParams: Promise<SearchParams> };
type Mode = "between" | "shift";

export default async function BusinessDaysPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const today = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  const mode: Mode = valueOf(params.mode) === "shift" ? "shift" : "between";
  const region = parseBusinessDayRegion(valueOf(params.region));

  return (
    <main className="calculator-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: "Date calculators", path: "/date-calculator" },
        { name: "Business days calculator", path: "/date-calculator/business-days" },
      ]} />
      <div className="shell calculator-shell">
        <CalculatorNav current="/date-calculator/business-days" />
        <div className="calculator-hero-row">
          <header className="calculator-hero compact">
            <span className="page-kicker">Working-day arithmetic</span>
            <h1>Business days calculator</h1>
            <p>Count workdays between two dates or move a deadline by business days. Weekends and verified U.S. or Canadian national holidays can be excluded automatically.</p>
          </header>
          <PageActions />
        </div>

        <nav className="calculator-mode-nav no-print" aria-label="Business day calculation mode">
          <Link className={mode === "between" ? "active" : ""} href="/date-calculator/business-days?mode=between">Between two dates</Link>
          <Link className={mode === "shift" ? "active" : ""} href="/date-calculator/business-days?mode=shift">Add or subtract workdays</Link>
        </nav>

        {mode === "between"
          ? <BetweenCalculator params={params} region={region} today={today} />
          : <ShiftCalculator params={params} region={region} today={today} />}

        <section className="calculator-explainer no-print">
          <div><span className="page-kicker">Counting rules</span><h2>What counts as a business day?</h2></div>
          <div className="calculator-explainer-grid">
            <article><h3>Weekdays</h3><p>Monday through Friday count unless the selected holiday calendar marks the date as a national holiday.</p></article>
            <article><h3>Observed holidays</h3><p>When a fixed holiday falls on a weekend, its cataloged weekday observance is excluded. The weekend date remains classified as a weekend.</p></article>
            <article><h3>Endpoints</h3><p>Between-date mode lets you include or exclude each endpoint. Add/subtract mode excludes the starting date unless you choose to count it.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}

function BetweenCalculator({ params, region, today }: { params: SearchParams; region: BusinessDayRegion; today: Date }) {
  const submitted = valueOf(params.submitted) === "1";
  const startValue = valueOf(params.start) ?? toIsoDate(today);
  const endValue = valueOf(params.end) ?? toIsoDate(addUtcDays(today, 30));
  const includeStart = submitted ? valueOf(params.includeStart) === "1" : true;
  const includeEnd = submitted ? valueOf(params.includeEnd) === "1" : true;
  const start = parseIsoCalendarDate(startValue);
  const end = parseIsoCalendarDate(endValue);
  const result = start && end ? calculateBusinessDaysBetween(start, end, region, includeStart, includeEnd) : null;
  const reversed = Boolean(start && end && end.getTime() < start.getTime());
  const rangeTooLarge = Boolean(start && end && !reversed && (end.getTime() - start.getTime()) / 86_400_000 > MAX_BUSINESS_DAY_RANGE_DAYS);
  const outsideHolidayRange = Boolean(start && end && region !== "weekends" && (
    start.getUTCFullYear() < MIN_SUPPORTED_HOLIDAY_YEAR
      || end.getUTCFullYear() > MAX_SUPPORTED_HOLIDAY_YEAR
  ));

  return (
    <div className="calculator-workspace">
      <form className="calculator-form" action="/date-calculator/business-days" method="get">
        <input name="mode" type="hidden" value="between" />
        <input name="submitted" type="hidden" value="1" />
        <DateField id="business-start" name="start" label="Start date" region={region} value={startValue} />
        <DateField id="business-end" name="end" label="End date" region={region} value={endValue} />
        <RegionField region={region} />
        <label className="calculator-check"><input name="includeStart" type="checkbox" value="1" defaultChecked={includeStart} /><span>Count the start date when it is a business day</span></label>
        <label className="calculator-check"><input name="includeEnd" type="checkbox" value="1" defaultChecked={includeEnd} /><span>Count the end date when it is a business day</span></label>
        <button className="button button-ink" type="submit">Count business days</button>
      </form>

      <section className="calculator-results business-day-results" aria-live="polite">
        {!start || !end
          ? <CalculatorError title="Enter two valid dates." copy={`Dates must fall between ${MIN_SUPPORTED_HOLIDAY_YEAR} and ${MAX_SUPPORTED_HOLIDAY_YEAR} when using a holiday calendar.`} />
          : reversed
            ? <CalculatorError title="The end date comes before the start date." copy="Move the end date forward, or use add/subtract mode to calculate backward." />
            : rangeTooLarge
              ? <CalculatorError title="This range is too large to calculate safely." copy={`Choose dates no more than ${MAX_BUSINESS_DAY_RANGE_DAYS.toLocaleString("en-US")} calendar days apart.`} />
            : outsideHolidayRange
              ? <CalculatorError title="Holiday data is unavailable for part of this range." copy={`Choose dates from ${MIN_SUPPORTED_HOLIDAY_YEAR} through ${MAX_SUPPORTED_HOLIDAY_YEAR}, or select Weekends only.`} />
              : result && <>
                <span className="result-kicker">Workdays in this range</span>
                <h2>{pluralize(result.businessDays, "business day")}</h2>
                <p className="result-summary">From <strong>{formatCalendarDate(start)}</strong> through <strong>{formatCalendarDate(end)}</strong>. {endpointSummary(includeStart, includeEnd)}</p>
                <ResultMetrics summary={result} />
                <BusinessDayTrail entries={result.entries} />
                <ResultLinks start={start} end={end} region={region} />
              </>}
      </section>
    </div>
  );
}

function ShiftCalculator({ params, region, today }: { params: SearchParams; region: BusinessDayRegion; today: Date }) {
  const dateValue = valueOf(params.date) ?? toIsoDate(today);
  const amountValue = valueOf(params.days) ?? "10";
  const amount = parseShiftAmount(amountValue);
  const direction = valueOf(params.direction) === "subtract" ? "subtract" : "add";
  const includeStart = valueOf(params.includeStart) === "1";
  const start = parseIsoCalendarDate(dateValue);
  const result = start && amount !== null ? shiftBusinessDays(start, amount, direction, region, includeStart) : null;
  const outsideHolidayRange = Boolean(start && region !== "weekends" && (
    start.getUTCFullYear() < MIN_SUPPORTED_HOLIDAY_YEAR
      || start.getUTCFullYear() > MAX_SUPPORTED_HOLIDAY_YEAR
      || (amount !== null && !result)
  ));

  return (
    <div className="calculator-workspace">
      <form className="calculator-form" action="/date-calculator/business-days" method="get">
        <input name="mode" type="hidden" value="shift" />
        <DateField id="business-base" name="date" label="Starting date" region={region} value={dateValue} />
        <div className="calculator-field"><label htmlFor="business-direction">Operation</label><select id="business-direction" name="direction" defaultValue={direction}><option value="add">Add business days</option><option value="subtract">Subtract business days</option></select></div>
        <div className="calculator-field"><label htmlFor="business-amount">Number of business days</label><input id="business-amount" name="days" type="number" min="0" max="9999" step="1" defaultValue={amountValue} required /></div>
        <RegionField region={region} />
        <label className="calculator-check"><input name="includeStart" type="checkbox" value="1" defaultChecked={includeStart} /><span>Count the starting date when it is a business day</span></label>
        <button className="button button-ink" type="submit">Calculate deadline</button>
      </form>

      <section className="calculator-results business-day-results" aria-live="polite">
        {!start || amount === null
          ? <CalculatorError title="Enter a valid date and business-day amount." copy="The amount must be a whole number from 0 through 9,999." />
          : outsideHolidayRange
            ? <CalculatorError title="The calculation leaves the verified holiday range." copy={`Reduce the shift, choose dates from ${MIN_SUPPORTED_HOLIDAY_YEAR} through ${MAX_SUPPORTED_HOLIDAY_YEAR}, or select Weekends only.`} />
            : result && <>
              <span className="result-kicker">Calculated business date</span>
              <h2>{formatCalendarDate(result.target)}</h2>
              <p className="result-summary">{direction === "add" ? "Adding" : "Subtracting"} <strong>{pluralize(amount, "business day")}</strong> {direction === "add" ? "to" : "from"} {formatCalendarDate(start)}. The starting date {includeStart ? "can count as day one" : "is not counted"}.</p>
              <ResultMetrics summary={result} />
              <BusinessDayTrail entries={result.entries} />
              <ResultLinks start={start} end={result.target} region={region} />
            </>}
      </section>
    </div>
  );
}

function DateField({ id, name, label, region, value }: { id: string; name: string; label: string; region: BusinessDayRegion; value: string }) {
  const min = region === "weekends" ? "0001-01-01" : `${MIN_SUPPORTED_HOLIDAY_YEAR}-01-01`;
  const max = region === "weekends" ? "9999-12-31" : `${MAX_SUPPORTED_HOLIDAY_YEAR}-12-31`;
  return <div className="calculator-field"><label htmlFor={id}>{label}</label><input id={id} name={name} type="date" min={min} max={max} defaultValue={value} required /></div>;
}

function RegionField({ region }: { region: BusinessDayRegion }) {
  return <div className="calculator-field"><label htmlFor="business-region">Days to exclude</label><select id="business-region" name="region" defaultValue={region}><option value="us">U.S. weekends and federal holidays</option><option value="ca">Canadian weekends and federal holidays</option><option value="weekends">Weekends only</option></select></div>;
}

function ResultMetrics({ summary }: { summary: BusinessDaySummary }) {
  return <div className="metric-grid business-metric-grid"><Metric label="Business days" value={summary.businessDays} /><Metric label="Weekend days" value={summary.weekendDays} /><Metric label="Holiday weekdays" value={summary.holidayDays} /><Metric label="Calendar dates checked" value={summary.calendarDays} /></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><strong>{value.toLocaleString("en-US")}</strong></div>;
}

function BusinessDayTrail({ entries }: { entries: BusinessDayEntry[] }) {
  if (!entries.length) return <p className="calculation-note">No calendar dates need to be traversed for this result.</p>;
  const preview: Array<BusinessDayEntry | null> = entries.length <= 31
    ? entries
    : [...entries.slice(0, 15), null, ...entries.slice(-15)];
  return <div className="business-day-trail"><div className="business-day-trail-heading"><strong>Dates checked</strong><span><i className="business-swatch business" /> Workday <i className="business-swatch weekend" /> Weekend <i className="business-swatch holiday" /> Holiday</span></div><div className="business-day-cells">{preview.map((entry, index) => entry
    ? <Link className={`business-day-cell ${entry.status}`} href={`/date/${entry.isoDate}`} key={entry.isoDate} title={entry.holidayNames.join(", ") || statusLabel(entry.status)}><span>{new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(entry.date)}</span><strong>{entry.date.getUTCDate()}</strong><small>{new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(entry.date)}</small></Link>
    : <span className="business-day-gap" key={`gap-${index}`}>…</span>)}</div></div>;
}

function ResultLinks({ start, end, region }: { start: Date; end: Date; region: BusinessDayRegion }) {
  const catalog = region === "weekends" ? undefined : getHolidayCatalog(region);
  return <div className="result-actions no-print"><Link className="button button-ghost" href={`/date/${toIsoDate(start)}`}>Open start date</Link><Link className="button button-ghost" href={`/date/${toIsoDate(end)}`}>Open result date</Link>{catalog && <Link className="button button-ghost" href={`/holidays/${catalog.slug}/${end.getUTCFullYear()}`}>View {catalog.demonym} holidays</Link>}</div>;
}

function CalculatorError({ title, copy }: { title: string; copy: string }) {
  return <div className="calculator-error"><strong>{title}</strong><p>{copy}</p></div>;
}

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseShiftAmount(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount <= 9999 ? amount : null;
}

function pluralize(value: number, unit: string): string {
  return `${value.toLocaleString("en-US")} ${unit}${value === 1 ? "" : "s"}`;
}

function endpointSummary(includeStart: boolean, includeEnd: boolean): string {
  if (includeStart && includeEnd) return "Both endpoints are eligible to count.";
  if (!includeStart && !includeEnd) return "Neither endpoint is counted.";
  return includeStart ? "The start date is eligible to count; the end date is excluded." : "The start date is excluded; the end date is eligible to count.";
}

function statusLabel(status: BusinessDayEntry["status"]): string {
  if (status === "business") return "Business day";
  return status === "weekend" ? "Weekend" : "National holiday";
}
