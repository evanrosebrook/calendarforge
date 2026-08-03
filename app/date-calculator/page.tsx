import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorNav } from "@/components/calculator-nav";

export const metadata: Metadata = {
  title: "Date Calculators",
  description: "Count days between dates, add or subtract calendar time, and inspect today's date in an explicit timezone.",
  alternates: { canonical: "/date-calculator" },
};

const CALCULATORS = [
  {
    href: "/date-calculator/days-between",
    kicker: "Compare two dates",
    title: "Days between dates",
    copy: "Count calendar days and Monday–Friday weekdays, include or exclude endpoints, and see the span in calendar units.",
  },
  {
    href: "/date-calculator/add-subtract",
    kicker: "Move through time",
    title: "Add or subtract dates",
    copy: "Shift a date by years, months, weeks, and days with predictable leap-year and month-end handling.",
  },
  {
    href: "/today",
    kicker: "Date reference",
    title: "Today",
    copy: "See today's date, week and day numbers, useful formats, and quick future dates in a selected timezone.",
  },
] as const;

export default function DateCalculatorPage() {
  return (
    <main className="calculator-page">
      <div className="shell calculator-shell">
        <CalculatorNav />
        <header className="calculator-hero">
          <span className="page-kicker">Date calculators</span>
          <h1>Useful date answers, without guesswork.</h1>
          <p>Every calculation uses calendar dates directly, stays explicit about counting rules, and can be bookmarked or shared.</p>
        </header>
        <div className="calculator-card-grid">
          {CALCULATORS.map((calculator) => (
            <article className="calculator-card" key={calculator.href}>
              <span>{calculator.kicker}</span>
              <h2>{calculator.title}</h2>
              <p>{calculator.copy}</p>
              <Link className="text-link" href={calculator.href}>Open calculator →</Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
