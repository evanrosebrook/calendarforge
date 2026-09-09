import type { Metadata } from "next";
import Link from "next/link";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { toIsoDate } from "@/lib/calendar";
import { SUPPORTED_TIME_ZONES, formatCalendarDate, getTodayFacts, parseSupportedTimeZone } from "@/lib/date-calculators";
import type { SearchParams } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Today's Date — Day, Week Number & Date Formats",
  description: "See today's date, local time, day and week numbers, date formats, and quick future dates in an explicit timezone.",
  alternates: { canonical: "/today" },
};

type Props = { searchParams: Promise<SearchParams> };

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TodayPage({ searchParams }: Props) {
  const params = await searchParams;
  const timeZone = parseSupportedTimeZone(valueOf(params.tz));
  const facts = getTodayFacts(new Date(), timeZone);
  const [year, month, day] = facts.isoDate.split("-");

  return (
    <main className="calculator-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: "Date calculators", path: "/date-calculator" },
        { name: "Today's date", path: "/today" },
      ]} />
      <div className="shell calculator-shell">
        <div className="calculator-hero-row">
          <header className="calculator-hero compact">
            <span className="page-kicker">Today’s date</span>
            <h1>{facts.longDate}</h1>
            <p>Showing the calendar date for <strong>{SUPPORTED_TIME_ZONES.find((zone) => zone.id === timeZone)?.label}</strong>. The timezone is explicit so the answer does not depend on the server’s location.</p>
          </header>
          <PageActions />
        </div>

        <form className="timezone-form no-print" action="/today" method="get">
          <label htmlFor="today-timezone">Timezone</label>
          <select id="today-timezone" name="tz" defaultValue={timeZone}>{SUPPORTED_TIME_ZONES.map((zone) => <option key={zone.id} value={zone.id}>{zone.label}</option>)}</select>
          <button className="button button-ink" type="submit">Show date</button>
        </form>

        <section className="today-panel">
          <div className="today-primary"><span>{facts.weekday}</span><strong>{day}</strong><p>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(facts.date)}</p></div>
          <div className="metric-grid today-metrics">
            <Metric label="Day of year" value={facts.dayOfYear.toString()} />
            <Metric label="ISO week" value={facts.isoWeek.toString()} />
            <Metric label="Leap year" value={facts.leapYear ? "Yes" : "No"} />
            <Metric label="Days after today in year" value={facts.daysRemainingAfterToday.toString()} />
          </div>
        </section>

        <div className="today-sections">
          <section className="date-format-panel">
            <span className="result-kicker">Date formats</span>
            <h2>Today written five ways</h2>
            <dl>
              <Format label="ISO 8601" value={facts.isoDate} />
              <Format label="Month / day / year" value={`${month}/${day}/${year}`} />
              <Format label="Day / month / year" value={`${day}/${month}/${year}`} />
              <Format label="Long form" value={facts.longDate} />
              <Format label="Local date and time" value={facts.localDateTime} />
            </dl>
          </section>
          <section className="quick-date-panel">
            <span className="result-kicker">Quick dates</span>
            <h2>Dates from today</h2>
            <ul>{facts.quickDates.map((item) => <li key={item.days}><span>{item.days} days</span><Link href={`/calendar/${item.date.getUTCFullYear()}/${item.date.getUTCMonth() + 1}`}>{formatCalendarDate(item.date, "medium")}</Link></li>)}</ul>
          </section>
        </div>
        <div className="result-actions no-print"><Link className="button button-ghost" href={`/date/${facts.isoDate}`} rel="nofollow">Open today’s date guide</Link><Link className="button button-ghost" href={`/calendar/${year}/${Number(month)}`}>Open this month</Link><Link className="button button-ghost" href={`/date-calculator/days-between?start=${facts.isoDate}`}>Days from today</Link><Link className="button button-ghost" href={`/date-calculator/add-subtract?date=${toIsoDate(facts.date)}`}>Add or subtract from today</Link><Link className="button button-ghost" href={`/date-calculator/business-days?mode=shift&date=${toIsoDate(facts.date)}`}>Add business days</Link><Link className="button button-ghost" href="/date-calculator/age">Calculate an age</Link></div>
        <section className="calculator-explainer no-print" aria-labelledby="today-explained">
          <div><span className="page-kicker">Reading today’s date</span><h2 id="today-explained">What each number means</h2></div>
          <div className="calculator-explainer-grid">
            <article><h3>The timezone sets the date</h3><p>“Today” changes at midnight in the timezone selected above. Choosing a timezone makes the answer dependable near midnight, while traveling, or when coordinating across regions.</p></article>
            <article><h3>ISO weeks start Monday</h3><p>ISO week {facts.isoWeek} follows the international Monday-to-Sunday system. Week 1 is the week containing January 4, so the first days of January can belong to the previous ISO week-year.</p></article>
            <article><h3>Day {facts.dayOfYear} of {facts.leapYear ? 366 : 365}</h3><p>The day-of-year count starts with January 1 as day 1. “Days after today” excludes today itself, leaving {facts.daysRemainingAfterToday} complete calendar days in this year.</p></article>
            <article><h3>Plan a future date</h3><p>The quick-date links jump to the calendar month containing each future date. For a custom interval, use <Link href={`/date-calculator/add-subtract?date=${facts.isoDate}`}>add or subtract dates</Link>.</p></article>
            <article><h3>Measure an exact span</h3><p>Use the <Link href={`/date-calculator/days-between?start=${facts.isoDate}`}>days-between calculator</Link> to compare today with a deadline, trip, anniversary, or any other Gregorian calendar date.</p></article>
            <article><h3>Count working days</h3><p>The <Link href={`/date-calculator/business-days?mode=shift&date=${facts.isoDate}`}>business-days calculator</Link> can skip weekends and optionally U.S. or Canadian national holidays.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function Format({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
