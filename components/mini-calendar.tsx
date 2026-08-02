import Link from "next/link";
import type { CalendarMonth } from "@/lib/calendar";

export function MiniCalendar({ calendar, query = "", highlightWeekends = true }: { calendar: CalendarMonth; query?: string; highlightWeekends?: boolean }) {
  return (
    <article className="mini-calendar">
      <div className="mini-title">
        <h3>{new Intl.DateTimeFormat(calendar.locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, calendar.month - 1, 1)))}</h3>
        <Link href={`/calendar/${calendar.year}/${calendar.month}${query}`}>Open</Link>
      </div>
      <table className={`mini-table ${highlightWeekends ? "" : "no-weekends"}`} aria-label={calendar.label}>
        <thead><tr>{calendar.weeks[0]?.weekNumber !== undefined && <th>W</th>}{calendar.weekdayLabels.map((label) => <th key={label}>{label.slice(0, 1)}</th>)}</tr></thead>
        <tbody>
          {calendar.weeks.map((week) => (
            <tr key={week.days[0]?.date}>
              {week.weekNumber !== undefined && <td className="week-col">{week.weekNumber}</td>}
              {week.days.map((day) => (
                <td key={day.date} className={`${day.inMonth ? "" : "outside"} ${day.isWeekend && highlightWeekends ? "weekend" : ""} ${day.holidays.length ? "has-holiday" : ""}`}>
                  {day.day}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
