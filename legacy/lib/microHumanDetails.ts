/**
 * MICRO-HUMAN DETAIL ENGINE (Phase 7)
 *
 * Small truths create emotional trust.
 *
 * Each banner gets 3-5 tiny human details the image brief should
 * include in the photographed subject:
 *
 *   - slight skin texture realism
 *   - tired eyes
 *   - jaw tension
 *   - uneven posture
 *   - nervous hand placement
 *   - imperfect clothing folds
 *   - eye distraction
 *   - hair inconsistency
 *   - object wear
 *   - environmental friction
 *   - emotional fatigue details
 *
 * Choice is driven by the emotional core — never random — and never
 * contains beautifying details (no "glowing skin", no "perfect light
 * across eyes").
 */

import type { HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type MicroDetail =
  | 'skin-texture'
  | 'tired-eyes'
  | 'jaw-tension'
  | 'uneven-posture'
  | 'nervous-hand'
  | 'imperfect-clothing-fold'
  | 'eye-distraction'
  | 'hair-inconsistency'
  | 'object-wear'
  | 'environmental-friction'
  | 'emotional-fatigue-detail'
  | 'breath-shallow'
  | 'micro-tic'
  | 'shoulder-asymmetry';

export interface MicroDetailPlan {
  details: MicroDetail[];
  /** A short paragraph the image brief inherits verbatim. */
  briefLine: string;
  /** Concrete sentence-form fragments per detail. */
  notes: string[];
}

const DETAIL_NOTES: Record<MicroDetail, string> = {
  'skin-texture': 'visible skin texture — pores, micro-blemishes, the absence of retouch',
  'tired-eyes': 'tired eyes — slight redness at the corners, the lids a millimetre heavier than normal',
  'jaw-tension': 'jaw clenched without the subject knowing — a small muscle visible at the side of the face',
  'uneven-posture': 'one shoulder slightly higher than the other — the body has stopped holding itself up evenly',
  'nervous-hand': 'one hand restless — finger tapping a thigh, thumb rubbing a knuckle',
  'imperfect-clothing-fold': 'a shirt collar slightly inside-out, a hoodie sleeve pushed up by an inch',
  'eye-distraction': 'eyes pulled to the side of frame — looking at something the viewer cannot see',
  'hair-inconsistency': 'hair settled the way hair settles after a long day — not styled, not unkempt, lived in',
  'object-wear': 'an object in frame shows wear — a faded keychain, a cracked phone case, a worn cuff',
  'environmental-friction': 'evidence the room has been used — a coffee ring, a crease on the sofa, a dust line on a shelf',
  'emotional-fatigue-detail': 'a single emotional detail — a tear about to fall, breath that just released, lips just unclenched',
  'breath-shallow': 'visibly shallow breathing — the chest barely moves',
  'micro-tic': 'a small involuntary tic — a blink, a quick swallow, a finger flex',
  'shoulder-asymmetry': 'shoulders carrying the body differently — one forward, one back, the spine not aligned',
};

const FAMILY_DETAILS: Record<HumanState['family'], MicroDetail[]> = {
  fatigue:         ['tired-eyes', 'uneven-posture', 'hair-inconsistency', 'imperfect-clothing-fold'],
  collapse:        ['tired-eyes', 'uneven-posture', 'breath-shallow', 'shoulder-asymmetry'],
  numbness:        ['eye-distraction', 'hair-inconsistency', 'environmental-friction', 'breath-shallow'],
  paralysis:       ['nervous-hand', 'eye-distraction', 'environmental-friction'],
  pressure:        ['jaw-tension', 'nervous-hand', 'shoulder-asymmetry', 'breath-shallow'],
  overstimulation: ['jaw-tension', 'micro-tic', 'eye-distraction', 'nervous-hand'],
  fragmentation:   ['nervous-hand', 'eye-distraction', 'micro-tic'],
  avoidance:       ['eye-distraction', 'uneven-posture', 'object-wear'],
};

const CORE_OVERRIDES: Partial<Record<EmotionalCore['id'], MicroDetail[]>> = {
  'hidden-anxiety':       ['jaw-tension', 'nervous-hand', 'breath-shallow', 'micro-tic'],
  'hyper-awareness':      ['micro-tic', 'jaw-tension', 'eye-distraction'],
  'invisible-pressure':   ['jaw-tension', 'shoulder-asymmetry', 'breath-shallow'],
  'doomscrolling':        ['eye-distraction', 'tired-eyes', 'jaw-tension'],
  'too-tired-to-rest':    ['tired-eyes', 'breath-shallow', 'environmental-friction'],
  'silent-burnout':       ['jaw-tension', 'shoulder-asymmetry', 'uneven-posture'],
  'emotional-numbness':   ['eye-distraction', 'breath-shallow', 'hair-inconsistency'],
  'social-performance-exhaustion': ['shoulder-asymmetry', 'tired-eyes', 'jaw-tension'],
};

export interface MicroDetailInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  seed?: number;
}

export function planMicroHumanDetails(input: MicroDetailInput): MicroDetailPlan {
  const { state, emotionalCore, seed = 0 } = input;

  // Base set: always includes skin texture (the universal anti-AI signal).
  const base: MicroDetail[] = ['skin-texture'];
  const fromCore = emotionalCore ? CORE_OVERRIDES[emotionalCore.id] ?? [] : [];
  const fromFamily = FAMILY_DETAILS[state.family] ?? [];

  // Merge, dedupe, then pick up to 5.
  const merged = uniq([...base, ...fromCore, ...fromFamily]);
  const rng = mulberry32(seed);
  const details = pickN(merged, Math.min(5, merged.length), rng);

  const notes = details.map((d) => DETAIL_NOTES[d]);
  const briefLine = `Human credibility cues (include in subject): ${notes.join('; ')}.`;
  return { details, briefLine, notes };
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  return out;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
