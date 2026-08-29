import Link from "next/link";
import type { CalendarMonth } from "@/lib/calendar";

type Props = {
  calendar: CalendarMonth;
  compact?: boolean;
  highlightWeekends?: boolean;
  highlightDate?: string;
  linkDates?: boolean;
  title?: string;
  subtitle?: string;
  showNotes?: boolean;
  dayNotes?: Record<string, string>;
  dayMarkers?: Record<string, string>;
  activeRange?: { startDate: string; endDate: string };
  theme?: "forge" | "linen" | "blueprint";
};

export function CalendarGrid({ calendar, compact = false, highlightWeekends = true, highlightDate, linkDates = false, title, subtitle, showNotes = false, dayNotes = {}, dayMarkers = {}, activeRange, theme = "forge" }: Props) {
  const showWeekColumn = calendar.weeks.some((week) => week.weekNumber !== undefined);
  return (
    <article className={`calendar-sheet theme-${theme} ${compact ? "compact" : ""} ${highlightWeekends ? "" : "no-weekends"}`}>
      <header className="sheet-heading">
        <h2>{title || calendar.label}</h2>
        <p>{subtitle ?? (title ? calendar.label : "Plan with intention")}</p>
      </header>
      <table className="calendar-table" aria-label={`${calendar.label} calendar`}>
        <thead>
          <tr>
            {showWeekColumn && <th className="week-col" scope="col">Wk</th>}
            {calendar.weekdayLabels.map((label) => <th key={label} scope="col">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {calendar.weeks.map((week) => (
            <tr key={week.days[0]?.date}>
              {showWeekColumn && <td className="week-col">{week.weekNumber}</td>}
              {week.days.map((day) => {
                const rangeOutside = activeRange !== undefined && (day.date < activeRange.startDate || day.date > activeRange.endDate);
                const showDayContent = !rangeOutside;
                const showAttachedContent = showDayContent && (activeRange === undefined || day.inMonth);
                return (
                  <td
                    key={day.date}
                    className={`${day.inMonth ? "" : "outside"} ${day.isWeekend ? "weekend" : ""} ${day.date === highlightDate ? "is-target" : ""} ${rangeOutside ? "range-outside" : ""}`}
                    data-date={day.date}
                  >
                    {day.inMonth && linkDates && showDayContent ? (
                      <Link className="day-number-link" href={`/date/${day.date}`} aria-label={`View date guide for ${day.date}`} rel="nofollow">
                        <time className="day-number" dateTime={day.date}>{day.day}</time>
                      </Link>
                    ) : <time className="day-number" dateTime={day.date}>{day.day}</time>}
                    {showAttachedContent && dayMarkers[day.date] && <span className="day-marker">{dayMarkers[day.date]}</span>}
                    {showAttachedContent && day.holidays.length > 0 && (
                      <ul className="holiday-list">
                        {day.holidays.map((holiday) => <li key={`${holiday.date}-${holiday.name}`}>{holiday.name}</li>)}
                      </ul>
                    )}
                    {showDayContent && day.inMonth && dayNotes[day.date] && <p className="day-note">{dayNotes[day.date]}</p>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {showNotes && <div className="notes-area"><strong>Notes</strong></div>}
      <p className="source-mark">Made with Calendar Forge</p>
    </article>
  );
}
