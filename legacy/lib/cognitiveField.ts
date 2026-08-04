/**
 * COGNITIVE FIELD (Phase 26 — Unified Cognitive Field)
 *
 * THE NERVOUS SYSTEM of MOOD Creative OS.
 *
 * Until Phase 25 the system had many powerful intelligence layers,
 * but they risked behaving like separate modules reporting in a line.
 * Phase 26 does not add a new organ — it builds the nervous system
 * that makes every organ behave like one mind.
 *
 * The cognitive field is the central SHARED STATE-SPACE. It receives
 * the signals every engine has already produced for this banner and
 * unifies them into ONE CognitiveFieldState — a single persistent
 * psychological world-state.
 *
 * The master principle: the engine no longer asks "what does this
 * module output?" It asks "how does this change the human world
 * model?" The cognitive field IS that world model, per banner.
 *
 * The critical output is `emergence_score`: did the candidate banner
 * EMERGE from this unified field, or was it merely DECORATED by the
 * intelligence modules? The meta-critic refuses the decorated.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalMicroMoment } from './culturalMemory';
import type { SystemicCauseReading } from './systemicPressureMap';
import type { CognitiveResidueReading } from './cognitiveResidue';
import type { BehaviorLoopReading } from './behaviorLoopEngine';
import type { BehavioralResidueReading } from './behavioralResidue';
import type { SocialMaskingEngineReading } from './socialMaskingEngine';
import type { DesireArchitectureReading } from './desireArchitecture';
import type { RitualFormationReading } from './ritualFormation';
import type { AttachmentLoopsReading } from './attachmentLoops';
import type { InternalNarrativeReading } from './internalNarrative';
import type { SelfStoryArchitectureReading } from './selfStoryArchitecture';
import type { EmotionalForecastReading } from './emotionalForecasting';
import type { CollectiveEmotionalMovementReading } from './collectiveEmotionalMovement';
import type { TruthPersistenceReport } from './truthPersistence';
import type { DecayReading } from './emotionalDecay';
import type { SymbolicObjectsReading } from './symbolicObjects';
import type { UnifiedHumanGraphReading } from './unifiedHumanGraph';
import type { WorldState } from './worldStateSimulation';
import { describeWorldState } from './worldStateSimulation';

export interface CognitiveFieldState {
  dominantTruths: string[];
  unresolvedTensions: string[];
  activePressures: string[];
  behavioralLoops: string[];
  maskingPatterns: string[];
  desireForces: string[];
  ritualAttachments: string[];
  identityNarratives: string[];
  culturalSignals: string[];
  emotionalResidue: string[];
  futureTrajectories: string[];
  symbolicObjects: string[];
  fatigueRisks: string[];
  truthPersistence: number;            // 0..10
  decaySignals: string[];
  campaignAtmosphere: string;
  worldStateConfidence: number;        // 0..10
  // ─── derived unification metrics ─────────────────────────────
  /** 0..10 — how internally consistent the field is. */
  field_coherence: number;
  /** 0..10 — how much the candidate banner EMERGED from the field
   *  rather than being decorated by the modules. The meta-critic's
   *  central Phase 26 signal. */
  emergence_score: number;
  /** The dimensions of the field the candidate banner actually
   *  connects to (truth / pressure / behavior / identity / ritual /
   *  culture / campaign-memory). */
  connected_dimensions: string[];
  notes: string[];
}

export interface CognitiveFieldInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  culturalMicroMoment: CulturalMicroMoment | null;
  systemicCause: SystemicCauseReading | null;
  cognitiveResidue: CognitiveResidueReading | null;
  behaviorLoop: BehaviorLoopReading | null;
  behavioralResidue: BehavioralResidueReading | null;
  socialMasking: SocialMaskingEngineReading | null;
  desire: DesireArchitectureReading | null;
  ritualFormation: RitualFormationReading | null;
  attachmentLoops: AttachmentLoopsReading | null;
  internalNarrative: InternalNarrativeReading | null;
  selfStory: SelfStoryArchitectureReading | null;
  forecast: EmotionalForecastReading | null;
  collectiveMovement: CollectiveEmotionalMovementReading | null;
  truthPersistenceReport: TruthPersistenceReport | null;
  decay: DecayReading | null;
  symbolicObjects: SymbolicObjectsReading | null;
  unifiedGraph: UnifiedHumanGraphReading | null;
  worldState: WorldState | null;
}

