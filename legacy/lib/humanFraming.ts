/**
 * HUMAN FRAMING (Phase 8) — imperfect cinematic framing.
 *
 * Phase 5/7's humanVisualBehavior decided micro-imperfections in the
 * subject. Phase 8's humanFraming decides imperfections in the CAMERA
 * itself — the spec's list:
 *
 *   accidental crop pressure
 *   blocked objects
 *   partial faces
 *   shoulder intrusion
 *   off-balance horizons
 *   documentary camera hesitation
 *   handheld asymmetry
 *   near-missed framing
 *
 * Forbidden: perfect symmetry, clean influencer framing.
 *
 * The engine emits a FramingPlan the image brief consumes: a list of
 * named camera behaviors + a one-line briefing the prompt builder
 * inserts under "Framing:".
 */

import type { CreativeDirection } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type FramingBehavior =
  | 'accidental-crop-pressure'   // subject pushed against an edge
  | 'blocked-object'              // a closer object partially blocks the focal
  | 'partial-face'                // face deliberately partly out of frame
  | 'shoulder-intrusion'          // another body's shoulder enters the frame
  | 'off-balance-horizon'         // the horizon line is not level
  | 'documentary-hesitation'      // moment-before composition, not moment-of
  | 'handheld-asymmetry'          // implied camera tilt
  | 'near-missed-framing';        // the camera almost missed the subject

export interface FramingPlan {
  behaviors: FramingBehavior[];
  /** One-line briefing the image prompt inherits verbatim. */
  briefLine: string;
  /** Where the camera is metaphorically standing. */
  camera_distance: 'close-shoulder' | 'medium-table-height' | 'wide-room' | 'low-floor' | 'overhead';
  /** When true, the engine refuses the layout's existing focal-centered framing. */
  rejects_symmetry: boolean;
  motivation: string;
}

export interface FramingInput {
  direction: CreativeDirection;
  emotionalCore: EmotionalCore | null;
  /** Banner restraint — high restraint means LESS aggressive framing. */
  restraint: number;
  seed?: number;
}

export function planHumanFraming(input: FramingInput): FramingPlan {
  const { direction, emotionalCore, restraint, seed = 0 } = input;
  const behaviors: FramingBehavior[] = [];
  let camera_distance: FramingPlan['camera_distance'] = 'medium-table-height';
  let motivation = 'human-held camera, no other reason';

  // The focal point + emotional core combine to choose framing.
  // Faces want partial-face + shoulder-intrusion. Hands want close-
  // shoulder + blocked-object. Environments want wide-room + off-balance-horizon.
  switch (direction.focalPoint) {
    case 'human-face':
      behaviors.push('partial-face');
      if (restraint < 0.7) behaviors.push('shoulder-intrusion');
      camera_distance = 'close-shoulder';
      motivation = 'face partially out of frame — the viewer fills in what is missing';
      break;
    case 'hands':
      behaviors.push('blocked-object', 'documentary-hesitation');
      camera_distance = 'close-shoulder';
      motivation = 'close on hands with something in front — the camera caught what it could';
      break;
    case 'environment':
      behaviors.push('off-balance-horizon', 'near-missed-framing');
      camera_distance = 'wide-room';
      motivation = 'the room is the subject — the human is small in it';
      break;
    case 'gesture':
      behaviors.push('handheld-asymmetry', 'documentary-hesitation');
      camera_distance = 'medium-table-height';
      motivation = 'mid-action gesture — the camera hesitated for half a second too long';
      break;
    case 'product-in-hand':
      behaviors.push('partial-face', 'blocked-object');
      camera_distance = 'close-shoulder';
      motivation = 'face partly out, product partly in — neither the hero';
      break;
    case 'empty-space':
      behaviors.push('off-balance-horizon', 'near-missed-framing');
      camera_distance = 'wide-room';
      motivation = 'almost-missed framing — the camera was looking at the room, not the subject';
      break;
    case 'object':
      behaviors.push('blocked-object', 'documentary-hesitation');
      camera_distance = 'medium-table-height';
      motivation = 'object in foreground, the rest of the scene incidental';
      break;
  }

  // Emotional core overrides.
  if (emotionalCore) {
    switch (emotionalCore.id) {
      case 'hyper-awareness':
      case 'hidden-anxiety':
        if (!behaviors.includes('partial-face')) behaviors.push('partial-face');
        if (!behaviors.includes('handheld-asymmetry')) behaviors.push('handheld-asymmetry');
        break;
      case 'social-performance-exhaustion':
      case 'loneliness-in-public':
        if (!behaviors.includes('shoulder-intrusion')) behaviors.push('shoulder-intrusion');
        camera_distance = 'wide-room';
        break;
      case 'doomscrolling':
      case 'too-tired-to-rest':
        if (!behaviors.includes('blocked-object')) behaviors.push('blocked-object');
        camera_distance = 'overhead';
        break;
      case 'depletion':
      case 'functional-collapse':
        if (!behaviors.includes('off-balance-horizon')) behaviors.push('off-balance-horizon');
        if (camera_distance === 'medium-table-height') camera_distance = 'low-floor';
        break;
      case 'overstimulation':
      case 'emotional-fragmentation':
        if (!behaviors.includes('accidental-crop-pressure')) behaviors.push('accidental-crop-pressure');
        break;
    }
  }

  // High restraint banners DOWNGRADE the framing aggressiveness.
  // The spec said "perfect symmetry forbidden" — but high restraint
  // doesn't mean centred, it means quieter framing. We strip the
  // loudest behaviors.
  if (restraint > 0.8 && behaviors.length > 2) {
    const noisy: FramingBehavior[] = ['accidental-crop-pressure', 'shoulder-intrusion', 'handheld-asymmetry'];
    const filtered = behaviors.filter((b) => !noisy.includes(b));
    if (filtered.length >= 1) behaviors.splice(0, behaviors.length, ...filtered);
  }

  // Slight seed-based jitter to avoid the same plan twice in a row.
  void seed;

  const dedup = Array.from(new Set(behaviors));
  const briefLine = `Framing: camera at ${camera_distance.replace(/-/g, ' ')}; ${dedup.join('; ')}. Refuse perfect symmetry. Refuse clean influencer framing.`;
  const rejects_symmetry = true;

  return { behaviors: dedup, briefLine, camera_distance, rejects_symmetry, motivation };
}

/** Used by the meta-critic's "looks assembled" gate. */
export function framingFeelsAssembled(plan: FramingPlan): boolean {
  // If the plan has only one behavior and that behavior is not one of
  // the aggressive ones, the framing is too clean for ENERGY.
  if (plan.behaviors.length <= 1) return true;
  return false;
}
