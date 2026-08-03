"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { CalendarSettings } from "@/lib/settings";
import { reportTelemetry } from "@/lib/telemetry-client";
import { Download, Printer, Share2 } from "./icons";

type Props = { settings: CalendarSettings; year: number; month?: number };

export function CalendarToolbar({ settings, year, month }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(settings.title);
  const [toast, setToast] = useState("");
  const [downloadsOpen, setDownloadsOpen] = useState(false);

  function update(key: string, value?: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === undefined) next.delete(key); else next.set(key, value);
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }

  function toggle(key: string, enabled: boolean, enabledValue = "1", disabledValue?: string) {
    update(key, enabled ? enabledValue : disabledValue);
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "My Calendar Forge calendar", url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setToast("Link copied to clipboard");
        window.setTimeout(() => setToast(""), 2200);
      }
      reportTelemetry("share", { surface: "calendar" });
    } catch {
      // The native share sheet was dismissed.
    }
  }

  function print() {
    reportTelemetry("print", { surface: "calendar" });
    window.print();
  }

  const exportBase = `/api/export/`;
  const exportQuery = new URLSearchParams(searchParams.toString());
  exportQuery.set("year", String(year));
  if (month) exportQuery.set("month", String(month));

  return (
    <aside className={`toolbar no-print ${pending ? "is-pending" : ""}`} aria-label="Calendar settings">
      <section className="toolbar-section">
        <span className="toolbar-label">Week layout</span>
        <div className="segmented">
          <button className={settings.firstDayOfWeek === 0 ? "active" : ""} onClick={() => update("start")} type="button">Sunday</button>
          <button className={settings.firstDayOfWeek === 1 ? "active" : ""} onClick={() => update("start", "monday")} type="button">Monday</button>
        </div>
        <div className="toggle-row"><span>Week numbers</span><button aria-label="Toggle week numbers" aria-pressed={settings.showWeekNumbers} className={`switch ${settings.showWeekNumbers ? "on" : ""}`} onClick={() => toggle("weekNumbers", !settings.showWeekNumbers)} type="button" /></div>
        <div className="toggle-row"><span>National holidays</span><button aria-label="Toggle national holidays" aria-pressed={settings.showHolidays} className={`switch ${settings.showHolidays ? "on" : ""}`} onClick={() => toggle("holidays", !settings.showHolidays, "1", "0")} type="button" /></div>
        {settings.showHolidays && <div className="field">
          <label htmlFor="holiday-country">Holiday country</label>
          <select id="holiday-country" value={settings.holidayCountry} onChange={(event) => {
            const next = new URLSearchParams(searchParams.toString());
            if (event.target.value === "ca") next.set("country", "ca"); else next.delete("country");
            next.set("scope", "national");
            startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
          }}>
            <option value="us">United States</option><option value="ca">Canada</option>
          </select>
          <small className="field-help">National holidays only</small>
        </div>}
        <div className="toggle-row"><span>Shade weekends</span><button aria-label="Toggle weekend shading" aria-pressed={settings.highlightWeekends} className={`switch ${settings.highlightWeekends ? "on" : ""}`} onClick={() => toggle("weekends", !settings.highlightWeekends, "1", "0")} type="button" /></div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Page setup</span>
        <div className="segmented">
          <button className={settings.orientation === "portrait" ? "active" : ""} onClick={() => update("orientation")} type="button">Portrait</button>
          <button className={settings.orientation === "landscape" ? "active" : ""} onClick={() => update("orientation", "landscape")} type="button">Landscape</button>
        </div>
        <div className="field">
          <label htmlFor="paper-size">Paper size</label>
          <select id="paper-size" value={settings.paper} onChange={(event) => update("paper", event.target.value === "a4" ? "a4" : undefined)}>
            <option value="letter">US Letter</option><option value="a4">A4</option>
          </select>
        </div>
        {month && <div className="field">
          <label htmlFor="density">Calendar spacing</label>
          <select id="density" value={settings.density} onChange={(event) => update("density", event.target.value === "compact" ? "compact" : undefined)}>
            <option value="roomy">More writing room</option><option value="compact">Compact</option>
          </select>
        </div>}
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Personalize</span>
        <div className="field">
          <label htmlFor="calendar-title">Custom title</label>
          <input id="calendar-title" value={title} maxLength={80} placeholder={month ? "e.g. Family plans" : "e.g. Our year"} onChange={(event) => setTitle(event.target.value)} onBlur={() => update("title", title || undefined)} onKeyDown={(event) => { if (event.key === "Enter") update("title", title || undefined); }} />
        </div>
        {month && <div className="toggle-row"><span>Notes area</span><button aria-label="Toggle notes area" aria-pressed={settings.showNotes} className={`switch ${settings.showNotes ? "on" : ""}`} onClick={() => toggle("notes", !settings.showNotes)} type="button" /></div>}
      </section>

      <div className="toolbar-actions">
        <button className="button button-ink" type="button" onClick={print}><Printer size={15} /> Print / save PDF</button>
        <div className="download-wrap">
          <button className="button button-ghost" type="button" aria-expanded={downloadsOpen} onClick={() => setDownloadsOpen(!downloadsOpen)}><Download size={15} /> Download</button>
          {downloadsOpen && <div className="download-menu">
            {(["pdf", "ics", "csv", "xlsx"] as const).map((format) => <a key={format} href={`${exportBase}${format}?${exportQuery}`} onClick={() => reportTelemetry("export", { format, surface: "calendar" })}><Download size={14} /> {format === "ics" ? "Calendar events" : format === "xlsx" ? "Spreadsheet" : format.toUpperCase()} <small>{format}</small></a>)}
          </div>}
        </div>
        <button className="button button-ghost" type="button" onClick={share}><Share2 size={15} /> Share link</button>
      </div>
      <p className="toolbar-help">Your settings stay in the URL, ready to bookmark or share.</p>
      {toast && <div className="toast" role="status">{toast}</div>}
    </aside>
  );
}
