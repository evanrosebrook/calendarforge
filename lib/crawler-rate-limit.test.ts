import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeTrainingCrawlerRequest,
  resetTrainingCrawlerRateLimits,
  TRAINING_CRAWLER_BURST,
  TRAINING_CRAWLER_DAILY_LIMIT,
} from "./crawler-rate-limit";

describe("training crawler rate limit", () => {
  beforeEach(() => resetTrainingCrawlerRateLimits());

  it("allows a short burst and then replenishes at one request per ten seconds", () => {
    for (let request = 0; request < TRAINING_CRAWLER_BURST; request += 1) {
      expect(consumeTrainingCrawlerRequest("claudebot", 1_000).allowed).toBe(true);
    }

    expect(consumeTrainingCrawlerRequest("claudebot", 1_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 10,
    });
    expect(consumeTrainingCrawlerRequest("claudebot", 11_000).allowed).toBe(true);
  });

  it("keeps crawler families in independent buckets", () => {
    for (let request = 0; request < TRAINING_CRAWLER_BURST; request += 1) {
      consumeTrainingCrawlerRequest("meta-externalagent", 1_000);
    }

    expect(consumeTrainingCrawlerRequest("meta-externalagent", 1_000).allowed).toBe(false);
    expect(consumeTrainingCrawlerRequest("claudebot", 1_000).allowed).toBe(true);
  });

  it("does not add tokens when the system clock moves backward", () => {
    for (let request = 0; request < TRAINING_CRAWLER_BURST; request += 1) {
      consumeTrainingCrawlerRequest("claudebot", 2_000);
    }

    expect(consumeTrainingCrawlerRequest("claudebot", 1_000).allowed).toBe(false);
  });

  it("caps each crawler family per UTC day", () => {
    const start = Date.UTC(2026, 7, 24);
    for (let request = 0; request < TRAINING_CRAWLER_DAILY_LIMIT; request += 1) {
      expect(consumeTrainingCrawlerRequest("claudebot", start + request * 10_000).allowed).toBe(true);
    }

    expect(consumeTrainingCrawlerRequest("claudebot", start + TRAINING_CRAWLER_DAILY_LIMIT * 10_000)).toMatchObject({
      allowed: false,
    });
    expect(consumeTrainingCrawlerRequest("claudebot", start + 86_400_000).allowed).toBe(true);
  });
});
