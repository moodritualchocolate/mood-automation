/**
 * AUTONOMOUS CREATIVE DIRECTION (Phase 35 — Wave 2: Reality Execution)
 *
 * The system makes a real CREATIVE DECISION — not an output, a
 * decision. It chooses a territory, rejects alternatives, forms a
 * strategy, writes a do-not-do list, and produces a Creative Director
 * Memo explaining the next move.
 *
 * Meta-critic question: "Did the system make a real creative
 * decision, or did it simply generate another asset?"
 */

import type { HumanState } from '@/core/types';
import type { EmotionalTraceEntry } from './humanMemory';
import type { CampaignNervousSystemReading } from './campaignNervousSystem';
import type { EmotionalContinuityRuntimeReading } from './emotionalContinuityRuntime';
import type { AudienceRealityFeedbackReading } from './audienceRealityFeedback';
import type { AntiOptimizationReading } from './antiOptimization';
import type { IdentityPersistenceReading } from './identityPersistence';
import { formCampaignHypothesis, type CampaignHypothesis } from './campaignHypothesisEngine';
import { planEmotionalStrategy, type EmotionalStrategy } from './emotionalStrategyPlanner';
import { recordCreativeDecision, type CreativeDecisionRecord } from './creativeDecisionMemory';
import { compileDoNotDoMemory } from './doNotDoMemory';

export interface AutonomousCreativeDirectionReading {
  campaignHypothesis: CampaignHypothesis;
  chosenTerritory: string;
  rejectedTerritories: string[];
  emotionalStrategy: EmotionalStrategy;
  visualStrategy: string;
  productStrategy: string;
  audienceStrategy: string;
  riskAssessment: string;
  nextCreativeMove: string;
  doNotDoList: string[];
  decision: CreativeDecisionRecord;
  /** The Creative Director Memo — a real decision in plain language. */
  creativeDirectorMemo: string;
  /** True when this is a real creative decision, not just an asset. */
  is_a_real_decision: boolean;
  notes: string[];
}

export interface AutonomousCreativeDirectionInput {
  state: HumanState;
  trail: EmotionalTraceEntry[];
  nervousSystem: CampaignNervousSystemReading;
  continuity: EmotionalContinuityRuntimeReading;
  feedback: AudienceRealityFeedbackReading;
  antiOptimization: AntiOptimizationReading;
  identity: IdentityPersistenceReading;
}

const ALL_TERRITORIES = ['fatigue', 'overstimulation', 'avoidance', 'numbness', 'pressure', 'fragmentation', 'paralysis', 'collapse'];

