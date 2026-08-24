"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MAX_SHIFT_BLOCK_DAYS, SHIFT_MONTH_COUNTS, shiftCalendarStateToParams, type ShiftCalendarState, type ShiftPreset } from "@/lib/shift-calendar";
import { reportTelemetry } from "@/lib/telemetry-client";
import { Download, Printer, Share2 } from "./icons";

export function ShiftCalendarToolbar({ state }: { state: ShiftCalendarState }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const exportQuery = shiftCalendarStateToParams(state).toString();

  function navigate(mutator: (params: URLSearchParams) => void) {
    const next = shiftCalendarStateToParams(state);
    mutator(next);
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  function setParam(key: string, value?: string) {
    navigate((params) => value === undefined ? params.delete(key) : params.set(key, value));
  }

  function setPreset(preset: ShiftPreset) {
    navigate((params) => {
      params.set("pattern", preset);
      params.delete("workDays");
      params.delete("offDays");
      if (preset === "custom") {
        params.set("workDays", String(state.workDays));
        params.set("offDays", String(state.offDays));
      }
    });
  }

  function setCustomCount(key: "workDays" | "offDays", value: string) {
    navigate((params) => {
      params.set("pattern", "custom");
      params.set(key, value);
    });
  }

  async function share() {
    const url = `${location.origin}${pathname}?${shiftCalendarStateToParams(state)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Shift calendar from Calendar Forge", url });
      else {
        await navigator.clipboard.writeText(url);
        setToast("Shift calendar link copied");
        window.setTimeout(() => setToast(""), 2200);
      }
      reportTelemetry("share", { surface: "shift_calendar" });
    } catch {
      // The native share sheet was dismissed.
    }
  }

  function print() {
    reportTelemetry("print", { surface: "shift_calendar" });
    window.print();
  }

  return (
    <aside className={`toolbar builder-toolbar shift-toolbar no-print ${pending ? "is-pending" : ""}`} aria-label="Shift calendar settings">
      <section className="toolbar-section">
        <span className="toolbar-label">Schedule start</span>
        <div className="field">
          <label htmlFor="shift-start-date">First work day</label>
          <input id="shift-start-date" type="date" min="0001-01-01" max="9999-12-31" value={state.startDate} onChange={(event) => setParam("startDate", event.target.value)} />
          <small className="field-help">The repeating cycle begins with a work block on this date.</small>
        </div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Rotation</span>
        <div className="field">
          <label htmlFor="shift-pattern">Pattern</label>
          <select id="shift-pattern" value={state.preset} onChange={(event) => setPreset(event.target.value as ShiftPreset)}>
            <option value="4-4">4 on / 4 off</option>
            <option value="2-2">2 on / 2 off</option>
            <option value="7-7">7 on / 7 off</option>
            <option value="custom">Custom pattern</option>
          </select>
        </div>
        {state.preset === "custom" && <div className="shift-count-fields">
          <div className="field"><label htmlFor="shift-work-days">Work days</label><input id="shift-work-days" type="number" min="1" max={MAX_SHIFT_BLOCK_DAYS} value={state.workDays} onChange={(event) => setCustomCount("workDays", event.target.value)} /></div>
          <div className="field"><label htmlFor="shift-off-days">Off days</label><input id="shift-off-days" type="number" min="1" max={MAX_SHIFT_BLOCK_DAYS} value={state.offDays} onChange={(event) => setCustomCount("offDays", event.target.value)} /></div>
        </div>}
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Calendar view</span>
        <div className="field">
          <label htmlFor="shift-months">Preview length</label>
          <select id="shift-months" value={state.monthCount} onChange={(event) => setParam("months", event.target.value)}>
            {SHIFT_MONTH_COUNTS.map((count) => <option key={count} value={count}>{count} {count === 1 ? "month" : "months"}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Weeks start on</label>
          <div className="segmented">
            <button className={state.firstDayOfWeek === 0 ? "active" : ""} onClick={() => setParam("weekStart")} type="button">Sunday</button>
            <button className={state.firstDayOfWeek === 1 ? "active" : ""} onClick={() => setParam("weekStart", "monday")} type="button">Monday</button>
          </div>
        </div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Calendar export</span>
        <Toggle label="Include off days in ICS" pressed={state.includeOffDays} onClick={() => setParam("includeOff", state.includeOffDays ? undefined : "1")} />
        <small className="field-help">CSV always includes every day. ICS includes work days by default, so your calendar stays uncluttered.</small>
      </section>

      <div className="toolbar-actions">
        <button className="button button-ink" type="button" onClick={print}><Printer size={15} /> Print / save PDF</button>
        <a className="button button-ghost" href={`/api/shift-calendar/ics?${exportQuery}`} onClick={() => reportTelemetry("export", { format: "ics", surface: "shift_calendar" })}><Download size={15} /> Download ICS</a>
        <a className="button button-ghost" href={`/api/shift-calendar/csv?${exportQuery}`} onClick={() => reportTelemetry("export", { format: "csv", surface: "shift_calendar" })}><Download size={15} /> Download CSV</a>
        <button className="button button-ghost" type="button" onClick={share}><Share2 size={15} /> Share link</button>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </aside>
  );
}

function Toggle({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return <div className="toggle-row"><span>{label}</span><button aria-label={`Toggle ${label.toLowerCase()}`} aria-pressed={pressed} className={`switch ${pressed ? "on" : ""}`} onClick={onClick} type="button" /></div>;
}
