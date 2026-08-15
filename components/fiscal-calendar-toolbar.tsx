"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addUtcDays, toIsoDate } from "@/lib/calendar";
import { MAX_FISCAL_DAYS, fiscalCalendarStateToParams, type FiscalCalendarState } from "@/lib/fiscal-calendar";
import { reportTelemetry } from "@/lib/telemetry-client";
import { Download, Printer, Share2 } from "./icons";

type Props = { state: FiscalCalendarState };

export function FiscalCalendarToolbar({ state }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const maxEndCandidate = addUtcDays(new Date(`${state.startDate}T00:00:00Z`), MAX_FISCAL_DAYS - 1);
  const maxEndDate = maxEndCandidate.getUTCFullYear() > 9999 ? "9999-12-31" : toIsoDate(maxEndCandidate);
  const exportQuery = fiscalCalendarStateToParams(state).toString();

  function navigate(mutator: (params: URLSearchParams) => void) {
    const next = fiscalCalendarStateToParams(state);
    mutator(next);
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  function setParam(key: string, value?: string) {
    navigate((params) => {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    });
  }

  async function share() {
    const url = `${location.origin}${pathname}?${fiscalCalendarStateToParams(state)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Fiscal calendar from Calendar Forge", url });
      else {
        await navigator.clipboard.writeText(url);
        setToast("Fiscal calendar link copied");
        window.setTimeout(() => setToast(""), 2200);
      }
      reportTelemetry("share", { surface: "fiscal-calendar" });
    } catch {
      // The native share sheet was dismissed.
    }
  }

  function print() {
    reportTelemetry("print", { surface: "fiscal-calendar" });
    window.print();
  }

  return (
    <aside className={`toolbar builder-toolbar fiscal-toolbar no-print ${pending ? "is-pending" : ""}`} aria-label="Fiscal calendar settings">
      <section className="toolbar-section">
        <span className="toolbar-label">Fiscal range</span>
        <div className="field">
          <label htmlFor="fiscal-start-date">Start date</label>
          <input id="fiscal-start-date" type="date" min="0001-01-01" max="9999-12-31" value={state.startDate} onChange={(event) => setParam("startDate", event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fiscal-end-date">End date</label>
          <input id="fiscal-end-date" type="date" min={state.startDate} max={maxEndDate} value={state.endDate} onChange={(event) => setParam("endDate", event.target.value)} />
          <small className="field-help">Inclusive; up to {MAX_FISCAL_DAYS} days.</small>
        </div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Fiscal rules</span>
        <div className="field">
          <label>Fiscal year is named for its</label>
          <div className="segmented">
            <button className={state.labelBy === "start" ? "active" : ""} onClick={() => setParam("labelBy", "start")} type="button">Start year</button>
            <button className={state.labelBy === "end" ? "active" : ""} onClick={() => setParam("labelBy")} type="button">End year</button>
          </div>
        </div>
        <div className="field">
          <label>Calendar weeks start on</label>
          <div className="segmented">
            <button className={state.firstDayOfWeek === 0 ? "active" : ""} onClick={() => setParam("weekStart")} type="button">Sunday</button>
            <button className={state.firstDayOfWeek === 1 ? "active" : ""} onClick={() => setParam("weekStart", "monday")} type="button">Monday</button>
          </div>
        </div>
        <Toggle label="Fiscal week numbers" pressed={state.showWeekNumbers} onClick={() => setParam("weekNumbers", state.showWeekNumbers ? undefined : "1")} />
        <small className="field-help">Accounting periods follow calendar months. The first and last may be partial; quarters contain three periods.</small>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Calendar details</span>
        <Toggle label="National holidays" pressed={state.showHolidays} onClick={() => setParam("holidays", state.showHolidays ? "0" : undefined)} />
        {state.showHolidays && <div className="field">
          <label htmlFor="fiscal-country">Holiday country</label>
          <select id="fiscal-country" value={state.holidayCountry} onChange={(event) => setParam("country", event.target.value === "ca" ? "ca" : undefined)}>
            <option value="us">United States</option><option value="ca">Canada</option>
          </select>
          <small className="field-help">National holidays only; 1971–2100.</small>
        </div>}
        <Toggle label="Shade weekends" pressed={state.highlightWeekends} onClick={() => setParam("weekends", state.highlightWeekends ? "0" : undefined)} />
        <div className="field">
          <label htmlFor="fiscal-locale">Language & locale</label>
          <select id="fiscal-locale" value={state.locale} onChange={(event) => setParam("locale", event.target.value === "en-US" ? undefined : event.target.value)}>
            <option value="en-US">English (United States)</option><option value="en-CA">English (Canada)</option><option value="fr-CA">Français (Canada)</option>
          </select>
        </div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Print layout</span>
        <div className="segmented">
          <button className={state.orientation === "portrait" ? "active" : ""} onClick={() => setParam("orientation", "portrait")} type="button">Portrait</button>
          <button className={state.orientation === "landscape" ? "active" : ""} onClick={() => setParam("orientation")} type="button">Landscape</button>
        </div>
        <div className="field">
          <label htmlFor="fiscal-paper">Paper</label>
          <select id="fiscal-paper" value={state.paper} onChange={(event) => setParam("paper", event.target.value === "a4" ? "a4" : undefined)}>
            <option value="letter">Letter</option><option value="a4">A4</option>
          </select>
        </div>
      </section>

      <div className="toolbar-actions">
        <button className="button button-ink" type="button" onClick={print}><Printer size={15} /> Print / save PDF</button>
        <a className="button button-ghost" href={`/api/fiscal-calendar/csv?${exportQuery}`} onClick={() => reportTelemetry("export", { format: "csv", surface: "fiscal-calendar" })}><Download size={15} /> Download CSV</a>
        <button className="button button-ghost" type="button" onClick={share}><Share2 size={15} /> Share link</button>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </aside>
  );
}

function Toggle({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return <div className="toggle-row"><span>{label}</span><button aria-label={`Toggle ${label.toLowerCase()}`} aria-pressed={pressed} className={`switch ${pressed ? "on" : ""}`} onClick={onClick} type="button" /></div>;
}
