/**
 * COLLECTIVE EMOTIONAL MOVEMENT (Phase 21)
 *
 * Emotions move across a population over time. The engine tracks
 * which DIRECTION the collective is moving in this period — toward
 * what feeling, away from which earlier feeling.
 *
 * Reads:
 *   - the campaign trail (which feelings have been said recently)
 *   - the candidate banner (where it sits in that movement)
 *   - the ingested signals (what the outside world has been saying)
 *
 * Emits a directional read: "the collective is moving FROM optimism
 * TO low-grade dread", with the campaign's location inside that
 * arc.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalTraceEntry } from './humanMemory';
import type { IngestedSignal } from './realityIngestion';

export type CollectiveDirection =
  | 'toward-numbness'
  | 'toward-overstimulation'
  | 'toward-deferred-rest'
  | 'toward-quiet-collapse'
  | 'toward-private-honesty'
  | 'toward-shared-recognition'
  | 'toward-disengagement'
  | 'toward-attachment'
  | 'static-no-movement';

export interface CollectiveEmotionalMovementReading {
  current_direction: CollectiveDirection;
  /** 0..10 — confidence the system has in the direction. */
  movement_confidence: number;
  /** Top families observed in the recent trail. */
  family_counts: Record<string, number>;
  /** Whether the candidate banner advances or contradicts the movement. */
  candidate_role: 'advances' | 'contradicts' | 'flat';
  notes: string[];
}

export interface CollectiveEmotionalMovementInput {
  state: HumanState;
  truth: HumanTruth;
  recentTrail: EmotionalTraceEntry[];
  ingestedSignals: IngestedSignal[];
}

const FAMILY_TO_DIRECTION: Record<string, CollectiveDirection> = {
  numbness:        'toward-numbness',
  overstimulation: 'toward-overstimulation',
  collapse:        'toward-quiet-collapse',
  fatigue:         'toward-deferred-rest',
  pressure:        'toward-overstimulation',
  fragmentation:   'toward-disengagement',
  paralysis:       'toward-quiet-collapse',
  avoidance:       'toward-disengagement',
};

export function readCollectiveEmotionalMovement(input: CollectiveEmotionalMovementInput): CollectiveEmotionalMovementReading {
  const { state, recentTrail, ingestedSignals } = input;
  const notes: string[] = [];

  const family_counts: Record<string, number> = {};
  for (const t of recentTrail.slice(0, 20)) {
    family_counts[t.family] = (family_counts[t.family] ?? 0) + 1;
  }

  let dominant: string | null = null;
  let maxCount = 0;
  for (const [family, count] of Object.entries(family_counts)) {
    if (count > maxCount) { dominant = family; maxCount = count; }
  }

  const current_direction: CollectiveDirection = dominant
    ? FAMILY_TO_DIRECTION[dominant] ?? 'static-no-movement'
    : 'static-no-movement';

  // Boost confidence with deep ingestion signals matching the direction.
  const signalBoost = ingestedSignals.length >= 10 ? 2 : 0;
  let movement_confidence = recentTrail.length >= 5 ? Math.min(8, maxCount + signalBoost) : Math.min(4, signalBoost + 2);

  const candidateDir = FAMILY_TO_DIRECTION[state.family] ?? 'static-no-movement';
  let candidate_role: 'advances' | 'contradicts' | 'flat' = 'flat';
  if (candidateDir === current_direction && candidateDir !== 'static-no-movement') candidate_role = 'advances';
  else if (current_direction !== 'static-no-movement' && candidateDir !== current_direction) candidate_role = 'contradicts';

  notes.push(`collective movement: ${current_direction} (confidence ${movement_confidence}/10)`);
  notes.push(`candidate role: ${candidate_role}`);

  return { current_direction, movement_confidence, family_counts, candidate_role, notes };
}
