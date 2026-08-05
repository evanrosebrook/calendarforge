import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BreadcrumbStructuredData } from "@/components/structured-data";
import { breadcrumbList } from "./seo";

describe("breadcrumb structured data", () => {
  const items = [
    { name: "Calendar Forge", path: "/" },
    { name: "2027 calendar", path: "/calendar/2027" },
    { name: "March 2027", path: "/calendar/2027/3" },
  ];

  it("builds ordered absolute breadcrumb URLs", () => {
    const data = breadcrumbList(items);

    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toEqual([
      expect.objectContaining({ position: 1, name: "Calendar Forge" }),
      expect.objectContaining({ position: 2, name: "2027 calendar", item: expect.stringMatching(/\/calendar\/2027$/) }),
      expect.objectContaining({ position: 3, name: "March 2027", item: expect.stringMatching(/\/calendar\/2027\/3$/) }),
    ]);
  });

  it("renders valid JSON-LD and escapes markup-sensitive characters", () => {
    const html = renderToStaticMarkup(<BreadcrumbStructuredData items={[...items, { name: "</script>", path: "/date/2027-03-17" }]} />);

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain("\\u003c/script>");
    expect(html).not.toContain("</script></script>");
  });
});
