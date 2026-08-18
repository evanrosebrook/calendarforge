import { describe, expect, it } from "vitest";
import { buildGoogleAnalyticsBootstrap } from "./google-analytics";

describe("Google Analytics bootstrap", () => {
  it("loads GA only after excluding automated user agents", () => {
    const bootstrap = buildGoogleAnalyticsBootstrap("G-MMP15FDWR4");

    expect(bootstrap).toContain("navigator.userAgent");
    expect(bootstrap).toContain("headlesschrome");
    expect(bootstrap).toContain("document.createElement('script')");
    expect(bootstrap).toContain("G-MMP15FDWR4");
    expect(() => new Function(bootstrap)).not.toThrow();
  });
});
