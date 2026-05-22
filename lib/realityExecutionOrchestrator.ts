/**
 * REALITY EXECUTION ORCHESTRATOR (Wave 2 — Phases 28–35)
 *
 * Wraps the eight Wave 2 phases into one connected execution layer.
 * Where Phase 26 made the system one mind and Phase 27 made that mind
 * persist, Wave 2 makes the mind ACT in reality — observe what it
 * releases, protect its truth, learn from response, resist
 * corruption, and decide what the brand should say next.
 *
 * The global meta-critic question: "Did this creative move emerge
 * from reality, memory, identity, and strategy — or did it merely
 * produce content?"
 */

import type { CampaignNervousSystemReading } from './campaignNervousSystem';
import type { AttentionPhysicsReading } from './attentionPhysics';
import type { VisualCognitionReading } from './visualCognition';
import type { EmotionalContinuityRuntimeReading } from './emotionalContinuityRuntime';
import type { AudienceRealityFeedbackReading } from './audienceRealityFeedback';
import type { AntiOptimizationReading } from './antiOptimization';
import type { IdentityPersistenceReading } from './identityPersistence';
import type { AutonomousCreativeDirectionReading } from './autonomousCreativeDirection';

export interface RealityExecutionState {
  /** 0..10 — how alive the campaign is. */
  campaignAlive: number;
  /** 0..10 — how true (vs loud) the attention is. */
  attentionTruth: number;
  /** 0..10 — how seen (vs assembled) the frame is. */
  frameSeen: number;
  /** 0..10 — how continuous the emotional arc is. */
  emotionalContinuity: number;
  /** 0..10 — how deeply the audience recognised itself. */
  audienceRecognition: number;
  /** 0..10 — anti-optimization integrity (10 = no corruption). */
  optimizationIntegrity: number;
  /** 0..10 — identity integrity (10 = unmistakably MOOD). */
  identityIntegrity: number;
  /** True when the run produced a real creative decision. */
  realDecisionMade: boolean;
  /** 0..10 — how strongly the move emerged from reality+memory+
   *  identity+strategy rather than merely producing content. */
  emergence_from_reality: number;
  /** The global verdict — the Wave 2 meta-critic signal. */
  merely_produced_content: boolean;
  /** The Creative Director Memo for this run. */
  creativeDirectorMemo: string;
  /** A consolidated one-line execution verdict. */
  executionVerdict: string;
  notes: string[];
}

export interface RealityExecutionInput {
  nervousSystem: CampaignNervousSystemReading;
  attention: AttentionPhysicsReading;
  visualCognition: VisualCognitionReading;
  continuity: EmotionalContinuityRuntimeReading;
  feedback: AudienceRealityFeedbackReading;
  antiOptimization: AntiOptimizationReading;
  identity: IdentityPersistenceReading;
  direction: AutonomousCreativeDirectionReading;
}

export function orchestrateRealityExecution(input: RealityExecutionInput): RealityExecutionState {
  const {
    nervousSystem, attention, visualCognition, continuity, feedback,
    antiOptimization, identity, direction,
  } = input;
  const notes: string[] = [];

  const campaignAlive = nervousSystem.emotionally_alive ? 8 : 3;
  const attentionTruth = attention.attention_is_true ? 8 : attention.attention_is_loud ? 2 : 5;
  const frameSeen = visualCognition.frame_is_seen ? 8 : 4;
  const emotionalContinuity = round1(10 - continuity.emotionalRepetitionRisk);
  const audienceRecognition = feedback.has_feedback
    ? feedback.deepEngagement
    : 5;   // no feedback yet — neutral, decided from memory
  const optimizationIntegrity = round1(10 - antiOptimization.optimizationRisk);
  const identityIntegrity = round1(10 - identity.identityRisk);
  const realDecisionMade = direction.is_a_real_decision;

  // Emergence from reality+memory+identity+strategy — the run emerged
  // when it is alive, attention is true, the frame is seen, identity
  // holds, optimisation did not corrupt it, and a real decision drove
  // it.
  const emergenceFactors = [
    nervousSystem.emotionally_alive,
    !attention.attention_is_loud,
    visualCognition.frame_is_seen,
    !antiOptimization.optimization_corrupts_truth,
    identity.still_unmistakably_mood,
    direction.is_a_real_decision,
    continuity.is_the_next_move,
  ];
  const emergence_from_reality = round1((emergenceFactors.filter(Boolean).length / emergenceFactors.length) * 10);

  // "Merely produced content" — the global Wave 2 failure. The move is
  // mere content when it did not emerge: no real decision, OR a
  // corrupted / loud / off-identity execution.
  const merely_produced_content =
    !realDecisionMade ||
    emergence_from_reality < 5 ||
    antiOptimization.optimization_corrupts_truth ||
    !identity.still_unmistakably_mood;

  const executionVerdict = merely_produced_content
    ? 'this run MERELY PRODUCED CONTENT — it did not emerge from reality, memory, identity, and strategy'
    : 'this run is a real creative move — it emerged from reality, memory, identity, and strategy';

  notes.push(`reality execution: ${executionVerdict} (emergence ${emergence_from_reality}/10)`);
  notes.push(`campaign alive ${campaignAlive}/10 · attention truth ${attentionTruth}/10 · frame seen ${frameSeen}/10 · identity ${identityIntegrity}/10`);

  return {
    campaignAlive, attentionTruth, frameSeen, emotionalContinuity,
    audienceRecognition, optimizationIntegrity, identityIntegrity,
    realDecisionMade, emergence_from_reality, merely_produced_content,
    creativeDirectorMemo: direction.creativeDirectorMemo,
    executionVerdict, notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
