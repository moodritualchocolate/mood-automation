/**
 * SELF-STORY ARCHITECTURE (Phase 23)
 *
 * Every human runs a STORY of themselves with a small number of
 * load-bearing beams: an origin ("i was the kid who…"), a defining
 * struggle, a current chapter, and a feared ending. The story is
 * mostly stable and mostly invisible to the subject.
 *
 * The engine maps the candidate banner to the BEAM of the self-story
 * it is touching, and scores how much the banner is operating on a
 * structural story-beam vs floating free of any narrative.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type StoryBeamId =
  | 'the-reliable-one'
  | 'the-one-who-made-it-out'
  | 'the-one-who-holds-it-together'
  | 'the-one-who-is-behind'
  | 'the-one-who-will-rest-later'
  | 'the-one-who-does-not-need-much'
  | 'the-one-who-is-good-at-this'
  | 'the-one-who-is-still-becoming';

export interface StoryBeamRecord {
  id: StoryBeamId;
  the_self_sentence: string;
  what_it_costs_to_keep: string;
}

export const STORY_BEAMS: Record<StoryBeamId, StoryBeamRecord> = {
  'the-reliable-one':            { id: 'the-reliable-one',            the_self_sentence: '"i am the one who can be counted on"',          what_it_costs_to_keep: 'the subject cannot drop anything without the story cracking' },
  'the-one-who-made-it-out':     { id: 'the-one-who-made-it-out',     the_self_sentence: '"i got further than where i started"',          what_it_costs_to_keep: 'rest reads as risking the return to where they started' },
  'the-one-who-holds-it-together':{ id: 'the-one-who-holds-it-together',the_self_sentence: '"i am the one who keeps it from falling"',     what_it_costs_to_keep: 'visible struggle is not available — the story forbids it' },
  'the-one-who-is-behind':       { id: 'the-one-who-is-behind',       the_self_sentence: '"i am running to catch up to where i should be"', what_it_costs_to_keep: 'no arrival ever counts; the finish line keeps moving' },
  'the-one-who-will-rest-later': { id: 'the-one-who-will-rest-later', the_self_sentence: '"rest is a thing i have earmarked for after"',    what_it_costs_to_keep: 'the after never arrives; the story keeps deferring' },
  'the-one-who-does-not-need-much':{ id: 'the-one-who-does-not-need-much',the_self_sentence: '"i am low-maintenance, i do not need much"',  what_it_costs_to_keep: 'real needs cannot be voiced — the story has no slot for them' },
  'the-one-who-is-good-at-this': { id: 'the-one-who-is-good-at-this', the_self_sentence: '"i am good at the thing i do"',                  what_it_costs_to_keep: 'any drop in performance threatens the whole identity' },
  'the-one-who-is-still-becoming':{ id: 'the-one-who-is-still-becoming',the_self_sentence: '"the real version of me is still ahead"',      what_it_costs_to_keep: 'the present self never gets to be enough' },
};

const STATE_TO_BEAM: Record<string, StoryBeamId[]> = {
  'silent-burnout':                  ['the-reliable-one', 'the-one-who-holds-it-together'],
  'overwhelmed-founder':             ['the-one-who-holds-it-together', 'the-one-who-made-it-out'],
  'startup-burnout':                 ['the-one-who-made-it-out', 'the-one-who-will-rest-later'],
  'unread-messages-anxiety':         ['the-reliable-one'],
  'sunday-anxiety':                  ['the-one-who-is-behind'],
  'parent-overload':                 ['the-one-who-holds-it-together', 'the-one-who-does-not-need-much'],
  'partner-overload':                ['the-one-who-does-not-need-much'],
  'emotionally-drained':             ['the-one-who-does-not-need-much'],
  'always-on-anxiety':               ['the-one-who-will-rest-later'],
  'workday-blur':                    ['the-one-who-is-good-at-this'],
  'before-meeting-panic':            ['the-one-who-is-good-at-this'],
  'tired-but-continuing':            ['the-one-who-will-rest-later'],
};

const CORE_TO_BEAM: Partial<Record<string, StoryBeamId>> = {
  'silent-burnout':                 'the-reliable-one',
  'invisible-pressure':             'the-one-who-is-behind',
  'performance-pressure':           'the-one-who-is-good-at-this',
  'productivity-identity':          'the-one-who-will-rest-later',
  'always-improving':               'the-one-who-is-still-becoming',
};

export interface SelfStoryArchitectureReading {
  primary: StoryBeamRecord | null;
  /** 0..10 — how strongly the banner operates on a structural beam. */
  story_structural_strength: number;
  notes: string[];
}

export interface SelfStoryArchitectureInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readSelfStoryArchitecture(input: SelfStoryArchitectureInput): SelfStoryArchitectureReading {
  const { state, emotionalCore } = input;
  const notes: string[] = [];
  const candidates: StoryBeamId[] = [];
  for (const id of STATE_TO_BEAM[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_BEAM[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? STORY_BEAMS[candidates[0]] : null;
  const story_structural_strength = primary ? 7 : 0;
  if (primary) notes.push(`self-story beam: ${primary.id} — ${primary.the_self_sentence}`);
  return { primary, story_structural_strength, notes };
}
