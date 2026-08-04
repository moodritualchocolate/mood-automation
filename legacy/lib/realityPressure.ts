/**
 * REALITY PRESSURE (Phase 13)
 *
 * The system must understand the SEVEN pressures the spec named:
 *
 *   emotional pressure    — guilt, shame, unmet care
 *   social pressure        — how others see them
 *   economic pressure      — money, bills, scarcity
 *   relational pressure    — partners, children, friends, family
 *   expectation pressure   — what they were supposed to be by now
 *   performance pressure   — to appear okay, productive, in control
 *   time pressure          — deadlines, lateness, hours running out
 *
 * The engine NAMES the pressures present in a candidate banner and
 * scores how SPECIFIC the pressure is — the spec gave clear examples:
 *
 *   weak  → "tired startup founder"
 *   strong → "someone answering Slack at 01:13 because silence feels
 *             dangerous"
 *
 * Specificity = the banner names a number, a time, an action, a
 * named relation. Genericity = a category word ("burnout", "tired",
 * "phone addiction") without a witness-able detail.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type PressureType =
  | 'emotional'
  | 'social'
  | 'economic'
  | 'relational'
  | 'expectation'
  | 'performance'
  | 'time';

export interface PressureSignal {
  type: PressureType;
  marker: string;           // what makes it specific in this banner
  source: 'truth' | 'state' | 'core';
}

export interface RealityPressureReading {
  signals: PressureSignal[];
  /** 0..10 — how SPECIFIC the pressure markers are. */
  pressure_specificity: number;
  /** True when the truth contains at least one witness-able detail
   *  (a number, time, named action, named relation). */
  specific_to_a_moment: boolean;
  /** True when the banner names only the category, not the moment. */
  reads_generic: boolean;
  /** Director-style hint: which marker is missing. */
  what_would_sharpen: string | null;
  notes: string[];
}

// Patterns that indicate a witness-able specific detail.
const TIME_PATTERN = /\b(\d{1,2}:\d{2}|01:\d{2}|02:\d{2}|03:\d{2}|04:\d{2}|22:\d{2}|23:\d{2}|0[0-4]:\d{2})\b/;
const NUMBER_PATTERN = /\b(\d+(\.\d+)?)\s+(minutes?|hours?|messages?|tabs?|notifications?|days?|years?|kids?|cups?|times?|emails?|replies?|metres?|kilometres?|km|m|years|weeks)\b/i;
const ACTION_PATTERN = /\b(answering|opening|closing|checking|refreshing|scrolling|typing|deleting|waiting|sitting|standing|driving|walking|holding|reaching|pulling|pushing|leaving|returning|arriving|reading|writing)\b/i;
const NAMED_RELATION_PATTERN = /\b(slack|whatsapp|inbox|teams|notion|ynet|kid|child|partner|spouse|wife|husband|boss|founder|client|manager|investor|colleague|reservist|miluim)\b/i;

const PRESSURE_KEYWORDS: Record<PressureType, RegExp> = {
  emotional:    /\b(guilt|shame|fear|worry|anxious|tense|tired|exhausted|drained|lonely|hollow)\b/i,
  social:       /\b(seen|invited|expected|excluded|judged|reply|reach out|disappoint|let down|saved|saw)\b/i,
  economic:     /\b(bills?|salary|rent|invoice|paycheck|broke|expensive|cheap|afford|debt|saving|budget)\b/i,
  relational:   /\b(kid|partner|family|friends?|parent|child|wife|husband|colleague|boss|client)\b/i,
  expectation:  /\b(supposed to|was going to|by now|should have|told them|promised|behind|ahead|hit the goal|target|kpis?)\b/i,
  performance:  /\b(productivity|performance|deliver|ship|deck|metrics?|kpis?|results?|present|presentation|pitch|launch)\b/i,
  time:         /\b(deadline|late|in time|hours? left|minutes? left|by tomorrow|by friday|tonight|this week|fri\.?day|past midnight|before \d)\b/i,
};

