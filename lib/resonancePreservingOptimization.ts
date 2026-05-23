/**
 * RESONANCE-PRESERVING OPTIMIZATION (Phase 193 — Wave 12: Autonomous Action Architecture)
 *
 * Optimization tends to sand the soul off a thing. This module checks
 * that an optimization preserves resonance — that the action is still
 * moving after it has been made more effective.
 */

export interface ResonancePreservingReading {
  /** True when optimization left the action's resonance intact. */
  resonance_preserved: boolean;
  /** 0..10 — resonance remaining after optimization. */
  resonance_after: number;
  preservation_note: string;
  notes: string[];
}

export interface ResonancePreservingInput {
  /** 0..10 — resonance before optimization. */
  resonanceBefore: number;
  /** True when an optimization was applied. */
  optimizationApplied: boolean;
  /** True when the optimization chased a metric over feeling. */
  chasedMetric: boolean;
  /** True when the action still tells the truth. */
  stillTruthful: boolean;
}

export function readResonancePreservingOptimization(input: ResonancePreservingInput): ResonancePreservingReading {
  const { resonanceBefore, optimizationApplied, chasedMetric, stillTruthful } = input;
  const notes: string[] = [];

  let resonance_after = resonanceBefore;
  if (optimizationApplied && chasedMetric) resonance_after -= 4;
  if (optimizationApplied && !stillTruthful) resonance_after -= 3;
  if (optimizationApplied && !chasedMetric && stillTruthful) resonance_after += 0.5;
  resonance_after = round1(Math.max(0, Math.min(10, resonance_after)));

  const resonance_preserved = resonance_after >= resonanceBefore - 1.5;

  const preservation_note = !optimizationApplied
    ? 'no optimization applied — resonance is whatever it was'
    : resonance_preserved
      ? 'the optimization preserved resonance — the action is still moving, only sharper'
      : 'the optimization sanded the resonance off — the action is more effective and less alive';

  notes.push(`resonance-preserving optimization: ${resonance_preserved ? 'preserved' : 'RESONANCE LOST'} ` +
    `(${resonanceBefore} → ${resonance_after}/10)`);
  return { resonance_preserved, resonance_after, preservation_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
