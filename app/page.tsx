import Link from "next/link";
import { ArrowRight, CalendarDays, Check, FileText, Grid2X2, Printer, Share2, Sparkles } from "@/components/icons";
import { CalendarGrid } from "@/components/calendar-grid";
import { createCalendarMonth, getUsFederalHolidaysForRange } from "@/lib/calendar";

export default function HomePage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const calendar = createCalendarMonth({
    year,
    month,
    holidays: getUsFederalHolidaysForRange(year, year),
  });

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
