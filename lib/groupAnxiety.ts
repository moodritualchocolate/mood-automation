/**
 * GROUP ANXIETY (Phase 21)
 *
 * Detects the AMBIENT anxiety operating in a defined social group
 * the subject belongs to — the school WhatsApp, the startup peer
 * cohort, the parent network, the team channel. The individual
 * carries this anxiety even when their own life is, on paper, fine.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type GroupAnxietyId =
  | 'school-chat-anxiety'
  | 'team-channel-anxiety'
  | 'family-thread-anxiety'
  | 'founder-cohort-anxiety'
  | 'fitness-community-anxiety'
  | 'old-friend-thread-anxiety'
  | 'mom-group-anxiety'
  | 'neighborhood-app-anxiety';

export interface GroupAnxietyRecord {
  id: GroupAnxietyId;
  the_group: string;
  the_ambient_charge: string;
}

export const GROUP_ANXIETIES: Record<GroupAnxietyId, GroupAnxietyRecord> = {
  'school-chat-anxiety': {
    id: 'school-chat-anxiety',
    the_group: 'the school parents WhatsApp',
    the_ambient_charge: 'a steady stream of small obligations, comparisons, and uncoordinated expectations',
  },
  'team-channel-anxiety': {
    id: 'team-channel-anxiety',
    the_group: 'the team slack channel',
    the_ambient_charge: 'an asynchronous wall of activity the subject cannot fully resolve in any session',
  },
  'family-thread-anxiety': {
    id: 'family-thread-anxiety',
    the_group: 'the family chat (siblings + parents)',
    the_ambient_charge: 'expectations, comparisons, unfinished conversations from years ago surfaced as emojis',
  },
  'founder-cohort-anxiety': {
    id: 'founder-cohort-anxiety',
    the_group: 'a chat / DM thread / discord of fellow founders',
    the_ambient_charge: 'shared news of raises, exits, and quiet failures none of them name',
  },
  'fitness-community-anxiety': {
    id: 'fitness-community-anxiety',
    the_group: 'a strava-like / training app community',
    the_ambient_charge: 'a quiet measurement field where everyone\'s consistency is observable',
  },
  'old-friend-thread-anxiety': {
    id: 'old-friend-thread-anxiety',
    the_group: 'the friend chat from college / high school',
    the_ambient_charge: 'the slow drift from current to historical that nobody is naming',
  },
  'mom-group-anxiety': {
    id: 'mom-group-anxiety',
    the_group: 'a moms group from prenatal / pediatrician / playgroup',
    the_ambient_charge: 'a small competition for the appearance of doing it well',
  },
  'neighborhood-app-anxiety': {
    id: 'neighborhood-app-anxiety',
    the_group: 'the neighborhood / building app',
    the_ambient_charge: 'a stream of micro-grievances, micro-warnings, and unresolved tone',
  },
};

const STATE_TO_GROUP: Record<string, GroupAnxietyId[]> = {
  'unread-messages-anxiety':         ['team-channel-anxiety'],
  'parent-overload':                 ['school-chat-anxiety', 'mom-group-anxiety'],
  'partner-overload':                ['family-thread-anxiety'],
  'overwhelmed-founder':             ['founder-cohort-anxiety'],
  'startup-burnout':                 ['founder-cohort-anxiety'],
  'social-load-exhaustion':          ['old-friend-thread-anxiety'],
  'sunday-anxiety':                  ['family-thread-anxiety', 'team-channel-anxiety'],
  'emotionally-drained':             ['family-thread-anxiety'],
};

export interface GroupAnxietyReading {
  primary: GroupAnxietyRecord | null;
  /** 0..10 — how much the body carries this group's ambient charge. */
  ambient_charge: number;
  notes: string[];
}

export interface GroupAnxietyInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readGroupAnxiety(input: GroupAnxietyInput): GroupAnxietyReading {
  const { state } = input;
  const notes: string[] = [];
  const id = STATE_TO_GROUP[state.id]?.[0] ?? null;
  const primary = id ? GROUP_ANXIETIES[id] : null;
  const ambient_charge = primary ? 7 : 0;
  if (primary) notes.push(`group anxiety: ${primary.id} — "${primary.the_ambient_charge}"`);
  return { primary, ambient_charge, notes };
}
