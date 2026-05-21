/**
 * LIFE NOISE (Phase 11)
 *
 * Adds NON-SYMBOLIC human mess. Different from Phase 7's
 * worldContinuity (which adds MEANINGFUL artifacts tied to the
 * emotional core) — lifeNoise adds details that mean NOTHING.
 *
 * The spec named it: "in real life, the most memorable things do not
 * feel directed." Real rooms contain:
 *   - an off-key object nobody planned (a sticker on a laptop, a
 *     wrong-colour mug)
 *   - an unfinished action (a half-typed sentence on screen, a
 *     drawer pulled three inches and forgotten)
 *   - accidental lighting (a stripe of sun where nobody designed it,
 *     a flicker from the building next door)
 *   - clutter that exists because life is busy, not because the
 *     campaign decided it
 *
 * The image brief inherits the noise plan as RANDOMNESS the camera
 * "happened to catch" — never as motifs. The compression engine
 * rewards this (more implied complexity); antiSynthetic rewards it
 * (more imperfection); nonPerformativeReality rewards it (more
 * observed, less composed).
 */

import type { HumanState } from '@/core/types';

export interface NoiseFragment {
  kind:
    | 'non-symbolic-object'
    | 'unfinished-action'
    | 'emotional-interruption'
    | 'accidental-lighting'
    | 'partial-visibility'
    | 'real-life-clutter'
    | 'imperfect-timing'
    | 'asymmetric-rhythm';
  description: string;
}

export interface LifeNoisePlan {
  fragments: NoiseFragment[];
  /** A short paragraph the image brief inherits. */
  briefLine: string;
  /** 0..10 — higher = more honest mess in the frame. */
  mess_score: number;
}

const NON_SYMBOLIC_OBJECTS = [
  'a sticker peeling off a laptop edge',
  'a wrong-coloured pen on the table',
  'an old appointment card from a fridge magnet, half-detached',
  'a hair tie on the windowsill',
  'a single sock on a chair arm',
  'a receipt with a coffee ring on it',
  'a clean hair clip in the wrong place',
  'a plant leaf that turned yellow nobody removed',
  'a forgotten phone charger from a different brand',
  'a postcard pinned with the wrong-coloured pin',
];
const UNFINISHED_ACTIONS = [
  'a half-typed sentence on the laptop screen, cursor blinking',
  'a drawer pulled three inches and forgotten',
  'a kettle that boiled and was never poured',
  'an unfinished sketch on the corner of a notebook',
  'a snack bag open but only one bite taken',
  'a folded blanket that started folding then stopped',
  'a windowsill mug with the spoon still in it',
  'a coat half-zipped',
];
const ACCIDENTAL_LIGHT = [
  'a stripe of late afternoon sun on one knee',
  'a flicker from the building across the street, intermittent',
  'a reflection of a phone screen on a glass surface',
  'a single dust mote caught in a window beam',
  'shadow of an unseen object across the wall',
];
const REAL_CLUTTER = [
  'a small pile of mail not yet opened',
  'cables behind the monitor that no one organised',
  'a coffee ring on the table that nobody wiped',
  'a chair pulled out, never pushed back',
  'crumbs near the laptop',
];
const PARTIAL_VISIBILITY = [
  'half a face in the corner of the mirror',
  'a hand only — the rest of the body cropped',
  'a shadow of the subject, not the subject',
  'feet visible, torso out of frame',
];
const EMOTIONAL_INTERRUPTION = [
  'a notification flash from a phone face-down',
  'a sudden expression that did not stay long enough to be a feeling',
  'an exhale that nobody noticed',
  'a hand that started reaching for something, then stopped',
];

export interface NoiseInput {
  state: HumanState;
  seed?: number;
}

export function planLifeNoise(input: NoiseInput): LifeNoisePlan {
  const { state, seed = Date.now() } = input;
  const rng = mulberry32(seed);

  const fragments: NoiseFragment[] = [];
  // Always: one non-symbolic object (the wrong-colour pen).
  fragments.push({
    kind: 'non-symbolic-object',
    description: pickOne(NON_SYMBOLIC_OBJECTS, rng),
  });
  // Always: one unfinished action.
  fragments.push({
    kind: 'unfinished-action',
    description: pickOne(UNFINISHED_ACTIONS, rng),
  });
  // 50% chance: accidental lighting.
  if (rng() < 0.5) {
    fragments.push({ kind: 'accidental-lighting', description: pickOne(ACCIDENTAL_LIGHT, rng) });
  }
  // 50% chance: real-life clutter.
  if (rng() < 0.5) {
    fragments.push({ kind: 'real-life-clutter', description: pickOne(REAL_CLUTTER, rng) });
  }
  // 30% chance: partial-visibility (only for non-environment focal points).
  if (rng() < 0.3) {
    fragments.push({ kind: 'partial-visibility', description: pickOne(PARTIAL_VISIBILITY, rng) });
  }
  // 30% chance: emotional interruption (when family supports it).
  if (rng() < 0.3 && (state.family === 'fragmentation' || state.family === 'overstimulation' || state.family === 'pressure')) {
    fragments.push({ kind: 'emotional-interruption', description: pickOne(EMOTIONAL_INTERRUPTION, rng) });
  }

  // imperfect-timing and asymmetric-rhythm are concept-level — emit them
  // as briefing notes rather than concrete objects.
  if (state.family === 'fragmentation') {
    fragments.push({
      kind: 'imperfect-timing',
      description: 'the camera caught the moment half a second after it would have been composed',
    });
  }
  if (state.family === 'overstimulation' || state.family === 'pressure') {
    fragments.push({
      kind: 'asymmetric-rhythm',
      description: 'two things visibly happening in the frame that have no relationship to each other',
    });
  }

  const briefLine = `Life noise (NOT motif — these details mean NOTHING, they just exist): ${fragments.map((f) => f.description).join('; ')}.`;
  // Mess score: more fragments = higher, but capped so over-cluttered
  // banners are not rewarded.
  const mess_score = Math.min(10, fragments.length * 1.6 + 1);

  return { fragments, briefLine, mess_score };
}

function pickOne<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
