import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots policy", () => {
  it("allows controlled training and search discovery while excluding APIs", () => {
    expect(robots().rules).toEqual([
      {
        userAgent: ["meta-externalagent", "ClaudeBot"],
        allow: "/",
        disallow: "/api/",
        crawlDelay: 1,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ]);
  });
});
