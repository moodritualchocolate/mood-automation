/**
 * COGNITIVE RESIDUE (Phase 17)
 *
 * Every modern system leaves residue. Modern people accumulate
 * INVISIBLE MENTAL LOAD throughout the day. The spec named:
 *
 *   unfinished tabs
 *   emotional carryover
 *   interrupted thoughts
 *   persistent low-grade urgency
 *   inability to mentally clear state
 *
 * The engine measures how much residue the candidate banner is
 * SHOWING — not in words, but in scene logic. A banner that captures
 * cognitive residue scores high; one that depicts a clear head
 * scores low (which is appropriate — modern life rarely produces a
 * clear head).
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { WorldContinuityPlan } from './worldContinuity';

export type ResidueKind =
  | 'unfinished-tabs'
  | 'emotional-carryover'
  | 'interrupted-thoughts'
  | 'low-grade-urgency'
  | 'inability-to-clear-state';

export interface ResidueRecord {
  id: ResidueKind;
  observable_marker: string;
  what_it_implies: string;
}

export const RESIDUE_LIBRARY: Record<ResidueKind, ResidueRecord> = {
  'unfinished-tabs': {
    id: 'unfinished-tabs',
    observable_marker: 'multiple browser tabs visible across one or more monitors',
    what_it_implies: 'multiple thoughts started, none closed',
  },
  'emotional-carryover': {
    id: 'emotional-carryover',
    observable_marker: 'subject in a different room from where the emotion started; body still carrying it',
    what_it_implies: 'a feeling from earlier still in the body, two activities later',
  },
  'interrupted-thoughts': {
    id: 'interrupted-thoughts',
    observable_marker: 'half-written sentence on screen, mid-action posture, the camera caught the pause',
    what_it_implies: 'a thought started; an interruption arrived; the thought never returned',
  },
  'low-grade-urgency': {
    id: 'low-grade-urgency',
    observable_marker: 'jaw tension + phone face-up + shoulders slightly raised',
    what_it_implies: 'the day asking something the body has not yet decided how to answer',
  },
  'inability-to-clear-state': {
    id: 'inability-to-clear-state',
    observable_marker: 'subject in a transitional space (doorway, car, elevator) frozen mid-arrival',
    what_it_implies: 'the previous activity has not finished neurologically; the next cannot begin',
  },
};

const STATE_TO_RESIDUE: Record<string, ResidueKind[]> = {
  'too-many-tabs':                  ['unfinished-tabs', 'interrupted-thoughts'],
  'tab-switching-paralysis':         ['unfinished-tabs', 'inability-to-clear-state'],
  'attention-fragmentation':         ['interrupted-thoughts', 'unfinished-tabs'],
  'fake-productivity':               ['unfinished-tabs', 'low-grade-urgency'],
  'restless-work-energy':            ['low-grade-urgency'],
  'workday-blur':                    ['inability-to-clear-state', 'emotional-carryover'],
  'exhausted-commute':               ['inability-to-clear-state', 'emotional-carryover'],
  'late-afternoon-collapse':         ['low-grade-urgency', 'emotional-carryover'],
  'emotionally-drained':             ['emotional-carryover', 'inability-to-clear-state'],
  'exhausted-but-wired':             ['low-grade-urgency', 'inability-to-clear-state'],
  'modern-brain-overload':           ['interrupted-thoughts', 'low-grade-urgency'],
  'before-meeting-panic':            ['low-grade-urgency'],
  'sunday-anxiety':                  ['low-grade-urgency', 'emotional-carryover'],
};

const CORE_TO_RESIDUE: Partial<Record<string, ResidueKind>> = {
  'emotional-fragmentation':    'interrupted-thoughts',
  'overstimulation':            'low-grade-urgency',
  'inability-to-land':          'inability-to-clear-state',
  'hidden-anxiety':             'low-grade-urgency',
  'invisible-pressure':         'low-grade-urgency',
  'silent-burnout':             'emotional-carryover',
  'doomscrolling':              'interrupted-thoughts',
  'digital-fatigue':            'unfinished-tabs',
  'decision-fatigue':           'inability-to-clear-state',
};

export interface CognitiveResidueReading {
  detected: ResidueRecord[];
  /** 0..10 — how much cognitive residue the banner carries. */
  residue_load: number;
  /** True when the residue is the central mechanic of the banner. */
  centrally_residued: boolean;
  /** Brief-line addition naming the residue markers to make visible. */
  briefAddition: string | null;
  notes: string[];
}

export interface CognitiveResidueInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  worldContinuity: WorldContinuityPlan | null;
}

export function readCognitiveResidue(input: CognitiveResidueInput): CognitiveResidueReading {
  const { state, truth, emotionalCore, worldContinuity } = input;
  const detected = new Set<ResidueKind>();
  const notes: string[] = [];

  for (const r of STATE_TO_RESIDUE[state.id] ?? []) detected.add(r);
  if (emotionalCore) {
    const fromCore = CORE_TO_RESIDUE[emotionalCore.id];
    if (fromCore) detected.add(fromCore);
  }

  // World continuity artifacts contribute when they imply residue.
  if (worldContinuity) {
    for (const a of worldContinuity.artifacts) {
      if (a.id === 'tabs-open' || a.id === 'open-notebook') detected.add('unfinished-tabs');
      if (a.id === 'unread-message' || a.id === 'phone-charger-trailing') detected.add('low-grade-urgency');
      if (a.id === 'jacket-on-chair' || a.id === 'shoes-half-off') detected.add('inability-to-clear-state');
      if (a.id === 'half-eaten-snack' || a.id === 'used-coffee-filter') detected.add('emotional-carryover');
    }
  }

  // Truth-text overrides.
  const text = truth.truth.toLowerCase();
  if (/\b(tab|tabs)\b/.test(text)) detected.add('unfinished-tabs');
  if (/\b(unfinished|half-finished|half-thought|half-typed|started.*not.*finish)\b/.test(text)) detected.add('interrupted-thoughts');
  if (/\b(still|kept|keeps|carry|carried|carrying)\b/.test(text)) detected.add('emotional-carryover');
  if (/\b(land|landed|arrive|arrived|home but|engine off but)\b/.test(text)) detected.add('inability-to-clear-state');

  const records = Array.from(detected).map((id) => RESIDUE_LIBRARY[id]);
  const residue_load = Math.min(10, records.length * 2.4);
  const centrally_residued = residue_load >= 6;

  const briefAddition = records.length > 0
    ? `Make cognitive residue visible: ${records.slice(0, 2).map((r) => r.observable_marker).join('; ')}.`
    : null;

  if (records.length === 0) notes.push('no cognitive residue detected — the banner is about a clear-head moment, which is rare in modern life');
  else notes.push(`residue kinds: ${records.map((r) => r.id).join(', ')}`);

  return { detected: records, residue_load, centrally_residued, briefAddition, notes };
}
