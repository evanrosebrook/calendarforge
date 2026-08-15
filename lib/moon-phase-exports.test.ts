import { describe, expect, it } from "vitest";
import { moonPhasesToIcs } from "./moon-phase-exports";
import { getMoonPhases } from "./moon-phases";

describe("moon phase ICS export", () => {
  it("creates one timed UTC event for every principal phase", () => {
    const events = getMoonPhases(2026);
    const ics = moonPhasesToIcs(events, 2026);

    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\nVERSION:2.0/);
    expect(ics).toMatch(/END:VCALENDAR\r\n$/);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(events.length);
    expect(ics).toContain("DTSTART:20260103T100326Z");
    expect(ics).toContain("SUMMARY:Full Moon");
    expect(ics).toContain("X-WR-CALNAME:2026 Moon Phases — Calendar Forge");
  });
});
