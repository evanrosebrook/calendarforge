import { describe, expect, it } from "vitest";
import { getTrainingCrawler, isLikelyAutomatedUserAgent } from "./bot-detection";

describe("bot user-agent detection", () => {
  it("identifies training crawlers without grouping them with search crawlers", () => {
    expect(getTrainingCrawler("meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)"))
      .toBe("meta-externalagent");
    expect(getTrainingCrawler("Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"))
      .toBe("claudebot");
    expect(getTrainingCrawler("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"))
      .toBeNull();
    expect(getTrainingCrawler("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"))
      .toBeNull();
  });

  it("recognizes automated traffic for measurement filtering", () => {
    expect(isLikelyAutomatedUserAgent("meta-externalagent/1.1"))
      .toBe(true);
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
