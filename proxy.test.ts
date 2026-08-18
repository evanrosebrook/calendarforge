import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

describe("crawler proxy", () => {
  it("blocks abusive crawlers before rendering application routes", () => {
    const response = proxy(request("meta-externalagent/1.1"));

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("allows people and search-engine crawlers", () => {
    expect(proxy(request("Mozilla/5.0 Chrome/145.0.0.0")).status).toBe(200);
    expect(proxy(request("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).status).toBe(200);
  });
});

function request(userAgent: string): NextRequest {
  return new NextRequest("https://calendarforge.net/today", {
    headers: { "User-Agent": userAgent },
  });
}
