import type { CalendarMonth } from "@/lib/calendar";

type Props = {
  calendar: CalendarMonth;
  compact?: boolean;
  highlightWeekends?: boolean;
  highlightDate?: string;
  title?: string;
  showNotes?: boolean;
  dayNotes?: Record<string, string>;
  theme?: "forge" | "linen" | "blueprint";
};

export function CalendarGrid({ calendar, compact = false, highlightWeekends = true, highlightDate, title, showNotes = false, dayNotes = {}, theme = "forge" }: Props) {
  return (
    <article className={`calendar-sheet theme-${theme} ${compact ? "compact" : ""} ${highlightWeekends ? "" : "no-weekends"}`}>
      <header className="sheet-heading">
        <h2>{title || calendar.label}</h2>
        <p>{title ? calendar.label : "Plan with intention"}</p>
      </header>
      <table className="calendar-table" aria-label={`${calendar.label} calendar`}>
        <thead>
          <tr>
            {calendar.weeks[0]?.weekNumber !== undefined && <th className="week-col" scope="col">Wk</th>}
            {calendar.weekdayLabels.map((label) => <th key={label} scope="col">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {calendar.weeks.map((week) => (
            <tr key={week.days[0]?.date}>
              {week.weekNumber !== undefined && <td className="week-col">{week.weekNumber}</td>}
              {week.days.map((day) => (
                <td
                  key={day.date}
                  className={`${day.inMonth ? "" : "outside"} ${day.isWeekend ? "weekend" : ""} ${day.date === highlightDate ? "is-target" : ""}`}
                  data-date={day.date}
                >
                  <time className="day-number" dateTime={day.date}>{day.day}</time>
                  {day.holidays.length > 0 && (
                    <ul className="holiday-list">
                      {day.holidays.map((holiday) => <li key={`${holiday.date}-${holiday.name}`}>{holiday.name}</li>)}
                    </ul>
                  )}
                  {day.inMonth && dayNotes[day.date] && <p className="day-note">{dayNotes[day.date]}</p>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {showNotes && <div className="notes-area"><strong>Notes</strong></div>}
      <p className="source-mark">Made with Calendar Forge</p>
    </article>
  );
}
