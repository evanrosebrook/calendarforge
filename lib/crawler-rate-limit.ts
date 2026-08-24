import type { TrainingCrawler } from "./bot-detection";

export const TRAINING_CRAWLER_REQUESTS_PER_MINUTE = 6;
export const TRAINING_CRAWLER_BURST = 3;
export const TRAINING_CRAWLER_DAILY_LIMIT = 500;

const millisecondsPerDay = 86_400_000;
const tokensPerMillisecond = TRAINING_CRAWLER_REQUESTS_PER_MINUTE / 60_000;
const buckets = new Map<TrainingCrawler, { tokens: number; updatedAt: number; dayStart: number; dailyCount: number }>();

export type CrawlerRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function consumeTrainingCrawlerRequest(
  crawler: TrainingCrawler,
  now = Date.now(),
): CrawlerRateLimitResult {
  const dayStart = Math.floor(now / millisecondsPerDay) * millisecondsPerDay;
  const existing = buckets.get(crawler) ?? {
    tokens: TRAINING_CRAWLER_BURST,
    updatedAt: now,
    dayStart,
    dailyCount: 0,
  };
  const dailyCount = existing.dayStart === dayStart ? existing.dailyCount : 0;
  const elapsed = Math.max(0, now - existing.updatedAt);
  const tokens = Math.min(
    TRAINING_CRAWLER_BURST,
    existing.tokens + elapsed * tokensPerMillisecond,
  );

  if (dailyCount >= TRAINING_CRAWLER_DAILY_LIMIT) {
    buckets.set(crawler, { tokens, updatedAt: now, dayStart, dailyCount });
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((dayStart + millisecondsPerDay - now) / 1_000)),
    };
  }

  if (tokens >= 1) {
    buckets.set(crawler, { tokens: tokens - 1, updatedAt: now, dayStart, dailyCount: dailyCount + 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  buckets.set(crawler, { tokens, updatedAt: now, dayStart, dailyCount });
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((1 - tokens) / tokensPerMillisecond / 1_000)),
  };
}

export function resetTrainingCrawlerRateLimits(): void {
  buckets.clear();
}
