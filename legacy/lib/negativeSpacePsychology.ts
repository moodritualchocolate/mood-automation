/**
 * NEGATIVE SPACE PSYCHOLOGY (Phase 8)
 *
 * Whitespace is emotion, not aesthetic.
 *
 * Per formula (V1 ships ENERGY; future formulas RELAX/FOCUS/SLEEP are
 * encoded for forward-compatibility):
 *
 *   ENERGY  → compressed pressure   (low restraint, edges full,
 *                                    typography crowded against edge)
 *   RELAX   → breathable silence    (high restraint, soft margins,
 *                                    typography centered-low)
 *   FOCUS   → structured isolation  (sharp grid, asymmetric balance,
 *                                    typography flush-left)
 *   SLEEP   → drifting emptiness    (extreme restraint, slow fade,
 *                                    typography barely there)
 *
 * The module returns a space_tension_score (0..10) for the current
 * banner. The meta-critic rejects centered-balanced layouts when the
 * formula prescribes asymmetric tension.
 */

import type { CompositionPlan, CreativeDirection, Formula } from '@/core/types';

export interface NegativeSpaceReading {
  formula: Formula;
  prescribed_behavior: 'compressed-pressure' | 'breathable-silence' | 'structured-isolation' | 'drifting-emptiness';
  observed_distribution: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    center: number;
  };
  /** 0..10 — how much honest emotional tension the whitespace carries. */
  space_tension_score: number;
  /** True when the layout is centered-balanced in a formula that
   *  forbids it (i.e. ENERGY / FOCUS). */
  reject_centered: boolean;
  rejection_reason: string | null;
  notes: string[];
}

const FORMULA_BEHAVIOR: Record<Formula, NegativeSpaceReading['prescribed_behavior']> = {
  ENERGY: 'compressed-pressure',
  // Non-ENERGY formulas use mood-appropriate defaults so the
  // engine handles them without falling back to a generic value.
  FOCUS:  'structured-isolation',
  RELAX:  'breathable-silence',
  SLEEP:  'drifting-emptiness',
};

export interface NegativeSpaceInput {
  formula: Formula;
  direction: CreativeDirection;
  composition: CompositionPlan;
}

export function analyzeNegativeSpace(input: NegativeSpaceInput): NegativeSpaceReading {
  const { formula, direction, composition } = input;
  const prescribed = FORMULA_BEHAVIOR[formula] ?? 'compressed-pressure';
  const notes: string[] = [];

  // ─── observed distribution ────────────────────────────────────
  // Measure how much "filled" content (focal + typo zones + product zone)
  // exists in each quadrant of the canvas, then invert to get negative
  // space distribution.
  const occupiedRegions: Array<{ x: number; y: number; w: number; h: number }> = [
    composition.focal,
    composition.typoZones.primary,
    composition.typoZones.cta,
  ];
  if (composition.typoZones.secondary) occupiedRegions.push(composition.typoZones.secondary);
  if (composition.typoZones.timestamp) occupiedRegions.push(composition.typoZones.timestamp);
  if (composition.productZone) occupiedRegions.push(composition.productZone);

  // Sample grid: top / bottom / left / right / center as 0..1 occupancy values.
  const sample = (x0: number, y0: number, x1: number, y1: number): number => {
    // Approximate by intersection-over-area against each occupied region.
    let total = 0;
    const sampleArea = (x1 - x0) * (y1 - y0);
    for (const z of occupiedRegions) {
      const ix0 = Math.max(x0, z.x);
      const iy0 = Math.max(y0, z.y);
      const ix1 = Math.min(x1, z.x + z.w);
      const iy1 = Math.min(y1, z.y + z.h);
      if (ix1 > ix0 && iy1 > iy0) total += (ix1 - ix0) * (iy1 - iy0);
    }
    return Math.min(1, total / sampleArea);
  };

  // Negative space = 1 - occupancy.
  const observed = {
    top:    1 - sample(0,    0,    1,    0.25),
    bottom: 1 - sample(0,    0.75, 1,    1),
    left:   1 - sample(0,    0,    0.25, 1),
    right:  1 - sample(0.75, 0,    1,    1),
    center: 1 - sample(0.25, 0.25, 0.75, 0.75),
  };

  // ─── space tension score ──────────────────────────────────────
  // Compressed-pressure (ENERGY): we want LOW negative space (edges
  // full) AND high asymmetry between sides. A perfectly balanced
  // layout scores low here.
  let space_tension_score = 5;
  if (prescribed === 'compressed-pressure') {
    // Reward asymmetry between top/bottom and left/right.
    const verticalAsymmetry = Math.abs(observed.top - observed.bottom);
    const horizontalAsymmetry = Math.abs(observed.left - observed.right);
    space_tension_score = clamp10((verticalAsymmetry + horizontalAsymmetry) * 8);
    // Penalise high center negative space (the layout breathes too freely for ENERGY).
    if (observed.center > 0.7) space_tension_score = Math.max(0, space_tension_score - 3);
    if (observed.center < 0.3) space_tension_score = Math.min(10, space_tension_score + 1);
  } else if (prescribed === 'breathable-silence') {
    // RELAX (future): reward high center negative space + balanced top/bottom.
    space_tension_score = clamp10(observed.center * 8 + (1 - Math.abs(observed.top - observed.bottom)) * 2);
  } else if (prescribed === 'structured-isolation') {
    // FOCUS (future): reward sharp left/right asymmetry, low center.
    space_tension_score = clamp10(Math.abs(observed.left - observed.right) * 10);
  } else if (prescribed === 'drifting-emptiness') {
    // SLEEP (future): reward high overall negative space.
    space_tension_score = clamp10(((observed.top + observed.bottom + observed.left + observed.right) / 4) * 11);
  }

  // ─── reject centered ──────────────────────────────────────────
  // Centered + balanced layouts are forbidden under ENERGY / FOCUS.
  let reject_centered = false;
  let rejection_reason: string | null = null;
  const horizontallyCentered = Math.abs(observed.left - observed.right) < 0.05;
  const verticallyCentered = Math.abs(observed.top - observed.bottom) < 0.05;
  const symmetricLayout = horizontallyCentered && verticallyCentered;
  if (symmetricLayout && (prescribed === 'compressed-pressure' || prescribed === 'structured-isolation')) {
    reject_centered = true;
    rejection_reason = 'centered-balanced layout forbidden under ' + prescribed;
    notes.push('layout is centered AND balanced — formula prescribes asymmetric tension');
  }

  // Composition-plan's negative-space bias is a structural override:
  // if it says 'center' on an ENERGY formula, that's a contradiction.
  if (composition.negativeSpaceBias === 'center' && prescribed === 'compressed-pressure') {
    space_tension_score = Math.max(0, space_tension_score - 2);
    notes.push('negativeSpaceBias=center contradicts ENERGY pressure');
  }

  // Direction restraint at the extreme — ENERGY high-restraint banners
  // need to earn their breath. Without the rhythm-engine telling us we
  // are mid-quiet-pivot, score them lower.
  if (prescribed === 'compressed-pressure' && direction.restraint > 0.85) {
    space_tension_score = Math.max(0, space_tension_score - 1.5);
    notes.push('ENERGY at restraint > 0.85 — risk of decorative quiet');
  }

  if (notes.length === 0) notes.push('whitespace carries honest tension');

  return {
    formula,
    prescribed_behavior: prescribed,
    observed_distribution: observed,
    space_tension_score,
    reject_centered,
    rejection_reason,
    notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
