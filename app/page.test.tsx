import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("home acquisition links", () => {
  it("links prominent date-intent tools from the homepage", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("Popular date tools");
    expect(html).toContain('href="/today"');
    expect(html).toMatch(/href="\/date\/\d{4}-\d{2}-\d{2}"/);
    expect(html).toMatch(/href="\/date-calculator\/days-between\?start=\d{4}-\d{2}-\d{2}"/);
  });
});
