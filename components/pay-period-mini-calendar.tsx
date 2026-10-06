import type { CalendarMonth } from "@/lib/calendar";

type Props = {
  calendar: CalendarMonth;
  payDateNumbers: Record<string, number>;
  adjustedPayDates: Set<string>;
};

export function PayPeriodMiniCalendar({ calendar, payDateNumbers, adjustedPayDates }: Props) {
  return (
    <article className="pay-period-mini-calendar">
      <header><h3>{calendar.label}</h3></header>
      <table className="mini-table" aria-label={`${calendar.label} biweekly pay calendar`}>
        <thead><tr>{calendar.weekdayLabels.map((label) => <th key={label} scope="col">{label.slice(0, 1)}</th>)}</tr></thead>
        <tbody>
          {calendar.weeks.map((week) => <tr key={week.days[0]?.date}>
            {week.days.map((day) => {
              const periodNumber = day.inMonth ? payDateNumbers[day.date] : undefined;
              const holiday = day.holidays.length > 0;
              return (
                <td
                  key={day.date}
                  className={`${day.inMonth ? "" : "outside"} ${holiday ? "has-holiday" : ""} ${periodNumber ? "pay-period-payday" : ""} ${adjustedPayDates.has(day.date) ? "pay-period-adjusted" : ""}`}
                  data-date={day.date}
                >
                  <time dateTime={day.date} title={periodNumber ? `Payday · pay period ${periodNumber}${adjustedPayDates.has(day.date) ? " · adjusted" : ""}` : day.holidays.map((item) => item.name).join(", ") || undefined}>
                    {day.day}
                  </time>
                </td>
              );
            })}
          </tr>)}
        </tbody>
      </table>
    </article>
  );
}
