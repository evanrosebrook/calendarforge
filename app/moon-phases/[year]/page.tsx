import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Download } from "@/components/icons";
import { MoonPhaseMiniCalendar } from "@/components/moon-phase-mini-calendar";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { createCalendarYear, utcDate } from "@/lib/calendar";
import { MOON_PHASE_DETAILS, getMoonPhases, isSupportedMoonPhaseYear, moonPhasesByDate, supportedMoonPhaseYears } from "@/lib/moon-phases";

type Props = { params: Promise<{ year: string }> };

export const dynamicParams = false;

export function parseMoonPhaseYear(value: string): number | null {
  const year = Number(value);
  return /^\d{4}$/.test(value) && isSupportedMoonPhaseYear(year) ? year : null;
}

export function generateStaticParams() {
  return supportedMoonPhaseYears().map((year) => ({ year: String(year) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = parseMoonPhaseYear((await params).year);
  if (!year) return { title: "Moon phase calendar not found" };
  return {
    title: `Moon Phases ${year} — Printable Lunar Calendar`,
    description: `See every ${year} new moon, first quarter, full moon, and last quarter in UTC on a printable twelve-month calendar.`,
    alternates: { canonical: `/moon-phases/${year}` },
  };
}

export default async function MoonPhasesPage({ params }: Props) {
  const year = parseMoonPhaseYear((await params).year);
  if (!year) notFound();

  const events = getMoonPhases(year);
  const phases = moonPhasesByDate(events);
  const calendars = createCalendarYear({ year });
  const supportedYears = supportedMoonPhaseYears();
  const firstYear = supportedYears[0]!;
  const lastYear = supportedYears.at(-1)!;
  const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", weekday: "short", timeZone: "UTC" });
  const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" });

  return (
    <main className="calendar-page moon-phase-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: `${year} moon phases`, path: `/moon-phases/${year}` },
      ]} />
      <style>{`@page { size: letter landscape; margin: .3in; }`}</style>
      <div className="shell">
        <div className="page-title-row">
          <div>
            <span className="page-kicker">Printable lunar calendar · Universal Time</span>
            <h1>Moon phases {year}</h1>
            <p className="moon-page-intro">Every new moon, first quarter, full moon, and last quarter—placed on its UTC calendar date.</p>
          </div>
          <div className="moon-page-actions no-print">
            <a className="button button-small button-ink" href={`/api/moon-phases/ics?year=${year}`}><Download size={14} /> Download ICS</a>
            <PageActions />
          </div>
        </div>

        <nav className="calendar-nav no-print" aria-label="Moon phase year navigation">
          {year > firstYear ? <Link className="icon-button" href={`/moon-phases/${year - 1}`} aria-label="Previous year"><ArrowLeft size={17} /></Link> : <span />}
          <div className="calendar-nav-title">Four principal phases · exact UTC times below</div>
          {year < lastYear ? <Link className="icon-button" href={`/moon-phases/${year + 1}`} aria-label="Next year"><ArrowRight size={17} /></Link> : <span />}
        </nav>

        <article className="calendar-sheet year-sheet moon-year-sheet">
          <header className="sheet-heading"><h2>{year} moon calendar</h2><p>Universal Time</p></header>
          <div className="moon-phase-legend" aria-label="Moon phase symbols">
            {MOON_PHASE_DETAILS.map((phase) => (
              <span key={phase.id}><span className={`moon-phase-glyph phase-${phase.id}`} aria-hidden="true">{phase.symbol}</span>{phase.name}</span>
            ))}
          </div>
          <div className="mini-grid">
            {calendars.map((calendar) => <MoonPhaseMiniCalendar key={calendar.month} calendar={calendar} phases={phases} />)}
          </div>
          <p className="source-mark">Made with Calendar Forge · Dates shown in UTC</p>
        </article>

        <section className="moon-phase-details no-print" aria-labelledby="moon-phase-dates-title">
          <span className="page-kicker">Exact moments</span>
          <h2 id="moon-phase-dates-title">{year} moon phase dates and times</h2>
          <p>Times use Universal Time (UTC). The local date can differ depending on your timezone.</p>
          <div className="moon-month-grid">
            {calendars.map((calendar) => {
              const monthEvents = events.filter((event) => Number(event.date.slice(5, 7)) === calendar.month);
              return (
                <article className="moon-month-card" key={calendar.month}>
                  <h3>{calendar.label}</h3>
                  <ul>
                    {monthEvents.map((event) => {
                      const instant = new Date(event.instant);
                      return (
                        <li key={event.instant}>
                          <span className={`moon-phase-glyph phase-${event.id}`} aria-hidden="true">{event.symbol}</span>
                          <span><strong>{event.name}</strong><Link href={`/date/${event.date}`}>{dateFormatter.format(utcDate(year, calendar.month, Number(event.date.slice(8, 10))))}</Link></span>
                          <time dateTime={event.instant}>{timeFormatter.format(instant)} UTC</time>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="moon-page-copy no-print" aria-labelledby="about-moon-phases">
          <h2 id="about-moon-phases">How this moon phase calendar works</h2>
          <p>The four principal phases occur when the Moon is 0°, 90°, 180°, or 270° from the Sun in geocentric ecliptic longitude. Calendar Forge calculates those instants with Astronomy Engine and displays them in UTC so the underlying moment stays unambiguous worldwide.</p>
          <p className="source-copy">Calculation reference: <a href="https://github.com/cosinekitty/astronomy" rel="noreferrer">Astronomy Engine</a>, validated by its maintainers against JPL Horizons. Independent phase-time reference: <a href="https://aa.usno.navy.mil/data/MoonPhases" rel="noreferrer">U.S. Naval Observatory</a>.</p>
        </section>
      </div>
    </main>
  );
}
