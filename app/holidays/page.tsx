import type { Metadata } from "next";
import Link from "next/link";
import { HOLIDAY_CATALOGS, MAX_SUPPORTED_HOLIDAY_YEAR, MIN_SUPPORTED_HOLIDAY_YEAR, getNationalHolidays } from "@/lib/calendar";

export const metadata: Metadata = {
  title: "National Holiday Calendars",
  description: "Browse U.S. and Canadian national holiday dates, observed days, and printable calendars.",
  alternates: { canonical: "/holidays" },
};

export default function HolidaysPage() {
  const year = new Date().getUTCFullYear();

  return (
    <main className="content-page">
      <div className="shell content-shell">
        <span className="page-kicker">Holiday calendars</span>
        <h1>National holidays, clearly dated.</h1>
        <p className="content-intro">Browse national dates and standard observed days, then open a printable calendar with the matching country already selected.</p>
        <div className="country-card-grid">
          {HOLIDAY_CATALOGS.map((catalog) => (
            <article className="country-card" key={catalog.code}>
              <span>{catalog.calendarLabel}</span>
              <h2>{catalog.name}</h2>
              <p>{getNationalHolidays(catalog.code, year).filter((holiday) => !holiday.observed).length} national holidays listed for {year}.</p>
              <Link className="text-link" href={`/holidays/${catalog.slug}/${year}`}>View {year} holidays →</Link>
            </article>
          ))}
        </div>
        <aside className="content-note">
          <strong>What is included?</strong>
          <p>Calendar Forge lists current-law planning dates from {MIN_SUPPORTED_HOLIDAY_YEAR} through {MAX_SUPPORTED_HOLIDAY_YEAR} for nationwide U.S. federal holidays and Canadian federal general holidays. It is not a historical record. State, provincial, territorial, religious, and informal observances are not mixed into these tables.</p>
        </aside>
      </div>
    </main>
  );
}
