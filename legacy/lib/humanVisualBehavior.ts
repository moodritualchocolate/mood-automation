/**
 * HUMAN VISUAL IMPERFECTION ENGINE (Phase 5)
 *
 * Prevents "AI cleanliness". The system intentionally introduces
 * human-camera realism — but only in ways that are emotionally
 * MOTIVATED, never random.
 *
 * Possible behaviors the spec named:
 *   slight tilt, imperfect crop, partial body cut, accidental framing,
 *   motion softness, realistic grain, light inconsistency, shadow
 *   collision, depth imperfection, real clutter, emotional objects,
 *   asymmetry, partial focus, empty space tension.
 *
 * Forbidden the spec named:
 *   hyper symmetry, centered perfection, glossy advertising feel,
 *   fake realism, fake luxury, influencer aesthetics.
 *
 * The engine is a successor to the V1 imperfection module — it takes
 * the same per-formula seed but returns a richer plan with named
 * behaviors and an explicit "what this imperfection is for" justification.
 */

import type { CompositionPlan, CreativeDirection, Formula, HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type ImperfectionBehavior =
  | 'slight-tilt'
  | 'imperfect-crop'
  | 'partial-body-cut'
  | 'accidental-framing'
  | 'motion-softness'
  | 'realistic-grain'
  | 'light-inconsistency'
  | 'shadow-collision'
  | 'depth-imperfection'
  | 'real-clutter'
  | 'emotional-object'
  | 'asymmetry'
  | 'partial-focus'
  | 'empty-space-tension';

export interface ImperfectionPlan {
  behaviors: ImperfectionBehavior[];
  /** A one-line note on why this imperfection was chosen for this state. */
  motivation: string;
  /** Direct directives to the renderer / image-brief layer. */
  directives: {
    framingNudgePx: { x: number; y: number };
    rotationDeg: number;
    typoOffsetPx: { x: number; y: number };
    grainOpacity: number;
    cutObjectAtEdge: boolean;
    /** Add an out-of-focus foreground object suggestion. */
    foregroundObstruction: boolean;
    /** Hint to the image brief to include surface clutter. */
    surfaceClutter: boolean;
  };
  forbidden: Array<'hyper-symmetry' | 'centered-perfection' | 'glossy-advertising' | 'fake-realism' | 'fake-luxury' | 'influencer-aesthetic'>;
}

export interface BehaviorInput {
  formula: Formula;
  plan: CompositionPlan;
  direction: CreativeDirection;
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  seed?: number;
}

export function planVisualBehavior(input: BehaviorInput): ImperfectionPlan {
  const { plan, direction, state, emotionalCore, seed = 0 } = input;

  // Each emotional core has its own imperfection signature.
  // We select 2–4 behaviors per banner — never the same pair twice in a
  // row by varying with the seed.
  const family = state.family;
  const jitter = (n: number) => (Math.sin((seed + n) * 1.7) % 1) * 4;

  const behaviors: ImperfectionBehavior[] = [];
  let motivation = 'human camera, no other reason';

  if (family === 'collapse' || family === 'fatigue') {
    behaviors.push('partial-body-cut', 'realistic-grain', 'asymmetry');
    motivation = 'body sinks — frame settles low and asymmetric, grain holds the warmth';
  } else if (family === 'overstimulation') {
    behaviors.push('partial-focus', 'shadow-collision', 'real-clutter', 'motion-softness');
    motivation = 'overload — multiple competing surfaces in frame, focus pulls between them';
  } else if (family === 'fragmentation') {
    behaviors.push('imperfect-crop', 'foreground-obstruction' as ImperfectionBehavior, 'asymmetry');
    behaviors.pop(); // ‘foreground-obstruction’ is a directive, not a behavior — drop and add what's valid
    behaviors.push('partial-focus', 'depth-imperfection');
    motivation = 'attention splits — frame splits with it, depth refuses to commit';
  } else if (family === 'pressure') {
    behaviors.push('slight-tilt', 'shadow-collision', 'emotional-object');
    motivation = 'weight pressing forward — slight tilt, the shadows under the body collide';
  } else if (family === 'avoidance') {
    behaviors.push('accidental-framing', 'partial-body-cut', 'empty-space-tension');
    motivation = 'subject slides off the frame line — the camera caught what it could';
  } else if (family === 'numbness' || family === 'paralysis') {
    behaviors.push('empty-space-tension', 'partial-focus', 'realistic-grain');
    motivation = 'nothing moves — frame holds long, grain does the speaking';
  } else {
    behaviors.push('slight-tilt', 'realistic-grain', 'asymmetry');
  }

  // Emotional core-level override: certain cores DEMAND specific behaviors.
  if (emotionalCore) {
    if (emotionalCore.id === 'hyper-awareness' || emotionalCore.id === 'hidden-anxiety') {
      if (!behaviors.includes('partial-focus')) behaviors.push('partial-focus');
    }
    if (emotionalCore.id === 'loneliness-in-public') {
      if (!behaviors.includes('empty-space-tension')) behaviors.push('empty-space-tension');
    }
    if (emotionalCore.id === 'doomscrolling' || emotionalCore.id === 'too-tired-to-rest') {
      if (!behaviors.includes('light-inconsistency')) behaviors.push('light-inconsistency');
    }
  }

  // Directives — concrete numbers the renderer + image-brief can apply.
  const directives: ImperfectionPlan['directives'] = {
    framingNudgePx: { x: Math.round(jitter(1) * 1.5), y: Math.round(jitter(2) * 1.5) },
    rotationDeg: behaviors.includes('slight-tilt') ? 0.4 + jitter(3) * 0.2 : jitter(3) * 0.1,
    typoOffsetPx: { x: Math.round(jitter(4)), y: Math.round(jitter(5)) },
    grainOpacity: behaviors.includes('realistic-grain') ? 0.18 : 0.12,
    cutObjectAtEdge: behaviors.includes('partial-body-cut') || plan.negativeSpaceBias !== 'center',
    foregroundObstruction: behaviors.includes('partial-focus'),
    surfaceClutter: behaviors.includes('real-clutter'),
  };

  // Forbidden — every banner with a high-restraint creative direction
  // also explicitly forbids the influencer aesthetic.
  const forbidden: ImperfectionPlan['forbidden'] = ['hyper-symmetry', 'centered-perfection', 'glossy-advertising', 'fake-realism'];
  if (direction.restraint > 0.6) forbidden.push('influencer-aesthetic', 'fake-luxury');

  // De-duplicate behaviors.
  const dedup = Array.from(new Set(behaviors));

  return { behaviors: dedup, motivation, directives, forbidden };
}
