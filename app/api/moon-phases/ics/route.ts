import { moonPhasesToIcs } from "@/lib/moon-phase-exports";
import { getMoonPhases, isSupportedMoonPhaseYear } from "@/lib/moon-phases";

export function GET(request: Request) {
  const yearValue = new URL(request.url).searchParams.get("year") ?? "";
  const year = Number(yearValue);
  if (!/^\d{4}$/.test(yearValue) || !isSupportedMoonPhaseYear(year)) {
    return new Response("Invalid or unsupported year", { status: 400 });
  }

  return new Response(moonPhasesToIcs(getMoonPhases(year), year), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="calendar-forge-moon-phases-${year}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
