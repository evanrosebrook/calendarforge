import Link from "next/link";
import { Brand } from "./brand";

export function SiteHeader() {
  const year = new Date().getUTCFullYear();
  return (
    <header className="site-header no-print">
      <div className="shell header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Primary navigation">
          <Link href={`/calendar/${year}`}>Year calendar</Link>
          <Link href={`/calendar/${year}/${new Date().getUTCMonth() + 1}`}>Monthly calendar</Link>
          <Link href="/#features">Features</Link>
        </nav>
        <Link className="button button-small button-ink" href={`/calendar/${year}/${new Date().getUTCMonth() + 1}`}>
          Open calendar
        </Link>
      </div>
    </header>
  );
}
