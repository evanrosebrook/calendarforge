import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import {
  createPayPeriodCalendar,
  payPeriodCalendarStateToParams,
  type PayPeriodCalendarState,
} from "@/lib/pay-period-calendar";

export const metadata: Metadata = {
  title: "2027 Biweekly Pay Calendar — Three-Paycheck Months",
  description: "See why 2027 three-paycheck months depend on your biweekly payday. Compare two Friday pay cycles, then make a printable calendar from your own payday.",
  alternates: { canonical: "/pay-period-calendar/2027" },
};

const examplePaydays = ["2027-01-08", "2027-01-15"] as const;
const monthListFormatter = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" });

function formatPayday(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`));
}

export default function PayPeriodGuide2027Page() {
  const examples = examplePaydays.map((knownPayday) => {
    const state: PayPeriodCalendarState = {
      year: 2027,
      knownPayday,
      lagDays: 6,
      adjustment: "none",
      firstDayOfWeek: 0,
    };
    return {
      knownPayday,
      calendar: createPayPeriodCalendar(state),
      href: `/pay-period-calendar?${payPeriodCalendarStateToParams(state)}`,
    };
  });

  return (
    <main className="content-page pay-period-guide-page">
      <BreadcrumbStructuredData items={[
        { name: "Calendar Forge", path: "/" },
        { name: "Pay-period calendar", path: "/pay-period-calendar" },
        { name: "2027 pay calendar", path: "/pay-period-calendar/2027" },
      ]} />
      <div className="shell content-shell">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/pay-period-calendar">Pay-period calendar</Link><span aria-hidden="true">/</span>
          <span aria-current="page">2027</span>
        </nav>
        <span className="page-kicker">2027 planning guide</span>
        <h1>2027 biweekly pay calendar</h1>
        <p className="content-intro">Which months have three paychecks in 2027? There is no single answer: it depends on your actual 14-day payday cycle and how your employer handles holidays. Compare two examples, then build a calendar using one of your own paydays.</p>

        <div className="content-note">
          <strong>The short answer</strong>
          <p>With no payday adjustments, a cycle containing Friday, January 8 has three paydays in April and October. A cycle containing Friday, January 15 has three in January, July, and December. These are examples, not a universal payroll schedule.</p>
        </div>

        <section className="pay-period-guide-section" aria-labelledby="pay-cycle-examples">
          <h2 id="pay-cycle-examples">Two Friday cycles, different results</h2>
          <p>Each example counts paydays exactly 14 days apart. The displayed dates are scheduled paydays, without moves for weekends or holidays.</p>
          <div className="country-card-grid">
            {examples.map(({ knownPayday, calendar, href }) => (
              <article className="country-card pay-period-example" key={knownPayday}>
                <span>Known payday: {formatPayday(knownPayday)}</span>
                <h3>{monthListFormatter.format(calendar.threePaycheckMonths.map((month) => month.label))}</h3>
                <p>{calendar.payPeriods.length} paydays fall in 2027 on this unadjusted cycle.</p>
                <ul>
                  {calendar.threePaycheckMonths.map((month) => (
                    <li key={month.month}>
                      <strong>{month.label}</strong>
                      <span>{month.payDates.map(formatPayday).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
                <Link className="button button-ghost" href={href}>Open this example</Link>
              </article>
            ))}
          </div>
          <p className="source-copy">The January 15 example also includes January 1, a U.S. federal holiday, on the same 14-day cycle. An employer that moves that payday into December 2026 will show a different 2027 count. Always use your employer’s actual payday and adjustment policy.</p>
        </section>

        <section className="pay-period-guide-section pay-period-guide-faq" aria-labelledby="payday-questions">
          <h2 id="payday-questions">Two details that change the answer</h2>
          <h3>Why can a biweekly cycle have 27 paydays in 2027?</h3>
          <p>There are 26 complete 14-day spans, plus one day, in a 365-day year. A cycle with scheduled paydays on both January 1 and December 31 therefore has 27 dates in 2027 before holiday adjustments. Moving a payday across the year boundary can change that count.</p>
          <h3>Is biweekly the same as twice a month?</h3>
          <p>No. Biweekly means every 14 days; twice monthly means two paydays in each month, usually 24 in a year. This guide and generator model biweekly schedules only.</p>
        </section>

        <section className="calculator-explainer" aria-labelledby="find-your-paydays">
          <div><span className="page-kicker">Make it yours</span><h2 id="find-your-paydays">Find your own three-paycheck months</h2></div>
          <div className="calculator-explainer-grid">
            <article><h3>Start with a real payday</h3><p>Take one payday from your payroll calendar or pay stub. The generator steps forward and backward by 14 days, so the date does not need to be the first payday of the year.</p></article>
            <article><h3>Choose the adjustment rule</h3><p>If your employer moves weekend or federal-holiday paydays, select the matching earlier or later planning rule. The calendar shows both scheduled and adjusted dates.</p></article>
            <article><h3>Take the schedule with you</h3><p>Review all pay periods and three-paycheck months, then print the calendar or export ICS and CSV files. The payroll lag changes period boundaries, not the 14-day payday cadence.</p></article>
          </div>
        </section>

        <div className="inline-actions">
          <Link className="button button-ink" href="/pay-period-calendar?year=2027">Build my 2027 pay calendar</Link>
          <Link className="button button-ghost" href="/pay-period-calendar">About the generator</Link>
        </div>
        <p className="source-copy">Planning aid only. Your employer’s payroll calendar controls actual pay dates, deposits, and period cutoffs. For the federal holiday dates used by the optional adjustment rule, see the <a href="https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/">U.S. Office of Personnel Management holiday schedule</a>.</p>
      </div>
    </main>
  );
}
