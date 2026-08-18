import type { TrainingCrawler } from "./bot-detection";

export const TRAINING_CRAWLER_REQUESTS_PER_MINUTE = 60;
export const TRAINING_CRAWLER_BURST = 10;

const tokensPerMillisecond = TRAINING_CRAWLER_REQUESTS_PER_MINUTE / 60_000;
const buckets = new Map<TrainingCrawler, { tokens: number; updatedAt: number }>();

export type CrawlerRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function consumeTrainingCrawlerRequest(
  crawler: TrainingCrawler,
  now = Date.now(),
): CrawlerRateLimitResult {
  const existing = buckets.get(crawler) ?? {
    tokens: TRAINING_CRAWLER_BURST,
    updatedAt: now,
  };
  const elapsed = Math.max(0, now - existing.updatedAt);
  const tokens = Math.min(
    TRAINING_CRAWLER_BURST,
    existing.tokens + elapsed * tokensPerMillisecond,
  );

  if (tokens >= 1) {
    buckets.set(crawler, { tokens: tokens - 1, updatedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  buckets.set(crawler, { tokens, updatedAt: now });
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((1 - tokens) / tokensPerMillisecond / 1_000)),
  };
}

export function resetTrainingCrawlerRateLimits(): void {
  buckets.clear();
}
