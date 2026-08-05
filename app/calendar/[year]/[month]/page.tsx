import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { CalendarGrid } from "@/components/calendar-grid";
import { CalendarToolbar } from "@/components/calendar-toolbar";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
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
    title: `${label} Calendar`,
    description: `Create, customize, print, and download a clean ${label} calendar. Choose Sunday or Monday start, holidays, and week numbers.`,
    alternates: { canonical: `/calendar/${date.year}/${date.month}` },
    robots: customized ? { index: false, follow: true } : undefined,
  };
}

export default async function MonthPage({ params, searchParams }: Props) {
  const date = readDate(await params);
  if (!date) notFound();
  const rawSearchParams = await searchParams;
  const settings = parseSettings(rawSearchParams);
  const holidays = holidaysForSettings(settings, date.year, date.year);
  const calendar = createCalendarMonth({
    ...date,
    locale: settings.locale,
    firstDayOfWeek: settings.firstDayOfWeek,
    weekendDays: [0, 6],
    showWeekNumbers: settings.showWeekNumbers,
    holidays,
  });
  const previous = adjacentMonth(date.year, date.month, -1);
  const next = adjacentMonth(date.year, date.month, 1);
  const query = queryString(rawSearchParams);

  return (
    <main className="calendar-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: `${date.year} calendar`, path: `/calendar/${date.year}` },
        { name: calendar.label, path: `/calendar/${date.year}/${date.month}` },
      ]} />
      <style>{`@page { size: ${settings.paper} ${settings.orientation}; margin: .35in; }`}</style>
      <div className="shell">
        <div className="page-title-row">
          <div><span className="page-kicker">Monthly calendar</span><h1>{calendar.label}</h1></div>
          <PageActions />
        </div>
        <div className="calendar-workspace">
          <CalendarToolbar settings={settings} year={date.year} month={date.month} />
          <div className="calendar-stage">
            <nav className="calendar-nav no-print" aria-label="Month navigation">
              <Link className="icon-button" href={`/calendar/${previous.year}/${previous.month}${query}`} aria-label="Previous month"><ArrowLeft size={17} /></Link>
              <div className="calendar-nav-title"><Link href={`/calendar/${date.year}${query}`}>View all of {date.year}</Link></div>
              <Link className="icon-button" href={`/calendar/${next.year}/${next.month}${query}`} aria-label="Next month"><ArrowRight size={17} /></Link>
            </nav>
            <CalendarGrid calendar={calendar} compact={settings.density === "compact"} highlightWeekends={settings.highlightWeekends} linkDates title={settings.title} showNotes={settings.showNotes} />
            <AdSlot />
          </div>
        </div>
      </div>
    </main>
  );
}
