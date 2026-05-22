/**
 * IDENTITY CONTINUITY (Phase 23)
 *
 * Modern humans hold MULTIPLE identities (work-self, home-self,
 * parent-self, friend-self, online-self). Identity continuity is the
 * degree to which these feel like one continuous person — or a set
 * of separate operators sharing a body.
 *
 * Low continuity is a defining modern fracture. The engine reads the
 * candidate banner for the continuity break and scores how much the
 * subject is paying the cost of switching.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type ContinuityBreakId =
  | 'work-self-vs-home-self'
  | 'parent-self-vs-person-self'
  | 'online-self-vs-offline-self'
  | 'public-self-vs-private-self'
  | 'today-self-vs-younger-self'
  | 'performing-self-vs-resting-self';

export interface ContinuityBreakRecord {
  id: ContinuityBreakId;
  the_two_selves: string;
  the_switching_cost: string;
}

export const CONTINUITY_BREAKS: Record<ContinuityBreakId, ContinuityBreakRecord> = {
  'work-self-vs-home-self': {
    id: 'work-self-vs-home-self',
    the_two_selves: 'the version that runs the workday and the version that walks in the door',
    the_switching_cost: 'the commute is too short to fully convert; one self bleeds into the other',
  },
  'parent-self-vs-person-self': {
    id: 'parent-self-vs-person-self',
    the_two_selves: 'the parent and the person who existed before the parent',
    the_switching_cost: 'the person-self has had no airtime in so long it has gone quiet',
  },
  'online-self-vs-offline-self': {
    id: 'online-self-vs-offline-self',
    the_two_selves: 'the self that is legible on a feed and the self in the room',
    the_switching_cost: 'a small dissonance when the two are observed side by side',
  },
  'public-self-vs-private-self': {
    id: 'public-self-vs-private-self',
    the_two_selves: 'the composed public version and the version once the door closes',
    the_switching_cost: 'the gap has widened to the point the subject is unsure which is real',
  },
  'today-self-vs-younger-self': {
    id: 'today-self-vs-younger-self',
    the_two_selves: 'the current self and the self of ten years ago',
    the_switching_cost: 'the younger self had assumptions the current self has quietly abandoned',
  },
  'performing-self-vs-resting-self': {
    id: 'performing-self-vs-resting-self',
    the_two_selves: 'the on-tone performing self and the self that exists when nothing is required',
    the_switching_cost: 'the resting self is so rarely accessed the body has half-forgotten it',
  },
};

const STATE_TO_BREAK: Record<string, ContinuityBreakId[]> = {
  'exhausted-commute':               ['work-self-vs-home-self'],
  'workday-blur':                    ['work-self-vs-home-self'],
  'parent-overload':                 ['parent-self-vs-person-self'],
  'mentally-absent':                 ['performing-self-vs-resting-self'],
  'silent-burnout':                  ['public-self-vs-private-self', 'performing-self-vs-resting-self'],
  'overconnected-exhaustion':        ['online-self-vs-offline-self'],
  'sunday-anxiety':                  ['today-self-vs-younger-self'],
  'overwhelmed-founder':             ['public-self-vs-private-self'],
  'social-load-exhaustion':          ['performing-self-vs-resting-self'],
};

const CORE_TO_BREAK: Partial<Record<string, ContinuityBreakId>> = {
  'social-mask-fatigue':            'public-self-vs-private-self',
  'silent-burnout':                 'performing-self-vs-resting-self',
  'emotional-numbness':             'performing-self-vs-resting-self',
  'inability-to-land':              'work-self-vs-home-self',
};

export interface IdentityContinuityReading {
  primary: ContinuityBreakRecord | null;
  /** 0..10 — how fractured identity continuity reads (10 = badly broken). */
  continuity_fracture: number;
  /** 0..10 — the switching cost the subject is carrying. */
  switching_cost: number;
  notes: string[];
}

export interface IdentityContinuityInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readIdentityContinuity(input: IdentityContinuityInput): IdentityContinuityReading {
  const { state, emotionalCore } = input;
  const notes: string[] = [];
  const candidates: ContinuityBreakId[] = [];
  for (const id of STATE_TO_BREAK[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_BREAK[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? CONTINUITY_BREAKS[candidates[0]] : null;
  const continuity_fracture = primary ? 7 : 2;
  const switching_cost = primary ? 6 : 0;
  if (primary) notes.push(`identity continuity break: ${primary.id} — ${primary.the_switching_cost}`);
  return { primary, continuity_fracture, switching_cost, notes };
}
