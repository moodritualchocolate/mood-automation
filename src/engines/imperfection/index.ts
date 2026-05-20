/**
 * 11. HUMAN IMPERFECTION ENGINE
 *
 * Translates the formula's imperfection signature into concrete
 * directives the renderer and image-prompt builder apply.
 *
 * ENERGY signature: pressure + interruption.
 *   → off-center framing, cut objects, foreground blur, dead space,
 *     accidental feeling, slight asymmetry in typography placement.
 *
 * Future formulas plug their own signatures here.
 */

import type { CompositionPlan, Formula } from '@/core/types';

export interface ImperfectionDirectives {
  framingNudgePx: { x: number; y: number };     // shift the focal slightly off-grid
  rotationDeg: number;                          // very subtle scene rotation
  typoOffsetPx: { x: number; y: number };       // pull headline slightly off the typo zone
  grainOpacity: number;                         // 0..1
  cutObjectAtEdge: boolean;
}

export function imperfectionFor(formula: Formula, plan: CompositionPlan, seed = 0): ImperfectionDirectives {
  // V1 ships ENERGY; switch ready for additional formulas.
  switch (formula) {
    case 'ENERGY':
    default: {
      const r = (n: number) => (Math.sin(seed * (n + 1)) + 1) / 2;
      return {
        framingNudgePx: { x: Math.round((r(1) - 0.5) * 24), y: Math.round((r(2) - 0.5) * 18) },
        rotationDeg: (r(3) - 0.5) * 0.6,
        typoOffsetPx: { x: Math.round((r(4) - 0.5) * 16), y: Math.round((r(5) - 0.5) * 10) },
        grainOpacity: 0.12 + r(6) * 0.08,
        cutObjectAtEdge: plan.negativeSpaceBias !== 'center',
      };
    }
  }
}
