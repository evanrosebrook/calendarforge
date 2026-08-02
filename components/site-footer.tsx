import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter() {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="site-footer no-print">
      <div className="shell footer-grid">
        <div>
          <Brand />
          <p>Clean calendars, made for real plans.</p>
        </div>
        <div className="footer-links">
          <Link href={`/calendar/${year}`}>Year calendar</Link>
          <Link href={`/calendar/${year}/${new Date().getUTCMonth() + 1}`}>Monthly calendar</Link>
          <a href="mailto:hello@calendarforge.app">Feedback</a>
        </div>
        <p className="footer-note">No account. No tracking cookies. Just your calendar.</p>
      </div>
    </footer>
  );
}
