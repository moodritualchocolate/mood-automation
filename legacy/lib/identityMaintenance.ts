/**
 * IDENTITY MAINTENANCE (Phase 19)
 *
 * Modern people do not only survive. They MAINTAIN AN IDENTITY while
 * surviving. The identity costs more than the survival.
 *
 * Six modeled identities the engine watches under pressure:
 *
 *   parent              — "good parent" / "patient parent" / "present parent"
 *   founder             — "the one who carries everyone" / "always optimistic"
 *   employee            — "reliable" / "easy to work with" / "on it"
 *   partner             — "still here" / "still showing up" / "still warm"
 *   strong-person       — "the one who doesn't fall apart"
 *   reliable-person     — "the one who replies" / "the one who can be counted on"
 *
 * The engine detects when BEHAVIOR EXISTS TO PRESERVE IDENTITY, not
 * to serve wellbeing. The cost of the identity is the photograph.
 *
 * Each detected identity scores:
 *   identity_pressure       — how much the identity is being held up
 *                             against internal load
 *   identity_above_wellbeing — how much the behavior serves the role,
 *                             not the body
 *   identity_cost           — what the maintenance is costing the body
 *   identity_visible_to_self — does the subject SEE the identity-work
 *                             they are doing? (low — almost always)
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type IdentityRoleId =
  | 'parent'
  | 'founder'
  | 'employee'
  | 'partner'
  | 'strong-person'
  | 'reliable-person'
  | 'caretaker'
  | 'fun-friend'
  | 'good-host'
  | 'capable-adult';

export interface IdentityRoleRecord {
  id: IdentityRoleId;
  what_it_demands: string;
  what_it_forbids: string;          // the move the identity does not allow
  maintenance_signatures: string[]; // observable behaviors that PROVE the identity
  hidden_cost: string;
}

export const IDENTITY_LIBRARY: Record<IdentityRoleId, IdentityRoleRecord> = {
  'parent': {
    id: 'parent',
    what_it_demands: 'patience, presence, warmth, on-call attention at any hour',
    what_it_forbids: 'being a person before being a parent — no separate need allowed',
    maintenance_signatures: [
      'soft tone at 23:14 for the third wakeup',
      '"sweetheart, one minute" said for the fourth time',
      'showing up to school pickup with the right energy after a 12h day',
      'reading the book again even though the eyes are closing',
    ],
    hidden_cost: 'the parent has not been a person in three years; the body forgot what it wanted before the kid',
  },
  'founder': {
    id: 'founder',
    what_it_demands: 'optimism, decisiveness, energy in the room, "we got this" in the team channel',
    what_it_forbids: 'doubt visible to anyone — investors, team, partner',
    maintenance_signatures: [
      'voice up in the all-hands; voice down in the car after',
      'an upbeat reply in slack at 23:42',
      'a "great question" to every question that did not deserve one',
      'closing the laptop in the bedroom; opening it again before the partner sees',
    ],
    hidden_cost: 'the founder has not had a real conversation about how they are in nine months',
  },
  'employee': {
    id: 'employee',
    what_it_demands: 'reliability, responsiveness, predictable output, "got it" within five minutes',
    what_it_forbids: 'visible struggle — every difficulty must be resolved inside the worker, not the work',
    maintenance_signatures: [
      'a clean inbox at 09:14',
      'a thoughtful reply at 22:38',
      'a confident answer in standup the brain had not finished forming',
      'turning a "this is hard" thought into a "let me take that on"',
    ],
    hidden_cost: 'the employee is at deficit; the deficit will be paid in the next sleep, the next weekend, the next year',
  },
  'partner': {
    id: 'partner',
    what_it_demands: 'warmth, availability, sustained attention, a shared evening that feels shared',
    what_it_forbids: 'arriving home empty — the partner identity requires arriving with something',
    maintenance_signatures: [
      'asking how their day went before being asked',
      'staying engaged at dinner after a full inbox day',
      'a hand on the partner\'s back without being asked',
      'kissing them at the door after a meeting that did not go well',
    ],
    hidden_cost: 'the partner identity is the last thing the subject offers — there is no room left for their own day',
  },
  'strong-person': {
    id: 'strong-person',
    what_it_demands: 'no visible cracks, no public collapse, an answer to "how are you" that does not require follow-up',
    what_it_forbids: 'asking for help — the identity is the one who does not need it',
    maintenance_signatures: [
      '"I\'m good" delivered evenly, with eye contact',
      'a steady tone through a hard sentence',
      'an "I\'ve got it" when offered help that is needed',
      'driving home composed; arriving home shaking',
    ],
    hidden_cost: 'the strong person has no language for not-being-okay anymore; the asking-system has atrophied',
  },
  'reliable-person': {
    id: 'reliable-person',
    what_it_demands: 'replies within reasonable time, follow-through on every promised thing, no dropped balls',
    what_it_forbids: 'missing — visibility is the identity',
    maintenance_signatures: [
      'a reply at 06:42 to a message sent at 05:58',
      'a calendar item created the same day it was promised',
      'a follow-up on a thread three weeks old',
      'an apology when nothing was actually missed',
    ],
    hidden_cost: 'reliability has become a structural part of self-worth; the day is not a day if a thing got dropped',
  },
  'caretaker': {
    id: 'caretaker',
    what_it_demands: 'checking in on others, holding the social weather, asking the second question',
    what_it_forbids: 'being the one being taken care of',
    maintenance_signatures: [
      'asking how the friend is doing without being asked back',
      'remembering the partner\'s thing on Tuesday',
      'cooking after a 11h day because the family needed dinner',
      'sending a "thinking of you" at the right moment to the right person',
    ],
    hidden_cost: 'the caretaker has no one whose job it is to check on them; the checking goes one direction',
  },
  'fun-friend': {
    id: 'fun-friend',
    what_it_demands: 'energy at the table, the right joke at the right beat, lifting the room',
    what_it_forbids: 'arriving without lift — the identity is the lift',
    maintenance_signatures: [
      'a joke that landed at the dinner the body did not want to attend',
      'energy in the group chat at 22:11',
      'an enthusiastic yes to plans the body had no capacity for',
      'sitting in the car for ten minutes after, no longer performing',
    ],
    hidden_cost: 'the fun friend cannot be at the table without the lift; the lift has become the cost of entry',
  },
  'good-host': {
    id: 'good-host',
    what_it_demands: 'a warm welcome, the right snacks, the right music, attention on the guest',
    what_it_forbids: 'guests seeing the house in its honest state',
    maintenance_signatures: [
      'tidying for 90 minutes for a 30-minute visit',
      'lighting the candle three minutes before the doorbell',
      'a warm "come in, come in" while still wet from showering',
      'collapsing on the couch the moment the door closes',
    ],
    hidden_cost: 'hosting has become a performance with a measurable energetic deficit',
  },
  'capable-adult': {
    id: 'capable-adult',
    what_it_demands: 'tax, rent, calendar, doctor, parents, errands, all on time, all unhelped',
    what_it_forbids: 'admitting any of it is harder than it should be',
    maintenance_signatures: [
      'a calendar that looks fine on Monday morning',
      'a paid bill, an answered email, a returned package',
      'a "yes I got it" to the parent who asked about the appointment',
      'a quiet panic at 23:14 the calendar never showed',
    ],
    hidden_cost: 'the capable-adult identity is a daily performance the body never agreed to',
  },
};

const STATE_TO_IDENTITY: Record<string, IdentityRoleId[]> = {
  'parent-overload':                 ['parent'],
  'partner-overload':                ['partner'],
  'silent-burnout':                  ['employee', 'reliable-person', 'strong-person'],
  'overwhelmed-founder':             ['founder', 'strong-person'],
  'startup-burnout':                 ['founder', 'reliable-person'],
  'overconnected-exhaustion':        ['reliable-person', 'employee'],
  'unread-messages-anxiety':         ['reliable-person'],
  'social-load-exhaustion':          ['fun-friend', 'good-host'],
  'before-meeting-panic':            ['employee', 'strong-person'],
  'always-on-anxiety':               ['reliable-person', 'employee'],
  'mentally-absent':                 ['parent', 'partner'],
  'phone-during-family':             ['parent'],
  'sunday-anxiety':                  ['capable-adult', 'reliable-person'],
  'emotionally-drained':             ['caretaker', 'strong-person'],
  'restless-night':                  ['strong-person'],
  'workday-blur':                    ['employee', 'reliable-person'],
};

const CORE_TO_IDENTITY: Partial<Record<string, IdentityRoleId>> = {
  'silent-burnout':                 'employee',
  'invisible-pressure':             'reliable-person',
  'performance-pressure':           'strong-person',
  'productivity-identity':          'employee',
  'social-mask-fatigue':            'fun-friend',
  'hidden-anxiety':                 'strong-person',
  'caretaker-fatigue':              'caretaker',
};

export interface IdentityMaintenanceReading {
  primary: IdentityRoleRecord | null;
  secondary: IdentityRoleRecord | null;
  /** 0..10 — how strongly the identity is being held up. */
  identity_pressure: number;
  /** 0..10 — how strongly the behavior serves the role over the body. */
  identity_above_wellbeing: number;
  /** 0..10 — what the maintenance is costing. */
  identity_cost: number;
  /** 0..10 — does the subject SEE the identity-work? Almost always low. */
  identity_visible_to_self: number;
  /** True when the truth observes a specific maintenance signature. */
  maintenance_signature_visible: boolean;
  /** True when the truth is identity-aware (subject names their own
   *  role) — usually a sign the banner is becoming too self-conscious. */
  subject_names_their_role: boolean;
  notes: string[];
}

