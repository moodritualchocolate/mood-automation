/**
 * COGNITIVE CONTINUITY SCORE (Phase 27 — Persistent Cognitive Runtime)
 *
 * Scores whether the system maintained CONTINUITY across runs — or
 * behaved like a fresh prompt that forgot everything it believed
 * yesterday.
 *
 * This is the signal behind Phase 27's master meta-critic question:
 * "Did this generation respect what the system has already learned,
 * or did it behave like a fresh prompt?"
 */

import type { CognitiveFieldState } from './cognitiveField';
import type { NextRunDirective } from './nextRunDirective';
import type { RejectionAssessment } from './rejectionMemory';
import type { ApprovalAssessment } from './approvalMemory';
import type { PriorStateSummary } from './runtimeMemoryStore';

export interface CognitiveContinuityReading {
  memory_continuity: number;
  campaign_identity_continuity: number;
  emotional_trajectory_continuity: number;
  symbolic_object_continuity: number;
  refusal_continuity: number;
  truth_persistence_continuity: number;
  human_graph_continuity: number;
  world_state_continuity: number;
  anti_repetition_effectiveness: number;
  evolution_without_fragmentation: number;
  /** 0..10 — composite continuity. */
  continuity_score: number;
  /** True when, despite prior memory existing, this run ignored it. */
  behaved_like_fresh_prompt: boolean;
  /** True for the campaign's very first run — being fresh is allowed. */
  is_first_run: boolean;
  notes: string[];
}

export interface ScoreCognitiveContinuityInput {
  generationIndex: number;
  field: CognitiveFieldState;
  priorDirective: NextRunDirective;
  rejectionAssessment: RejectionAssessment;
  approvalAssessment: ApprovalAssessment;
  priorState: PriorStateSummary | null;
  worldStateGen: number;
  /** state family of this run. */
  candidateTerritory: string;
  truthPersistence: number;            // 0..10 durability
  unifiedGraphCoherence: number;       // 0..10
}

export function scoreCognitiveContinuity(input: ScoreCognitiveContinuityInput): CognitiveContinuityReading {
  const {
    generationIndex, field, priorDirective, rejectionAssessment, approvalAssessment,
    priorState, worldStateGen, candidateTerritory, truthPersistence, unifiedGraphCoherence,
  } = input;
  const notes: string[] = [];

  const is_first_run = generationIndex === 0 || priorState === null;

  if (is_first_run) {
    // The first run cannot be discontinuous — there is nothing to be
    // continuous with. Give a neutral baseline, not a fail.
    return {
      memory_continuity: 6, campaign_identity_continuity: 6,
      emotional_trajectory_continuity: 6, symbolic_object_continuity: 6,
      refusal_continuity: 6, truth_persistence_continuity: 5,
      human_graph_continuity: 6, world_state_continuity: 6,
      anti_repetition_effectiveness: 6, evolution_without_fragmentation: 6,
      continuity_score: 6,
      behaved_like_fresh_prompt: false,
      is_first_run: true,
      notes: ['continuity: first run of the campaign — being fresh is permitted'],
    };
  }

  // ─── memory continuity — does the run inherit prior state? ─────
  const memory_continuity = priorState ? 8 : 2;

  // ─── campaign identity continuity — atmosphere coherent? ───────
  const campaign_identity_continuity = unifiedGraphCoherence >= 6 ? 8
    : unifiedGraphCoherence >= 4 ? 6 : 4;

  // ─── emotional trajectory continuity — the directive asked the
  // run to AVOID the prior territory; honouring that is continuity.
  const honoursAvoid = !priorDirective.avoidEmotionalTerritories.includes(candidateTerritory);
  const emotional_trajectory_continuity = honoursAvoid ? 8 : 3;
  if (!honoursAvoid) notes.push(`run re-opened "${candidateTerritory}" — the directive asked the runtime to avoid it`);

  // ─── symbolic object continuity — developed vs avoided ─────────
  const usedAvoided = field.symbolicObjects.some((o) => priorDirective.symbolicObjectsToAvoid.includes(o));
  const developedWanted = field.symbolicObjects.some((o) => priorDirective.symbolicObjectsToDevelop.includes(o));
  let symbolic_object_continuity = 6;
  if (developedWanted) symbolic_object_continuity += 2;
  if (usedAvoided) symbolic_object_continuity -= 3;
  symbolic_object_continuity = clamp10(symbolic_object_continuity);

  // ─── refusal continuity — not repeating refused territory ──────
  const refusal_continuity = rejectionAssessment.repeats_rejected_territory ? 2 : 8;
  if (rejectionAssessment.repeats_rejected_territory) {
    notes.push('run repeats a territory the runtime previously refused');
  }

  // ─── truth persistence continuity ──────────────────────────────
  const truth_persistence_continuity = truthPersistence >= 5 ? 8 : truthPersistence >= 3 ? 6 : 4;

  // ─── human graph continuity ────────────────────────────────────
  const human_graph_continuity = field.connected_dimensions.includes('campaign-memory') ? 8 : 5;

  // ─── world-state continuity — generation index advancing ───────
  const world_state_continuity = worldStateGen > 0 ? 8 : 4;

  // ─── anti-repetition effectiveness — NOT duplicating a pattern ─
  const anti_repetition_effectiveness = approvalAssessment.duplicates_pattern ? 2
    : approvalAssessment.continues_territory ? 8 : 6;
  if (approvalAssessment.duplicates_pattern) {
    notes.push('run duplicates an approved pattern instead of evolving it');
  }

  // ─── evolution without fragmentation ───────────────────────────
  // Healthy: continues territory AND does not duplicate. Fragmented:
  // neither continues nor connects to memory.
  let evolution_without_fragmentation = 5;
  if (approvalAssessment.continues_territory && !approvalAssessment.duplicates_pattern) evolution_without_fragmentation = 8;
  if (!approvalAssessment.continues_territory && !field.connected_dimensions.includes('campaign-memory')) {
    evolution_without_fragmentation = 3;
  }

  const metrics = [
    memory_continuity, campaign_identity_continuity, emotional_trajectory_continuity,
    symbolic_object_continuity, refusal_continuity, truth_persistence_continuity,
    human_graph_continuity, world_state_continuity, anti_repetition_effectiveness,
    evolution_without_fragmentation,
  ];
  const continuity_score = round1(metrics.reduce((a, b) => a + b, 0) / metrics.length);

  // Behaved like a fresh prompt: prior memory existed but the run
  // ignored it — low continuity across the memory-facing metrics.
  const behaved_like_fresh_prompt =
    continuity_score < 4.5 ||
    (memory_continuity <= 3 && world_state_continuity <= 4);

  if (behaved_like_fresh_prompt) {
    notes.push('WARNING: the run behaved like a fresh prompt — it did not respect what the system already learned');
  } else {
    notes.push(`continuity maintained — score ${continuity_score}/10`);
  }

  return {
    memory_continuity, campaign_identity_continuity, emotional_trajectory_continuity,
    symbolic_object_continuity, refusal_continuity, truth_persistence_continuity,
    human_graph_continuity, world_state_continuity, anti_repetition_effectiveness,
    evolution_without_fragmentation, continuity_score, behaved_like_fresh_prompt,
    is_first_run: false, notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
