/**
 * 4. COMPOSITION PLANNER
 *
 * Plans the banner BEFORE generation:
 *  - chooses aspect ratio (V1 defaults to 4:5 — mobile-first feed-native)
 *  - places focal zone, product zone, typography zones, safe zones
 *  - defines eye-flow path (sequence of points the eye traces)
 *  - declares negative-space bias for the typography to honour
 *
 * Deterministic given the direction; no LLM call needed.
 * The image-prompt engine consumes the zones so the camera "leaves room"
 * where typography will sit.
 */

import type { CompositionPlan, CreativeDirection, EngineContext } from '@/core/types';

export interface PlanInput {
  ctx: EngineContext;
  direction: CreativeDirection;
}

export function planComposition(input: PlanInput): CompositionPlan {
  const { ctx, direction } = input;

  const plan = layoutFor(direction);
  ctx.emit({
    stage: 'composition',
    message: `${direction.layoutFamily} → ${plan.negativeSpaceBias}`,
    data: plan,
  });
  return plan;
}

function layoutFor(d: CreativeDirection): CompositionPlan {
  const aspect: CompositionPlan['aspect'] = '4:5';

  switch (d.layoutFamily) {
    case 'documentary-crop':
      return {
        aspect,
        focal: { x: 0.18, y: 0.22, w: 0.55, h: 0.55 },
        productZone: d.productRole === 'hidden' ? null : { x: 0.62, y: 0.62, w: 0.28, h: 0.28 },
        typoZones: {
          primary: { x: 0.06, y: 0.78, w: 0.62, h: 0.12 },
          secondary: { x: 0.06, y: 0.90, w: 0.62, h: 0.05 },
          cta: { x: 0.06, y: 0.95, w: 0.30, h: 0.04 },
          timestamp: d.typographyDominance === 'timestamp' ? { x: 0.72, y: 0.06, w: 0.22, h: 0.06 } : null,
        },
        safeZones: [{ x: 0.04, y: 0.04, w: 0.92, h: 0.92 }],
        eyeFlow: [[0.45, 0.4], [0.18, 0.82], [0.18, 0.96]],
        negativeSpaceBias: 'bottom',
      };

    case 'editorial-page':
      return {
        aspect,
        focal: { x: 0.10, y: 0.10, w: 0.80, h: 0.55 },
        productZone: d.productRole === 'hidden' ? null : { x: 0.74, y: 0.46, w: 0.22, h: 0.18 },
        typoZones: {
          primary: { x: 0.08, y: 0.70, w: 0.72, h: 0.10 },
          secondary: { x: 0.08, y: 0.82, w: 0.72, h: 0.06 },
          cta: { x: 0.08, y: 0.92, w: 0.30, h: 0.04 },
          timestamp: d.typographyDominance === 'timestamp' ? { x: 0.78, y: 0.92, w: 0.16, h: 0.05 } : null,
        },
        safeZones: [{ x: 0.05, y: 0.05, w: 0.90, h: 0.90 }],
        eyeFlow: [[0.45, 0.32], [0.18, 0.74], [0.18, 0.93]],
        negativeSpaceBias: 'bottom',
      };

    case 'off-center-portrait':
      return {
        aspect,
        focal: { x: 0.48, y: 0.10, w: 0.46, h: 0.80 },
        productZone: d.productRole === 'hidden' ? null : { x: 0.10, y: 0.62, w: 0.32, h: 0.24 },
        typoZones: {
          primary: { x: 0.06, y: 0.10, w: 0.36, h: 0.32 },
          secondary: { x: 0.06, y: 0.44, w: 0.36, h: 0.08 },
          cta: { x: 0.06, y: 0.92, w: 0.30, h: 0.04 },
          timestamp: d.typographyDominance === 'timestamp' ? { x: 0.06, y: 0.06, w: 0.20, h: 0.05 } : null,
        },
        safeZones: [{ x: 0.04, y: 0.04, w: 0.92, h: 0.92 }],
        eyeFlow: [[0.70, 0.30], [0.20, 0.22], [0.20, 0.94]],
        negativeSpaceBias: 'left',
      };

    case 'environmental-wide':
      return {
        aspect,
        focal: { x: 0.00, y: 0.00, w: 1.00, h: 0.70 },
        productZone: d.productRole === 'hidden' ? null : { x: 0.06, y: 0.74, w: 0.22, h: 0.18 },
        typoZones: {
          primary: { x: 0.06, y: 0.76, w: 0.88, h: 0.10 },
          secondary: { x: 0.06, y: 0.88, w: 0.60, h: 0.05 },
          cta: { x: 0.70, y: 0.94, w: 0.24, h: 0.04 },
          timestamp: d.typographyDominance === 'timestamp' ? { x: 0.70, y: 0.06, w: 0.24, h: 0.06 } : null,
        },
        safeZones: [{ x: 0.04, y: 0.72, w: 0.92, h: 0.24 }],
        eyeFlow: [[0.50, 0.30], [0.20, 0.80], [0.82, 0.96]],
        negativeSpaceBias: 'bottom',
      };

    case 'timestamp-anchor':
      return {
        aspect,
        focal: { x: 0.10, y: 0.20, w: 0.80, h: 0.50 },
        productZone: d.productRole === 'hidden' ? null : { x: 0.62, y: 0.62, w: 0.28, h: 0.22 },
        typoZones: {
          primary: { x: 0.06, y: 0.74, w: 0.88, h: 0.10 },
          secondary: { x: 0.06, y: 0.86, w: 0.60, h: 0.05 },
          cta: { x: 0.06, y: 0.94, w: 0.30, h: 0.04 },
          timestamp: { x: 0.06, y: 0.06, w: 0.45, h: 0.10 },
        },
        safeZones: [{ x: 0.04, y: 0.04, w: 0.92, h: 0.92 }],
        eyeFlow: [[0.18, 0.10], [0.50, 0.40], [0.18, 0.78]],
        negativeSpaceBias: 'top',
      };

    case 'negative-space':
      return {
        aspect,
        focal: { x: 0.62, y: 0.55, w: 0.32, h: 0.35 },
        productZone: d.productRole === 'hidden' ? null : { x: 0.66, y: 0.60, w: 0.24, h: 0.24 },
        typoZones: {
          primary: { x: 0.06, y: 0.08, w: 0.52, h: 0.36 },
          secondary: { x: 0.06, y: 0.46, w: 0.52, h: 0.10 },
          cta: { x: 0.06, y: 0.92, w: 0.30, h: 0.04 },
          timestamp: d.typographyDominance === 'timestamp' ? { x: 0.06, y: 0.04, w: 0.20, h: 0.04 } : null,
        },
        safeZones: [{ x: 0.04, y: 0.04, w: 0.56, h: 0.92 }],
        eyeFlow: [[0.30, 0.20], [0.30, 0.50], [0.78, 0.70]],
        negativeSpaceBias: 'left',
      };
  }
}
