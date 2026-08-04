/**
 * Agent barrel — re-exports the five execution agents.
 *
 * All agents are pure orchestrators. They never publish, never spend,
 * never call external APIs, never approve their own runs. Human
 * remains final authority.
 */

export type { AgentId, AgentDescriptor } from './types';
export { AGENT_IDS, AGENT_CATALOG, AGENT_ADVISORY_NOTICE } from './types';
export { runCreativeDirectorAgent } from './creativeDirectorAgent';
export type { CreativeDirectorAgentInput, CreativeDirectorAgentOutput } from './creativeDirectorAgent';
export { runContentProducerAgent } from './contentProducerAgent';
export type { ContentProducerAgentInput, ContentProducerAgentOutput } from './contentProducerAgent';
export { runQualityReviewerAgent } from './qualityReviewerAgent';
export type { QualityReviewerAgentInput, QualityReviewerAgentOutput } from './qualityReviewerAgent';
export { runCampaignManagerAgent } from './campaignManagerAgent';
export type { CampaignManagerAgentInput, CampaignManagerAgentOutput } from './campaignManagerAgent';
export { runPerformanceAnalystAgent } from './performanceAnalystAgent';
export type { PerformanceAnalystAgentInput, PerformanceAnalystAgentOutput } from './performanceAnalystAgent';
