"use client";

import Link from "next/link";
import { reportTelemetry } from "@/lib/telemetry-client";

type Props = { isoDate: string; year: number; month: number };

export function DateGuideActions({ isoDate, year, month }: Props) {
  function track(placement: string) {
    reportTelemetry("date_guide_action", { placement, surface: "date_guide" });
  }

  function printPlanner() {
    track("print_planner");
    reportTelemetry("print", { surface: "date_guide" });
    window.print();
  }

  return (
    <nav className="date-guide-actions no-print" aria-label="Use this date">
      <span>Use this date</span>
      <div>
        <Link className="button button-ghost" href={`/calendar/${year}/${month}`} onClick={() => track("open_calendar")}>Open monthly calendar</Link>
        <Link className="button button-ghost" href={`/date-calculator/days-between?start=${isoDate}`} onClick={() => track("days_between")}>Days from this date</Link>
        <Link className="button button-ghost" href={`/date-calculator/business-days?mode=shift&date=${isoDate}`} onClick={() => track("business_days")}>Add business days</Link>
        <button className="button button-ink" onClick={printPlanner} type="button">Print daily planner</button>
      </div>
    </nav>
  );
}
