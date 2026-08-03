import Link from "next/link";

const ITEMS = [
  { href: "/date-calculator/days-between", label: "Days between" },
  { href: "/date-calculator/add-subtract", label: "Add or subtract" },
  { href: "/today", label: "Today" },
] as const;

export function CalculatorNav({ current }: { current?: string }) {
  return (
    <nav className="calculator-nav no-print" aria-label="Date calculators">
      <Link className={!current ? "active" : ""} href="/date-calculator">All calculators</Link>
      {ITEMS.map((item) => <Link className={current === item.href ? "active" : ""} href={item.href} key={item.href}>{item.label}</Link>)}
    </nav>
  );
}
