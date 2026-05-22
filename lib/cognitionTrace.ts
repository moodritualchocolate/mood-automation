/**
 * COGNITION TRACE (Phase 26 — Unified Cognitive Field)
 *
 * Makes the system EXPLAIN ITS THINKING. For every generation the
 * trace records why the banner exists — the truth, the pressure, the
 * causal chain, the chosen tension, what was rejected and why, and
 * the final creative reason.
 *
 * The trace is the evidence the meta-critic uses to enforce Phase
 * 26's critical rule: a banner whose final creative decision cannot
 * be explained through the cognitive field is refused.
 */

import type { CognitiveFieldState } from './cognitiveField';
import type { EmotionalPhysicsReading } from './emotionalPhysics';
import type { TensionTopologyReading } from './tensionTopology';
import type { LifeTrajectoryReading } from './lifeTrajectory';
import type { ContradictionResolverReading } from './cognitiveContradictionResolver';

export interface CognitionTrace {
  bannerId: string;
  createdAt: number;
  primaryHumanTruth: string;
  dominantPressure: string;
  causalChain: string[];
  chosenTension: string;
  rejectedDirections: string[];
  whyRejected: string[];
  productDecision: string;
  typographyDecision: string;
  silenceDecision: string;
  campaignMemoryInfluence: string;
  worldStateUpdate: string;
  finalCreativeReason: string;
  /** 0..10 — how fully the banner is explained by the field. */
  explainability: number;
}

export interface CognitionTraceInput {
  bannerId: string;
  field: CognitiveFieldState;
  physics: EmotionalPhysicsReading;
  topology: TensionTopologyReading;
  trajectory: LifeTrajectoryReading;
  resolver: ContradictionResolverReading;
  rejectedAttempts: Array<{ stage: string; reason: string }>;
  productDecision: string;
  typographyDecision: string;
  silenceDecision: string;
  worldStateUpdate: string;
}

export function buildCognitionTrace(input: CognitionTraceInput): CognitionTrace {
  const {
    bannerId, field, physics, topology, trajectory, resolver,
    rejectedAttempts, productDecision, typographyDecision, silenceDecision,
    worldStateUpdate,
  } = input;

  const primaryHumanTruth = field.dominantTruths[0] ?? 'no dominant truth';
  const dominantPressure = field.activePressures[0] ?? 'no structural pressure';
  const causalChain = physics.primary_chain?.chain ?? [];
  const chosenTension = topology.deepest_opportunity?.the_tension ?? field.unresolvedTensions[0] ?? 'no tension chosen';
  const rejectedDirections = rejectedAttempts.map((r) => r.stage);
  const whyRejected = rejectedAttempts.map((r) => r.reason);
  const campaignMemoryInfluence = field.connected_dimensions.includes('campaign-memory')
    ? `truth persistence ${field.truthPersistence}/10 informed this banner`
    : 'campaign memory did not materially shape this banner';

  // The final creative reason MUST connect to a structural dimension.
  const finalCreativeReason = field.connected_dimensions.length > 0
    ? `the banner emerged from the cognitive field via ${field.connected_dimensions.join(' + ')}, ` +
      `governed by "${resolver.governing_voice}"; ${trajectory.trajectory_statement}`
    : 'the banner has no structural reason — it was decorated, not derived';

  // Explainability — how completely the field accounts for the banner.
  let explainability = field.emergence_score;
  if (physics.primary_chain) explainability += 1;
  if (topology.truth_inhabits_opportunity) explainability += 1;
  if (resolver.governing_voice === 'human-truth') explainability += 0.5;
  explainability = Math.max(0, Math.min(10, Math.round(explainability * 10) / 10));

  return {
    bannerId,
    createdAt: Date.now(),
    primaryHumanTruth,
    dominantPressure,
    causalChain,
    chosenTension,
    rejectedDirections,
    whyRejected,
    productDecision,
    typographyDecision,
    silenceDecision,
    campaignMemoryInfluence,
    worldStateUpdate,
    finalCreativeReason,
    explainability,
  };
}
