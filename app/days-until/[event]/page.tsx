import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CountdownResult } from "@/components/countdown-result";
import { PageActions } from "@/components/page-actions";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { toIsoDate, utcDate } from "@/lib/calendar";
import { getCountdownEvent, getNextCountdownTarget, type CountdownEventId } from "@/lib/countdown";
import { formatCalendarDate } from "@/lib/date-calculators";

const EVENT_PAGES = ["christmas", "easter"] as const;
type EventPageId = (typeof EVENT_PAGES)[number];
type Props = { params: Promise<{ event: string }> };

export const dynamicParams = false;
export const dynamic = "force-dynamic";

function readEvent(value: string) {
  if (!EVENT_PAGES.includes(value as EventPageId)) return null;
  return getCountdownEvent(value as CountdownEventId) ?? null;
}

export function generateStaticParams() {
  return EVENT_PAGES.map((event) => ({ event }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = readEvent((await params).event);
  if (!event) return { title: "Countdown not found" };
  return {
    title: `How Many Days Until ${event.shortLabel}?`,
    description: `See the live UTC countdown to the next ${event.label}, including calendar days, full weeks, and Monday–Friday weekdays.`,
    alternates: { canonical: `/days-until/${event.id}` },
  };
}

export default async function CountdownEventPage({ params }: Props) {
  const event = readEvent((await params).event);
  if (!event) notFound();
  const now = new Date();
  const today = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  const target = getNextCountdownTarget(event.id, today);
  if (!target) notFound();
  const calculatorHref = `/date-calculator/days-until?start=${toIsoDate(today)}&target=${target.isoDate}`;

  return (
    <main className="calculator-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: "Date calculators", path: "/date-calculator" },
        { name: "Days until calculator", path: "/date-calculator/days-until" },
        { name: event.shortLabel, path: `/days-until/${event.id}` },
      ]} />
      <div className="shell calculator-shell">
        <nav className="breadcrumb no-print" aria-label="Breadcrumb"><Link href="/date-calculator">Date calculators</Link><span>/</span><Link href="/date-calculator/days-until">Days until</Link><span>/</span><span>{event.shortLabel}</span></nav>
        <div className="calculator-hero-row">
          <header className="calculator-hero compact">
            <span className="page-kicker">Live UTC countdown</span>
            <h1>How many days until {event.shortLabel}?</h1>
            <p>The next {event.label} is <strong>{formatCalendarDate(target.date)}</strong>. This page counts from today’s Gregorian calendar date in UTC.</p>
          </header>
          <PageActions />
        </div>

        <div className="calculator-workspace">
          <aside className="countdown-event-copy">
            <span className="page-kicker">About this date</span>
            <h2>{eventCopy(event.id).title}</h2>
            <p>{eventCopy(event.id).copy}</p>
            <Link className="text-link" href={calculatorHref}>Choose another starting date →</Link>
          </aside>
          <CountdownResult start={today} target={target.date} calculatorHref={calculatorHref} />
        </div>

        <section className="calculator-explainer no-print">
          <div><span className="page-kicker">The details</span><h2>How this countdown works</h2></div>
          <div className="calculator-explainer-grid">
            <article><h3>Today is day zero</h3><p>The countdown excludes today and includes {event.shortLabel}. If today is the event date, the result is zero and the page says “Today.”</p></article>
            <article><h3>Calendar days</h3><p>UTC calendar dates avoid daylight-saving-time shifts. Leap days are included automatically whenever they fall in the interval.</p></article>
            <article><h3>Weekdays</h3><p>The weekday total counts Monday through Friday. It does not remove public holidays or regional non-working days.</p></article>
          </div>
        </section>

        <div className="inline-actions no-print">
          <Link className="button button-ink" href={calculatorHref}>Open the countdown calculator</Link>
          <Link className="button button-ghost" href={`/days-until/${event.id === "christmas" ? "easter" : "christmas"}`}>Days until {event.id === "christmas" ? "Easter" : "Christmas"}</Link>
        </div>
      </div>
    </main>
  );
}

function eventCopy(id: CountdownEventId): { title: string; copy: string } {
  if (id === "christmas") {
    return {
      title: "Christmas is always December 25",
      copy: "The countdown uses Christmas Day itself, not Christmas Eve or an observed weekday holiday. When December 25 has passed in UTC, it rolls forward to Christmas of the following year.",
    };
  }
  return {
    title: "Western Easter changes each year",
    copy: "This page calculates Western Easter Sunday in the Gregorian calendar. It can fall from March 22 through April 25; Orthodox Easter and local observances may use a different date.",
  };
}
