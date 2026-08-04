/**
 * HUMAN IMPERFECTION V2 (Phase 2)
 *
 * Imperfection is EMOTIONALLY MOTIVATED — not random.
 *
 * Each state family pulls the directives in a specific direction:
 *
 *   collapse / fatigue     → off-balance framing, body droops, dead space
 *   fragmentation          → multiple focal pulls, partial obstruction
 *   overstimulation        → cropped overflow at edges, restless framing
 *   numbness / paralysis   → unusually centered, dead air around subject
 *   pressure / avoidance   → tight crops, foreground obstruction, off-axis
 *
 * Random per-banner jitter is reduced to a tiny amount of "human camera"
 * noise — never the source of personality.
 */

import type { CompositionPlan, Formula, HumanState } from '@/core/types';

export interface ImperfectionDirectives {
  framingNudgePx: { x: number; y: number };
  rotationDeg: number;
  typoOffsetPx: { x: number; y: number };
  grainOpacity: number;
  cutObjectAtEdge: boolean;
  /** Named source of the imperfection — surfaced for trace/debug. */
  motivation: string;
}

export function imperfectionFor(
  formula: Formula,
  plan: CompositionPlan,
  seed = 0,
  state?: HumanState,
): ImperfectionDirectives {
  // V1 formula coverage — ENERGY for now; CALM/FOCUS slot in here.
  if (formula !== 'ENERGY' || !state) return defaultDirectives(seed, plan);

  const family = state.family;

  // A tiny per-banner human-hand jitter (the camera was held by a
  // person, not a tripod). Never large — that's V1's mistake.
  const jitter = (n: number) => (Math.sin((seed + n) * 1.7) % 1) * 4;

  switch (family) {
    case 'collapse':
    case 'fatigue':
      return {
        framingNudgePx: { x: jitter(1) - 2, y: 8 + jitter(2) },     // sink the focal
        rotationDeg: -0.4 + jitter(3) * 0.1,                         // slight droop
        typoOffsetPx: { x: jitter(4), y: 4 + jitter(5) },
        grainOpacity: 0.18,
        cutObjectAtEdge: plan.negativeSpaceBias !== 'center',
        motivation: 'body sinks — frame droops with it',
      };

    case 'fragmentation':
      return {
        framingNudgePx: { x: 6 + jitter(1), y: -4 + jitter(2) },     // off-axis
        rotationDeg: 0.5 + jitter(3) * 0.2,
        typoOffsetPx: { x: -6 + jitter(4), y: jitter(5) },           // type pulled left
        grainOpacity: 0.16,
        cutObjectAtEdge: true,
        motivation: 'attention splits — frame splits with it',
      };

    case 'overstimulation':
      return {
        framingNudgePx: { x: -8 + jitter(1), y: -6 + jitter(2) },    // crop pushes overflow
        rotationDeg: -0.6 + jitter(3) * 0.2,
        typoOffsetPx: { x: 8 + jitter(4), y: -2 + jitter(5) },
        grainOpacity: 0.22,
        cutObjectAtEdge: true,
        motivation: 'overload — edges spill out of frame',
      };

    case 'numbness':
    case 'paralysis':
      return {
        framingNudgePx: { x: jitter(1) * 0.3, y: jitter(2) * 0.3 },  // unusually centered
        rotationDeg: jitter(3) * 0.05,
        typoOffsetPx: { x: jitter(4) * 0.3, y: jitter(5) * 0.3 },
        grainOpacity: 0.10,                                          // less grain = stillness
        cutObjectAtEdge: false,
        motivation: 'nothing moves — frame refuses to move with it',
      };

    case 'pressure':
      return {
        framingNudgePx: { x: 4 + jitter(1), y: 6 + jitter(2) },      // tight crop forward
        rotationDeg: 0.3 + jitter(3) * 0.15,
        typoOffsetPx: { x: -4 + jitter(4), y: 2 + jitter(5) },
        grainOpacity: 0.16,
        cutObjectAtEdge: true,
        motivation: 'shoulders push forward — frame tightens forward',
      };

    case 'avoidance':
      return {
        framingNudgePx: { x: -10 + jitter(1), y: jitter(2) },        // frame slips away
        rotationDeg: -0.2 + jitter(3) * 0.1,
        typoOffsetPx: { x: 4 + jitter(4), y: jitter(5) },
        grainOpacity: 0.14,
        cutObjectAtEdge: true,
        motivation: 'subject avoids — frame slides off the obvious line',
      };
  }
}

function defaultDirectives(seed: number, plan: CompositionPlan): ImperfectionDirectives {
  const r = (n: number) => (Math.sin(seed * (n + 1)) + 1) / 2;
  return {
    framingNudgePx: { x: Math.round((r(1) - 0.5) * 12), y: Math.round((r(2) - 0.5) * 10) },
    rotationDeg: (r(3) - 0.5) * 0.3,
    typoOffsetPx: { x: Math.round((r(4) - 0.5) * 8), y: Math.round((r(5) - 0.5) * 6) },
    grainOpacity: 0.14,
    cutObjectAtEdge: plan.negativeSpaceBias !== 'center',
    motivation: 'human-camera jitter only — no emotional anchor available',
  };
}
