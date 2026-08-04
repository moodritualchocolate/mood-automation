/**
 * EXECUTIVE RUNTIME (Phase 41 — Wave 4: Executive Cognition)
 *
 * The engine now decides like a strategic creative director. This
 * module synthesises every Wave 4 layer — strategic priority,
 * cognitive energy, temporal psychology, identity governance,
 * campaign lifecycle, world-state — resolves their conflicts, selects
 * an executive action, runs self-governance, and explains itself.
 *
 * The system no longer behaves like content generation. It behaves
 * like a living executive nervous system.
 */

import type { StrategicPriorityReading } from './strategicPriorityEngine';
import type { CognitiveEnergyReading } from './cognitiveEnergyModel';
import type { TemporalPsychologyReading } from './temporalPsychology';
import type { IdentityGovernanceReading } from './identityGovernance';
import type { CampaignLifecycleReading } from './campaignLifecycle';
import type { ExecutiveWorldState, WorldUnderstandingReading } from './worldStateEngine';
import type { ExecutiveAction } from './actionSelection';
import { actionIsOutput } from './actionSelection';
import { resolveStrategicConflict, type ConflictPosition } from './strategicConflictResolution';
import { decideExecutiveAction } from './cognitiveDecisionEngine';
import { buildExecutiveReasoningTrace, type ExecutiveReasoningTrace } from './executiveReasoningTrace';
import { runSelfGovernanceLoop } from './selfGovernanceLoop';

export interface ExecutiveDecision {
  action: ExecutiveAction;
  is_an_output: boolean;
  decision_confidence: number;
  governing_voice: string;
  governance_score: number;
  decision_is_governed: boolean;
  strategically_wise: boolean;
  reasoning: ExecutiveReasoningTrace;
  /** True when the engine governed itself rather than merely reacting. */
  self_governed: boolean;
  notes: string[];
}

export interface ExecutiveRuntimeInput {
  strategicPriority: StrategicPriorityReading;
  cognitiveEnergy: CognitiveEnergyReading;
  temporal: TemporalPsychologyReading;
  identityGovernance: IdentityGovernanceReading;
  lifecycle: CampaignLifecycleReading;
  worldState: ExecutiveWorldState;
  worldUnderstanding: WorldUnderstandingReading;
}

export function runExecutiveRuntime(input: ExecutiveRuntimeInput): ExecutiveDecision {
  const {
    strategicPriority, cognitiveEnergy, temporal, identityGovernance,
    lifecycle, worldState, worldUnderstanding,
  } = input;
  const notes: string[] = [];

  // ─── build the conflict positions ──────────────────────────────
  const positions: ConflictPosition[] = [
    {
      voice: 'identity-governance',
      wants_block: identityGovernance.governance_blocks,
      pushes_toward: identityGovernance.governance_blocks ? 'archive' : 'permit',
      reason: identityGovernance.governanceCorrection ?? 'identity is intact',
    },
    {
      voice: 'world-understanding',
      wants_block: !worldUnderstanding.campaign_understands_world,
      pushes_toward: worldUnderstanding.campaign_understands_world ? 'permit' : 'delay',
      reason: worldUnderstanding.reason,
    },
    {
      voice: 'cognitive-energy',
      wants_block: cognitiveEnergy.recommend_silence || cognitiveEnergy.depletes_attention,
      pushes_toward: cognitiveEnergy.recommend_silence ? 'silence' : 'permit',
      reason: cognitiveEnergy.reason,
    },
    {
      voice: 'temporal-fitness',
      wants_block: temporal.timing_is_wrong,
      pushes_toward: temporal.timing_is_wrong ? 'delay' : 'permit',
      reason: temporal.reason,
    },
    {
      voice: 'strategic-priority',
      wants_block: strategicPriority.priority_band === 'refuse' || strategicPriority.priority_band === 'defer',
      pushes_toward: strategicPriority.priority_band,
      reason: strategicPriority.executiveSummary,
    },
    {
      voice: 'lifecycle-continuity',
      wants_block: false,
      pushes_toward: lifecycle.evolution_move,
      reason: lifecycle.lifecycleSummary,
    },
  ];
  const conflict = resolveStrategicConflict({ positions });

  // ─── decide the action ─────────────────────────────────────────
  const decision = decideExecutiveAction({
    conflict,
    identityBlocks: identityGovernance.governance_blocks,
    worldBlind: !worldUnderstanding.campaign_understands_world,
    recommendSilence: cognitiveEnergy.recommend_silence || cognitiveEnergy.depletes_attention,
    timingWrong: temporal.timing_is_wrong,
    priorityBand: strategicPriority.priority_band,
    realUrgency: strategicPriority.urgency_kind === 'real-urgency',
    strategicWeight: strategicPriority.strategic_weight,
    evolutionMove: lifecycle.evolution_move,
    shouldRetire: lifecycle.should_retire,
  });

  // ─── self-governance ───────────────────────────────────────────
  const strategically_wise = !strategicPriority.strategically_unwise && !strategicPriority.merely_emotionally_effective;
  const governance = runSelfGovernanceLoop({
    action: decision.action,
    strategicallyWise: strategically_wise,
    preservesLongTermTrust: identityGovernance.exhausted_human_would_trust,
    repeatingWouldDamage: lifecycle.lifecycle_state === 'overexposed' || lifecycle.lifecycle_state === 'emotionally-drained',
    speakingFromTruth: strategicPriority.urgency_kind !== 'false-urgency',
    belongsToWorld: worldUnderstanding.campaign_understands_world,
    strengthensInOneYear: strategicPriority.long_term_equity >= 5 && identityGovernance.exhausted_human_would_trust,
  });

  // ─── the reasoning trace ───────────────────────────────────────
  const reasoning = buildExecutiveReasoningTrace({
    action: decision.action,
    decisionConfidence: decision.decision_confidence,
    identity: identityGovernance.exhausted_human_would_trust
      ? 'a real exhausted human would trust this'
      : `identity at risk — ${identityGovernance.governanceCorrection ?? 'aesthetic admiration only'}`,
    fatigue: cognitiveEnergy.should_speak
      ? `cognitive energy ${cognitiveEnergy.cognitive_energy}/10 — there is energy to speak well`
      : `${cognitiveEnergy.reason}`,
    timing: temporal.timing_is_wrong ? temporal.reason : `timing truth ${temporal.timing_truth_score}/10 — the moment can receive it`,
    truth: `strategic truth value ${strategicPriority.truth_value}/10`,
    strategicValue: strategicPriority.executiveSummary,
    audienceState: worldState.climate_description,
    emotionalContinuity: lifecycle.lifecycleSummary,
    longTermMemoryImpact: `long-term equity ${strategicPriority.long_term_equity}/10`,
    identityAlignment: identityGovernance.constitutionAlignment,
    longTermCost: round1(10 - strategicPriority.long_term_equity),
  });

  const self_governed = governance.decision_is_governed;

  notes.push(`executive runtime: decision "${decision.action}" (${actionIsOutput(decision.action) ? 'output' : 'no output'}) — ${decision.primary_driver}`);
  notes.push(...conflict.notes, ...decision.notes, ...governance.notes);

  return {
    action: decision.action,
    is_an_output: actionIsOutput(decision.action),
    decision_confidence: decision.decision_confidence,
    governing_voice: conflict.governing_voice,
    governance_score: governance.governance_score,
    decision_is_governed: governance.decision_is_governed,
    strategically_wise,
    reasoning,
    self_governed,
    notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
