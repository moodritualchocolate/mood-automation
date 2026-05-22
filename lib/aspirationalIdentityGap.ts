/**
 * ASPIRATIONAL IDENTITY GAP (Phase 20)
 *
 * Modern humans run a low-grade comparison between the IDENTITY they
 * are LIVING and the identity they imagined they would be living.
 * The gap is the engine of much modern emotional weather.
 *
 * Different from Phase 19 identityMaintenance (the role being
 * PRESERVED). Phase 20 aspirationalIdentityGap is the SHADOW IDENTITY
 * — the version of the self that did not happen, and the body's
 * quiet awareness of it.
 *
 * Scored:
 *   gap_intensity      — how big the gap reads
 *   gap_specificity    — how concretely the shadow identity is named
 *   gap_un-resolution  — whether the truth tries to RESOLVE the gap
 *                        (which would be aspirational marketing) or
 *                        simply OBSERVES it (the spec's ideal)
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type ShadowIdentityId =
  | 'the-version-with-time-for-friends'
  | 'the-version-who-cooks-on-weeknights'
  | 'the-version-who-reads-at-night'
  | 'the-version-who-runs-three-times-a-week'
  | 'the-version-who-finishes-the-project'
  | 'the-version-who-calls-the-parents'
  | 'the-version-who-knows-the-kids-friends-names'
  | 'the-version-who-meditated-this-morning'
  | 'the-version-who-said-no'
  | 'the-version-who-took-the-job-elsewhere';

export interface ShadowIdentityRecord {
  id: ShadowIdentityId;
  the_imagined_version: string;
  why_the_gap_widens: string;
  observable_in_truth: string;
}

export const SHADOW_LIBRARY: Record<ShadowIdentityId, ShadowIdentityRecord> = {
  'the-version-with-time-for-friends': {
    id: 'the-version-with-time-for-friends',
    the_imagined_version: 'a self who replied to the friend group chat within the same week',
    why_the_gap_widens: 'the calendar offers no entry point that does not displace a paid commitment',
    observable_in_truth: 'a message left unread because the reply would take real attention',
  },
  'the-version-who-cooks-on-weeknights': {
    id: 'the-version-who-cooks-on-weeknights',
    the_imagined_version: 'a self who makes the simple meal on Tuesdays instead of ordering it',
    why_the_gap_widens: 'cooking requires margin the workday no longer leaves',
    observable_in_truth: 'a fridge of small starts — half a head of cabbage, a forgotten leek',
  },
  'the-version-who-reads-at-night': {
    id: 'the-version-who-reads-at-night',
    the_imagined_version: 'a self who reads a book for thirty minutes before sleep',
    why_the_gap_widens: 'the phone wins the bedside competition every night',
    observable_in_truth: 'a stack of books that has not moved in seven months',
  },
  'the-version-who-runs-three-times-a-week': {
    id: 'the-version-who-runs-three-times-a-week',
    the_imagined_version: 'a self who does the moderate cardio thing consistently',
    why_the_gap_widens: 'consistency requires baseline energy the body does not have at 19:14',
    observable_in_truth: 'running shoes by the door that were last used twelve days ago',
  },
  'the-version-who-finishes-the-project': {
    id: 'the-version-who-finishes-the-project',
    the_imagined_version: 'a self who finishes the side project that was started in October',
    why_the_gap_widens: 'every weeknight is claimed by something nobody wrote down',
    observable_in_truth: 'an open notebook with a half-completed schematic',
  },
  'the-version-who-calls-the-parents': {
    id: 'the-version-who-calls-the-parents',
    the_imagined_version: 'a self who calls their parents weekly without it becoming a thing',
    why_the_gap_widens: 'the call requires a clean 30 minutes that does not exist',
    observable_in_truth: 'an unreturned voicemail from twelve days ago',
  },
  'the-version-who-knows-the-kids-friends-names': {
    id: 'the-version-who-knows-the-kids-friends-names',
    the_imagined_version: 'a parent who knows which kid is Mira, which is Yael',
    why_the_gap_widens: 'pickup-time conversations end at the gate; the names never land',
    observable_in_truth: 'a small surprise when the kid mentions a name the parent does not have a face for',
  },
  'the-version-who-meditated-this-morning': {
    id: 'the-version-who-meditated-this-morning',
    the_imagined_version: 'a self who did the ten minutes today',
    why_the_gap_widens: 'mornings have been negotiated away to the household',
    observable_in_truth: 'the meditation app shows a five-day gap',
  },
  'the-version-who-said-no': {
    id: 'the-version-who-said-no',
    the_imagined_version: 'a self who declined the last three things they did not have capacity for',
    why_the_gap_widens: 'the no costs more than the yes — relationally, professionally, identity-wise',
    observable_in_truth: 'a calendar with four commitments the subject quietly regrets accepting',
  },
  'the-version-who-took-the-job-elsewhere': {
    id: 'the-version-who-took-the-job-elsewhere',
    the_imagined_version: 'a self who took the offer in 2022 and would have been living somewhere else',
    why_the_gap_widens: 'the path-not-taken keeps writing back through small moments',
    observable_in_truth: 'a city name in the news that produces a half-beat of feeling',
  },
};

const STATE_TO_SHADOW: Record<string, ShadowIdentityId[]> = {
  'silent-burnout':                  ['the-version-who-said-no', 'the-version-who-finishes-the-project'],
  'overwhelmed-founder':             ['the-version-who-took-the-job-elsewhere', 'the-version-who-said-no'],
  'parent-overload':                 ['the-version-who-knows-the-kids-friends-names', 'the-version-with-time-for-friends'],
  'partner-overload':                ['the-version-with-time-for-friends'],
  'workday-blur':                    ['the-version-who-cooks-on-weeknights', 'the-version-who-reads-at-night'],
  'emotionally-drained':             ['the-version-who-calls-the-parents'],
  'sunday-anxiety':                  ['the-version-who-finishes-the-project', 'the-version-who-runs-three-times-a-week'],
  'late-afternoon-collapse':         ['the-version-who-meditated-this-morning'],
  'overconnected-exhaustion':        ['the-version-with-time-for-friends'],
  'always-on-anxiety':               ['the-version-who-said-no'],
};

const RESOLUTION_LANGUAGE = /\b(finally|i will|going to start|next week|new year|tomorrow|monday|never too late|small steps)\b/i;
const ASPIRATIONAL_MARKETING = /\b(become|unlock|transform|elevate|level up|step into|your best|future self)\b/i;

export interface AspirationalIdentityGapReading {
  primary: ShadowIdentityRecord | null;
  /** 0..10 — how strongly the shadow identity is present. */
  gap_intensity: number;
  /** 0..10 — how concretely the shadow identity is named. */
  gap_specificity: number;
  /** True when the truth tries to RESOLVE the gap. */
  attempts_resolution: boolean;
  /** True when the truth uses aspirational-marketing vocabulary. */
  uses_marketing_vocab: boolean;
  notes: string[];
}

