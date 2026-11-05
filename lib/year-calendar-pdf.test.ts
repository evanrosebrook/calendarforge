import { decodePDFRawStream, PDFArray, PDFDocument, PDFRawStream } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { createCalendarYear, getNationalHolidaysForRange } from "./calendar";
import { yearCalendarToPdf } from "./year-calendar-pdf";

async function readPdf(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes);
  const contents = pdf.getPage(0).node.Contents();
  const streams = contents instanceof PDFArray ? contents.asArray() : [contents];
  const operators = streams.map((ref) => {
    const stream = pdf.context.lookup(ref);
    if (!(stream instanceof PDFRawStream)) throw new Error("Missing PDF content stream");
    return new TextDecoder().decode(decodePDFRawStream(stream).decode());
  }).join("\n");
  const text = [...operators.matchAll(/<([0-9A-F]+)> Tj/g)].map((match) => Buffer.from(match[1]!, "hex").toString("latin1")).join("\n");
  return { pdf, text };
}

describe("one-page yearly PDF", () => {
  it.each([
    ["letter", "portrait", 612, 792], ["letter", "landscape", 792, 612],
    ["a4", "portrait", 595.28, 841.89], ["a4", "landscape", 841.89, 595.28],
  ] as const)("keeps all twelve months on one %s %s page", async (paper, orientation, width, height) => {
    const { pdf, text } = await readPdf(await yearCalendarToPdf(createCalendarYear({ year: 2027 }), { paper, orientation, holidayLabel: "U.S. federal holidays" }));
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getSize()).toEqual({ width, height });
    for (const month of ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]) expect(text.split("\n").filter((entry) => entry === month)).toHaveLength(1);
    expect(text).toContain("SUNDAY START");
    expect(text).not.toContain("highlighted above");
  });

  it("retains Monday start, week numbers, the title, and adjacent-year observed holidays", async () => {
    const calendars = createCalendarYear({ year: 2027, firstDayOfWeek: 1, showWeekNumbers: true, holidays: getNationalHolidaysForRange("us", 2027, 2027) });
    const { text } = await readPdf(await yearCalendarToPdf(calendars, { paper: "letter", orientation: "landscape", title: "Family plans", holidayLabel: "U.S. federal holidays", highlightWeekends: true }));
    expect(text).toContain("Family plans");
    expect(text).toContain("2027  /  YEAR AT A GLANCE  /  MONDAY START");
    expect(text).toContain("MO\nTU\nWE\nTH\nFR\nSA\nSU");
    expect(text.split("\n").filter((entry) => entry === "W")).toHaveLength(12);
    expect(text).toContain("Dec 31 New Year's Day (observed)");
    expect(text).not.toContain("Jan 1 New Year's Day (observed)");
  });

  it("uses Canadian holidays without adding U.S. holidays", async () => {
    const calendars = createCalendarYear({ year: 2027, holidays: getNationalHolidaysForRange("ca", 2027, 2027) });
    const { text } = await readPdf(await yearCalendarToPdf(calendars, { paper: "a4", orientation: "portrait", holidayLabel: "Canadian federal holidays" }));
    expect(text).toContain("Canadian federal holidays");
    expect(text).toContain("Jul 1 Canada Day");
    expect(text).not.toContain("Independence Day");
  });

  it.each(["Our family plans, school breaks, appointments, birthdays and adventures for 2027", "W".repeat(80)])("keeps a long title complete without displacing the months", async (title) => {
    const { pdf, text } = await readPdf(await yearCalendarToPdf(createCalendarYear({ year: 2027 }), { paper: "a4", orientation: "portrait", title, holidayLabel: "U.S. federal holidays" }));
    const header = text.split("CALENDAR FORGE")[0]!.replaceAll(/\s/g, "");
    expect(header).toBe(title.replaceAll(/\s/g, ""));
    expect(pdf.getPageCount()).toBe(1);
    expect(text).toContain("December");
  });

  it("rejects incomplete, mixed, or reordered calendar ranges", async () => {
    const calendars = createCalendarYear({ year: 2027 });
    const options = { paper: "letter", orientation: "portrait", holidayLabel: "U.S. federal holidays" } as const;
    await expect(yearCalendarToPdf(calendars.slice(0, 3), options)).rejects.toThrow(RangeError);
    await expect(yearCalendarToPdf([...calendars].reverse(), options)).rejects.toThrow(RangeError);
    await expect(yearCalendarToPdf([...calendars.slice(0, 11), createCalendarYear({ year: 2028 })[11]!], options)).rejects.toThrow(RangeError);
  });
});
