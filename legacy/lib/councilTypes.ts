/**
 * COUNCIL TYPES (Wave 5 — Autonomous Strategic Society)
 *
 * Shared contracts for the internal cognitive council. The system is
 * no longer one executive intelligence — it is a SOCIETY of cognitive
 * entities with competing interpretations of reality. Before Wave 5
 * the system thinks; after Wave 5 it argues with itself before
 * acting.
 *
 * The CouncilBriefing is the shared packet every entity reads — a
 * flat snapshot of the campaign drawn from the whole 1–42 cognition
 * stack. Each entity interprets the SAME briefing through its OWN
 * bias and produces an EntityOpinion.
 */

export type CouncilEntityId =
  | 'strategist'
  | 'identity-guardian'
  | 'cultural-analyst'
  | 'audience-interpreter'
  | 'emotional-historian'
  | 'attention-physicist'
  | 'recovery-director'
  | 'anti-hype-defender'
  | 'world-state-observer'
  | 'narrative-architect'
  | 'executive-synthesizer';

export type EntityStance = 'advocate' | 'object' | 'caution' | 'abstain';

export interface EntityOpinion {
  entity: CouncilEntityId;
  stance: EntityStance;
  /** 0..10 — how strongly the entity holds this position. */
  conviction: number;
  /** The entity's argument, in its own voice. */
  argument: string;
  /** The priority this entity exists to defend. */
  priority_defended: string;
}

/**
 * The flat campaign snapshot every council entity interprets. Built
 * by the pipeline from the accumulated 1–42 readings.
 */
export interface CouncilBriefing {
  // ── strategic (Phase 36) ──
  strategicWeight: number;
  priorityBand: 'deepen' | 'proceed' | 'defer' | 'refuse';
  strategicallyUnwise: boolean;
  merelyEmotionallyEffective: boolean;
  longTermEquity: number;
  // ── identity (Phase 19 / 34 / 39) ──
  identityGovernanceBlocks: boolean;
  exhaustedHumanTrust: boolean;
  identityRisk: number;
  // ── cultural (Phase 12 / 42) ──
  collectiveRecognition: number;
  worldTension: number;
  culturalClimate: string;
  viralContamination: number;
  // ── audience (Phase 32) ──
  audienceHasFeedback: boolean;
  audienceRecognisedItself: boolean;
  deepEngagement: number;
  shallowEngagement: number;
  responseCorruptsTruth: boolean;
  // ── emotional history (Phase 9 / 15 / 31) ──
  emotionalRepetitionRisk: number;
  truthPersistence: number;
  continuityScore: number;
  // ── attention (Phase 29) ──
  attentionIsTrue: boolean;
  attentionIsLoud: boolean;
  attentionRisk: number;
  // ── recovery (Phase 37) ──
  cognitiveEnergy: number;
  shouldSpeak: boolean;
  recommendSilence: boolean;
  // ── anti-hype (Phase 33) ──
  optimizationCorruptsTruth: boolean;
  optimizationRisk: number;
  // ── world-state (Phase 42) ──
  campaignUnderstandsWorld: boolean;
  worldStrained: boolean;
  // ── narrative (Phase 35 / 40) ──
  lifecycleState: string;
  campaignHealth: number;
  isRealDecision: boolean;
  // ── executive (Phase 41) ──
  executiveAction: string;
  executiveIsOutput: boolean;
  executiveConfidence: number;
  // ── core ──
  emergence: number;
  truthValue: number;
}

/** A small DRY helper for entities to build their opinion. */
export function makeOpinion(
  entity: CouncilEntityId,
  priority_defended: string,
  stance: EntityStance,
  conviction: number,
  argument: string,
): EntityOpinion {
  return {
    entity,
    priority_defended,
    stance,
    conviction: Math.max(0, Math.min(10, Math.round(conviction * 10) / 10)),
    argument,
  };
}
