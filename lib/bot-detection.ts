export const TRAINING_CRAWLER_USER_AGENT_SOURCE = String.raw`(?:meta-externalagent|claudebot)`;
export const AUTOMATED_USER_AGENT_SOURCE = String.raw`(?:meta-externalagent|bot\b|crawler\b|spider\b|slurp\b|headlesschrome|lighthouse)`;

const trainingCrawlerPattern = new RegExp(TRAINING_CRAWLER_USER_AGENT_SOURCE, "i");
const automatedUserAgentPattern = new RegExp(AUTOMATED_USER_AGENT_SOURCE, "i");

export type TrainingCrawler = "claudebot" | "meta-externalagent";

export function getTrainingCrawler(value: string): TrainingCrawler | null {
  if (!trainingCrawlerPattern.test(value)) return null;
  return /meta-externalagent/i.test(value) ? "meta-externalagent" : "claudebot";
}

export function isLikelyAutomatedUserAgent(value: string): boolean {
  return automatedUserAgentPattern.test(value);
}
