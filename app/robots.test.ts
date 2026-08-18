import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots policy", () => {
  it("denies abusive crawlers while preserving normal search discovery", () => {
    expect(robots().rules).toEqual([
      {
        userAgent: ["meta-externalagent", "ClaudeBot"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ]);
  });
});
