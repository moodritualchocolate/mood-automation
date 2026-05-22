/**
 * SOCIAL PERMISSION STRUCTURES (Phase 21)
 *
 * Modern humans operate inside informal PERMISSION ECONOMIES. They
 * cannot easily take rest until rest is permitted by the cohort.
 * They cannot leave the workplace at 17:14 until somebody else does
 * first. They cannot decline the playdate until a parent in the
 * group declines first.
 *
 * The engine models which permission structure the banner is
 * operating inside, and scores the SOCIAL UNFREEDOM the subject is
 * carrying.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type PermissionStructureId =
  | 'first-to-leave-the-office'
  | 'first-to-decline-the-playdate'
  | 'first-to-mute-the-group-chat'
  | 'first-to-leave-the-team-slack-empty'
  | 'first-to-say-not-now-to-the-parents'
  | 'first-to-skip-the-friday-drink'
  | 'first-to-say-no-to-the-team-offsite'
  | 'first-to-bring-up-the-real-thing-at-dinner';

export interface PermissionStructureRecord {
  id: PermissionStructureId;
  the_unspoken_rule: string;
  cost_of_breaking_it: string;
}

export const PERMISSION_STRUCTURES: Record<PermissionStructureId, PermissionStructureRecord> = {
  'first-to-leave-the-office': {
    id: 'first-to-leave-the-office',
    the_unspoken_rule: 'nobody leaves before the team lead is observed leaving',
    cost_of_breaking_it: 'a small perceived flag on commitment',
  },
  'first-to-decline-the-playdate': {
    id: 'first-to-decline-the-playdate',
    the_unspoken_rule: 'parents in the cohort accept every playdate to maintain reciprocity',
    cost_of_breaking_it: 'the kid drops slightly in the social network',
  },
  'first-to-mute-the-group-chat': {
    id: 'first-to-mute-the-group-chat',
    the_unspoken_rule: 'muting reads as opting out of the relationship',
    cost_of_breaking_it: 'a small friction the next time the chat lights up',
  },
  'first-to-leave-the-team-slack-empty': {
    id: 'first-to-leave-the-team-slack-empty',
    the_unspoken_rule: 'visible activity in slack is taken as a proxy for capacity',
    cost_of_breaking_it: 'a perceived absence even though work continued',
  },
  'first-to-say-not-now-to-the-parents': {
    id: 'first-to-say-not-now-to-the-parents',
    the_unspoken_rule: 'parents calls are answered when they arrive',
    cost_of_breaking_it: 'a small concern noted, then revisited',
  },
  'first-to-skip-the-friday-drink': {
    id: 'first-to-skip-the-friday-drink',
    the_unspoken_rule: 'the team friday drink builds the relational capital the team uses on Monday',
    cost_of_breaking_it: 'a small drift from the inside-jokes that develop in the room',
  },
  'first-to-say-no-to-the-team-offsite': {
    id: 'first-to-say-no-to-the-team-offsite',
    the_unspoken_rule: 'offsites are nominally optional but observably mandatory',
    cost_of_breaking_it: 'the perception of not being a team player',
  },
  'first-to-bring-up-the-real-thing-at-dinner': {
    id: 'first-to-bring-up-the-real-thing-at-dinner',
    the_unspoken_rule: 'family dinners maintain a tone the unspoken thing would shatter',
    cost_of_breaking_it: 'a redefinition of the dinner the family is not ready to absorb',
  },
};

const STATE_TO_PERMISSION: Record<string, PermissionStructureId[]> = {
  'overconnected-exhaustion':        ['first-to-mute-the-group-chat', 'first-to-leave-the-team-slack-empty'],
  'silent-burnout':                  ['first-to-leave-the-office', 'first-to-leave-the-team-slack-empty'],
  'workday-blur':                    ['first-to-leave-the-office'],
  'unread-messages-anxiety':         ['first-to-leave-the-team-slack-empty', 'first-to-mute-the-group-chat'],
  'social-load-exhaustion':          ['first-to-skip-the-friday-drink'],
  'parent-overload':                 ['first-to-decline-the-playdate'],
  'partner-overload':                ['first-to-say-not-now-to-the-parents'],
  'emotionally-drained':             ['first-to-bring-up-the-real-thing-at-dinner'],
  'startup-burnout':                 ['first-to-say-no-to-the-team-offsite'],
  'overwhelmed-founder':             ['first-to-leave-the-office'],
};

export interface SocialPermissionReading {
  primary: PermissionStructureRecord | null;
  /** 0..10 — how much the body is carrying the social-unfreedom. */
  unfreedom_intensity: number;
  notes: string[];
}

export interface SocialPermissionInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readSocialPermissionStructures(input: SocialPermissionInput): SocialPermissionReading {
  const { state } = input;
  const notes: string[] = [];
  const id = STATE_TO_PERMISSION[state.id]?.[0] ?? null;
  const primary = id ? PERMISSION_STRUCTURES[id] : null;
  const unfreedom_intensity = primary ? 7 : 0;
  if (primary) notes.push(`social permission: ${primary.id} — rule "${primary.the_unspoken_rule}"`);
  return { primary, unfreedom_intensity, notes };
}
