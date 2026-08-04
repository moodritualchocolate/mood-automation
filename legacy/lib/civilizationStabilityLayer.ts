/**
 * CIVILIZATION STABILITY LAYER (Phase 69 — Wave 6: Cognitive Civilization)
 *
 * Monitors whether the civilization is STABLE or DECAYING. A
 * civilization decays when optimization repeatedly beats identity,
 * when its culture narrows into a monoculture, when its ideology has
 * mutated, when authority over-concentrates, or when its politics
 * collapse into a one-party state.
 */

import type { CivilizationState } from './civilizationArchive';
import type { CulturalDriftReading } from './culturalDriftEngine';
import type { IdeologicalMutationReading } from './ideologicalMutationDetection';
import type { TrustAuthorityReading } from './trustAuthorityGraph';

export type CivilizationCondition = 'flourishing' | 'stable' | 'strained' | 'decaying';

export interface CivilizationStabilityReading {
  condition: CivilizationCondition;
  /** 0..10 — overall stability. */
  stability: number;
  /** The decay signals currently active. */
  decay_signals: string[];
  /** True when the civilization is decaying. */
  is_decaying: boolean;
  notes: string[];
}

export interface CivilizationStabilityInput {
  state: CivilizationState;
  drift: CulturalDriftReading;
  mutation: IdeologicalMutationReading;
  authority: TrustAuthorityReading;
}

export function readCivilizationStability(input: CivilizationStabilityInput): CivilizationStabilityReading {
  const { state, drift, mutation, authority } = input;
  const notes: string[] = [];
  const decay_signals: string[] = [];

  // The central decay signal — optimization beating identity over the
  // civilization's life.
  const totalDecisions = state.optimizationWins + state.identityWins;
  const optimizationShare = totalDecisions > 0 ? state.optimizationWins / totalDecisions : 0;
  if (totalDecisions >= 6 && optimizationShare > 0.5) {
    decay_signals.push(`optimization has beaten identity ${state.optimizationWins}:${state.identityWins} — the civilization is decaying`);
  }
  if (drift.drift_is_narrowing) decay_signals.push('cultural narrowing into a monoculture');
  if (mutation.mutation_detected) decay_signals.push('the ideology has mutated from its founding character');
  if (authority.authority_too_concentrated) decay_signals.push('authority has over-concentrated in one voice');

  let stability = 10;
  stability -= decay_signals.length * 2.2;
  if (totalDecisions >= 6) stability -= Math.max(0, (optimizationShare - 0.5) * 8);
  stability = Math.max(0, Math.min(10, round1(stability)));

  const is_decaying = decay_signals.length >= 2 || optimizationShare > 0.6;
  // is_decaying is the authoritative decay signal — when it is set the
  // condition is "decaying" regardless of where the stability number
  // happens to land.
  const condition: CivilizationCondition =
    is_decaying ? 'decaying' :
    stability >= 8 ? 'flourishing' :
    stability >= 6 ? 'stable' : 'strained';

  notes.push(`civilization stability: ${condition} (${stability}/10)`);
  if (decay_signals.length) notes.push(`civilization decay signals: ${decay_signals.join('; ')}`);

  return { condition, stability, decay_signals, is_decaying, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
