import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorResultTelemetry } from "@/components/calculator-result-telemetry";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { daysInMonth, toIsoDate, utcDate } from "@/lib/calendar";
import { calculateAge, formatCalendarDate, parseIsoCalendarDate, type CalendarDuration } from "@/lib/date-calculators";
import type { SearchParams } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Age Calculator — Exact Age & Next Birthday",
  description: "Calculate exact age in years, months, and days, total days lived, birth weekday, and the number of days until the next birthday.",
  alternates: { canonical: "/date-calculator/age" },
};

type Props = { searchParams: Promise<SearchParams> };

export default async function AgeCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const asOfDefault = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  const birthDefault = utcDate(
    Math.max(1, asOfDefault.getUTCFullYear() - 30),
    asOfDefault.getUTCMonth() + 1,
    Math.min(asOfDefault.getUTCDate(), daysInMonth(Math.max(1, asOfDefault.getUTCFullYear() - 30), asOfDefault.getUTCMonth() + 1)),
  );
  const birthValue = valueOf(params.birth) ?? toIsoDate(birthDefault);
  const asOfValue = valueOf(params.asOf) ?? toIsoDate(asOfDefault);
  const birth = parseIsoCalendarDate(birthValue);
  const asOf = parseIsoCalendarDate(asOfValue);
  const result = birth && asOf ? calculateAge(birth, asOf) : null;
  const reversed = Boolean(birth && asOf && asOf.getTime() < birth.getTime());
  const submitted = params.birth !== undefined || params.asOf !== undefined;

  return (
    <main className="calculator-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: "Date calculators", path: "/date-calculator" },
        { name: "Age calculator", path: "/date-calculator/age" },
      ]} />
      <div className="shell calculator-shell">
        <div className="calculator-hero-row">
          <header className="calculator-hero compact">
            <span className="page-kicker">Birthday arithmetic</span>
            <h1>Age calculator</h1>
            <p>Find an exact age in calendar years, months, and days, plus lifetime days and the countdown to the next birthday.</p>
          </header>
          <PageActions />
        </div>

        <div className="calculator-workspace">
          <form className="calculator-form" action="/date-calculator/age" method="get">
            <div className="calculator-field"><label htmlFor="birth-date">Date of birth</label><input id="birth-date" name="birth" type="date" min="0001-01-01" max="9999-12-31" defaultValue={birthValue} required /></div>
            <div className="calculator-field"><label htmlFor="age-as-of">Age on this date</label><input id="age-as-of" name="asOf" type="date" min="0001-01-01" max="9999-12-31" defaultValue={asOfValue} required /></div>
            <button className="button button-ink" type="submit">Calculate age</button>
          </form>

          <section className="calculator-results" aria-live="polite">
            {!birth || !asOf
              ? <CalculatorError title="Enter two valid dates." copy="Dates must use the Gregorian calendar and fall between years 0001 and 9999." />
              : reversed || !result
                ? <CalculatorError title="The birth date comes after the as-of date." copy="Choose an as-of date on or after the date of birth." />
                : <>
                  {submitted && <CalculatorResultTelemetry surface="age" />}
                  <span className="result-kicker">Exact age on {formatCalendarDate(asOf, "medium")}</span>
                  <h2>{durationLabel(result.age)}</h2>
                  <p className="result-summary">Born on <strong>{formatCalendarDate(birth)}</strong>, a {result.bornWeekday}.</p>
                  <div className="metric-grid">
                    <Metric label="Total days" value={result.totalDays.toLocaleString("en-US")} />
                    <Metric label="Next birthday" value={result.nextBirthday ? formatCalendarDate(result.nextBirthday, "medium") : "Beyond supported range"} />
                    <Metric label="Birthday countdown" value={result.daysUntilNextBirthday === null ? "—" : result.birthdayToday ? "Today" : pluralize(result.daysUntilNextBirthday, "day")} />
                  </div>
                  <p className="calculation-note">Calendar age advances by anniversaries first, then complete months, then remaining days. A February 29 birthday uses February 28 as its anniversary in non-leap years.</p>
                  <div className="result-actions no-print">
                    <Link className="button button-ghost" href={`/date/${toIsoDate(birth)}`} rel="nofollow">Open birth date</Link>
                    <Link className="button button-ghost" href={`/date/${toIsoDate(asOf)}`} rel="nofollow">Open as-of date</Link>
                    <Link className="button button-ghost" href={`/date-calculator/days-between?start=${toIsoDate(birth)}&end=${toIsoDate(asOf)}`}>Compare the dates</Link>
                  </div>
                </>}
          </section>
        </div>

        <section className="calculator-explainer no-print" aria-labelledby="age-calculation-explained">
          <div><span className="page-kicker">How it works</span><h2 id="age-calculation-explained">Calendar age, not an average</h2></div>
          <div className="calculator-explainer-grid">
            <article><h3>Birthday-first calculation</h3><p>Completed birthdays determine the year count before complete months and remaining days are measured. Someone born May 20, 1990 is 35 on May 19, 2026 and turns 36 on May 20.</p></article>
            <article><h3>Exact calendar units</h3><p>Years and months follow real anniversary dates rather than average month or year lengths. The displayed years, months, and days therefore describe a calendar age, not a decimal-age estimate.</p></article>
            <article><h3>Leap-day birthdays</h3><p>This calculator treats February 28 as the anniversary of a February 29 birthday in non-leap years. Legal and administrative rules can vary by jurisdiction, so verify the applicable rule for official deadlines.</p></article>
            <article><h3>Total days lived</h3><p>The total-days metric is the elapsed calendar-day distance from the birth date to the as-of date: the birth date is day zero. Use <Link href="/date-calculator/days-between">days between dates</Link> to include both endpoints instead.</p></article>
            <article><h3>Age on another date</h3><p>Choose a past or future as-of date to check age at a graduation, retirement date, eligibility deadline, or other milestone. The next-birthday countdown is calculated from that same as-of date.</p></article>
            <article><h3>Plan from a birthday</h3><p>Both inputs stay in the URL for bookmarking or sharing. To move a birth or milestone date by a fixed duration, use the <Link href="/date-calculator/add-subtract">add-or-subtract date calculator</Link>.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}

function durationLabel(duration: CalendarDuration): string {
  return [pluralize(duration.years, "year"), pluralize(duration.months, "month"), pluralize(duration.days, "day")].join(", ");
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function CalculatorError({ title, copy }: { title: string; copy: string }) {
  return <div className="calculator-error"><strong>{title}</strong><p>{copy}</p></div>;
}

function pluralize(value: number, unit: string): string {
  return `${value.toLocaleString("en-US")} ${unit}${value === 1 ? "" : "s"}`;
}

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
