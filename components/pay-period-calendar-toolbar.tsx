"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MAX_PAY_PERIOD_YEAR,
  MAX_PAYROLL_LAG_DAYS,
  MIN_PAY_PERIOD_YEAR,
  payPeriodCalendarStateToParams,
  type PaydayAdjustment,
  type PayPeriodCalendarState,
} from "@/lib/pay-period-calendar";
import { reportTelemetry } from "@/lib/telemetry-client";
import { Download, Printer, Share2 } from "./icons";

export function PayPeriodCalendarToolbar({ state }: { state: PayPeriodCalendarState }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const exportQuery = payPeriodCalendarStateToParams(state).toString();

  function setParam(key: string, value?: string) {
    const next = payPeriodCalendarStateToParams(state);
    if (value === undefined) next.delete(key);
    else next.set(key, value);
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  async function share() {
    const url = `${location.origin}${pathname}?${payPeriodCalendarStateToParams(state)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${state.year} biweekly pay calendar`, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast("Pay calendar link copied");
        window.setTimeout(() => setToast(""), 2200);
      }
      reportTelemetry("share", { surface: "pay_period" });
    } catch {
      // The native share sheet was dismissed.
    }
  }

  function print() {
    reportTelemetry("print", { surface: "pay_period" });
    window.print();
  }

  return (
    <aside className={`toolbar builder-toolbar pay-period-toolbar no-print ${pending ? "is-pending" : ""}`} aria-label="Pay-period calendar settings">
      <section className="toolbar-section">
        <span className="toolbar-label">Calendar year</span>
        <div className="field">
          <label htmlFor="pay-period-year">Year to plan</label>
          <input id="pay-period-year" type="number" min={MIN_PAY_PERIOD_YEAR} max={MAX_PAY_PERIOD_YEAR} value={state.year} onChange={(event) => setParam("year", event.target.value)} />
        </div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Biweekly cycle</span>
        <div className="field">
          <label htmlFor="known-payday">One known payday</label>
          <input id="known-payday" type="date" min="0001-01-01" max="9999-12-31" value={state.knownPayday} onChange={(event) => setParam("payday", event.target.value)} />
          <small className="field-help">Every other payday is counted in 14-day steps from this anchor.</small>
        </div>
        <div className="field">
          <label htmlFor="payroll-lag">Period ends before payday</label>
          <select id="payroll-lag" value={state.lagDays} onChange={(event) => setParam("lag", event.target.value)}>
            {Array.from({ length: MAX_PAYROLL_LAG_DAYS + 1 }, (_, days) => <option key={days} value={days}>{days} {days === 1 ? "day" : "days"}</option>)}
          </select>
          <small className="field-help">Each displayed pay period always covers 14 calendar days.</small>
        </div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Payday rules</span>
        <div className="field">
          <label htmlFor="payday-adjustment">Weekend or U.S. federal holiday</label>
          <select id="payday-adjustment" value={state.adjustment} onChange={(event) => setParam("adjust", event.target.value as PaydayAdjustment)}>
            <option value="previous">Move to previous business day</option>
            <option value="next">Move to next business day</option>
            <option value="none">Keep scheduled date</option>
          </select>
          <small className="field-help">Confirm the actual rule with your employer or payroll provider.</small>
        </div>
        <div className="field">
          <label>Weeks start on</label>
          <div className="segmented">
            <button className={state.firstDayOfWeek === 0 ? "active" : ""} onClick={() => setParam("weekStart")} type="button">Sunday</button>
            <button className={state.firstDayOfWeek === 1 ? "active" : ""} onClick={() => setParam("weekStart", "monday")} type="button">Monday</button>
          </div>
        </div>
      </section>

      <div className="toolbar-actions">
        <button className="button button-ink" type="button" onClick={print}><Printer size={15} /> Print / save PDF</button>
        <a className="button button-ghost" href={`/api/pay-period-calendar/ics?${exportQuery}`} onClick={() => reportTelemetry("export", { format: "ics", surface: "pay_period" })}><Download size={15} /> Download ICS</a>
        <a className="button button-ghost" href={`/api/pay-period-calendar/csv?${exportQuery}`} onClick={() => reportTelemetry("export", { format: "csv", surface: "pay_period" })}><Download size={15} /> Download CSV</a>
        <button className="button button-ghost" type="button" onClick={share}><Share2 size={15} /> Share link</button>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </aside>
  );
}
