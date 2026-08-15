import Link from "next/link";
import { Brand } from "./brand";
import { ChevronDown } from "./icons";

const CALCULATORS = [
  { href: "/date-calculator/days-until", label: "Days until" },
  { href: "/date-calculator/days-between", label: "Days between" },
  { href: "/date-calculator/add-subtract", label: "Add or subtract" },
  { href: "/date-calculator/business-days", label: "Business days" },
  { href: "/date-calculator/age", label: "Age calculator" },
  { href: "/today", label: "Today" },
] as const;

export function SiteHeader() {
  const year = new Date().getUTCFullYear();
  return (
    <header className="site-header no-print">
      <div className="shell header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Primary navigation">
          <Link href={`/calendar/${year}`}>Year calendar</Link>
          <Link href={`/calendar/${year}/${new Date().getUTCMonth() + 1}`}>Monthly calendar</Link>
          <Link href="/fiscal-calendar">Fiscal calendar</Link>
          <Link href={`/moon-phases/${year}`}>Moon phases</Link>
          <details className="main-nav-dropdown">
            <summary>Calculators <ChevronDown aria-hidden="true" size={14} strokeWidth={2} /></summary>
            <div className="main-nav-menu">
              <Link href="/date-calculator">All date calculators</Link>
              {CALCULATORS.map((calculator) => <Link href={calculator.href} key={calculator.href}>{calculator.label}</Link>)}
            </div>
          </details>
          <Link href="/holidays">Holidays</Link>
        </nav>
        <Link className="button button-small button-ink" href="/make-calendar">
          Make a calendar
        </Link>
      </div>
    </header>
  );
}
