import Link from "next/link";
import { Brand } from "./brand";
import { ChevronDown } from "./icons";

type NavigationItem = { href: string; label: string };

const CALCULATORS = [
  { href: "/today", label: "Today’s date" },
  { href: "/date-calculator/days-between", label: "Days between" },
  { href: "/date-calculator/add-subtract", label: "Add or subtract" },
  { href: "/date-calculator/business-days", label: "Business days" },
  { href: "/date-calculator/age", label: "Age calculator" },
  { href: "/date-calculator/days-until", label: "Days until" },
  { href: "/date-calculator", label: "All date calculators" },
] as const;

export function SiteHeader() {
  const year = new Date().getUTCFullYear();
  const month = new Date().getUTCMonth() + 1;
  const calendars = [
    { href: `/calendar/${year}/${month}`, label: "Monthly calendar" },
    { href: `/calendar/${year}`, label: "Year calendar" },
    { href: `/calendar/monday-start/${year}/${month}`, label: "Monday-start calendar" },
    { href: "/fiscal-calendar", label: "Fiscal calendar" },
    { href: "/holidays", label: "Holiday calendars" },
    { href: `/moon-phases/${year}`, label: "Moon phases" },
  ] as const;

  return (
    <header className="site-header no-print">
      <div className="shell header-inner">
        <Brand />
        <nav className="main-nav desktop-nav" aria-label="Primary navigation">
          <NavigationDropdown label="Calendars" items={calendars} />
          <NavigationDropdown label="Calculators" items={CALCULATORS} />
        </nav>
        <Link className="button button-small button-ink" href="/make-calendar">
          Make a calendar
        </Link>
        <details className="mobile-nav">
          <summary>Menu <ChevronDown aria-hidden="true" size={15} strokeWidth={2} /></summary>
          <div className="mobile-nav-menu">
            <NavigationGroup label="Calendars" items={calendars} />
            <NavigationGroup label="Calculators" items={CALCULATORS} />
            <Link className="button button-ink mobile-nav-cta" href="/make-calendar">Make a calendar</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function NavigationDropdown({ label, items }: { label: string; items: readonly NavigationItem[] }) {
  return (
    <details className="main-nav-dropdown" name="primary-navigation">
      <summary>{label} <ChevronDown aria-hidden="true" size={14} strokeWidth={2} /></summary>
      <div className="main-nav-menu">
        {items.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
      </div>
    </details>
  );
}

function NavigationGroup({ label, items }: { label: string; items: readonly NavigationItem[] }) {
  return (
    <section className="mobile-nav-group" aria-label={label}>
      <strong>{label}</strong>
      <div>{items.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</div>
    </section>
  );
}
