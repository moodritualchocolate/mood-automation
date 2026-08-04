/**
 * EMOTIONAL RETURN MECHANICS (Phase 22)
 *
 * Why does the subject return to the same ritual / object / place /
 * person? The engine modules the GRAVITY OF EMOTIONAL RETURN — the
 * pull that brings the body back, even when conscious mind would
 * route differently.
 *
 * The campaign must stop selling products. It must understand why
 * humans emotionally return.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type ReturnDriverId =
  | 'reliable-regulation'
  | 'identity-confirmation'
  | 'continuity-with-past-self'
  | 'sensory-shorthand'
  | 'relational-anchor'
  | 'predictable-pleasure'
  | 'absence-mitigation'
  | 'familial-association';

export interface ReturnDriverRecord {
  id: ReturnDriverId;
  why_the_body_returns: string;
}

export const RETURN_LIBRARY: Record<ReturnDriverId, ReturnDriverRecord> = {
  'reliable-regulation':       { id: 'reliable-regulation',       why_the_body_returns: 'the ritual reliably down-regulates the nervous system in a predictable window' },
  'identity-confirmation':     { id: 'identity-confirmation',     why_the_body_returns: 'doing the ritual confirms "i am someone who does this"' },
  'continuity-with-past-self': { id: 'continuity-with-past-self', why_the_body_returns: 'the ritual is the connective tissue with a previous version of the self' },
  'sensory-shorthand':         { id: 'sensory-shorthand',         why_the_body_returns: 'a specific smell / sound / temperature unlocks a state faster than a thought can' },
  'relational-anchor':         { id: 'relational-anchor',         why_the_body_returns: 'the ritual was learned from / shared with a specific person' },
  'predictable-pleasure':      { id: 'predictable-pleasure',      why_the_body_returns: 'the ritual reliably produces a small pleasure the day is otherwise short on' },
  'absence-mitigation':        { id: 'absence-mitigation',        why_the_body_returns: 'the ritual stands in for something not currently available — solitude, company, attention' },
  'familial-association':      { id: 'familial-association',      why_the_body_returns: 'a parent or grandparent did this, and doing it returns the subject to that body' },
};

const STATE_TO_DRIVER: Record<string, ReturnDriverId[]> = {
  'silent-burnout':                  ['reliable-regulation'],
  'late-kitchen-silence':            ['sensory-shorthand', 'familial-association'],
  'restless-night':                  ['reliable-regulation', 'sensory-shorthand'],
  'sunday-anxiety':                  ['continuity-with-past-self'],
  'partner-overload':                ['relational-anchor'],
  'emotionally-drained':             ['absence-mitigation'],
  'overwhelmed-founder':             ['identity-confirmation'],
  'mentally-absent':                 ['continuity-with-past-self'],
};

export interface EmotionalReturnReading {
  primary: ReturnDriverRecord | null;
  /** 0..10 — how strong the return-pull reads. */
  return_gravity: number;
  notes: string[];
}

export interface EmotionalReturnInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readEmotionalReturnMechanics(input: EmotionalReturnInput): EmotionalReturnReading {
  const { state } = input;
  const notes: string[] = [];
  const id = STATE_TO_DRIVER[state.id]?.[0] ?? null;
  const primary = id ? RETURN_LIBRARY[id] : null;
  const return_gravity = primary ? 7 : 0;
  if (primary) notes.push(`return driver: ${primary.id} — "${primary.why_the_body_returns}"`);
  return { primary, return_gravity, notes };
}