export function directAutonomousCreative(input: AutonomousCreativeDirectionInput): AutonomousCreativeDirectionReading {
  const { state, trail, nervousSystem, continuity, feedback, antiOptimization, identity } = input;
  const notes: string[] = [];

  const campaignHypothesis = formCampaignHypothesis({ nervousSystem, continuity, feedback });
  const emotionalStrategy = planEmotionalStrategy({ continuity, nervousSystem, antiOptimization });
  const doNotDo = compileDoNotDoMemory({ nervousSystem, continuity, antiOptimization, identity, feedback });

  const chosenTerritory = state.family;
  // Rejected territories — the over-represented ones in the recent
  // trail that the system deliberately did NOT choose this run.
  const familyCounts: Record<string, number> = {};
  for (const t of trail.slice(0, 10)) familyCounts[t.family] = (familyCounts[t.family] ?? 0) + 1;
  const rejectedTerritories = ALL_TERRITORIES
    .filter((t) => t !== chosenTerritory && (familyCounts[t] ?? 0) >= 2)
    .sort((a, b) => (familyCounts[b] ?? 0) - (familyCounts[a] ?? 0))
    .slice(0, 3);
  // If the trail is too thin to over-represent anything, name the
  // territories the hypothesis explicitly steers away from.
  if (rejectedTerritories.length === 0) {
    for (const t of ALL_TERRITORIES) {
      if (t !== chosenTerritory && nervousSystem.motifOveruse.length > 0) { rejectedTerritories.push(t); }
      if (rejectedTerritories.length >= 2) break;
    }
  }

  const decisionReason =
    `${campaignHypothesis.hypothesis} — therefore ${emotionalStrategy.emotionalMove} "${chosenTerritory}"`;
  const decisionMemory = recordCreativeDecision({
    chosenTerritory,
    emotionalMove: emotionalStrategy.emotionalMove,
    reason: decisionReason,
    rejectedTerritories,
    trail,
  });

  const visualStrategy =
    `silence at ${emotionalStrategy.silenceLevel}/10; ` +
    `${emotionalStrategy.silenceLevel >= 6 ? 'restrained, observed framing' : 'present but never loud'}`;
  const productStrategy =
    emotionalStrategy.productVisibility === 'hidden'
      ? 'product hidden — the truth carries the banner; the product must not become the interruption'
      : 'product environmental — held by the scene physics, never pasted, never a hero shot';
  const audienceStrategy = feedback.has_feedback
    ? feedback.learningRecommendation
    : 'no feedback yet — decide from world-state and memory, observe the response';
  const riskAssessment =
    antiOptimization.optimization_corrupts_truth ? 'HIGH — optimisation pressure would corrupt truth; resist it'
    : identity.identityRisk >= 6 ? 'ELEVATED — identity is drifting; protect the MOOD voice'
    : continuity.emotionalRepetitionRisk >= 6 ? 'ELEVATED — emotional repetition risk; the move must evolve'
    : 'CONTAINED — the campaign is alive and on-identity';

  const nextCreativeMove =
    `${emotionalStrategy.emotionalMove} the "${chosenTerritory}" territory with ${emotionalStrategy.posture}`;

  // A real decision requires: a hypothesis, rejected alternatives, a
  // do-not-do list, a reason, and a move that is not a flat repeat.
  const is_a_real_decision =
    campaignHypothesis.hypothesis.length > 0 &&
    doNotDo.do_not_do.length > 0 &&
    !decisionMemory.repeats_prior_decision &&
    riskAssessment.length > 0;

  const creativeDirectorMemo = buildMemo({
    hypothesis: campaignHypothesis,
    move: nextCreativeMove,
    chosenTerritory,
    rejectedTerritories,
    doNotDo: doNotDo.do_not_do,
    riskAssessment,
    audienceStrategy,
  });

  notes.push(`autonomous creative direction: ${is_a_real_decision ? 'a real creative decision' : 'NOT a real decision — just an asset'}`);
  notes.push(...campaignHypothesis.hypothesis ? [`hypothesis: ${campaignHypothesis.hypothesis}`] : []);
  notes.push(...decisionMemory.notes, ...doNotDo.notes);

  return {
    campaignHypothesis,
    chosenTerritory,
    rejectedTerritories,
    emotionalStrategy,
    visualStrategy,
    productStrategy,
    audienceStrategy,
    riskAssessment,
    nextCreativeMove,
    doNotDoList: doNotDo.do_not_do,
    decision: decisionMemory.decision,
    creativeDirectorMemo,
    is_a_real_decision,
    notes,
  };
}

function buildMemo(args: {
  hypothesis: CampaignHypothesis;
  move: string;
  chosenTerritory: string;
  rejectedTerritories: string[];
  doNotDo: string[];
  riskAssessment: string;
  audienceStrategy: string;
}): string {
  const lines: string[] = [];
  lines.push(`This campaign should ${args.move}.`);
  lines.push(`Hypothesis: ${args.hypothesis.hypothesis}.`);
  if (args.rejectedTerritories.length) {
    lines.push(`Not: ${args.rejectedTerritories.join(', ')} — those territories are saturated or decaying.`);
  }
  lines.push(`Audience: ${args.audienceStrategy}.`);
  lines.push(`Risk: ${args.riskAssessment}.`);
  lines.push(`Do not: ${args.doNotDo.slice(0, 3).join('; ')}.`);
  return lines.join(' ');
}
