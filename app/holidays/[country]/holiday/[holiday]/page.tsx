import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HOLIDAY_CATALOGS, MAX_SUPPORTED_HOLIDAY_YEAR, MIN_SUPPORTED_HOLIDAY_YEAR, getHolidayCatalog, getHolidayDefinition, getHolidayOccurrences, toIsoDate, utcDate } from "@/lib/calendar";

type Props = { params: Promise<{ country: string; holiday: string }> };

function readParams(params: { country: string; holiday: string }) {
  const catalog = getHolidayCatalog(params.country);
  if (!catalog) return null;
  const holiday = getHolidayDefinition(catalog.code, params.holiday);
  return holiday ? { catalog, holiday } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const values = readParams(await params);
  if (!values) return { title: "Holiday not found" };
  return {
    title: `${values.holiday.name} Dates in ${values.catalog.name}`,
    description: `Upcoming ${values.holiday.name} dates and observed days in ${values.catalog.name}.`,
    alternates: { canonical: `/holidays/${values.catalog.slug}/holiday/${values.holiday.id}` },
  };
}

export function generateStaticParams() {
  return HOLIDAY_CATALOGS.flatMap((catalog) => catalog.holidays.map((holiday) => ({ country: catalog.slug, holiday: holiday.id })));
}

export default async function HolidayDetailPage({ params }: Props) {
  const values = readParams(await params);
  if (!values) notFound();
  const { catalog, holiday } = values;
  const today = new Date();
  const todayUtc = utcDate(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate());
  const todayIso = toIsoDate(todayUtc);
  const occurrences = getHolidayOccurrences(catalog.code, holiday.id, Math.max(MIN_SUPPORTED_HOLIDAY_YEAR, today.getUTCFullYear()), Math.min(MAX_SUPPORTED_HOLIDAY_YEAR, today.getUTCFullYear() + 8))
    .filter((occurrence) => occurrence.date >= todayIso)
    .slice(0, 10);
  const formatter = new Intl.DateTimeFormat(catalog.locale, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  return (
    <main className="content-page">
      <div className="shell content-shell narrow-content">
        <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/holidays">Holidays</Link><span>/</span><Link href={`/holidays/${catalog.slug}/${today.getUTCFullYear()}`}>{catalog.name}</Link><span>/</span><span>{holiday.name}</span></nav>
        <span className="page-kicker">{catalog.demonym} national holiday</span>
        <h1>{holiday.name}</h1>
        <p className="content-intro">{holiday.description}</p>
        <section className="occurrence-panel">
          <h2>Upcoming dates</h2>
          <ol className="occurrence-list">
            {occurrences.map((occurrence) => {
              const [year, month, day] = occurrence.date.split("-").map(Number);
              return <li key={`${occurrence.date}-${occurrence.observed ? "observed" : "actual"}`}><Link href={`/holidays/${catalog.slug}/${year}`}>{formatter.format(utcDate(year!, month!, day!))}</Link>{occurrence.observed && <span>Observed day</span>}</li>;
            })}
          </ol>
        </section>
        <aside className="content-note"><strong>How observed days work</strong><p>{catalog.observedNote}</p></aside>
        <div className="inline-actions"><Link className="button button-ink" href={`/holidays/${catalog.slug}/${today.getUTCFullYear()}`}>All {catalog.name} holidays</Link><Link className="button button-ghost" href={`/calendar/${today.getUTCFullYear()}?scope=national${catalog.code === "ca" ? "&country=ca" : ""}`}>Open calendar</Link></div>
      </div>
    </main>
  );
}
