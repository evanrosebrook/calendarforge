import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetTrainingCrawlerRateLimits, TRAINING_CRAWLER_BURST } from "./lib/crawler-rate-limit";
import { proxy } from "./proxy";

describe("crawler proxy", () => {
  beforeEach(() => {
    resetTrainingCrawlerRateLimits();
    vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 7, 24));
  });

  afterEach(() => vi.restoreAllMocks());

  it("allows training crawlers to render application routes", () => {
    expect(proxy(request("meta-externalagent/1.1")).status).toBe(200);
    expect(proxy(request("ClaudeBot/1.0")).status).toBe(200);
  });

  it("rate limits a crawler family after its global burst", () => {
    for (let requestNumber = 0; requestNumber < TRAINING_CRAWLER_BURST; requestNumber += 1) {
      expect(proxy(request("meta-externalagent/1.1")).status).toBe(200);
    }
    const response = proxy(request("meta-externalagent/1.1"));

    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("10");
  });

  it("allows only canonical acquisition routes for training crawlers", () => {
    expect(proxy(request("ClaudeBot/1.0", "/api/export/pdf")).status).toBe(403);
    expect(proxy(request("ClaudeBot/1.0", "/date/2866-09-16")).status).toBe(403);
    expect(proxy(request("ClaudeBot/1.0", "/calendar/2029/1")).status).toBe(403);
    expect(proxy(request("ClaudeBot/1.0", "/date-calculator/add-subtract?date=2866-09-16")).status).toBe(403);
    expect(proxy(request("ClaudeBot/1.0", "/date/2028-02-29")).status).toBe(200);
    expect(proxy(request("ClaudeBot/1.0", "/holidays/us/holiday/independence-day")).status).toBe(200);
    expect(proxy(request("ClaudeBot/1.0", "/shift-calendar")).status).toBe(200);
    expect(proxy(request("ClaudeBot/1.0", "/shift-calendar?pattern=4-4")).status).toBe(403);
  });

  it("allows people and search-engine crawlers", () => {
    expect(proxy(request("Mozilla/5.0 Chrome/145.0.0.0")).status).toBe(200);
    expect(proxy(request("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).status).toBe(200);
  });
});

function request(userAgent: string, path = "/today"): NextRequest {
  return new NextRequest(`https://calendarforge.net${path}`, {
    headers: { "User-Agent": userAgent },
  });
}
