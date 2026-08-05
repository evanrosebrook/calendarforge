import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarGrid } from "@/components/calendar-grid";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { addUtcDays, createCalendarMonth, getHolidayCatalog, getNationalHolidaysForRange, toIsoDate, utcDate } from "@/lib/calendar";
import { calculateDateDifference, getDateFacts, parseIsoCalendarDate } from "@/lib/date-calculators";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const value = (await params).date;
  const date = parseIsoCalendarDate(value);
  if (!date) return { title: "Date not found" };
  const facts = getDateFacts(date);
  return {
    title: `${facts.longDate}: Day of Week, Week Number & Countdown`,
    description: `${facts.longDate} is a ${facts.weekday} in ISO week ${facts.isoWeek}. See its day number, countdown, holidays, monthly calendar, and printable daily planner.`,
    alternates: { canonical: `/date/${facts.isoDate}` },
  };
}

export default async function DatePage({ params }: Props) {
  const value = (await params).date;
  const date = parseIsoCalendarDate(value);
  if (!date) notFound();

  const facts = getDateFacts(date);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
  const nationalHolidays = [
    ...getNationalHolidaysForRange("us", year, year),
    ...getNationalHolidaysForRange("ca", year, year),
  ];
  const holidaysOnDate = nationalHolidays.filter((holiday) => holiday.date === facts.isoDate);
  const calendar = createCalendarMonth({
    year,
    month,
    holidays: getNationalHolidaysForRange("us", year, year),
  });
  const now = new Date();
  const today = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  const relative = calculateDateDifference(today, date);
  const previousDate = toIsoDate(addUtcDays(date, -1));
  const nextDate = toIsoDate(addUtcDays(date, 1));

  return (
    <main className="date-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: `${year} calendar`, path: `/calendar/${year}` },
        { name: `${monthName} ${year}`, path: `/calendar/${year}/${month}` },
        { name: facts.longDate, path: `/date/${facts.isoDate}` },
      ]} />
      <div className="shell date-page-shell">
        <nav className="breadcrumb no-print" aria-label="Breadcrumb"><Link href="/today">Today</Link><span>/</span><span>{facts.isoDate}</span></nav>
        <header className="date-page-header">
          <div>
            <span className="page-kicker">Date guide</span>
            <h1>{facts.longDate}</h1>
            <p>{facts.longDate} falls on a <strong>{facts.weekday}</strong>. It is day {facts.dayOfYear} of {facts.daysInYear} and sits in ISO week {facts.isoWeek}.</p>
          </div>
          <PageActions />
        </header>

        <nav className="date-stepper no-print" aria-label="Adjacent dates">
          <Link href={`/date/${previousDate}`}>← {formatShortDate(addUtcDays(date, -1))}</Link>
          <Link href={`/calendar/${year}/${month}`}>Open {monthName} calendar</Link>
          <Link href={`/date/${nextDate}`}>{formatShortDate(addUtcDays(date, 1))} →</Link>
        </nav>

        <section className="date-summary-grid" aria-label="Date summary">
          <div className="date-tile">
            <span>{facts.weekday}</span>
            <strong>{date.getUTCDate()}</strong>
            <p>{monthName} {year}</p>
            <small>{relativeLabel(relative.direction, relative.totalDays)}</small>
          </div>
          <div className="date-stat-grid">
            <DateStat label="Day of year" value={`${facts.dayOfYear} of ${facts.daysInYear}`} />
            <DateStat label="ISO week" value={facts.isoWeek.toString()} />
            <DateStat label="Quarter" value={`Q${facts.quarter}`} />
            <DateStat label="Days left in year" value={facts.daysRemainingAfterDate.toString()} />
            <DateStat label="Leap year" value={facts.leapYear ? "Yes" : "No"} />
            <DateStat label="ISO date" value={facts.isoDate} />
          </div>
        </section>

        <section className="date-calendar-section">
          <div className="date-section-heading no-print">
            <div><span className="page-kicker">In context</span><h2>{monthName} {year} calendar</h2></div>
            <p>The selected date is highlighted. US national holidays are shown when they occur.</p>
          </div>
          <CalendarGrid calendar={calendar} highlightDate={facts.isoDate} linkDates />
        </section>

        <div className="date-detail-grid no-print">
          <section className="date-detail-card">
            <span className="result-kicker">Date formats</span>
            <h2>{monthName} {date.getUTCDate()} written four ways</h2>
            <dl>
              <Format label="ISO 8601" value={facts.isoDate} />
              <Format label="US numeric" value={`${String(month).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}/${year}`} />
              <Format label="International" value={`${String(date.getUTCDate()).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`} />
              <Format label="Long form" value={facts.longDate} />
            </dl>
          </section>
          <section className="date-detail-card">
            <span className="result-kicker">Holiday check</span>
            <h2>{holidaysOnDate.length ? "National holidays on this date" : "No national holiday listed"}</h2>
            {holidaysOnDate.length ? <ul className="date-holiday-list">{holidaysOnDate.map((holiday) => {
              const catalog = getHolidayCatalog(holiday.country);
              return <li key={`${holiday.country}-${holiday.name}`}><Link href={`/holidays/${catalog?.slug ?? holiday.country}/holiday/${holiday.id}`}>{holiday.name}</Link> <span>{holiday.country === "us" ? "United States" : "Canada"}</span></li>;
            })}</ul> : <p>Calendar Forge does not list a US or Canadian national holiday on this date. Regional holidays and informal observances may still apply.</p>}
            <div className="inline-actions"><Link className="text-link" href={`/holidays/us/${year}`}>US holidays</Link><Link className="text-link" href={`/holidays/canada/${year}`}>Canada holidays</Link></div>
          </section>
        </div>

        <section className="daily-planner" aria-labelledby="daily-planner-title">
          <header><div><span className="page-kicker">Printable daily planner</span><h2 id="daily-planner-title">Plan {formatShortDate(date)}</h2></div><span>{facts.weekday} · Week {facts.isoWeek}</span></header>
          <div className="daily-planner-grid">
            <div className="planner-schedule"><h3>Schedule</h3>{["6 AM", "8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM"].map((time) => <div key={time}><span>{time}</span></div>)}</div>
            <div className="planner-notes"><section><h3>Top priorities</h3><ol><li /><li /><li /></ol></section><section><h3>Notes</h3><div className="planner-lines" /></section></div>
          </div>
        </section>

        <div className="result-actions no-print">
          <Link className="button button-ink" href={`/calendar/${year}/${month}`}>Customize this month</Link>
          <Link className="button button-ghost" href={`/date-calculator/add-subtract?date=${facts.isoDate}`}>Add or subtract time</Link>
          <Link className="button button-ghost" href={`/date-calculator/days-between?start=${facts.isoDate}`}>Calculate days between</Link>
          <Link className="button button-ghost" href={`/date-calculator/business-days?mode=shift&date=${facts.isoDate}`}>Add business days</Link>
        </div>
      </div>
    </main>
  );
}

function relativeLabel(direction: -1 | 0 | 1, days: number): string {
  if (direction === 0) return "Today in UTC";
  return direction > 0 ? `${days.toLocaleString("en-US")} days from today (UTC)` : `${days.toLocaleString("en-US")} days ago (UTC)`;
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function DateStat({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function Format({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
