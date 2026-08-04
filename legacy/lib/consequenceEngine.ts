/**
 * CONSEQUENCE ENGINE (Phase 13)
 *
 * Every banner must answer: "What happens if nothing changes?"
 *
 * The system has been very good at NAMING emotions. Phase 13 makes it
 * name STAKES — the unspoken consequence the subject is paying right
 * now, and what gets worse if the pattern continues.
 *
 * Output:
 *   - stakes_phrase            — one sentence answering the question
 *   - what_continues           — what is happening NOW that will
 *                                keep happening
 *   - what_gets_worse          — what compounds
 *   - stakes_clarity           — 0..10 — high when stakes are real,
 *                                low when the banner is decorative
 *
 * Used by the meta-critic: a banner without clear stakes is the
 * spec's "beautiful observation that does not move anyone."
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalPattern } from './sharedCulturalMemory';
import type { RealityPressureReading } from './realityPressure';

export interface ConsequenceReading {
  stakes_phrase: string;
  what_continues: string;
  what_gets_worse: string;
  stakes_clarity: number;
  /** True when stakes are real and specific. */
  has_stakes: boolean;
  /** True when the banner is decoratively emotional with no real
   *  consequence. */
  decorative_emotion: boolean;
  notes: string[];
}

// Per-emotional-core stake templates. Each template answers
// "what happens if nothing changes" in plain director language.
const CORE_STAKES: Partial<Record<string, { continues: string; worse: string }>> = {
  'depletion':                   { continues: 'the body keeps doing the day',                 worse: 'the year gets longer; the body forgets how to rest' },
  'silent-burnout':              { continues: 'the work keeps going',                          worse: 'the work continues; the worker quietly disappears inside it' },
  'too-tired-to-rest':           { continues: 'the phone stays on past midnight',              worse: 'tomorrow starts before the body slept' },
  'doomscrolling':               { continues: 'the feed keeps refreshing',                     worse: 'the feeling that something is wrong becomes the only feeling there is' },
  'overconnected-exhaustion':    { continues: 'the slack notifications keep arriving',         worse: 'the day belongs to forty-three people; the person belongs to nobody' },
  'social-performance-exhaustion':{ continues: 'they keep saying yes',                          worse: 'every yes adds another debt; the smile gets harder to find' },
  'loneliness-in-public':        { continues: 'they keep showing up',                          worse: 'showing up becomes the performance; being known becomes impossible' },
  'guilt':                       { continues: 'the unread message stays unread',               worse: 'the obligation becomes its own punishment' },
  'shame':                       { continues: 'they keep hiding the version of themselves',    worse: 'the gap between the public face and the private face widens until something cracks' },
  'avoidance':                   { continues: 'the task waits',                                worse: 'the cost of starting compounds; the task becomes the room they cannot enter' },
  'emotional-numbness':          { continues: 'they keep going to the events',                 worse: 'feeling becomes a memory of what feeling used to be' },
  'emotional-drift':             { continues: 'the days keep blurring',                        worse: 'the week ends; nothing landed' },
  'functional-collapse':         { continues: 'the work gets done',                            worse: 'the worker stops being inside the work' },
  'invisible-pressure':          { continues: 'they keep carrying it',                         worse: 'the load becomes invisible to them too — they will not remember it was heavy' },
  'hidden-anxiety':              { continues: 'they keep smiling at the meeting',              worse: 'the meeting becomes the costume they cannot remove' },
  'decision-fatigue':            { continues: 'they keep deferring',                           worse: 'small decisions become impossible; the day becomes a queue' },
  'inability-to-land':           { continues: 'they keep half-arriving',                       worse: 'the moments that were supposed to be the destination are now the waiting room' },
  'overstimulation':             { continues: 'every screen stays on',                         worse: 'their own thoughts become foreign — too quiet to recognise' },
  'overstimulated-but-flat':     { continues: 'the noise stays at full volume',                worse: 'emotion becomes a sound they can no longer hear' },
  'revenge-bedtime-procrastination': { continues: 'they keep claiming the hour after midnight', worse: 'the hour becomes the only thing they own; the day belongs to someone else' },
  'digital-fatigue':             { continues: 'the phone stays in hand',                       worse: 'their attention stops being theirs; it becomes a thing rented out' },
  'emotional-fragmentation':     { continues: 'three thoughts stay open',                      worse: 'none of them finish; the day is a series of openings' },
};

export interface ConsequenceInput {
  truth: HumanTruth;
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  pattern: CulturalPattern | null;
  pressure: RealityPressureReading;
}

export function readConsequence(input: ConsequenceInput): ConsequenceReading {
  const { truth, state, emotionalCore, pattern, pressure } = input;
  const notes: string[] = [];

  // Pull the stake from the core if mapped; else from the family.
  const coreId = emotionalCore?.id;
  let template = coreId ? CORE_STAKES[coreId] : undefined;
  if (!template) {
    // Family fallback.
    switch (state.family) {
      case 'fatigue':       template = CORE_STAKES['depletion']; break;
      case 'collapse':      template = CORE_STAKES['depletion']; break;
      case 'numbness':      template = CORE_STAKES['emotional-numbness']; break;
      case 'paralysis':     template = CORE_STAKES['decision-fatigue']; break;
      case 'pressure':      template = CORE_STAKES['invisible-pressure']; break;
      case 'fragmentation': template = CORE_STAKES['emotional-fragmentation']; break;
      case 'overstimulation': template = CORE_STAKES['overstimulation']; break;
      case 'avoidance':     template = CORE_STAKES['avoidance']; break;
    }
  }
  if (!template) {
    template = { continues: 'the day keeps happening', worse: 'the days repeat without the person knowing they passed' };
  }

  // Build the stakes phrase. When the pressure reading found witness-
  // able markers, the phrase is sharper.
  const what_continues = template.continues;
  const what_gets_worse = template.worse;
  const stakes_phrase = `If nothing changes: ${what_continues}. ${what_gets_worse}.`;

  // ─── stakes clarity ───────────────────────────────────────────
  let clarity = 4;
  // Truth length: short, specific truths carry stakes more clearly.
  if (truth.truth.length > 0 && truth.truth.length < 90) clarity += 1.5;
  // Pressure specificity contributes — when the banner names a time
  // or action, the stakes feel real.
  clarity += pressure.pressure_specificity * 0.3;
  // Tension phrase present.
  if (truth.tension && truth.tension.length > 0 && truth.tension.length < 40) clarity += 1.5;
  // Cultural pattern present — the stakes are bigger when collective.
  if (pattern) clarity += 1;
  // Generic reading drops clarity.
  if (pressure.reads_generic) clarity -= 3;
  clarity = Math.max(0, Math.min(10, clarity));

  const has_stakes = clarity >= 6;
  const decorative_emotion = clarity < 4;

  if (decorative_emotion) notes.push('banner is decoratively emotional — no real stake');
  if (has_stakes) notes.push('stakes are present and specific enough to land');

  return {
    stakes_phrase,
    what_continues,
    what_gets_worse,
    stakes_clarity: clarity,
    has_stakes,
    decorative_emotion,
    notes,
  };
}
