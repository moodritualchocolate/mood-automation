/**
 * EMOTIONAL DRIFT PREDICTION (Phase 24)
 *
 * Predicts the slow, multi-week DRIFT of the subject's emotional
 * baseline — the direction the resting state itself is moving.
 *
 * Different from Phase 24 emotionalForecasting (the next state) —
 * drift is the movement of the FLOOR, not the next step. A subject
 * can have good days while their baseline quietly erodes; the engine
 * catches that erosion.
 *
 * Reads the campaign trail's family distribution over time.
 */

import type { HumanState } from '@/core/types';
import type { EmotionalTraceEntry } from './humanMemory';

export type DriftVector =
  | 'baseline-eroding'
  | 'baseline-numbing'
  | 'baseline-stable'
  | 'baseline-fragmenting'
  | 'baseline-slowly-lifting';

export interface EmotionalDriftPredictionReading {
  vector: DriftVector;
  /** 0..10 — how pronounced the drift is. */
  drift_magnitude: number;
  /** Early-window vs late-window family snapshots. */
  early_dominant: string | null;
  late_dominant: string | null;
  notes: string[];
}

export interface EmotionalDriftPredictionInput {
  state: HumanState;
  recentTrail: EmotionalTraceEntry[];
}

const SEVERITY: Record<string, number> = {
  overstimulation: 2,
  fragmentation: 3,
  pressure: 3,
  avoidance: 4,
  fatigue: 5,
  paralysis: 6,
  numbness: 7,
  collapse: 8,
};

function dominantFamily(entries: EmotionalTraceEntry[]): string | null {
  const counts: Record<string, number> = {};
  for (const e of entries) counts[e.family] = (counts[e.family] ?? 0) + 1;
  let best: string | null = null;
  let max = 0;
  for (const [f, c] of Object.entries(counts)) {
    if (c > max) { best = f; max = c; }
  }
  return best;
}

export function readEmotionalDriftPrediction(input: EmotionalDriftPredictionInput): EmotionalDriftPredictionReading {
  const { recentTrail } = input;
  const notes: string[] = [];

  if (recentTrail.length < 6) {
    notes.push('emotional drift: insufficient trail to project a baseline drift');
    return { vector: 'baseline-stable', drift_magnitude: 0, early_dominant: null, late_dominant: null, notes };
  }

  // Trail is most-recent-first. "late" = recent half, "early" = older half.
  const mid = Math.floor(recentTrail.length / 2);
  const lateWindow = recentTrail.slice(0, mid);
  const earlyWindow = recentTrail.slice(mid);

  const late_dominant = dominantFamily(lateWindow);
  const early_dominant = dominantFamily(earlyWindow);

  const earlySeverity = early_dominant ? SEVERITY[early_dominant] ?? 4 : 4;
  const lateSeverity = late_dominant ? SEVERITY[late_dominant] ?? 4 : 4;
  const delta = lateSeverity - earlySeverity;

  let vector: DriftVector;
  if (delta >= 2 && (late_dominant === 'numbness')) vector = 'baseline-numbing';
  else if (delta >= 2) vector = 'baseline-eroding';
  else if (delta <= -2) vector = 'baseline-slowly-lifting';
  else if (late_dominant === 'fragmentation') vector = 'baseline-fragmenting';
  else vector = 'baseline-stable';

  const drift_magnitude = Math.min(10, Math.abs(delta) * 2.2);

  notes.push(`emotional drift: ${vector} (magnitude ${drift_magnitude.toFixed(1)}/10) — ${early_dominant ?? '?'} → ${late_dominant ?? '?'}`);
  return { vector, drift_magnitude, early_dominant, late_dominant, notes };
}
