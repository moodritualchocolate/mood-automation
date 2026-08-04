/**
 * EMOTIONAL SELF-TRANSLATION (Phase 23)
 *
 * The gap between what a human FEELS and what they can SAY about it,
 * even to themselves. Modern humans routinely mistranslate their own
 * states — calling exhaustion "laziness", calling grief "a weird
 * mood", calling overwhelm "being bad at time management".
 *
 * The engine detects the mistranslation the candidate banner is
 * operating inside, and scores how well the banner catches the
 * GAP between the real feeling and the subject's name for it.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type MistranslationId =
  | 'exhaustion-called-laziness'
  | 'grief-called-a-weird-mood'
  | 'overwhelm-called-bad-time-management'
  | 'loneliness-called-being-tired'
  | 'burnout-called-needing-more-discipline'
  | 'anxiety-called-being-busy'
  | 'sadness-called-being-fine'
  | 'need-for-rest-called-being-unmotivated';

export interface MistranslationRecord {
  id: MistranslationId;
  the_real_feeling: string;
  the_subject_calls_it: string;
  why_the_mistranslation: string;
}

export const MISTRANSLATIONS: Record<MistranslationId, MistranslationRecord> = {
  'exhaustion-called-laziness': {
    id: 'exhaustion-called-laziness',
    the_real_feeling: 'a body genuinely out of resources',
    the_subject_calls_it: '"i\'m being lazy"',
    why_the_mistranslation: 'laziness is a moral failing the subject can act on; exhaustion is a structural fact they cannot',
  },
  'grief-called-a-weird-mood': {
    id: 'grief-called-a-weird-mood',
    the_real_feeling: 'a real loss the body is processing',
    the_subject_calls_it: '"i\'m in a weird mood today"',
    why_the_mistranslation: 'a weird mood passes; grief asks to be sat with, and there is no time',
  },
  'overwhelm-called-bad-time-management': {
    id: 'overwhelm-called-bad-time-management',
    the_real_feeling: 'a load genuinely larger than the hours available',
    the_subject_calls_it: '"i just need a better system"',
    why_the_mistranslation: 'a system is a solvable problem; an over-large load is an unsolvable one',
  },
  'loneliness-called-being-tired': {
    id: 'loneliness-called-being-tired',
    the_real_feeling: 'a real absence of being known',
    the_subject_calls_it: '"i\'m just tired"',
    why_the_mistranslation: 'tiredness has a remedy the subject can imagine; loneliness does not feel like it does',
  },
  'burnout-called-needing-more-discipline': {
    id: 'burnout-called-needing-more-discipline',
    the_real_feeling: 'a depleted system that needs to stop',
    the_subject_calls_it: '"i need to push harder / be more disciplined"',
    why_the_mistranslation: 'more discipline keeps the self-story intact; burnout breaks it',
  },
  'anxiety-called-being-busy': {
    id: 'anxiety-called-being-busy',
    the_real_feeling: 'an unresolved anxiety running under everything',
    the_subject_calls_it: '"i\'ve just got a lot on"',
    why_the_mistranslation: 'busy is socially admirable; anxiety asks for a different kind of attention',
  },
  'sadness-called-being-fine': {
    id: 'sadness-called-being-fine',
    the_real_feeling: 'a low real sadness with a specific cause',
    the_subject_calls_it: '"i\'m fine, honestly"',
    why_the_mistranslation: '"fine" closes the conversation; sadness would open one the subject cannot afford',
  },
  'need-for-rest-called-being-unmotivated': {
    id: 'need-for-rest-called-being-unmotivated',
    the_real_feeling: 'a body asking, correctly, to stop',
    the_subject_calls_it: '"i\'ve lost my motivation"',
    why_the_mistranslation: 'lost motivation is a personal flaw to fix; a correct need to stop is an instruction to obey',
  },
};

const STATE_TO_MISTRANSLATION: Record<string, MistranslationId[]> = {
  'silent-burnout':                  ['burnout-called-needing-more-discipline', 'exhaustion-called-laziness'],
  'no-motivation-morning':           ['need-for-rest-called-being-unmotivated', 'exhaustion-called-laziness'],
  'sunday-anxiety':                  ['anxiety-called-being-busy'],
  'mentally-absent':                 ['sadness-called-being-fine'],
  'overconnected-exhaustion':        ['loneliness-called-being-tired'],
  'low-battery-feeling':             ['need-for-rest-called-being-unmotivated'],
  'overwhelmed-founder':             ['overwhelm-called-bad-time-management'],
  'emotionally-drained':             ['grief-called-a-weird-mood', 'sadness-called-being-fine'],
  'late-afternoon-collapse':         ['exhaustion-called-laziness'],
  'always-on-anxiety':               ['anxiety-called-being-busy'],
};

const CORE_TO_MISTRANSLATION: Partial<Record<string, MistranslationId>> = {
  'silent-burnout':                 'burnout-called-needing-more-discipline',
  'emotional-numbness':             'sadness-called-being-fine',
  'hidden-anxiety':                 'anxiety-called-being-busy',
  'too-tired-to-rest':              'need-for-rest-called-being-unmotivated',
};

export interface EmotionalSelfTranslationReading {
  primary: MistranslationRecord | null;
  /** 0..10 — strength of the mistranslation present. */
  mistranslation_intensity: number;
  /** 0..10 — does the banner catch the GAP between feeling and name? */
  gap_visible: number;
  notes: string[];
}

export interface EmotionalSelfTranslationInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readEmotionalSelfTranslation(input: EmotionalSelfTranslationInput): EmotionalSelfTranslationReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];
  const candidates: MistranslationId[] = [];
  for (const id of STATE_TO_MISTRANSLATION[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_MISTRANSLATION[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? MISTRANSLATIONS[candidates[0]] : null;

  const mistranslation_intensity = primary ? 7 : 0;
  // gap visible when the truth holds the subject's WORD and the body's FACT.
  const holdsBothLayers = /\b(call(s|ed)? it|tell(s|ing)? (myself|themselves|himself|herself)|says? (i'?m|they'?re)|"i'?m fine"|"i'?m good"|just |only )\b/i.test(truth.truth);
  const gap_visible = primary ? (holdsBothLayers ? 8 : 4) : 0;

  if (primary) notes.push(`emotional self-translation: ${primary.id} — feels "${primary.the_real_feeling}", calls it ${primary.the_subject_calls_it}`);
  if (gap_visible >= 7) notes.push('banner catches the GAP between the feeling and the subject\'s name for it');
  return { primary, mistranslation_intensity, gap_visible, notes };
}