const STATE_TO_TYPICAL_PRESSURES: Record<HumanState['family'], PressureType[]> = {
  fatigue:         ['performance', 'time', 'expectation'],
  collapse:        ['performance', 'expectation', 'emotional'],
  numbness:        ['relational', 'social', 'emotional'],
  paralysis:       ['expectation', 'time', 'performance'],
  pressure:        ['performance', 'time', 'expectation', 'economic'],
  fragmentation:  ['time', 'performance', 'expectation'],
  overstimulation:['social', 'time', 'performance'],
  avoidance:       ['relational', 'social', 'expectation'],
};

export interface PressureInput {
  truth: HumanTruth;
  state: HumanState;
  emotionalCore: EmotionalCore | null;
}

export function readRealityPressure(input: PressureInput): RealityPressureReading {
  const { truth, state, emotionalCore } = input;
  const text = truth.truth;
  const lowerText = text.toLowerCase();
  const notes: string[] = [];

  // Detect pressure-type signals from truth keywords.
  const signals: PressureSignal[] = [];
  for (const [type, pattern] of Object.entries(PRESSURE_KEYWORDS) as Array<[PressureType, RegExp]>) {
    const match = text.match(pattern);
    if (match) {
      signals.push({ type, marker: match[0], source: 'truth' });
    }
  }
  // State-family inferred pressures — these are present even when the
  // truth does not name them.
  const inferredTypes = STATE_TO_TYPICAL_PRESSURES[state.family] ?? [];
  for (const t of inferredTypes) {
    if (!signals.find((s) => s.type === t)) {
      signals.push({ type: t, marker: `inferred from family "${state.family}"`, source: 'state' });
    }
  }
  // Emotional core overrides — depleted cores carry emotional pressure
  // regardless of truth phrasing.
  if (emotionalCore) {
    const core = emotionalCore.id;
    if ((core === 'guilt' || core === 'shame' || core === 'hidden-anxiety') &&
        !signals.find((s) => s.type === 'emotional')) {
      signals.push({ type: 'emotional', marker: `core "${core}"`, source: 'core' });
    }
    if (core === 'invisible-pressure' && !signals.find((s) => s.type === 'performance')) {
      signals.push({ type: 'performance', marker: `core "${core}"`, source: 'core' });
    }
  }

  // ─── specificity score ────────────────────────────────────────
  let specificity = 0;
  const witnessable: string[] = [];
  if (TIME_PATTERN.test(text))           { specificity += 3; witnessable.push('time'); }
  if (NUMBER_PATTERN.test(text))         { specificity += 2.5; witnessable.push('number'); }
  if (ACTION_PATTERN.test(lowerText))    { specificity += 1.5; witnessable.push('action'); }
  if (NAMED_RELATION_PATTERN.test(text)) { specificity += 2; witnessable.push('named relation'); }
  // State carries a time anchor — counts even if the truth does not name it.
  if (state.timeAnchor) { specificity += 1; witnessable.push('state time anchor'); }
  const pressure_specificity = Math.max(0, Math.min(10, specificity));

  const specific_to_a_moment = witnessable.length >= 2;
  // Generic if truth uses ONLY category words and zero witnessable markers.
  const GENERIC_CATEGORY_WORDS = /\b(burnout|stressed|tired|exhausted|overwhelmed|busy|productive|phone addiction|hustle)\b/i;
  const containsGenericCategory = GENERIC_CATEGORY_WORDS.test(text);
  const reads_generic = containsGenericCategory && witnessable.length === 0;

  let what_would_sharpen: string | null = null;
  if (reads_generic) {
    what_would_sharpen = 'add a witness-able marker: a specific time, a specific action, a specific named relation';
    notes.push('truth reads as category, not moment');
  } else if (witnessable.length === 1) {
    what_would_sharpen = `truth has one specific marker (${witnessable[0]}) — one more (number / action / time) would land it`;
  }

  if (signals.length === 0) notes.push('no pressure signal detected — banner may be too abstract');
  if (signals.length >= 3 && specific_to_a_moment) notes.push('multiple pressures carried with specificity — banner has weight');

  return {
    signals,
    pressure_specificity,
    specific_to_a_moment,
    reads_generic,
    what_would_sharpen,
    notes,
  };
}
