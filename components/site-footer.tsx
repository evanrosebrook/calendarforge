import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter() {
  const year = new Date().getUTCFullYear();
  const month = new Date().getUTCMonth() + 1;
  return (
    <footer className="site-footer no-print">
      <div className="shell footer-grid">
        <div>
          <Brand />
          <p>Clean calendars, made for real plans.</p>
        </div>
        <div className="footer-links">
          <Link href={`/calendar/${year}`}>Year calendar</Link>
          <Link href={`/calendar/${year}/${month}`}>Monthly calendar</Link>
          <Link href={`/calendar/monday-start/${year}/${month}`}>Monday-start calendar</Link>
          <Link href="/make-calendar">Make a calendar</Link>
          <Link href="/fiscal-calendar">Fiscal calendar</Link>
          <Link href="/shift-calendar">Shift calendar</Link>
          <Link href={`/moon-phases/${year}`}>Moon phases</Link>
          <Link href="/date-calculator">Calculators</Link>
          <Link href="/holidays">Holidays</Link>
          <Link href="/privacy">Privacy</Link>
          <a href="mailto:hello@calendarforge.net">Feedback</a>
        </div>
        <p className="footer-note">No account required. Calendar contents stay out of analytics.</p>
      </div>
    </footer>
  );
}
