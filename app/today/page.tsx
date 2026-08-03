import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorNav } from "@/components/calculator-nav";
import { toIsoDate } from "@/lib/calendar";
import { SUPPORTED_TIME_ZONES, formatCalendarDate, getTodayFacts, parseSupportedTimeZone } from "@/lib/date-calculators";
import type { SearchParams } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Today's Date",
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
      <div className="shell calculator-shell">
        <CalculatorNav current="/today" />
        <header className="calculator-hero compact">
          <span className="page-kicker">Today’s date</span>
          <h1>{facts.longDate}</h1>
          <p>Showing the calendar date for <strong>{SUPPORTED_TIME_ZONES.find((zone) => zone.id === timeZone)?.label}</strong>. The timezone is explicit so the answer does not depend on the server’s location.</p>
        </header>

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
        <div className="result-actions no-print"><Link className="button button-ghost" href={`/calendar/${year}/${Number(month)}`}>Open this month</Link><Link className="button button-ghost" href={`/date-calculator/add-subtract?date=${toIsoDate(facts.date)}`}>Add or subtract from today</Link></div>
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
