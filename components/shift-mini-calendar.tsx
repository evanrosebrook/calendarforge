import type { ShiftCalendarSheet } from "@/lib/shift-calendar";

export function ShiftMiniCalendar({ sheet, startDate }: { sheet: ShiftCalendarSheet; startDate: string }) {
  const { calendar, assignments } = sheet;
  return (
    <article className="shift-mini-calendar">
      <header><h3>{calendar.label}</h3></header>
      <table className="mini-table" aria-label={`${calendar.label} shift schedule`}>
        <thead><tr>{calendar.weekdayLabels.map((label) => <th key={label} scope="col">{label.slice(0, 1)}</th>)}</tr></thead>
        <tbody>
          {calendar.weeks.map((week) => <tr key={week.days[0]?.date}>
            {week.days.map((day) => {
              const assignment = assignments[day.date];
              const inactive = !day.inMonth || day.date < startDate || !assignment;
              return <td key={day.date} className={`${!day.inMonth ? "outside" : ""} ${inactive ? "range-outside" : ""} ${assignment ? `shift-${assignment}` : ""}`} data-date={day.date}>
                <time dateTime={day.date} title={!inactive ? (assignment === "work" ? "Work day" : "Off day") : undefined}>{day.day}</time>
              </td>;
            })}
          </tr>)}
        </tbody>
      </table>
    </article>
  );
}
