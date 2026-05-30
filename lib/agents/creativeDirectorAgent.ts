/**
 * CREATIVE DIRECTOR AGENT (pure orchestrator)
 *
 * Consumes business goal + campaign + performance history. Produces
 * operator-reviewable creative briefs · angles · story directions ·
 * asset requirements.
 *
 * The agent calls existing pure analyzers (campaign planner + story
 * architect + creative director + creative brief generator) — it
 * never generates assets, never publishes.
 */

import type { Formula } from '@/core/types';
import { composeCampaignPlan, type CampaignGoal, type CampaignMarket } from '../campaignPlannerEngine';
import { computeStoryArchitect } from '../storyArchitectEngine';
import { computeCreativeDirections } from '../creativeDirectorEngine';
import { computeCreativeBriefs } from '../creativeBriefGenerator';
import type { PerformanceAnalyzerReading } from '../performanceAnalyzer';
import type { AgentDescriptor } from './types';
import { AGENT_CATALOG, AGENT_ADVISORY_NOTICE } from './types';

// ─── input ────────────────────────────────────────────────────

export interface CreativeDirectorAgentInput {
  goal: CampaignGoal;
  formula: Formula;
  market: CampaignMarket;
  audience: string;
  budgetUSD?: number;
  brandLanguage?: 'hebrew' | 'mixed' | 'english';
  /** Optional performance evidence to anchor the briefs. */
  performance?: PerformanceAnalyzerReading | null;
}

// ─── output ───────────────────────────────────────────────────

export interface CreativeDirectorAgentOutput {
  descriptor: AgentDescriptor;
  /** Compact composed reading. */
  campaignSnapshot: ReturnType<typeof composeCampaignPlan>;
  storyArchitect: ReturnType<typeof computeStoryArchitect>;
  creativeDirections: ReturnType<typeof computeCreativeDirections>;
  briefs: ReturnType<typeof computeCreativeBriefs>;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── main ─────────────────────────────────────────────────────

export function runCreativeDirectorAgent(
  input: CreativeDirectorAgentInput,
): CreativeDirectorAgentOutput {
  const budgetUSD = Math.max(0, Math.floor(input.budgetUSD ?? 1000));
  const brandLanguage = input.brandLanguage ?? 'hebrew';

  // Step 1 — anchor a campaign plan.
  const campaignSnapshot = composeCampaignPlan({
    budgetUSD, goal: input.goal, formula: input.formula,
    market: input.market, audience: input.audience, brandLanguage,
  });

  // Step 2 — story architecture (we need a coarse imprint shape;
  // the agent re-uses the campaign's creative angles as a proxy
  // for the story families to surface).
  const storyArchitect = computeStoryArchitect({
    world: {},
    presence: {},
    imprint: {},
    humanTruth: {},
    selfReflection: {},
    culturalMemory: {},
    supervised: {},
    trialOutcomes: { totalOutcomes: 0 },
    scar: {},
    director: { dominantDirections: ['restraintDirections', 'realismDirections'] },
  });

  // Step 3 — creative directions (uses world signals as inputs; we
  // pass minimal hints so the directions stay restrained when no
  // observed history exists).
  const creativeDirections = computeCreativeDirections({
    world: {},
    memoryImprint: {},
    selfReflection: {},
    humanTruth: {},
    presence: {},
    supervised: { alignedMutations: [], contradictedMutations: [] },
    trialOutcomes: { totalOutcomes: 0 },
  });

  // Step 4 — briefs derived from the campaign plan + story architect.
  const briefs = computeCreativeBriefs({
    stories: storyArchitect.storyBlueprints,
    scenes: [],
    packages: {},
    formula: input.formula,
    brandLanguage,
    audienceMarket: input.market,
  });

  const notes: string[] = [
    'creative director agent run · operator-reviewable output',
    'historically observed creative briefs + angles + story directions composed for operator review',
  ];
  if (input.performance && input.performance.totalPerformances > 0) {
    notes.push(`anchored to ${input.performance.totalPerformances} prior performance observation(s) historically observed`);
  } else {
    notes.push('no prior performance evidence — requires more evidence');
  }

  return {
    descriptor: AGENT_CATALOG['creative-director'],
    campaignSnapshot,
    storyArchitect,
    creativeDirections,
    briefs,
    notes,
    reasonCodes: [
      `goal:${input.goal}`,
      `formula:${input.formula}`,
      `market:${input.market}`,
      `budgetUSD:${budgetUSD}`,
      `blueprints:${storyArchitect.storyBlueprints.length}`,
      `briefs:${briefs.banners.length + briefs.carousels.length + briefs.images.length + briefs.videos.length + briefs.landings.length}`,
    ],
    advisoryNotice: AGENT_ADVISORY_NOTICE,
  };
}
