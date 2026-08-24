import Link from "next/link";
import { ArrowRight, CalendarDays, Check, FileText, Grid2X2, Printer, Share2, Sparkles } from "@/components/icons";
import { CalendarGrid } from "@/components/calendar-grid";
import { createCalendarMonth, getUsFederalHolidaysForRange, toIsoDate, utcDate } from "@/lib/calendar";

export default function HomePage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const calendar = createCalendarMonth({
    year,
    month,
    holidays: getUsFederalHolidaysForRange(year, year),
  });
  const today = toIsoDate(utcDate(year, month, now.getUTCDate()));

  return (
    <main>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <span className="eyebrow">Built for plans, not pop-ups</span>
            <h1>Make space for <em>what matters.</em></h1>
            <p className="hero-copy">Beautiful, practical calendars you can shape around your life—then print, download, or share. Free forever. No account needed.</p>
            <div className="hero-actions">
              <Link className="button button-accent" href={`/calendar/${year}/${month}`}>Create your calendar <ArrowRight size={17} /></Link>
              <Link className="button button-ghost" href={`/calendar/${year}`}>View the full year</Link>
            </div>
            <div className="trust-row">
              <span className="trust-item"><Check size={14} /> No sign-up</span>
              <span className="trust-item"><Check size={14} /> Print-ready</span>
              <span className="trust-item"><Check size={14} /> Shareable settings</span>
            </div>
          </div>
          <div className="calendar-preview-wrap" aria-label="Calendar preview">
            <div className="paper-card">
              <div className="preview-stamp">Free<br />to use</div>
              <CalendarGrid calendar={calendar} compact linkDates />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-rule" id="features">
        <div className="shell">
          <div className="section-heading">
            <div><span className="eyebrow">Simple by design</span><h2>A calendar that works<br />the way you do.</h2></div>
            <p>Start with a clean, useful calendar. Change only what matters, keep the result in your URL, and take it anywhere.</p>
          </div>
          <div className="feature-grid">
            <Feature number="01" icon={<CalendarDays size={21} />} title="Any month, any year" copy="Jump backward or forward without limits. Every calendar is generated accurately on demand." />
            <Feature number="02" icon={<Grid2X2 size={21} />} title="Your week, your way" copy="Start on Sunday or Monday, add ISO week numbers, holidays, and weekend shading." />
            <Feature number="03" icon={<Printer size={21} />} title="Designed to print" copy="Crisp black-and-white layouts with useful writing space on Letter or A4 paper." />
            <Feature number="04" icon={<FileText size={21} />} title="Export what you need" copy="Download clean PDF, calendar, CSV, or spreadsheet files from one normalized calendar." />
            <Feature number="05" icon={<Share2 size={21} />} title="Share the exact view" copy="Every setting lives in the URL. Copy it once and collaborators see the same calendar." />
            <Feature number="06" icon={<Sparkles size={21} />} title="Nothing in the way" copy="No account, no paywall, and no ads in anything you print or export." />
          </div>
        </div>
      </section>

      <section className="section section-rule">
        <div className="shell">
          <div className="section-heading">
            <div><span className="eyebrow">Popular date tools</span><h2>Start with the answer<br />you need today.</h2></div>
            <p>Check the current date, inspect a specific day, or calculate the exact distance between two dates.</p>
          </div>
          <div className="calculator-card-grid calculator-card-grid-four">
            <article className="calculator-card"><span>Current date</span><h2>Today’s date</h2><p>See today’s weekday, ISO week number, date formats, and useful future dates in an explicit timezone.</p><Link className="text-link" href="/today">See today’s date →</Link></article>
            <article className="calculator-card"><span>Date reference</span><h2>Today’s date guide</h2><p>Open the full guide for today with numeric formats, holidays, a monthly calendar, and a printable daily planner.</p><Link className="text-link" href={`/date/${today}`}>Open today’s guide →</Link></article>
            <article className="calculator-card"><span>Date calculator</span><h2>Days between dates</h2><p>Count exact calendar days, weekdays, full weeks, and calendar duration with explicit endpoint rules.</p><Link className="text-link" href={`/date-calculator/days-between?start=${today}`}>Calculate days →</Link></article>
            <article className="calculator-card"><span>Work schedule</span><h2>Shift calendar</h2><p>Turn a 4-on/4-off, 2-on/2-off, 7-on/7-off, or custom rotation into a printable and shareable calendar.</p><Link className="text-link" href={`/shift-calendar?startDate=${today}&pattern=4-4&months=3`}>Build a shift calendar →</Link></article>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="shell home-cta-inner">
          <div><h2>Your next month, made clearer.</h2><p>Open the calendar. Make it yours. Get on with your day.</p></div>
          <Link className="button button-accent" href={`/calendar/${year}/${month}`}>Start with {calendar.label} <ArrowRight size={17} /></Link>
        </div>
      </section>
    </main>
  );
}

function Feature({ number, icon, title, copy }: { number: string; icon: React.ReactNode; title: string; copy: string }) {
  return <article className="feature-card"><div className="feature-number">{number}</div><div style={{ marginTop: 22 }}>{icon}</div><h3>{title}</h3><p>{copy}</p></article>;
}
