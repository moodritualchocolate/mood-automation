/**
 * REALITY RHYTHM SYNCHRONIZATION (Phase 77 — Wave 7: Reality Organism)
 *
 * Reality has a rhythm — collective attention rises and falls, the
 * culture inhales and exhales. A healthy organism synchronises to
 * that rhythm: it speaks on the culture's exhale, it rests on its
 * inhale. An out-of-phase organism speaks into noise and is missed.
 */

import type { ExecutiveWorldState } from './worldStateEngine';
import type { TemporalPsychologyReading } from './temporalPsychology';

export type RhythmPhase = 'in-sync' | 'slightly-off' | 'out-of-phase';

export interface RealityRhythmReading {
  phase: RhythmPhase;
  /** 0..10 — how synchronised the organism is to reality's rhythm. */
  synchronization: number;
  /** True when speaking now is on the culture's exhale (a receptive beat). */
  on_the_exhale: boolean;
  notes: string[];
}

export interface RealityRhythmInput {
  worldState: ExecutiveWorldState;
  temporal: TemporalPsychologyReading;
}

export function readRealityRhythmSync(input: RealityRhythmInput): RealityRhythmReading {
  const { worldState, temporal } = input;
  const notes: string[] = [];

  // The culture is on its "exhale" — receptive — when collective
  // receptivity is decent and the world is not at peak tension.
  const exhaleScore = (temporal.collective_receptivity * 0.6) + ((10 - worldState.world_tension) * 0.4);
  const synchronization = round1(Math.max(0, Math.min(10,
    exhaleScore * 0.6 + temporal.timing_truth_score * 0.4)));

  const phase: RhythmPhase =
    synchronization >= 6.5 ? 'in-sync' :
    synchronization >= 4 ? 'slightly-off' : 'out-of-phase';

  const on_the_exhale = exhaleScore >= 5.5 && !temporal.timing_is_wrong;

  notes.push(`reality rhythm: ${phase} (synchronization ${synchronization}/10)`);
  if (phase === 'out-of-phase') notes.push('reality rhythm: the organism is out of phase with reality — speaking now lands into noise');
  else if (on_the_exhale) notes.push('reality rhythm: the culture is on its exhale — a receptive beat to speak on');

  return { phase, synchronization, on_the_exhale, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