export function buildCognitiveField(input: CognitiveFieldInput): CognitiveFieldState {
  const notes: string[] = [];

  // ─── dominant truths ───────────────────────────────────────────
  const dominantTruths: string[] = [];
  if (input.emotionalCore) dominantTruths.push(input.emotionalCore.id);
  if (input.truth.truth) dominantTruths.push(input.truth.truth.slice(0, 80));

  // ─── unresolved tensions ───────────────────────────────────────
  const unresolvedTensions: string[] = [];
  if (input.truth.tension) unresolvedTensions.push(input.truth.tension);
  if (input.internalNarrative?.primary && !input.internalNarrative.too_articulate) {
    unresolvedTensions.push(`internal: ${input.internalNarrative.primary.id}`);
  }

  // ─── active pressures ──────────────────────────────────────────
  const activePressures: string[] = [];
  if (input.systemicCause?.matched_systems.primary) {
    activePressures.push(input.systemicCause.matched_systems.primary.id);
  }
  if (input.systemicCause?.matched_systems.secondary) {
    activePressures.push(input.systemicCause.matched_systems.secondary.id);
  }

  // ─── behavioral loops ──────────────────────────────────────────
  const behavioralLoops: string[] = [];
  if (input.behaviorLoop?.primary_loop) behavioralLoops.push(input.behaviorLoop.primary_loop.id);
  if (input.behaviorLoop?.secondary_loop) behavioralLoops.push(input.behaviorLoop.secondary_loop.id);

  // ─── masking patterns ──────────────────────────────────────────
  const maskingPatterns: string[] = [];
  if (input.socialMasking?.primary) {
    maskingPatterns.push(`${input.socialMasking.primary.id} (${input.socialMasking.classification})`);
  }

  // ─── desire forces ─────────────────────────────────────────────
  const desireForces: string[] = [];
  if (input.desire?.primary) desireForces.push(input.desire.primary.id);
  if (input.desire?.secondary) desireForces.push(input.desire.secondary.id);

  // ─── ritual attachments ────────────────────────────────────────
  const ritualAttachments: string[] = [];
  if (input.attachmentLoops?.primary) ritualAttachments.push(input.attachmentLoops.primary.id);
  if (input.ritualFormation?.detected_stage) {
    ritualAttachments.push(`formation:${input.ritualFormation.detected_stage}`);
  }

  // ─── identity narratives ───────────────────────────────────────
  const identityNarratives: string[] = [];
  if (input.selfStory?.primary) identityNarratives.push(input.selfStory.primary.id);
  if (input.internalNarrative?.primary) identityNarratives.push(input.internalNarrative.primary.id);

  // ─── cultural signals ──────────────────────────────────────────
  const culturalSignals: string[] = [];
  if (input.culturalMicroMoment) culturalSignals.push(input.culturalMicroMoment.state_id);
  if (input.collectiveMovement) culturalSignals.push(input.collectiveMovement.current_direction);

  // ─── emotional residue ─────────────────────────────────────────
  const emotionalResidue: string[] = [];
  for (const r of input.cognitiveResidue?.detected ?? []) emotionalResidue.push(r.id);
  if (input.behavioralResidue?.carries_weeks_not_minutes) emotionalResidue.push('carries-weeks-of-residue');

  // ─── future trajectories ───────────────────────────────────────
  const futureTrajectories: string[] = [];
  if (input.forecast) futureTrajectories.push(input.forecast.direction);

  // ─── symbolic objects ──────────────────────────────────────────
  const symbolicObjects = (input.symbolicObjects?.objects_present ?? []).map((o) => o.object);

  // ─── fatigue risks ─────────────────────────────────────────────
  const fatigueRisks: string[] = [];
  if (input.worldState && input.worldState.exhaustion_level >= 7) fatigueRisks.push('world-exhaustion-high');
  if (input.worldState && input.worldState.silence_availability <= 3) fatigueRisks.push('world-silence-collapsed');
  if (input.symbolicObjects?.worn_motif_present) fatigueRisks.push('worn-object-motif');

  // ─── truth persistence ─────────────────────────────────────────
  const truthPersistence = input.truthPersistenceReport?.durability_score ?? 0;

  // ─── decay signals ─────────────────────────────────────────────
  const decaySignals: string[] = [];
  if (input.decay && input.decay.status !== 'fresh') decaySignals.push(input.decay.status);
  if (input.decay?.decorative_mode) decaySignals.push(input.decay.decorative_mode);

  // ─── campaign atmosphere ───────────────────────────────────────
  const campaignAtmosphere = input.unifiedGraph?.portrait
    ?? (input.worldState ? describeWorldState(input.worldState) : 'the campaign atmosphere is still forming');

  // ─── world-state confidence ────────────────────────────────────
  // The field is confident when many dimensions are populated AND the
  // world-state has accumulated observations.
  const populated = [
    dominantTruths, activePressures, behavioralLoops, maskingPatterns,
    desireForces, ritualAttachments, identityNarratives, culturalSignals,
    emotionalResidue, futureTrajectories,
  ].filter((d) => d.length > 0).length;
  let worldStateConfidence = Math.min(10, populated * 0.9 + 1);
  if (input.worldState && input.worldState.generationCount >= 5) worldStateConfidence = Math.min(10, worldStateConfidence + 1.5);
  worldStateConfidence = round1(worldStateConfidence);

  // ─── field coherence ───────────────────────────────────────────
  // Coherent when the field's dimensions agree: a pressure that
  // produces a loop that produces residue that the forecast extends.
  let field_coherence = 5;
  if (activePressures.length && behavioralLoops.length) field_coherence += 1.5;
  if (behavioralLoops.length && emotionalResidue.length) field_coherence += 1.5;
  if (emotionalResidue.length && futureTrajectories.length) field_coherence += 1;
  if (dominantTruths.length && desireForces.length) field_coherence += 1;
  field_coherence = clamp10(round1(field_coherence));

  // ─── connected dimensions + emergence ──────────────────────────
  // The candidate banner "emerges from the field" when its creative
  // backbone connects to the field's structural dimensions, not just
  // to taste/aesthetics.
  const connected_dimensions: string[] = [];
  if (dominantTruths.length) connected_dimensions.push('human-truth');
  if (activePressures.length) connected_dimensions.push('pressure');
  if (behavioralLoops.length) connected_dimensions.push('behavior');
  if (identityNarratives.length || maskingPatterns.length) connected_dimensions.push('identity');
  if (ritualAttachments.length) connected_dimensions.push('ritual');
  if (culturalSignals.length) connected_dimensions.push('culture');
  if (truthPersistence >= 4 || (input.unifiedGraph?.human_coherence ?? 0) >= 5) {
    connected_dimensions.push('campaign-memory');
  }

  let emergence_score = connected_dimensions.length * 1.4;
  if (field_coherence >= 7) emergence_score += 1.5;
  if (input.unifiedGraph && input.unifiedGraph.candidate_belongs >= 6) emergence_score += 1;
  emergence_score = clamp10(round1(emergence_score));

  notes.push(`cognitive field unified ${populated}/10 dimensions · coherence ${field_coherence}/10`);
  notes.push(`emergence ${emergence_score}/10 — connected to: ${connected_dimensions.join(', ') || 'nothing structural'}`);
  if (emergence_score < 4 && worldStateConfidence >= 6) {
    notes.push('WARNING: the banner reads as DECORATED by modules, not EMERGED from the world model');
  }

  return {
    dominantTruths, unresolvedTensions, activePressures, behavioralLoops,
    maskingPatterns, desireForces, ritualAttachments, identityNarratives,
    culturalSignals, emotionalResidue, futureTrajectories, symbolicObjects,
    fatigueRisks, truthPersistence: round1(truthPersistence), decaySignals,
    campaignAtmosphere, worldStateConfidence,
    field_coherence, emergence_score, connected_dimensions, notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
