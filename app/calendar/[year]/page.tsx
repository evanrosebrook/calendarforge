import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { CalendarToolbar } from "@/components/calendar-toolbar";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { MiniCalendar } from "@/components/mini-calendar";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { createCalendarYear } from "@/lib/calendar";
import { queryString } from "@/lib/navigation";
import { holidaysForSettings, parseSettings, type SearchParams } from "@/lib/settings";

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
    description: `View, customize, print, and download a complete ${year} calendar with holidays and optional week numbers.`,
    alternates: { canonical: `/calendar/${year}` },
    robots: customized ? { index: false, follow: true } : undefined,
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

  return (
    <main className="calendar-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: `${year} calendar`, path: `/calendar/${year}` },
      ]} />
      <style>{`@page { size: ${settings.paper} ${settings.orientation}; margin: .3in; }`}</style>
      <div className="shell">
        <div className="page-title-row">
          <div><span className="page-kicker">Year at a glance</span><h1>{settings.title || `${year} calendar`}</h1></div>
          <PageActions />
        </div>
        <div className="calendar-workspace">
          <CalendarToolbar settings={settings} year={year} />
          <div className="calendar-stage">
            <nav className="calendar-nav no-print" aria-label="Year navigation">
              <Link className="icon-button" href={`/calendar/${year - 1}${query}`} aria-label="Previous year"><ArrowLeft size={17} /></Link>
              <div className="calendar-nav-title">Twelve months. One clear view.</div>
              <Link className="icon-button" href={`/calendar/${year + 1}${query}`} aria-label="Next year"><ArrowRight size={17} /></Link>
            </nav>
            <article className={`calendar-sheet year-sheet ${settings.highlightWeekends ? "" : "no-weekends"}`}>
              <header className="sheet-heading"><h2>{settings.title || year}</h2><p>Year at a glance</p></header>
              <div className="mini-grid">
                {calendars.map((calendar) => <MiniCalendar key={calendar.month} calendar={calendar} query={query} highlightWeekends={settings.highlightWeekends} />)}
              </div>
              <p className="source-mark">Made with Calendar Forge</p>
            </article>
            <AdSlot placement="year_after" />
          </div>
        </div>
      </div>
    </main>
  );
}
