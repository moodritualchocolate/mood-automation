/**
 * MICRO ESCAPE DETECTION (Phase 18)
 *
 * Detects the TINY escape behaviors humans use to regulate overload —
 * the ones too short to be called avoidance, too purposeful to be
 * called numbness, too quiet to be called rebellion.
 *
 * The spec named seven micro-escapes:
 *   bathroom scrolling
 *   parked-car silence
 *   fake productivity
 *   disappearing into phone
 *   lingering after shower
 *   unnecessary errands
 *   "staring moments"
 *
 * Different from Phase 14's emotionalAvoidance (the SUBSTITUTION),
 * Phase 14's modernNumbing (the SEDATION), Phase 17's recoveryFailure
 * (the FAILURE of rest), and Phase 18's behaviorLoopEngine (the LOOP):
 *
 * Phase 18 micro-escapes are EPHEMERAL REGULATION — 90 seconds to
 * 8 minutes of unsupervised, often-invisible withdrawal from the
 * social/work field. They are not addictions, not failures, not
 * loops — they are HUMAN PAUSES the world has not yet noticed.
 *
 * Each escape is scored on:
 *   emotional_necessity   — how much the body needed it
 *   invisibility          — how invisible to others
 *   recognizability       — how widely recognised (cultural shared-ness)
 *   behavioral_truth      — how truthful as a behaviour vs. as a writing
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalMicroMoment } from './culturalMemory';

export type MicroEscapeId =
  | 'bathroom-scrolling'
  | 'parked-car-silence'
  | 'fake-productivity'
  | 'disappearing-into-phone'
  | 'lingering-after-shower'
  | 'unnecessary-errand'
  | 'staring-moment'
  | 'longer-walk-to-the-printer'
  | 'extra-loop-around-the-block'
  | 'extended-elevator-pause';

export interface MicroEscapeRecord {
  id: MicroEscapeId;
  observable_action: string;
  duration_seconds: [number, number];   // typical range
  social_field_left: string;             // what they stepped out of
  what_they_get_back: string;            // the small regulation
  invisibility_marker: string;           // why nobody notices
  recognition_phrase: string;            // how someone else describes it
}

export const MICRO_ESCAPES: Record<MicroEscapeId, MicroEscapeRecord> = {
  'bathroom-scrolling': {
    id: 'bathroom-scrolling',
    observable_action: 'goes to the bathroom; sits or stands there; scrolls; flushes when nothing was needed',
    duration_seconds: [120, 480],
    social_field_left: 'the office, the meeting, the family room',
    what_they_get_back: 'four minutes the body did not have to perform',
    invisibility_marker: 'nobody questions a bathroom trip — the body uses that',
    recognition_phrase: 'fake bathroom break',
  },
  'parked-car-silence': {
    id: 'parked-car-silence',
    observable_action: 'arrives at destination; turns off the engine; does not get out for several minutes',
    duration_seconds: [60, 600],
    social_field_left: 'work, home, the school pickup line',
    what_they_get_back: 'the only minute of the day with no obligation in either direction',
    invisibility_marker: 'inside the car they are invisible — neither the place behind them nor the place ahead can see',
    recognition_phrase: 'sitting in the car',
  },
  'fake-productivity': {
    id: 'fake-productivity',
    observable_action: 'cmd-tabs into the IDE / opens a doc / scrolls Slack — looks productive — nothing progresses',
    duration_seconds: [180, 900],
    social_field_left: 'the actual task',
    what_they_get_back: 'looks busy to anyone walking by; the brain rests behind the appearance',
    invisibility_marker: 'visually identical to working',
    recognition_phrase: 'looked busy, did nothing',
  },
  'disappearing-into-phone': {
    id: 'disappearing-into-phone',
    observable_action: 'mid-conversation, mid-room, mid-meal — the gaze drops to the screen; the room continues without them',
    duration_seconds: [20, 240],
    social_field_left: 'the conversation, the room, the people at the table',
    what_they_get_back: 'a socially acceptable way to step out without leaving',
    invisibility_marker: 'everyone in the room recognises it but nobody calls it',
    recognition_phrase: 'they checked their phone again',
  },
  'lingering-after-shower': {
    id: 'lingering-after-shower',
    observable_action: 'water off — towel on — sits on the edge of the bed — does nothing for several minutes',
    duration_seconds: [180, 720],
    social_field_left: 'the day, the family, the next task',
    what_they_get_back: 'the only moment the body has been alone and warm at the same time',
    invisibility_marker: 'the door is closed; the household assumes they are still drying off',
    recognition_phrase: 'they always take forever after the shower',
  },
  'unnecessary-errand': {
    id: 'unnecessary-errand',
    observable_action: 'announces a quick run to the store / gas station / pharmacy for one small item — comes back twenty-five minutes later',
    duration_seconds: [600, 2400],
    social_field_left: 'the house, the kids, the partner',
    what_they_get_back: 'twenty-five minutes in a car, alone, with a small legitimate destination',
    invisibility_marker: 'errands are unimpeachable — nobody questions a milk run',
    recognition_phrase: 'they really took their time at the store',
  },
  'staring-moment': {
    id: 'staring-moment',
    observable_action: 'stops mid-room / mid-screen / mid-action and stares at nothing for thirty to ninety seconds',
    duration_seconds: [20, 120],
    social_field_left: 'whatever they were doing',
    what_they_get_back: 'a small unmeasured pause the brain insisted on',
    invisibility_marker: 'the subject would not even describe it as a break',
    recognition_phrase: 'they zoned out',
  },
  'longer-walk-to-the-printer': {
    id: 'longer-walk-to-the-printer',
    observable_action: 'takes the long way to the printer / the kitchen / the bathroom at work',
    duration_seconds: [40, 180],
    social_field_left: 'the desk and the screen and the colleagues nearby',
    what_they_get_back: 'a hundred extra steps the calendar cannot see',
    invisibility_marker: 'walking is always plausible',
    recognition_phrase: 'they walked the long way again',
  },
  'extra-loop-around-the-block': {
    id: 'extra-loop-around-the-block',
    observable_action: 'walks the dog / takes out the trash / runs to the car — and adds one more lap before going inside',
    duration_seconds: [120, 480],
    social_field_left: 'the inside of the house and everything inside it',
    what_they_get_back: 'one more cycle of air before the household reabsorbs them',
    invisibility_marker: 'the dog was the alibi; the loop was the point',
    recognition_phrase: 'they walk the dog forever',
  },
  'extended-elevator-pause': {
    id: 'extended-elevator-pause',
    observable_action: 'enters the elevator alone; the doors close; the body lets go for the ten seconds nobody can see them',
    duration_seconds: [8, 30],
    social_field_left: 'the office floor, the building lobby, the home floor',
    what_they_get_back: 'a vacuum-sealed pause between two performances',
    invisibility_marker: 'nobody in the building knows what anyone in an elevator looks like',
    recognition_phrase: 'the elevator face',
  },
};

const STATE_TO_ESCAPES: Record<string, MicroEscapeId[]> = {
  'overstimulated-office':         ['bathroom-scrolling', 'longer-walk-to-the-printer', 'extended-elevator-pause'],
  'overstimulated-after-work':     ['parked-car-silence', 'extra-loop-around-the-block'],
  'exhausted-commute':              ['parked-car-silence', 'extended-elevator-pause'],
  'workday-blur':                   ['fake-productivity', 'bathroom-scrolling'],
  'fake-productivity':              ['fake-productivity'],
  'mentally-absent':                ['disappearing-into-phone', 'staring-moment'],
  'attention-fragmentation':        ['disappearing-into-phone'],
  'tab-switching-paralysis':        ['fake-productivity'],
  'sunday-anxiety':                 ['unnecessary-errand', 'extra-loop-around-the-block'],
  'restless-work-energy':           ['longer-walk-to-the-printer', 'staring-moment'],
  'overwhelmed-founder':            ['parked-car-silence', 'bathroom-scrolling'],
  'social-load-exhaustion':         ['bathroom-scrolling', 'disappearing-into-phone'],
  'phone-during-family':            ['disappearing-into-phone'],
  'late-afternoon-collapse':        ['staring-moment', 'fake-productivity'],
  'emotionally-drained':            ['lingering-after-shower', 'parked-car-silence'],
  'before-meeting-panic':           ['bathroom-scrolling'],
  'after-meeting-recovery':         ['bathroom-scrolling', 'longer-walk-to-the-printer'],
  'parent-overload':                ['unnecessary-errand', 'lingering-after-shower'],
  'partner-overload':               ['unnecessary-errand', 'extra-loop-around-the-block'],
};

const CORE_TO_ESCAPE: Partial<Record<string, MicroEscapeId>> = {
  'emotional-fragmentation':       'disappearing-into-phone',
  'overstimulation':                'bathroom-scrolling',
  'overstimulated-but-flat':       'staring-moment',
  'silent-burnout':                 'parked-car-silence',
  'invisible-pressure':             'parked-car-silence',
  'hidden-anxiety':                 'bathroom-scrolling',
  'avoidance':                      'fake-productivity',
  'inability-to-land':              'lingering-after-shower',
  'mentally-absent':                'staring-moment',
};

const MOMENT_TO_ESCAPE: Record<string, MicroEscapeId> = {
  'car-after-work':                 'parked-car-silence',
  'bathroom-break':                 'bathroom-scrolling',
  'office-fluorescent':             'longer-walk-to-the-printer',
  'school-pickup':                  'parked-car-silence',
  'elevator':                       'extended-elevator-pause',
};

export interface MicroEscapeReading {
  primary: MicroEscapeRecord | null;
  secondary: MicroEscapeRecord | null;
  /** 0..10 — how strongly the candidate banner captures a micro-escape. */
  micro_escape_score: number;
  /** 0..10 — was this regulation necessary to the body? */
  emotional_necessity: number;
  /** 0..10 — how invisible the escape is to others (10 = nobody noticed). */
  invisibility: number;
  /** 0..10 — how widely recognised the gesture is (10 = "yes, everyone does that"). */
  recognizability: number;
  /** 0..10 — does it read as observed behaviour, not as written description? */
  behavioral_truth: number;
  /** True when the banner shows a micro-escape mid-execution. */
  in_the_act: boolean;
  notes: string[];
}

