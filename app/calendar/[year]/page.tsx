import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { CalendarToolbar } from "@/components/calendar-toolbar";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { MiniCalendar } from "@/components/mini-calendar";
import { PageActions } from "@/components/page-actions";
import { YearCalendarDownloads } from "@/components/year-calendar-downloads";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { isAcquisitionYear, robotsForYear } from "@/lib/acquisition";
import { createCalendarYear, isSupportedHolidayYear } from "@/lib/calendar";
import { queryString } from "@/lib/navigation";
import { holidaysForSettings, parseSettings, settingsToParams, type SearchParams } from "@/lib/settings";

type Props = { params: Promise<{ year: string }>; searchParams: Promise<SearchParams> };

function readYear(value: string): number | null {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1 && year <= 9999 ? year : null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const year = readYear((await params).year);
  if (!year) return { title: "Calendar not found" };
  const customized = Object.keys(await searchParams).length > 0;
  return {
    title: `${year} Printable Calendar`,
    description: `Download a free ${year} calendar as a one-page yearly PDF or 12 monthly pages. Choose blank or holiday calendars, Sunday or Monday start, Letter or A4.`,
    alternates: { canonical: `/calendar/${year}` },
    robots: robotsForYear(year, customized),
  };
}

export default async function YearPage({ params, searchParams }: Props) {
  const year = readYear((await params).year);
  if (!year) notFound();
  const rawSearchParams = await searchParams;
  const settings = parseSettings(rawSearchParams);
  const calendars = createCalendarYear({
    year,
    locale: settings.locale,
    firstDayOfWeek: settings.firstDayOfWeek,
    weekendDays: [0, 6],
    showWeekNumbers: settings.showWeekNumbers,
    holidays: holidaysForSettings(settings, year, year),
  });
  const query = queryString(rawSearchParams);
  const acquisitionPage = isAcquisitionYear(year);
  function preset(key: string, value: string) {
    const params = settingsToParams(settings);
    params.set(key, value);
    return `/calendar/${year}?${params}`;
  }
  const builderParams = new URLSearchParams(settingsToParams(settings));
  builderParams.set("year", String(year));
  builderParams.set("month", "1");
  builderParams.set("months", "12");

  return (
    <main className="calendar-page year-calendar-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: `${year} calendar`, path: `/calendar/${year}` },
      ]} />
      <style>{`@page { size: ${settings.paper} ${settings.orientation}; margin: .3in; }`}</style>
      <div className="shell">
        <div className="page-title-row">
          <div><span className="page-kicker">Free printable calendar</span><h1>{year} calendar</h1><p className="year-page-intro">Print the whole year on one page, or give each month room of its own. No account needed.</p></div>
          <PageActions />
        </div>
        <YearCalendarDownloads year={year} settings={settings} />
        <nav className="year-presets no-print" aria-label="Calendar quick starts">
          <span>Quick starts</span>
          <Link href={preset("holidays", "0")}>Blank (no holidays)</Link>
          <Link href={preset("holidays", "1")}>With holidays</Link>
          <Link href={preset("start", "monday")}>Monday start</Link>
        </nav>
        <div className="calendar-workspace">
          <CalendarToolbar settings={settings} year={year} />
          <div className="calendar-stage">
            <nav className="calendar-nav no-print" aria-label="Year navigation">
              {!acquisitionPage || isAcquisitionYear(year - 1)
                ? <Link className="icon-button" href={`/calendar/${year - 1}${query}`} aria-label="Previous year"><ArrowLeft size={17} /></Link>
                : <span className="icon-button" aria-hidden="true"><ArrowLeft size={17} /></span>}
              <div className="calendar-nav-title">Twelve months. One clear view.</div>
              {!acquisitionPage || isAcquisitionYear(year + 1)
                ? <Link className="icon-button" href={`/calendar/${year + 1}${query}`} aria-label="Next year"><ArrowRight size={17} /></Link>
                : <span className="icon-button" aria-hidden="true"><ArrowRight size={17} /></span>}
            </nav>
            <article className={`calendar-sheet year-sheet ${settings.highlightWeekends ? "" : "no-weekends"}`}>
              <header className="sheet-heading"><h2>{settings.title || year}</h2><p>Year at a glance</p></header>
              <div className="mini-grid">
                {calendars.map((calendar) => <MiniCalendar key={calendar.month} calendar={calendar} query={query} highlightWeekends={settings.highlightWeekends} linkDates={false} />)}
              </div>
              <p className="source-mark">Made with Calendar Forge</p>
            </article>
            <AdSlot placement="year_after" />
          </div>
        </div>
        <section className="year-calendar-guide no-print" aria-labelledby="year-calendar-guide-title">
          <span className="page-kicker">Ready for your plans</span>
          <h2 id="year-calendar-guide-title">Make the most of your {year} calendar</h2>
          <div className="year-guide-grid">
            <article><h3>Pick your print layout</h3><p>The one-page PDF keeps all twelve months together. The 12-page PDF gives each month its own sheet. Both use your chosen week start, paper size, orientation, and holiday settings.</p><p>Match the paper size in your printer settings to your PDF. Print at actual size, or use “Fit” if your printer clips the edges.</p></article>
            <article><h3>Keep holidays in view</h3>{isSupportedHolidayYear(year) ? <><p>Choose U.S. or Canadian federal holidays, or turn them off for a clean dated calendar. The one-page PDF highlights holiday dates and lists their names below the calendar.</p><Link className="text-link" href={`/holidays/${settings.holidayCountry === "ca" ? "canada" : "us"}/${year}`}>See {year} holiday dates →</Link></> : <p>National holiday coverage is available for 1971–2100. Calendars outside that range show dates without holiday markings.</p>}</article>
            <article><h3>Plan beyond the overview</h3><p>Open any month above for a larger calendar. To add notes to individual dates or build a different range of months, start with the custom calendar maker.</p><Link className="text-link" href={`/make-calendar?${builderParams}`}>Customize a {year} calendar →</Link></article>
          </div>
        </section>
      </div>
    </main>
  );
}
