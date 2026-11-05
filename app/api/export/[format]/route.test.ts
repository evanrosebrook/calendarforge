import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

function request(query: string, format = "pdf") {
  return GET(new Request(`https://calendarforge.net/api/export/${format}?${query}`), { params: Promise.resolve({ format }) });
}

describe("calendar PDF downloads", () => {
  it("provides a separate one-page yearly file while preserving the 12-page default", async () => {
    const year = await request("year=2027&layout=year&paper=a4&orientation=landscape&start=monday&weekNumbers=1");
    expect(year.status).toBe(200);
    expect(year.headers.get("content-disposition")).toContain("calendar-forge-2027-one-page.pdf");
    const onePage = await PDFDocument.load(await year.arrayBuffer());
    expect(onePage.getPageCount()).toBe(1);
    expect(onePage.getPage(0).getSize()).toEqual({ width: 841.89, height: 595.28 });
    const monthly = await request("year=2027");
    expect(monthly.headers.get("content-disposition")).toContain('filename="calendar-forge-2027.pdf"');
    expect((await PDFDocument.load(await monthly.arrayBuffer())).getPageCount()).toBe(12);
    const month = await request("year=2027&month=1");
    expect((await PDFDocument.load(await month.arrayBuffer())).getPageCount()).toBe(1);
  });

  it.each(["year=2027&month=1&layout=year", "year=2027&layout=unknown", "year=0&layout=year", "year=10000&layout=year"])("rejects invalid yearly export requests: %s", async (query) => {
    expect((await request(query)).status).toBe(400);
  });

  it("does not apply a PDF layout to other formats", async () => {
    expect((await request("year=2027&layout=year", "ics")).status).toBe(400);
    const response = await request("year=2027", "ics");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("BEGIN:VCALENDAR");
  });
});
