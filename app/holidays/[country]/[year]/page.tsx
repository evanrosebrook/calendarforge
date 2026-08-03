import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HOLIDAY_CATALOGS, MAX_SUPPORTED_HOLIDAY_YEAR, MIN_SUPPORTED_HOLIDAY_YEAR, getHolidayCatalog, getNationalHolidays, isSupportedHolidayYear, utcDate } from "@/lib/calendar";
import { holidayExportPath } from "@/lib/navigation";

type Props = { params: Promise<{ country: string; year: string }> };

export function parseHolidayYear(value: string): number | null {
  const year = Number(value);
  return /^\d{4}$/.test(value) && isSupportedHolidayYear(year) ? year : null;
}

function readParams(params: { country: string; year: string }) {
  const catalog = getHolidayCatalog(params.country);
  const year = parseHolidayYear(params.year);
  return catalog && year ? { catalog, year } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const values = readParams(await params);
  if (!values) return { title: "Holiday calendar not found" };
  return {
    title: `${values.catalog.name} Holidays ${values.year}`,
    description: `${values.year} ${values.catalog.demonym} national holiday dates, weekdays, observed days, and printable calendar links.`,
    alternates: { canonical: `/holidays/${values.catalog.slug}/${values.year}` },
  };
}

export function generateStaticParams() {
  const year = new Date().getUTCFullYear();
  return HOLIDAY_CATALOGS.flatMap((catalog) => [year - 1, year, year + 1].map((value) => ({ country: catalog.slug, year: String(value) })));
}

export default async function CountryHolidayYearPage({ params }: Props) {
  const values = readParams(await params);
  if (!values) notFound();
  const { catalog, year } = values;
  const holidays = getNationalHolidays(catalog.code, year);
  const formatter = new Intl.DateTimeFormat(catalog.locale, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const weekdayFormatter = new Intl.DateTimeFormat(catalog.locale, { weekday: "long", timeZone: "UTC" });
  const countryParam = catalog.code === "ca" ? "&country=ca" : "";

  return (
    <main className="content-page">
      <div className="shell content-shell">
        <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/holidays">Holidays</Link><span>/</span><span>{catalog.name}</span></nav>
        <div className="content-title-row">
          <div><span className="page-kicker">{catalog.calendarLabel}</span><h1>{catalog.name} holidays {year}</h1></div>
          <div className="content-title-actions">
            <Link className="button button-ink" href={`/calendar/${year}?scope=national${countryParam}`}>Open {year} calendar</Link>
            <a className="button button-ghost" href={holidayExportPath("csv", catalog.code, year)}>Download CSV</a>
            <a className="button button-ghost" href={holidayExportPath("ics", catalog.code, year)}>Download ICS</a>
          </div>
        </div>
        <p className="content-intro">National dates and standard observed days for current-law calendar planning. Regional holidays are not included.</p>
        <nav className="year-switcher" aria-label="Holiday year navigation">
          {year > MIN_SUPPORTED_HOLIDAY_YEAR && <Link href={`/holidays/${catalog.slug}/${year - 1}`}>← {year - 1}</Link>}
          <span>{year}</span>
          {year < MAX_SUPPORTED_HOLIDAY_YEAR && <Link href={`/holidays/${catalog.slug}/${year + 1}`}>{year + 1} →</Link>}
        </nav>
        <div className="table-scroll">
          <table className="holiday-table">
            <thead><tr><th>Date</th><th>Weekday</th><th>Holiday</th><th>Category</th></tr></thead>
            <tbody>
              {holidays.map((holiday) => {
                const [dateYear, month, day] = holiday.date.split("-").map(Number);
                const date = utcDate(dateYear!, month!, day!);
                return (
                  <tr key={`${holiday.date}-${holiday.id}-${holiday.observed ? "observed" : "actual"}`}>
                    <td>{formatter.format(date)}</td>
                    <td>{weekdayFormatter.format(date)}</td>
                    <td><Link href={`/holidays/${catalog.slug}/holiday/${holiday.id}`}>{holiday.name}</Link></td>
                    <td><span className="category-tag">National{holiday.observed ? " · Observed" : ""}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <aside className="content-note"><strong>Observed dates</strong><p>{catalog.observedNote}</p></aside>
        <p className="source-copy">Coverage uses current national rules for planning dates from {MIN_SUPPORTED_HOLIDAY_YEAR} through {MAX_SUPPORTED_HOLIDAY_YEAR}; it is not a historical record. Source reference: <a href={catalog.sourceUrl} rel="noreferrer">{catalog.sourceLabel}</a>. Always confirm workplace closures with the relevant employer or authority.</p>
      </div>
    </main>
  );
}
