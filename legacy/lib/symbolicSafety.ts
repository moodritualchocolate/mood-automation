/**
 * SYMBOLIC SAFETY (Phase 22)
 *
 * Objects the subject keeps not because they are useful but because
 * they are emotionally LOAD-BEARING. The cinematic value of these
 * objects is enormous — they carry the part of the subject the
 * subject does not narrate.
 *
 * Scored:
 *   safety_object_present     — does the truth contain a symbolic-safety object?
 *   symbolic_resonance        — how loaded the object reads
 *   object_named_too_directly — has the truth turned the object into a metaphor?
 *                               (which would be over-explaining; the spec prefers it stay un-named)
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type SymbolicSafetyObjectId =
  | 'kept-old-jumper'
  | 'first-pen-still-on-the-desk'
  | 'one-photo-by-the-bed'
  | 'a-tin-of-tea-not-drunk-anymore'
  | 'a-card-not-thrown-out'
  | 'a-keyring-fob-from-an-old-place'
  | 'a-stone-from-a-beach'
  | 'a-shirt-not-worn-in-three-years';

export interface SymbolicSafetyRecord {
  id: SymbolicSafetyObjectId;
  the_object: string;
  what_it_holds: string;
}

export const SYMBOLIC_LIBRARY: Record<SymbolicSafetyObjectId, SymbolicSafetyRecord> = {
  'kept-old-jumper': {
    id: 'kept-old-jumper',
    the_object: 'a jumper from a previous self the body sometimes still wears at home',
    what_it_holds: 'a continuity to a body that wanted less',
  },
  'first-pen-still-on-the-desk': {
    id: 'first-pen-still-on-the-desk',
    the_object: 'the first pen of a project that mattered, never thrown out',
    what_it_holds: 'a proof the subject once started something',
  },
  'one-photo-by-the-bed': {
    id: 'one-photo-by-the-bed',
    the_object: 'one photograph next to the bed, of a person or place',
    what_it_holds: 'a relationship the subject does not have to maintain to feel',
  },
  'a-tin-of-tea-not-drunk-anymore': {
    id: 'a-tin-of-tea-not-drunk-anymore',
    the_object: 'an unopened tin of tea kept on the shelf',
    what_it_holds: 'a small future-self the subject has not let go of',
  },
  'a-card-not-thrown-out': {
    id: 'a-card-not-thrown-out',
    the_object: 'a card from someone, kept in a drawer years past relevance',
    what_it_holds: 'evidence of being held by someone in a specific year',
  },
  'a-keyring-fob-from-an-old-place': {
    id: 'a-keyring-fob-from-an-old-place',
    the_object: 'a small fob from an old apartment, still on the keys',
    what_it_holds: 'a place the body still belongs to inside',
  },
  'a-stone-from-a-beach': {
    id: 'a-stone-from-a-beach',
    the_object: 'a beach pebble in a bowl on the desk',
    what_it_holds: 'a specific afternoon the subject was happy',
  },
  'a-shirt-not-worn-in-three-years': {
    id: 'a-shirt-not-worn-in-three-years',
    the_object: 'a shirt in the back of the closet from a self who wore it once',
    what_it_holds: 'an identity the body has not formally retired',
  },
};

const STATE_TO_SAFETY: Record<string, SymbolicSafetyObjectId[]> = {
  'silent-burnout':                  ['kept-old-jumper', 'first-pen-still-on-the-desk'],
  'emotionally-drained':             ['one-photo-by-the-bed', 'a-card-not-thrown-out'],
  'overwhelmed-founder':             ['first-pen-still-on-the-desk'],
  'restless-night':                  ['kept-old-jumper'],
  'sunday-anxiety':                  ['a-tin-of-tea-not-drunk-anymore'],
  'late-kitchen-silence':            ['a-stone-from-a-beach'],
  'mentally-absent':                 ['one-photo-by-the-bed'],
  'partner-overload':                ['a-card-not-thrown-out'],
};

const OBJECT_NAMING_TOO_DIRECTLY = /\b(metaphor|symbol(ises|ic|ically)?|represent(s|ed|ing)?|stand(s)? in for)\b/i;

export interface SymbolicSafetyReading {
  primary: SymbolicSafetyRecord | null;
  /** 0..10 — strength of the symbolic-safety presence. */
  symbolic_resonance: number;
  /** True when the truth describes the object as a symbol. */
  object_named_too_directly: boolean;
  notes: string[];
}

export interface SymbolicSafetyInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readSymbolicSafety(input: SymbolicSafetyInput): SymbolicSafetyReading {
  const { state, truth } = input;
  const notes: string[] = [];
  const id = STATE_TO_SAFETY[state.id]?.[0] ?? null;
  const primary = id ? SYMBOLIC_LIBRARY[id] : null;
  const object_named_too_directly = OBJECT_NAMING_TOO_DIRECTLY.test(truth.truth);

  let symbolic_resonance = primary ? 7 : 0;
  if (object_named_too_directly) symbolic_resonance -= 3;
  symbolic_resonance = Math.max(0, Math.min(10, symbolic_resonance));

  if (primary) notes.push(`symbolic safety object: ${primary.id} — holds "${primary.what_it_holds}"`);
  if (object_named_too_directly) notes.push('WARNING: truth names the object as a symbol — Phase 22 prefers the object stay an object');
  return { primary, symbolic_resonance, object_named_too_directly, notes };
}
