"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { BUILDER_MONTH_COUNTS, MAX_DAY_NOTES, MAX_NOTE_LENGTH, builderRange, builderStateToParams, type BuilderState } from "@/lib/builder";
import { toIsoDate, utcDate } from "@/lib/calendar";
import { reportTelemetry } from "@/lib/telemetry-client";
import { Download, Printer, Share2 } from "./icons";

type Props = { state: BuilderState };

export function CalendarBuilderToolbar({ state }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(state.title);
  const [toast, setToast] = useState("");
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const range = builderRange(state);
  const minDate = `${String(state.startYear).padStart(4, "0")}-${String(state.startMonth).padStart(2, "0")}-01`;
  const maxDate = toIsoDate(utcDate(range.endYear, range.endMonth + 1, 0));
  const exportQuery = builderStateToParams(state).toString();

  function navigate(mutator: (params: URLSearchParams) => void) {
    const next = builderStateToParams(state);
    mutator(next);
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  function setParam(key: string, value?: string) {
    navigate((params) => {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    });
  }

  function setDayNote(date: string, note: string) {
    navigate((params) => {
      params.delete("note");
      const nextNotes = { ...state.dayNotes };
      const clean = note.trim().slice(0, MAX_NOTE_LENGTH);
      if (clean) nextNotes[date] = clean;
      else delete nextNotes[date];
      for (const [noteDate, text] of Object.entries(nextNotes).sort(([a], [b]) => a.localeCompare(b))) {
        params.append("note", `${noteDate}~${text}`);
      }
    });
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setDayNote(String(form.get("date") ?? ""), String(form.get("text") ?? ""));
    event.currentTarget.reset();
  }

  async function share() {
    const url = `${location.origin}${pathname}?${builderStateToParams(state)}`;
    try {
      if (navigator.share) await navigator.share({ title: "My Calendar Forge calendar", url });
      else {
        await navigator.clipboard.writeText(url);
        setToast("Builder link copied");
        window.setTimeout(() => setToast(""), 2200);
      }
      reportTelemetry("share", { surface: "builder" });
    } catch {
      // The native share sheet was dismissed.
    }
  }

  function print() {
    reportTelemetry("print", { surface: "builder" });
    window.print();
  }

  return (
    <aside className={`toolbar builder-toolbar no-print ${pending ? "is-pending" : ""}`} aria-label="Calendar builder settings">
      <section className="toolbar-section">
        <span className="toolbar-label">Date range</span>
        <div className="builder-date-fields">
          <div className="field">
            <label htmlFor="builder-month">Start month</label>
            <select id="builder-month" value={state.startMonth} onChange={(event) => setParam("month", event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat(state.locale, { month: "long", timeZone: "UTC" }).format(utcDate(2024, index + 1, 1))}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="builder-year">Start year</label>
            <input id="builder-year" type="number" min="1" max="9999" defaultValue={state.startYear} onBlur={(event) => setParam("year", event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setParam("year", event.currentTarget.value); }} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="builder-range">Months to include</label>
          <select id="builder-range" value={state.monthCount} onChange={(event) => setParam("months", event.target.value)}>
            {BUILDER_MONTH_COUNTS.map((count) => <option key={count} value={count}>{count} {count === 1 ? "month" : "months"}</option>)}
          </select>
        </div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Calendar details</span>
        <div className="segmented">
          <button className={state.firstDayOfWeek === 0 ? "active" : ""} onClick={() => setParam("start")} type="button">Sunday</button>
          <button className={state.firstDayOfWeek === 1 ? "active" : ""} onClick={() => setParam("start", "monday")} type="button">Monday</button>
        </div>
        <Toggle label="Week numbers" pressed={state.showWeekNumbers} onClick={() => setParam("weekNumbers", state.showWeekNumbers ? undefined : "1")} />
        <Toggle label="National holidays" pressed={state.showHolidays} onClick={() => setParam("holidays", state.showHolidays ? "0" : undefined)} />
        {state.showHolidays && <div className="field">
          <label htmlFor="builder-country">Holiday country</label>
          <select id="builder-country" value={state.holidayCountry} onChange={(event) => setParam("country", event.target.value === "ca" ? "ca" : undefined)}>
            <option value="us">United States</option><option value="ca">Canada</option>
          </select>
          <small className="field-help">National holidays only; 1971–2100.</small>
        </div>}
        <Toggle label="Shade weekends" pressed={state.highlightWeekends} onClick={() => setParam("weekends", state.highlightWeekends ? "0" : undefined)} />
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Page & style</span>
        <div className="segmented">
          <button className={state.orientation === "portrait" ? "active" : ""} onClick={() => setParam("orientation")} type="button">Portrait</button>
          <button className={state.orientation === "landscape" ? "active" : ""} onClick={() => setParam("orientation", "landscape")} type="button">Landscape</button>
        </div>
        <div className="builder-date-fields">
          <div className="field"><label htmlFor="builder-paper">Paper</label><select id="builder-paper" value={state.paper} onChange={(event) => setParam("paper", event.target.value === "a4" ? "a4" : undefined)}><option value="letter">Letter</option><option value="a4">A4</option></select></div>
          <div className="field"><label htmlFor="builder-theme">Theme</label><select id="builder-theme" value={state.theme} onChange={(event) => setParam("theme", event.target.value === "forge" ? undefined : event.target.value)}><option value="forge">Forge</option><option value="linen">Linen</option><option value="blueprint">Blueprint</option></select></div>
        </div>
        <div className="field">
          <label htmlFor="builder-locale">Language & locale</label>
          <select id="builder-locale" value={state.locale} onChange={(event) => setParam("locale", event.target.value === "en-US" ? undefined : event.target.value)}>
            <option value="en-US">English (United States)</option><option value="en-CA">English (Canada)</option><option value="fr-CA">Français (Canada)</option>
          </select>
          <small className="field-help">Changes month and weekday labels. Holiday names remain in English.</small>
        </div>
      </section>

      <section className="toolbar-section">
        <span className="toolbar-label">Personalize</span>
        <div className="field">
          <label htmlFor="builder-title">Title</label>
          <input id="builder-title" value={title} maxLength={80} placeholder="e.g. Studio schedule" onChange={(event) => setTitle(event.target.value)} onBlur={() => setParam("title", title || undefined)} onKeyDown={(event) => { if (event.key === "Enter") setParam("title", title || undefined); }} />
        </div>
        <Toggle label="Notes area on each page" pressed={state.showNotesArea} onClick={() => setParam("notesArea", state.showNotesArea ? undefined : "1")} />
      </section>

      <section className="toolbar-section day-notes-editor">
        <span className="toolbar-label">Notes on dates</span>
        {Object.entries(state.dayNotes).sort(([a], [b]) => a.localeCompare(b)).map(([date, note]) => (
          <form key={`${date}-${note}`} onSubmit={(event) => { event.preventDefault(); setDayNote(date, String(new FormData(event.currentTarget).get("text") ?? "")); }}>
            <label htmlFor={`note-${date}`}>{date}</label>
            <textarea id={`note-${date}`} name="text" maxLength={MAX_NOTE_LENGTH} defaultValue={note} />
            <div><button type="submit">Save</button><button type="button" onClick={() => setDayNote(date, "")}>Remove</button></div>
          </form>
        ))}
        {Object.keys(state.dayNotes).length < MAX_DAY_NOTES ? <form className="new-note-form" onSubmit={addNote}>
          <label htmlFor="new-note-date">Add a note</label>
          <input id="new-note-date" name="date" type="date" required min={minDate} max={maxDate} defaultValue={minDate} />
          <textarea aria-label="Note text" name="text" required maxLength={MAX_NOTE_LENGTH} placeholder="Up to 120 characters" />
          <button className="button button-small button-ghost" type="submit">Add note</button>
        </form> : <p className="field-help">The 24-note limit has been reached.</p>}
        <small className="field-help">Notes stay in this URL and its downloads. They are not saved or sent to analytics or ads.</small>
      </section>

      <div className="toolbar-actions">
        <button className="button button-ink" type="button" onClick={print}><Printer size={15} /> Print / save PDF</button>
        <div className="download-wrap">
          <button className="button button-ghost" type="button" aria-expanded={downloadsOpen} onClick={() => setDownloadsOpen(!downloadsOpen)}><Download size={15} /> Download</button>
          {downloadsOpen && <div className="download-menu">
            {(["pdf", "svg", "ics", "csv", "xlsx"] as const).map((format) => <a key={format} href={`/api/builder/export/${format}?${exportQuery}`} title={format === "svg" ? "All selected months in one continuous SVG" : undefined} onClick={() => reportTelemetry("export", { format, surface: "builder" })}><Download size={14} /> {format === "ics" ? "Calendar events" : format === "xlsx" ? "Spreadsheet" : format.toUpperCase()} <small>{format}</small></a>)}
          </div>}
        </div>
        <button className="button button-ghost" type="button" onClick={share}><Share2 size={15} /> Share link</button>
      </div>
      <p className="toolbar-help">SVG downloads place every selected month in one continuous image.</p>
      {toast && <div className="toast" role="status">{toast}</div>}
    </aside>
  );
}

function Toggle({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return <div className="toggle-row"><span>{label}</span><button aria-label={`Toggle ${label.toLowerCase()}`} aria-pressed={pressed} className={`switch ${pressed ? "on" : ""}`} onClick={onClick} type="button" /></div>;
}
