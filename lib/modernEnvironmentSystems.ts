/**
 * MODERN ENVIRONMENT SYSTEMS (Phase 17)
 *
 * Modern environments are no longer passive backdrops. They are
 * emotional MACHINES that actively shape human cognition.
 *
 * The spec named six:
 *
 *   phones remove transitions
 *   laptops extend work identity
 *   beds become productivity zones
 *   streaming destroys silence
 *   notifications erase mental recovery
 *
 * The engine identifies which environmental machine is active in
 * the candidate banner — and emits a briefing line that tells the
 * image brief HOW that machine should be visible in the scene.
 */

import type { CulturalMicroMoment } from './culturalMemory';
import type { HumanState } from '@/core/types';
import type { LightBehavior } from './atmosphericLight';

export type EnvironmentalMachine =
  | 'phone-removes-transitions'
  | 'laptop-extends-work-identity'
  | 'bed-as-productivity-zone'
  | 'streaming-destroys-silence'
  | 'notifications-erase-recovery'
  | 'open-plan-removes-private-recovery';

export interface EnvironmentalMachineRecord {
  id: EnvironmentalMachine;
  mechanism: string;
  what_it_replaces: string;          // what used to be there before the machine
  briefHint: string;                  // exact directive for the image brief
}

export const ENVIRONMENT_MACHINES: Record<EnvironmentalMachine, EnvironmentalMachineRecord> = {
  'phone-removes-transitions': {
    id: 'phone-removes-transitions',
    mechanism: 'phone fills every micro-pause — elevator, waiting room, between meetings, walking to the kitchen',
    what_it_replaces: 'the small mental gaps that let thoughts complete',
    briefHint: 'phone in hand DURING a transitional space (elevator / corridor / lift / between rooms) — the gap has been filled',
  },
  'laptop-extends-work-identity': {
    id: 'laptop-extends-work-identity',
    mechanism: 'laptop travels into non-work rooms — bed, kitchen, couch, café — work identity follows everywhere',
    what_it_replaces: 'the boundary between work-self and home-self',
    briefHint: 'laptop in a NON-WORK room (bedside table / dining table / sofa) — work identity has migrated',
  },
  'bed-as-productivity-zone': {
    id: 'bed-as-productivity-zone',
    mechanism: 'bed is now used for working, scrolling, reading, watching — sleep is one of many activities the same surface hosts',
    what_it_replaces: 'the bed as a pure rest signal',
    briefHint: 'bed scene with non-sleep surface clutter — laptop open, snack wrapper, notebook — the bed has been overloaded',
  },
  'streaming-destroys-silence': {
    id: 'streaming-destroys-silence',
    mechanism: 'continuous audio/video fills every quiet moment — podcast through the chores, TV at meal, autoplay before sleep',
    what_it_replaces: 'silence the body once used to consolidate the day',
    briefHint: 'a screen or speaker visibly playing while the subject is doing something else — neither watched, both running',
  },
  'notifications-erase-recovery': {
    id: 'notifications-erase-recovery',
    mechanism: 'notifications puncture the day at intervals that prevent any nervous-system downshift',
    what_it_replaces: 'the slow-release rest curve the body needs after stimulation',
    briefHint: 'phone notification visible (badge / glow / lockscreen) interrupting a scene that was about to be quiet',
  },
  'open-plan-removes-private-recovery': {
    id: 'open-plan-removes-private-recovery',
    mechanism: 'open-plan office + open kitchen + open living-room — no door to close means no recovery between roles',
    what_it_replaces: 'the room you could close to be off-duty',
    briefHint: 'wide shot of an open-plan space (office or apartment) — visible activity in the background that the subject cannot fully escape',
  },
};

