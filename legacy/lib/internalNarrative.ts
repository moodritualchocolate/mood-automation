/**
 * INTERNAL NARRATIVE (Phase 23)
 *
 * Humans narrate themselves to themselves continuously. The internal
 * narrative is not articulate — it is a low-resolution running
 * commentary, mostly in fragments, mostly unfair, mostly repeated.
 *
 * The engine detects the SHAPE of the candidate banner's internal
 * narrative and — critically — refuses banners whose internal
 * narrative is too articulate, too literary, too resolved. A real
 * internal narrative is clumsy, looping, and unfinished.
 *
 * Different from Phase 5 humanTruthEngine (the OBSERVED truth) — the
 * internal narrative is the SUBJECT'S OWN telling, which is far less
 * reliable and far less polished.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type NarrativeShapeId =
  | 'running-self-criticism'
  | 'low-grade-justification'
  | 'comparison-loop'
  | 'should-have-track'
  | 'keeping-score'
  | 'rehearsing-a-future-conversation'
  | 'replaying-a-past-one'
  | 'flat-no-narration';

export interface NarrativeShapeRecord {
  id: NarrativeShapeId;
  the_running_commentary: string;
  texture: string;                  // how it actually sounds inside
}

export const NARRATIVE_SHAPES: Record<NarrativeShapeId, NarrativeShapeRecord> = {
  'running-self-criticism': {
    id: 'running-self-criticism',
    the_running_commentary: 'a low background track noting what the subject did not do well enough',
    texture: 'fragmentary, repetitive, never escalating to a real verdict — just a hum',
  },
  'low-grade-justification': {
    id: 'low-grade-justification',
    the_running_commentary: 'a quiet ongoing defence of choices nobody has challenged',
    texture: 'pre-emptive, addressed to an imagined audience, slightly tired',
  },
  'comparison-loop': {
    id: 'comparison-loop',
    the_running_commentary: 'a measuring of the self against a rotating cast of others',
    texture: 'involuntary, fast, returns even after being dismissed',
  },
  'should-have-track': {
    id: 'should-have-track',
    the_running_commentary: 'a list of the small things the day should have included',
    texture: 'arrives at transitions — getting in the car, lying down — never with a plan attached',
  },
  'keeping-score': {
    id: 'keeping-score',
    the_running_commentary: 'an informal ledger of what the subject gave vs received this week',
    texture: 'the subject would deny doing this; the ledger runs anyway',
  },
  'rehearsing-a-future-conversation': {
    id: 'rehearsing-a-future-conversation',
    the_running_commentary: 'a conversation that has not happened, run several times with variations',
    texture: 'each run slightly different; none of them will be the real one',
  },
  'replaying-a-past-one': {
    id: 'replaying-a-past-one',
    the_running_commentary: 'a conversation that did happen, replayed with edits',
    texture: 'the edits are what the subject wishes they had said; the loop does not resolve',
  },
  'flat-no-narration': {
    id: 'flat-no-narration',
    the_running_commentary: 'the narration has gone quiet — not peace, just offline',
    texture: 'a blank where the commentary usually runs; the subject notices the silence',
  },
};

const STATE_TO_NARRATIVE: Record<string, NarrativeShapeId[]> = {
  'silent-burnout':                  ['running-self-criticism', 'should-have-track'],
  'before-meeting-panic':            ['rehearsing-a-future-conversation'],
  'sunday-anxiety':                  ['should-have-track', 'comparison-loop'],
  'overwhelmed-founder':             ['low-grade-justification', 'keeping-score'],
  'emotionally-drained':             ['replaying-a-past-one', 'keeping-score'],
  'restless-night':                  ['replaying-a-past-one', 'rehearsing-a-future-conversation'],
  'mentally-absent':                 ['flat-no-narration'],
  'zombie-mode':                     ['flat-no-narration'],
  'partner-overload':                ['keeping-score'],
  'overconnected-exhaustion':        ['comparison-loop'],
};

const CORE_TO_NARRATIVE: Partial<Record<string, NarrativeShapeId>> = {
  'silent-burnout':                 'running-self-criticism',
  'invisible-pressure':             'should-have-track',
  'hidden-anxiety':                 'rehearsing-a-future-conversation',
  'emotional-numbness':             'flat-no-narration',
  'guilt':                          'replaying-a-past-one',
};

const TOO_ARTICULATE = /\b(i have come to realise|i understand now|what i have learned|the truth is that i|i finally see)\b/i;
const TOO_LITERARY = /\b(a quiet ache|the weight of|tapestry|the architecture of|a symphony of|the gentle hum of)\b/i;

export interface InternalNarrativeReading {
  primary: NarrativeShapeRecord | null;
  /** 0..10 — how authentically clumsy / looping the narrative reads. */
  narrative_authenticity: number;
  /** True when the narration is too articulate (resolved insight). */
  too_articulate: boolean;
  /** True when the narration uses literary vocabulary. */
  too_literary: boolean;
  notes: string[];
}

export interface InternalNarrativeInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readInternalNarrative(input: InternalNarrativeInput): InternalNarrativeReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  const candidates: NarrativeShapeId[] = [];
  for (const id of STATE_TO_NARRATIVE[state.id] ?? []) candidates.push(id);
  if (emotionalCore) {
    const fromCore = CORE_TO_NARRATIVE[emotionalCore.id];
    if (fromCore && !candidates.includes(fromCore)) candidates.push(fromCore);
  }
  const primary = candidates[0] ? NARRATIVE_SHAPES[candidates[0]] : null;

  const text = truth.truth;
  const too_articulate = TOO_ARTICULATE.test(text);
  const too_literary = TOO_LITERARY.test(text);

  let narrative_authenticity = primary ? 7 : 0;
  if (too_articulate) narrative_authenticity -= 4;
  if (too_literary) narrative_authenticity -= 3;
  narrative_authenticity = Math.max(0, Math.min(10, narrative_authenticity));

  if (primary) notes.push(`internal narrative: ${primary.id} — texture "${primary.texture}"`);
  if (too_articulate) notes.push('WARNING: internal narrative is too articulate — real narration does not resolve into insight');
  if (too_literary) notes.push('WARNING: internal narrative uses literary vocabulary — real narration is clumsy, not written');
  return { primary, narrative_authenticity, too_articulate, too_literary, notes };
}
