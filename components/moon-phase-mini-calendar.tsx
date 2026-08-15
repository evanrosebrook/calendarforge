import Link from "next/link";
import type { CalendarMonth } from "@/lib/calendar";
import type { MoonPhaseEvent } from "@/lib/moon-phases";

type Props = {
  calendar: CalendarMonth;
  phases: ReadonlyMap<string, MoonPhaseEvent>;
};

export function MoonPhaseMiniCalendar({ calendar, phases }: Props) {
  const monthName = new Intl.DateTimeFormat(calendar.locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, calendar.month - 1, 1)));

  return (
    <article className="mini-calendar moon-mini-calendar">
      <div className="mini-title">
        <h3>{monthName}</h3>
        <Link href={`/calendar/${calendar.year}/${calendar.month}`}>Open</Link>
      </div>
      <table className="mini-table" aria-label={`${calendar.label} moon phase calendar`}>
        <thead><tr>{calendar.weekdayLabels.map((label) => <th key={label}>{label.slice(0, 1)}</th>)}</tr></thead>
        <tbody>
          {calendar.weeks.map((week) => (
            <tr key={week.days[0]?.date}>
              {week.days.map((day) => {
                const phase = day.inMonth ? phases.get(day.date) : undefined;
                const label = phase ? `${day.date}: ${phase.name}` : `View date guide for ${day.date}`;
                return (
                  <td key={day.date} className={`${day.inMonth ? "" : "outside"} ${phase ? "has-moon-phase" : ""}`}>
                    {day.inMonth ? (
                      <Link className="mini-day-link moon-day-link" href={`/date/${day.date}`} aria-label={label}>
                        <span>{day.day}</span>
                        {phase && <span className={`moon-phase-glyph phase-${phase.id}`} aria-hidden="true">{phase.symbol}</span>}
                      </Link>
                    ) : day.day}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
