/**
 * VISUAL PSYCHOLOGY ENGINE (Phase 2)
 *
 * Reads the composition like a director, not an assembler.
 *
 * The composition should feel DIRECTED. The engine evaluates:
 *  - entry point (where the eye lands first — derived from the eyeFlow)
 *  - focal interruption (does it stop the eye, or pass through?)
 *  - tension zone (where the eye lingers — should NOT be the CTA)
 *  - release zone (where the eye exits — should resolve into the CTA)
 *  - emotional hierarchy clarity
 *  - delayed product reveal (the product earns its arrival)
 *  - CTA resolution (the eye finds the CTA last, not first)
 *  - eye-flow integrity (the path traces a coherent shape, not noise)
 */

import type {
  CompositionPlan,
  CreativeDirection,
  EngineContext,
  TypographyPlan,
  VisualPsychology,
  Zone,
} from '@/core/types';

export interface PsychologyInput {
  ctx: EngineContext;
  direction: CreativeDirection;
  composition: CompositionPlan;
  typography: TypographyPlan;
}

export function analyzeVisualPsychology(input: PsychologyInput): VisualPsychology {
  const { ctx, direction, composition, typography } = input;

  const flow = composition.eyeFlow;
  const entry = flow[0] ?? [0.5, 0.5];
  const lingering = flow[flow.length > 1 ? 1 : 0];
  const exit = flow[flow.length - 1];

  const ctaCenter = center(composition.typoZones.cta);
  const productCenter = composition.productZone ? center(composition.productZone) : null;
  const focalCenter = center(composition.focal);
  const primaryCenter = center(composition.typoZones.primary);

  // Focal interruption: how far the focal is from the dead center.
  const focalDistFromCenter = Math.hypot(focalCenter[0] - 0.5, focalCenter[1] - 0.5);
  const focalInterruption = clamp10(focalDistFromCenter * 18); // ~0.3 off → ~5

  // Eye-flow integrity: the path should bend, not loop or backtrack.
  const eyeFlowIntegrity = scorePathCoherence(flow);

  // Delayed product reveal: product NOT inside the focal zone, NOT at
  // the entry point, but reachable along the flow. Hidden product
  // scores high (the "delay" is total).
  const delayedProductReveal = !productCenter
    ? 9
    : (() => {
        const distFromEntry = Math.hypot(productCenter[0] - entry[0], productCenter[1] - entry[1]);
        const distFromFocal = Math.hypot(productCenter[0] - focalCenter[0], productCenter[1] - focalCenter[1]);
        if (distFromEntry < 0.15) return 2;  // product is the entry — bad
        if (distFromFocal < 0.15) return 4;  // product overlaps focal — middling
        return clamp10(5 + distFromEntry * 6);
      })();

  // CTA resolution: the CTA should be near the EXIT of the flow, not
  // the entry. A CTA at the entry kills the discovery.
  const ctaDistFromExit = Math.hypot(ctaCenter[0] - exit[0], ctaCenter[1] - exit[1]);
  const ctaDistFromEntry = Math.hypot(ctaCenter[0] - entry[0], ctaCenter[1] - entry[1]);
  const ctaResolution = clamp10(8 - ctaDistFromExit * 10 + ctaDistFromEntry * 6);

  // Emotional hierarchy clarity: primary typo + focal should be distinct
  // zones (not overlapping) and CTA should be subordinate in size.
  const primaryToFocalDist = Math.hypot(primaryCenter[0] - focalCenter[0], primaryCenter[1] - focalCenter[1]);
  const dominanceClear = direction.typographyDominance !== 'absent';
  const ctaSubordinate = typography.primary.size > 0 && typography.primary.size >= 36;
  const emotionalHierarchyClear = clamp10(
    (primaryToFocalDist > 0.25 ? 5 : 2) + (dominanceClear ? 2 : 0) + (ctaSubordinate ? 2 : 0),
  );

  // Tension + release zones — pure derivation from the flow.
  const tensionZone: VisualPsychology['tensionZone'] = lingering ? [lingering[0], lingering[1]] : null;
  const releaseZone: VisualPsychology['releaseZone'] = exit ? [exit[0], exit[1]] : null;

  const notes: string[] = [];
  if (focalInterruption < 4) notes.push('focal too close to dead center — the eye passes through');
  if (eyeFlowIntegrity < 5) notes.push('eye-flow path is noisy or backtracks');
  if (ctaResolution < 5) notes.push('CTA is reached too early — kills discovery');
  if (delayedProductReveal < 4) notes.push('product is the entry point — collapses the narrative');
  if (emotionalHierarchyClear < 5) notes.push('headline and focal compete for the same zone');

  const psychology: VisualPsychology = {
    entryPoint: { x: entry[0], y: entry[1] },
    focalInterruption,
    tensionZone,
    releaseZone,
    emotionalHierarchyClear,
    delayedProductReveal,
    ctaResolution,
    eyeFlowIntegrity,
    notes,
  };

  ctx.emit({
    stage: 'visual-psychology',
    message: `flow integrity ${eyeFlowIntegrity.toFixed(1)} · CTA resolution ${ctaResolution.toFixed(1)}`,
    data: { notes, focalInterruption, delayedProductReveal },
  });
  return psychology;
}

function center(z: Zone): [number, number] {
  return [z.x + z.w / 2, z.y + z.h / 2];
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}

/**
 * Reward paths that bend cleanly (one direction change, monotonic in at
 * least one axis), penalise loops, backtracks, or tight clusters.
 */
function scorePathCoherence(flow: Array<[number, number]>): number {
  if (flow.length < 2) return 4;
  let bends = 0;
  let backtracks = 0;
  let totalDist = 0;
  for (let i = 1; i < flow.length; i++) {
    const [px, py] = flow[i - 1];
    const [x, y] = flow[i];
    totalDist += Math.hypot(x - px, y - py);
    if (i >= 2) {
      const [ppx, ppy] = flow[i - 2];
      // Backtrack if current direction reverses previous direction.
      const v1 = [px - ppx, py - ppy];
      const v2 = [x - px, y - py];
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      const mag = Math.hypot(...v1) * Math.hypot(...v2);
      const cos = mag > 0 ? dot / mag : 1;
      if (cos < -0.3) backtracks += 1;
      else if (cos < 0.7) bends += 1;
    }
  }
  // One bend is good (path "turns"); zero bends = straight line (weak);
  // two+ backtracks = chaotic.
  let score = 6 + bends * 1.5 - backtracks * 3;
  if (totalDist < 0.4) score -= 2;  // too tight — eye doesn't move
  if (totalDist > 2.0) score -= 2;  // too sprawling — eye gives up
  return clamp10(score);
}