export interface IdentityMaintenanceInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

const ROLE_NAMING_VOCAB = /\b(as a (parent|founder|partner|wife|husband|spouse|employee|friend|host|adult)|the (good|strong|reliable|capable) (parent|founder|partner|wife|husband|spouse|employee|friend|host|adult)|i'm a (parent|founder|partner|wife|husband|spouse|employee|friend|host|adult))\b/i;
const MAINTENANCE_SIGNATURE_VOCAB = /\b(sweetheart|honey|of course|got it|reply|replied|tidy|tidied|cooked|host(ed|ing)?|inbox|standup|all[- ]?hands|pickup|bedtime|book|bath|wake[- ]?ups?|errand)\b/i;

export function readIdentityMaintenance(input: IdentityMaintenanceInput): IdentityMaintenanceReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: IdentityRoleId[] = [];
  for (const id of STATE_TO_IDENTITY[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_IDENTITY[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }

  const primary = candidates[0] ? IDENTITY_LIBRARY[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? IDENTITY_LIBRARY[candidates[1]]
    : null;

  const text = truth.truth;
  const subject_names_their_role = ROLE_NAMING_VOCAB.test(text);
  const maintenance_signature_visible = MAINTENANCE_SIGNATURE_VOCAB.test(text);

  // Identity pressure — strong when state family is pressure/fatigue/
  // overstimulation and a role matched.
  let identity_pressure = 0;
  if (primary) identity_pressure += 5;
  switch (state.family) {
    case 'pressure':         identity_pressure += 4; break;
    case 'overstimulation':  identity_pressure += 3; break;
    case 'fatigue':          identity_pressure += 3; break;
    case 'numbness':         identity_pressure += 2; break;
    case 'collapse':         identity_pressure += 2; break;
    default:                  identity_pressure += 1; break;
  }
  identity_pressure = clamp10(identity_pressure);

  // Identity above wellbeing — high when the role's "what_it_forbids"
  // is being violated only internally.
  let identity_above_wellbeing = primary ? 7 : 0;
  if (maintenance_signature_visible) identity_above_wellbeing += 1;
  identity_above_wellbeing = clamp10(identity_above_wellbeing);

  // Identity cost.
  let identity_cost = 0;
  if (primary) identity_cost = 7;
  if (identity_pressure >= 7) identity_cost += 1;
  identity_cost = clamp10(identity_cost);

  // Identity visible to self — almost never. Only rises when the
  // truth explicitly names the role, which is suspicious.
  let identity_visible_to_self = 0;
  if (subject_names_their_role) identity_visible_to_self = 8;
  else identity_visible_to_self = 1;

  if (primary) {
    notes.push(`identity under maintenance: ${primary.id}`);
    notes.push(`identity demands: ${primary.what_it_demands}`);
    notes.push(`identity hidden cost: ${primary.hidden_cost}`);
  } else {
    notes.push('no identity role matched — behavior may exist outside identity pressure');
  }
  if (subject_names_their_role) {
    notes.push('WARNING: truth has the subject naming their own role — banner becomes self-conscious instead of observed');
  }
  if (maintenance_signature_visible) {
    notes.push('truth catches a maintenance signature — the photograph sees the identity-work mid-execution');
  }

  return {
    primary,
    secondary,
    identity_pressure,
    identity_above_wellbeing,
    identity_cost,
    identity_visible_to_self,
    maintenance_signature_visible,
    subject_names_their_role,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
