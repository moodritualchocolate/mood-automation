/**
 * MODERN NUMBING (Phase 14)
 *
 * Modern self-anesthesia. Not addiction aesthetics — BEHAVIORAL
 * SEDATION. The spec named six patterns:
 *
 *   scrolling while tired
 *   content while eating
 *   background noise while alone
 *   reopening apps automatically
 *   listening instead of thinking
 *   constant stimulation preventing emotional landing
 *
 * Each pattern names a low-grade stimulus the subject reaches for so
 * that the internal state never has the room to land. The point is
 * not the addiction. The point is what the stimulus is PREVENTING.
 *
 * Different from Phase 13's invisibleStakes (which named modern
 * COMPULSIONS — phone-from-anxiety etc). Phase 14's modernNumbing
 * focuses on SEDATION — the active replacement of internal quiet with
 * background input.
 */

import type { HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type NumbingPattern =
  | 'scrolling-while-tired'
  | 'content-while-eating'
  | 'background-noise-alone'
  | 'automatic-app-reopen'
  | 'listening-instead-of-thinking'
  | 'constant-stimulation-preventing-landing';

export interface NumbingRecord {
  id: NumbingPattern;
  observable_action: string;
  what_it_prevents: string;
  daily_dosage: string;
  briefHint: string;
}

export const NUMBING_LIBRARY: Record<NumbingPattern, NumbingRecord> = {
  'scrolling-while-tired': {
    id: 'scrolling-while-tired',
    observable_action: 'lying down, phone above face, autoplaying through feed',
    what_it_prevents: 'the body actually noticing it is tired',
    daily_dosage: 'forty-five minutes most nights, more on bad weeks',
    briefHint: 'subject horizontal, phone glow on face, no engagement, no rest',
  },
  'content-while-eating': {
    id: 'content-while-eating',
    observable_action: 'a video plays while the subject eats, neither watched nor tasted',
    what_it_prevents: 'fifteen minutes of presence with their own meal',
    daily_dosage: 'every meal eaten alone',
    briefHint: 'plate in foreground, laptop or phone in background, eyes on neither',
  },
  'background-noise-alone': {
    id: 'background-noise-alone',
    observable_action: 'TV or podcast playing while doing something else, attention on neither',
    what_it_prevents: 'silence the subject does not yet know how to be inside',
    daily_dosage: 'hours per day',
    briefHint: 'subject doing one thing while a screen plays a different thing — neither watched',
  },
  'automatic-app-reopen': {
    id: 'automatic-app-reopen',
    observable_action: 'instagram closes; thirty seconds later instagram opens; nothing changed',
    what_it_prevents: 'the gap between two thoughts',
    daily_dosage: 'fifty to one hundred times a day',
    briefHint: 'thumb tap pattern visible; the app icon array reflects in the eye',
  },
  'listening-instead-of-thinking': {
    id: 'listening-instead-of-thinking',
    observable_action: 'podcast or audio book on, on, on — every walk, every commute, every dish-wash',
    what_it_prevents: 'thirty minutes alone with their own internal voice',
    daily_dosage: 'most waking hours of solitude',
    briefHint: 'earbuds in the frame, the subject visibly listening — but the body is mid-other-task',
  },
  'constant-stimulation-preventing-landing': {
    id: 'constant-stimulation-preventing-landing',
    observable_action: 'one device on, then another, then back — no gap',
    what_it_prevents: 'any feeling getting time to develop into something nameable',
    daily_dosage: 'continuously, for the duration of waking',
    briefHint: 'two stimuli visible at once (laptop + phone, TV + phone, headphones + screen)',
  },
};

const STATE_TO_NUMBING: Record<string, NumbingPattern[]> = {
  'doomscroll-fatigue':           ['scrolling-while-tired', 'automatic-app-reopen'],
  'exhausted-scrolling':           ['scrolling-while-tired', 'automatic-app-reopen'],
  'constant-notifications':        ['automatic-app-reopen', 'constant-stimulation-preventing-landing'],
  'overconnected-exhaustion':      ['automatic-app-reopen', 'constant-stimulation-preventing-landing'],
  'too-many-tabs':                 ['constant-stimulation-preventing-landing'],
  'attention-fragmentation':       ['automatic-app-reopen', 'constant-stimulation-preventing-landing'],
  'late-afternoon-collapse':       ['background-noise-alone'],
  'emotionally-drained':           ['background-noise-alone'],
  'emotional-static':              ['listening-instead-of-thinking', 'background-noise-alone'],
  'exhausted-commute':             ['listening-instead-of-thinking'],
  'workday-blur':                  ['listening-instead-of-thinking'],
  'social-exhaustion':             ['background-noise-alone'],
  'mentally-absent':               ['listening-instead-of-thinking'],
  'mentally-disconnected':         ['listening-instead-of-thinking'],
  'mentally-checked-out':          ['background-noise-alone'],
  'late-kitchen-silence':          ['scrolling-while-tired'],
};

const CORE_TO_NUMBING: Partial<Record<string, NumbingPattern>> = {
  'doomscrolling':                'scrolling-while-tired',
  'digital-fatigue':              'automatic-app-reopen',
  'too-tired-to-rest':            'scrolling-while-tired',
  'revenge-bedtime-procrastination': 'scrolling-while-tired',
  'overstimulated-but-flat':      'constant-stimulation-preventing-landing',
  'emotional-numbness':           'background-noise-alone',
  'emotional-drift':              'listening-instead-of-thinking',
  'emotional-fragmentation':      'automatic-app-reopen',
  'loneliness-in-public':         'listening-instead-of-thinking',
};

export interface NumbingReading {
  pattern: NumbingRecord | null;
  sedation_score: number;          // 0..10
  is_numbing_active: boolean;
  notes: string[];
}

export interface NumbingInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
}

export function readModernNumbing(input: NumbingInput): NumbingReading {
  const { state, emotionalCore } = input;
  const notes: string[] = [];

  let pattern: NumbingRecord | null = null;
  let sedation = 0;

  const stateCandidates = STATE_TO_NUMBING[state.id] ?? [];
  if (stateCandidates.length > 0) {
    pattern = NUMBING_LIBRARY[stateCandidates[0]];
    sedation = 7;
  }
  if (!pattern && emotionalCore) {
    const id = CORE_TO_NUMBING[emotionalCore.id];
    if (id) {
      pattern = NUMBING_LIBRARY[id];
      sedation = 6;
    }
  }
  if (!pattern) {
    // Family fallback (only the families where sedation is plausible).
    if (state.family === 'overstimulation' || state.family === 'fragmentation') {
      pattern = NUMBING_LIBRARY['constant-stimulation-preventing-landing'];
      sedation = 4;
    } else if (state.family === 'numbness') {
      pattern = NUMBING_LIBRARY['background-noise-alone'];
      sedation = 4;
    }
  }

  const is_numbing_active = pattern !== null && sedation >= 5;

  if (pattern) notes.push(`numbing pattern: ${pattern.id} — preventing "${pattern.what_it_prevents}"`);
  else notes.push('no modern numbing pattern detected');

  return { pattern, sedation_score: Math.min(10, sedation), is_numbing_active, notes };
}