const MOMENT_TO_MACHINES: Record<string, EnvironmentalMachine[]> = {
  'fridge-open-at-night':       ['streaming-destroys-silence'],
  'bed-scrolling':              ['bed-as-productivity-zone', 'phone-removes-transitions'],
  'unread-whatsapp':            ['notifications-erase-recovery'],
  'office-fluorescent':         ['open-plan-removes-private-recovery'],
  'office-1647-brain-death':    ['open-plan-removes-private-recovery'],
  'startup-late-night':         ['laptop-extends-work-identity', 'open-plan-removes-private-recovery'],
  'parenting-overload':         ['phone-removes-transitions'],
  'coffee-machine-emptiness':   ['phone-removes-transitions'],
  'overstimulated-tabs':        ['laptop-extends-work-identity', 'notifications-erase-recovery'],
  'late-kitchen-silence':       ['streaming-destroys-silence'],
  'avoiding-messages':          ['notifications-erase-recovery'],
  'staring-without-processing': ['laptop-extends-work-identity'],
  'eating-without-hunger':      ['streaming-destroys-silence'],
  'reserves-fatigue':           ['notifications-erase-recovery'],
  'car-after-work':             ['phone-removes-transitions'],
  'train-ride-silence':         ['streaming-destroys-silence'],
  'zoning-out':                 ['laptop-extends-work-identity', 'open-plan-removes-private-recovery'],
};

const STATE_FAMILY_FALLBACK: Record<HumanState['family'], EnvironmentalMachine> = {
  fatigue:         'laptop-extends-work-identity',
  collapse:        'bed-as-productivity-zone',
  numbness:        'streaming-destroys-silence',
  paralysis:       'streaming-destroys-silence',
  pressure:        'laptop-extends-work-identity',
  overstimulation: 'notifications-erase-recovery',
  fragmentation:   'notifications-erase-recovery',
  avoidance:       'phone-removes-transitions',
};

export interface EnvironmentalSystemReading {
  primary: EnvironmentalMachineRecord | null;
  secondary: EnvironmentalMachineRecord | null;
  /** Plain-text director note for the image brief. */
  briefAddition: string | null;
  /** True when the environment in the scene is the actual emotional cause. */
  environment_is_the_machine: boolean;
  notes: string[];
}

export interface EnvironmentalSystemInput {
  state: HumanState;
  microMoment: CulturalMicroMoment | null;
  atmosphericLightBehavior?: LightBehavior | string;
}

export function identifyEnvironmentalSystem(input: EnvironmentalSystemInput): EnvironmentalSystemReading {
  const { state, microMoment, atmosphericLightBehavior } = input;
  const notes: string[] = [];

  const candidates: EnvironmentalMachine[] = [];
  if (microMoment && MOMENT_TO_MACHINES[microMoment.state_id]) {
    candidates.push(...MOMENT_TO_MACHINES[microMoment.state_id]);
  }
  // Atmospheric-light overrides — sleepless-blue + phone-glow-loneliness
  // are notification-erase signals; monitor-cool-only is laptop-extends.
  if (atmosphericLightBehavior === 'sleepless-blue' || atmosphericLightBehavior === 'phone-glow-loneliness') {
    if (!candidates.includes('notifications-erase-recovery')) candidates.push('notifications-erase-recovery');
  }
  if (atmosphericLightBehavior === 'monitor-cool-only' || atmosphericLightBehavior === 'late-office-warmth') {
    if (!candidates.includes('laptop-extends-work-identity')) candidates.push('laptop-extends-work-identity');
  }
  // Family fallback when nothing else matched.
  if (candidates.length === 0) {
    candidates.push(STATE_FAMILY_FALLBACK[state.family]);
  }

  const primary = candidates[0] ? ENVIRONMENT_MACHINES[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? ENVIRONMENT_MACHINES[candidates[1]]
    : null;

  const briefAddition = primary
    ? `Environmental machine to make visible: ${primary.briefHint}.`
    : null;

  const environment_is_the_machine = candidates.length >= 1;

  if (primary) notes.push(`environmental machine: ${primary.id}`);
  if (secondary) notes.push(`secondary machine: ${secondary.id}`);

  return { primary, secondary, briefAddition, environment_is_the_machine, notes };
}