export interface AspirationalIdentityGapInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readAspirationalIdentityGap(input: AspirationalIdentityGapInput): AspirationalIdentityGapReading {
  const { state, truth } = input;
  const notes: string[] = [];
  const id = STATE_TO_SHADOW[state.id]?.[0] ?? null;
  const primary = id ? SHADOW_LIBRARY[id] : null;

  const text = truth.truth;
  const attempts_resolution = RESOLUTION_LANGUAGE.test(text);
  const uses_marketing_vocab = ASPIRATIONAL_MARKETING.test(text);

  let gap_intensity = 0;
  if (primary) gap_intensity += 6;
  if (uses_marketing_vocab) gap_intensity -= 3;
  gap_intensity = clamp10(gap_intensity);

  let gap_specificity = primary ? 5 : 0;
  const SPECIFIC_MARKERS = /\b(at \d{2}:\d{2}|tuesday|wednesday|notebook|fridge|shoes|app|gate|stack)\b/i.test(text);
  if (SPECIFIC_MARKERS) gap_specificity += 3;
  gap_specificity = clamp10(gap_specificity);

  if (primary) notes.push(`shadow identity: ${primary.id} — "${primary.the_imagined_version}"`);
  if (attempts_resolution) notes.push('truth attempts to RESOLVE the gap — Phase 20 prefers observation over resolution');
  if (uses_marketing_vocab) notes.push('WARNING: aspirational-marketing vocabulary present');

  return { primary, gap_intensity, gap_specificity, attempts_resolution, uses_marketing_vocab, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
