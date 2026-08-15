import type { FiscalCalendarSheet } from "@/lib/fiscal-calendar";

type Props = {
  sheet: FiscalCalendarSheet;
  startDate: string;
  endDate: string;
  highlightWeekends: boolean;
  showWeekNumbers: boolean;
};

export function FiscalMiniCalendar({ sheet, startDate, endDate, highlightWeekends, showWeekNumbers }: Props) {
  const { calendar } = sheet;
  const showWeekColumn = showWeekNumbers && calendar.weeks.some((week) => week.weekNumber !== undefined);

  return (
    <article className="fiscal-mini-calendar">
      <header>
        <h3>{calendar.label}</h3>
        <span>{sheet.periodLabel}</span>
      </header>
      <table className={`mini-table ${highlightWeekends ? "" : "no-weekends"}`} aria-label={`${calendar.label}, ${sheet.periodLabel}`}>
        <thead>
          <tr>
            {showWeekColumn && <th className="week-col" scope="col">W</th>}
            {calendar.weekdayLabels.map((label) => <th key={label} scope="col">{label.slice(0, 1)}</th>)}
          </tr>
        </thead>
        <tbody>
          {calendar.weeks.map((week) => (
            <tr key={week.days[0]?.date}>
              {showWeekColumn && <td className="week-col">{week.weekNumber}</td>}
              {week.days.map((day) => {
                const rangeOutside = day.date < startDate || day.date > endDate;
                const activeHoliday = day.inMonth && !rangeOutside && day.holidays.length > 0;
                return (
                  <td key={day.date} data-date={day.date} className={`${day.inMonth ? "" : "outside"} ${rangeOutside ? "range-outside" : ""} ${day.isWeekend && highlightWeekends ? "weekend" : ""} ${activeHoliday ? "has-holiday" : ""}`}>
                    <time dateTime={day.date} title={activeHoliday ? day.holidays.map((holiday) => holiday.name).join(", ") : undefined}>{day.day}</time>
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
