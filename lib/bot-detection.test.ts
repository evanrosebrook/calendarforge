import { describe, expect, it } from "vitest";
import { isAbusiveCrawlerUserAgent, isLikelyAutomatedUserAgent } from "./bot-detection";

describe("bot user-agent detection", () => {
  it("identifies the abusive production crawlers without blocking search crawlers", () => {
    expect(isAbusiveCrawlerUserAgent("meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)"))
      .toBe(true);
    expect(isAbusiveCrawlerUserAgent("Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"))
      .toBe(true);
    expect(isAbusiveCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"))
      .toBe(false);
    expect(isAbusiveCrawlerUserAgent("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"))
      .toBe(false);
  });

  it("recognizes automated traffic for measurement filtering", () => {
    expect(isLikelyAutomatedUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"))
      .toBe(true);
    expect(isLikelyAutomatedUserAgent("Mozilla/5.0 HeadlessChrome/145.0.0.0"))
      .toBe(true);
    expect(isLikelyAutomatedUserAgent("Mozilla/5.0 Chrome/145.0.0.0 Safari/537.36"))
      .toBe(false);
    expect(isLikelyAutomatedUserAgent(""))
      .toBe(false);
  });
});
