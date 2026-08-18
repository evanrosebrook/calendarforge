export const ABUSIVE_CRAWLER_USER_AGENT_SOURCE = String.raw`(?:meta-externalagent|claudebot)`;
export const AUTOMATED_USER_AGENT_SOURCE = String.raw`(?:bot\b|crawler\b|spider\b|slurp\b|headlesschrome|lighthouse)`;

const abusiveCrawlerPattern = new RegExp(ABUSIVE_CRAWLER_USER_AGENT_SOURCE, "i");
const automatedUserAgentPattern = new RegExp(AUTOMATED_USER_AGENT_SOURCE, "i");

export function isAbusiveCrawlerUserAgent(value: string): boolean {
  return abusiveCrawlerPattern.test(value);
}

export function isLikelyAutomatedUserAgent(value: string): boolean {
  return automatedUserAgentPattern.test(value);
}
