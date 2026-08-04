/**
 * UNIFIED HUMAN GRAPH (Phases 20–25 — central cognition architecture)
 *
 * The single structure that binds every memory layer the system has
 * accumulated:
 *
 *   emotional memory      — the emotional trail (Phase 4 / humanMemory)
 *   desire memory         — the longing graph (humanDesireMemory)
 *   ritual memory         — ritual-dependency entries
 *   behavioral memory     — survival fingerprints (Phase 18)
 *   identity memory       — masking / role entries (Phase 19)
 *   cultural memory       — ingested signal evolution (Phase 16 / 25)
 *   systemic pressure mem — pressure trajectory (Phase 17 / 24)
 *   future trajectory mem — forecasting + drift (Phase 24)
 *
 * The unified graph does NOT generate. It SYNTHESISES. It produces a
 * single coherent read of "who this modern human is, across time" so
 * that the meta-critic can ask one final question: does this banner
 * belong to the same continuous human the graph already knows?
 *
 * This is the architecture's closing structure — the transition from
 * a creative pipeline to a living human-cognition model.
 */

import type { HumanState } from '@/core/types';
import type { EmotionalTraceEntry } from './humanMemory';
import type { DesireMemoryEntry } from './humanDesireMemory';
import type { EmotionalForecastReading } from './emotionalForecasting';
import type { EmotionalDriftPredictionReading } from './emotionalDriftPrediction';
import type { AdaptiveEmotionalIntelligenceReading } from './adaptiveEmotionalIntelligence';

export interface UnifiedHumanGraphReading {
  /** The dominant emotional family across the campaign's lifetime. */
  lifetime_dominant_family: string | null;
  /** The longest-standing desire in the longing graph. */
  deepest_desire: DesireMemoryEntry | null;
  /** The most-repeated desire in the longing graph. */
  most_repeated_desire: DesireMemoryEntry | null;
  /** 0..10 — how coherent the human the graph describes is. A high
   *  value means the campaign has been modelling one continuous
   *  person; a low value means scattered, unrelated banners. */
  human_coherence: number;
  /** 0..10 — how much the candidate banner belongs to that human. */
  candidate_belongs: number;
  /** The graph's one-sentence portrait of the modern human it models. */
  portrait: string;
  /** The system's current self-assessment, surfaced from Phase 25. */
  organism_state: string;
  notes: string[];
}

export interface UnifiedHumanGraphInput {
  state: HumanState;
  recentTrail: EmotionalTraceEntry[];
  desireEntries: DesireMemoryEntry[];
  forecast: EmotionalForecastReading;
  drift: EmotionalDriftPredictionReading;
  adaptive: AdaptiveEmotionalIntelligenceReading;
}

export function readUnifiedHumanGraph(input: UnifiedHumanGraphInput): UnifiedHumanGraphReading {
  const { state, recentTrail, desireEntries, forecast, drift, adaptive } = input;
  const notes: string[] = [];

  // ─── lifetime dominant family ──────────────────────────────────
  const familyCounts: Record<string, number> = {};
  for (const t of recentTrail) familyCounts[t.family] = (familyCounts[t.family] ?? 0) + 1;
  let lifetime_dominant_family: string | null = null;
  let maxFamily = 0;
  for (const [f, c] of Object.entries(familyCounts)) {
    if (c > maxFamily) { lifetime_dominant_family = f; maxFamily = c; }
  }

  // ─── deepest + most-repeated desire ────────────────────────────
  let deepest_desire: DesireMemoryEntry | null = null;
  let most_repeated_desire: DesireMemoryEntry | null = null;
  for (const e of desireEntries) {
    if (!deepest_desire || e.firstSeen < deepest_desire.firstSeen) deepest_desire = e;
    if (!most_repeated_desire || e.count > most_repeated_desire.count) most_repeated_desire = e;
  }

  // ─── human coherence ───────────────────────────────────────────
  // High when one family dominates the trail and a desire recurs.
  let human_coherence = 0;
  if (recentTrail.length >= 4) {
    const familyShare = maxFamily / recentTrail.length;
    human_coherence += familyShare * 5;
  } else {
    human_coherence += 2;
  }
  if (most_repeated_desire && most_repeated_desire.count >= 3) human_coherence += 3;
  if (most_repeated_desire && most_repeated_desire.count >= 2) human_coherence += 1;
  if (adaptive.directive !== 'resync-with-reality') human_coherence += 1;
  human_coherence = clamp10(human_coherence);

  // ─── candidate belongs ─────────────────────────────────────────
  // The candidate belongs to this human when its family aligns with
  // the lifetime dominant family OR with the forecasted direction.
  let candidate_belongs = 5;
  if (lifetime_dominant_family && state.family === lifetime_dominant_family) candidate_belongs += 3;
  if (recentTrail.length < 4) candidate_belongs = 6;        // too early to judge — give benefit
  if (drift.vector === 'baseline-eroding' || drift.vector === 'baseline-numbing') candidate_belongs += 1;
  candidate_belongs = clamp10(candidate_belongs);

  // ─── portrait ──────────────────────────────────────────────────
  const desirePhrase = most_repeated_desire ? most_repeated_desire.display : 'a longing not yet named';
  const familyPhrase = lifetime_dominant_family ?? state.family;
  const portrait =
    `a modern human who lives mostly in "${familyPhrase}", reaching quietly for ${desirePhrase}, ` +
    `with a baseline that is ${drift.vector.replace(/-/g, ' ')} and a near future of ${forecast.direction.replace(/-/g, ' ')}`;

  notes.push(`unified human graph: coherence ${human_coherence.toFixed(1)}/10, candidate-belongs ${candidate_belongs.toFixed(1)}/10`);
  notes.push(`portrait: ${portrait}`);
  if (deepest_desire) notes.push(`deepest desire (longest-standing): ${deepest_desire.display}`);

  return {
    lifetime_dominant_family,
    deepest_desire,
    most_repeated_desire,
    human_coherence,
    candidate_belongs,
    portrait,
    organism_state: adaptive.organism_state,
    notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