export interface MicroEscapeInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  microMoment: CulturalMicroMoment | null;
}

const BEHAVIORAL_VERBS = /\b(sits?|stands?|walk(s|ed|ing)?|drive(s|n|ing)?|enter(s|ed)?|leave(s|ing)?|step(s|ped)?|linger(s|ed|ing)?|pause(s|d)?|scroll(s|ed|ing)?|stare(s|d|ing)?|check(s|ed)?|disappear(s|ed|ing)?|reach(es|ed)?|close(s|d)?)\b/i;
const WRITTEN_VOICE   = /\b(feel(s|ing)?|notice(s|d)?|realize(s|d)?|wonder(s|ed)?|think(s|ing)?|truth|reality|moment)\b/i;

export function readMicroEscape(input: MicroEscapeInput): MicroEscapeReading {
  const { state, truth, emotionalCore, microMoment } = input;
  const notes: string[] = [];

  // Collect candidates from state → core → moment, in that order.
  const candidates: MicroEscapeId[] = [];
  for (const id of STATE_TO_ESCAPES[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_ESCAPE[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  if (microMoment) {
    const fromMoment = MOMENT_TO_ESCAPE[microMoment.state_id];
    if (fromMoment && !candidates.includes(fromMoment)) candidates.push(fromMoment);
  }

  const primary = candidates[0] ? MICRO_ESCAPES[candidates[0]] : null;
  const secondary = candidates[1] && candidates[1] !== candidates[0]
    ? MICRO_ESCAPES[candidates[1]]
    : null;

  // Necessity scales with how exhausted / pressured the state family is.
  let emotional_necessity = 0;
  switch (state.family) {
    case 'pressure':         emotional_necessity = 8.5; break;
    case 'overstimulation':  emotional_necessity = 8;   break;
    case 'fatigue':          emotional_necessity = 7;   break;
    case 'fragmentation':    emotional_necessity = 7;   break;
    case 'avoidance':        emotional_necessity = 6;   break;
    case 'numbness':         emotional_necessity = 5;   break;
    case 'collapse':         emotional_necessity = 5;   break;
    case 'paralysis':        emotional_necessity = 5;   break;
  }
  if (!primary) emotional_necessity = Math.max(0, emotional_necessity - 4);

  // Invisibility — most micro-escapes are highly invisible. The
  // disappearing-into-phone is least invisible because everyone in the
  // room sees the gesture; staring is more invisible because nobody
  // names it. We default high.
  let invisibility = primary
    ? (primary.id === 'disappearing-into-phone' ? 5 : 8)
    : 0;

  // Recognizability — the gesture as a SHARED MODERN BEHAVIOUR.
  // Bathroom scrolling / parked-car silence are universally recognised;
  // staring-moment less so.
  let recognizability = 0;
  if (primary) {
    const HIGH = new Set<MicroEscapeId>(['bathroom-scrolling', 'parked-car-silence', 'unnecessary-errand', 'disappearing-into-phone']);
    const MID  = new Set<MicroEscapeId>(['fake-productivity', 'lingering-after-shower', 'extra-loop-around-the-block']);
    recognizability = HIGH.has(primary.id) ? 9 : MID.has(primary.id) ? 7 : 5;
  }

  // Behavioral truth — does the truth-text actually NAME a behavior, or
  // does it write a feeling? We reward behaviour, penalize feeling-only.
  const usesBehavior = BEHAVIORAL_VERBS.test(truth.truth);
  const usesWritten  = WRITTEN_VOICE.test(truth.truth);
  let behavioral_truth = 5;
  if (usesBehavior) behavioral_truth += 3;
  if (usesWritten && !usesBehavior) behavioral_truth -= 3;
  behavioral_truth = clamp10(behavioral_truth);

  // Composite micro_escape_score.
  let score = 0;
  if (primary) score += 4;
  if (secondary) score += 1.5;
  score += (emotional_necessity / 10) * 2;
  score += (behavioral_truth / 10) * 2;
  if (primary && usesBehavior) score += 0.5;
  const micro_escape_score = clamp10(score);

  const in_the_act = !!primary && usesBehavior && micro_escape_score >= 6;

  if (primary) notes.push(`primary micro-escape: ${primary.id} — "${primary.recognition_phrase}"`);
  else         notes.push('no micro-escape pattern matched');
  if (in_the_act) notes.push('banner captures the escape MID-EXECUTION, not mid-description');

  return {
    primary,
    secondary,
    micro_escape_score,
    emotional_necessity,
    invisibility,
    recognizability,
    behavioral_truth,
    in_the_act,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
