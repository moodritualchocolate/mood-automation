/**
 * VALIDATION SYSTEMS (Phase 20)
 *
 * Modern humans are wired into multiple parallel validation systems
 * that produce small, scheduled, measurable doses of "you are okay
 * right now": work feedback, family acknowledgement, social media
 * engagement, partner reciprocity, parenting outcomes.
 *
 * The engine maps the candidate banner to its operating validation
 * system(s) and scores:
 *   dependency_intensity   — how much the body needs the dose to feel okay
 *   measurement_anxiety    — how much the body tracks the dose
 *   silence_intolerance    — how much the absence of the dose destabilises
 *
 * The point is NOT to describe likes/followers. The point is to model
 * the QUIET DEPENDENCY humans have on validation arrival timing.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type ValidationSystemId =
  | 'work-feedback-loop'
  | 'family-acknowledgement-loop'
  | 'social-media-engagement-loop'
  | 'partner-reciprocity-loop'
  | 'parenting-outcome-loop'
  | 'peer-comparison-loop'
  | 'expert-credentialing-loop'
  | 'fitness-metric-loop';

export interface ValidationSystemRecord {
  id: ValidationSystemId;
  the_dose: string;
  arrival_signal: string;
  absence_signal: string;
}

export const VALIDATION_SYSTEMS: Record<ValidationSystemId, ValidationSystemRecord> = {
  'work-feedback-loop': {
    id: 'work-feedback-loop',
    the_dose: 'a "great work" / a thank-you / a manager nod / a thumbs-up emoji',
    arrival_signal: 'a small breath out at 16:42 after the message lands',
    absence_signal: 'a Friday afternoon refreshing slack to see if the deck was acknowledged',
  },
  'family-acknowledgement-loop': {
    id: 'family-acknowledgement-loop',
    the_dose: 'a "thank you for making this" / "the room looks nice" / "you remembered"',
    arrival_signal: 'the body softens at the moment the small acknowledgement lands',
    absence_signal: 'a flat dinner where the work nobody named goes unnamed',
  },
  'social-media-engagement-loop': {
    id: 'social-media-engagement-loop',
    the_dose: 'the notification dot — likes/replies/saves arriving on a post',
    arrival_signal: 'small dopamine on the lock screen for the third hour',
    absence_signal: 'a silent post the body keeps checking on',
  },
  'partner-reciprocity-loop': {
    id: 'partner-reciprocity-loop',
    the_dose: 'a "how was your day" arriving before the subject asks it',
    arrival_signal: 'the body settles when the partner asks first',
    absence_signal: 'a quiet evening where the subject keeps almost saying it',
  },
  'parenting-outcome-loop': {
    id: 'parenting-outcome-loop',
    the_dose: 'a teacher\'s note / a kid making a friend / a small developmental milestone',
    arrival_signal: 'the parent posts the photo, the parent stops asking the question that has been running for weeks',
    absence_signal: 'a teacher conference that ends without the affirmation the parent was bracing for',
  },
  'peer-comparison-loop': {
    id: 'peer-comparison-loop',
    the_dose: 'a public competitor\'s setback / a peer\'s setback / a quiet "you\'re ahead" signal',
    arrival_signal: 'a relief the body would not say out loud',
    absence_signal: 'a LinkedIn announcement from a peer at 11:14',
  },
  'expert-credentialing-loop': {
    id: 'expert-credentialing-loop',
    the_dose: 'a "your take on this" / a citation / a "i learned that from you"',
    arrival_signal: 'a small straightening in the chair',
    absence_signal: 'an unattributed reuse of the subject\'s work',
  },
  'fitness-metric-loop': {
    id: 'fitness-metric-loop',
    the_dose: 'a wearable score that beats yesterday',
    arrival_signal: 'the body wakes ready to take the metric',
    absence_signal: 'a recovery score of 58 — the rest of the morning is shaped by the number',
  },
};

const STATE_TO_VALIDATION: Record<string, ValidationSystemId[]> = {
  'unread-messages-anxiety':         ['work-feedback-loop'],
  'overwhelmed-founder':             ['peer-comparison-loop', 'expert-credentialing-loop'],
  'startup-burnout':                 ['work-feedback-loop', 'peer-comparison-loop'],
  'overconnected-exhaustion':        ['social-media-engagement-loop'],
  'always-on-anxiety':               ['work-feedback-loop', 'social-media-engagement-loop'],
  'parent-overload':                 ['parenting-outcome-loop'],
  'partner-overload':                ['partner-reciprocity-loop'],
  'sunday-anxiety':                  ['fitness-metric-loop', 'work-feedback-loop'],
  'mentally-absent':                 ['partner-reciprocity-loop'],
  'workday-blur':                    ['work-feedback-loop'],
};

const PERFORMATIVE_LANGUAGE = /\b(likes?|followers?|engagement|impressions?|clout|optics)\b/i;

export interface ValidationSystemsReading {
  primary: ValidationSystemRecord | null;
  /** 0..10 — how dependent on the dose. */
  dependency_intensity: number;
  /** 0..10 — how much the body tracks the dose. */
  measurement_anxiety: number;
  /** 0..10 — how destabilising silence is. */
  silence_intolerance: number;
  /** True when the truth uses performative-platform vocabulary (likes, followers). */
  uses_performative_vocabulary: boolean;
  notes: string[];
}

export interface ValidationSystemsInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readValidationSystems(input: ValidationSystemsInput): ValidationSystemsReading {
  const { state, truth } = input;
  const notes: string[] = [];

  const id = STATE_TO_VALIDATION[state.id]?.[0] ?? null;
  const primary = id ? VALIDATION_SYSTEMS[id] : null;

  const uses_performative_vocabulary = PERFORMATIVE_LANGUAGE.test(truth.truth);

  let dependency_intensity = primary ? 7 : 0;
  if (uses_performative_vocabulary) dependency_intensity -= 2;
  dependency_intensity = clamp10(dependency_intensity);

  const measurement_anxiety = /\b(check(ed|ing)?|refresh(ed|ing)?|wait(ed|ing)?|haven[' ]?t heard)\b/i.test(truth.truth) ? 7 : (primary ? 4 : 0);

  const silence_intolerance = primary ? 7 : 0;

  if (primary) notes.push(`validation system: ${primary.id} — dose "${primary.the_dose}"`);
  if (uses_performative_vocabulary) notes.push('WARNING: truth uses platform-engagement vocabulary');

  return { primary, dependency_intensity, measurement_anxiety, silence_intolerance, uses_performative_vocabulary, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
