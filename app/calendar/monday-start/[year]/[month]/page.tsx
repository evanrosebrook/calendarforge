import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { CalendarGrid } from "@/components/calendar-grid";
import { CalendarToolbar } from "@/components/calendar-toolbar";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { isAcquisitionYear, robotsForYear } from "@/lib/acquisition";
import { createCalendarMonth } from "@/lib/calendar";
import { adjacentMonth, queryString } from "@/lib/navigation";
import { holidaysForSettings, parseSettings, type SearchParams } from "@/lib/settings";

type Props = { params: Promise<{ year: string; month: string }>; searchParams: Promise<SearchParams> };

function readDate(params: { year: string; month: string }) {
  const year = Number(params.year);
  const month = Number(params.month);
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const date = readDate(await params);
  if (!date) return { title: "Calendar not found" };
  const customized = Object.keys(await searchParams).length > 0;
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(date.year, date.month - 1, 1)));
  return {
    title: `${label} Monday-Start Calendar`,
    description: `Print and download a ${label} calendar with Monday as the first day of the week. Add holidays, week numbers, notes, and weekend shading.`,
    alternates: { canonical: `/calendar/monday-start/${date.year}/${date.month}` },
    robots: robotsForYear(date.year, customized),
  };
}

export default async function MondayStartMonthPage({ params, searchParams }: Props) {
  const date = readDate(await params);
  if (!date) notFound();
  const rawSearchParams = await searchParams;
  const settings = parseSettings(rawSearchParams, 1);
  const calendar = createCalendarMonth({
    ...date,
    locale: settings.locale,
    firstDayOfWeek: settings.firstDayOfWeek,
    weekendDays: [0, 6],
    showWeekNumbers: settings.showWeekNumbers,
    holidays: holidaysForSettings(settings, date.year, date.year),
  });
  const previous = adjacentMonth(date.year, date.month, -1);
  const next = adjacentMonth(date.year, date.month, 1);
  const query = queryString(rawSearchParams);
  const acquisitionPage = isAcquisitionYear(date.year);

  return (
    <main className="calendar-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: `${date.year} calendar`, path: `/calendar/${date.year}` },
        { name: `${calendar.label} Monday-start calendar`, path: `/calendar/monday-start/${date.year}/${date.month}` },
      ]} />
      <style>{`@page { size: ${settings.paper} ${settings.orientation}; margin: .35in; }`}</style>
      <div className="shell">
        <div className="page-title-row">
          <div><span className="page-kicker">Monday-start monthly calendar</span><h1>{calendar.label}</h1></div>
          <PageActions />
        </div>
        <div className="calendar-workspace">
          <CalendarToolbar settings={settings} year={date.year} month={date.month} defaultFirstDayOfWeek={1} />
          <div className="calendar-stage">
            <nav className="calendar-nav no-print" aria-label="Month navigation">
              {!acquisitionPage || isAcquisitionYear(previous.year)
                ? <Link className="icon-button" href={`/calendar/monday-start/${previous.year}/${previous.month}${query}`} aria-label="Previous month"><ArrowLeft size={17} /></Link>
                : <span className="icon-button" aria-hidden="true"><ArrowLeft size={17} /></span>}
              <div className="calendar-nav-title"><Link href={`/calendar/${date.year}/${date.month}`}>Open Sunday-start version</Link> · <Link href={`/calendar/${date.year}`}>View {date.year}</Link></div>
              {!acquisitionPage || isAcquisitionYear(next.year)
                ? <Link className="icon-button" href={`/calendar/monday-start/${next.year}/${next.month}${query}`} aria-label="Next month"><ArrowRight size={17} /></Link>
                : <span className="icon-button" aria-hidden="true"><ArrowRight size={17} /></span>}
            </nav>
            <CalendarGrid calendar={calendar} compact={settings.density === "compact"} highlightWeekends={settings.highlightWeekends} linkDates={acquisitionPage} title={settings.title} showNotes={settings.showNotes} />
            <AdSlot />
          </div>
        </div>

        <section className="calculator-explainer no-print">
          <div><span className="page-kicker">Monday first</span><h2>A workweek-shaped monthly view</h2></div>
          <div className="calculator-explainer-grid">
            <article><h3>Weekdays stay together</h3><p>Monday through Friday appear as one continuous block, with Saturday and Sunday grouped at the end of each row.</p></article>
            <article><h3>Week numbers fit naturally</h3><p>Optional ISO week numbers use the same Monday-first convention, which makes project and business planning easier to scan.</p></article>
            <article><h3>Ready to reuse</h3><p>Print the calendar or download PDF, ICS, CSV, and XLSX versions generated from the same selected dates and settings.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
