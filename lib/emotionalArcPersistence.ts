/**
 * EMOTIONAL ARC PERSISTENCE (Phase 40 — Strategic Campaign Lifecycles / Wave 4)
 *
 * Measures whether the campaign's emotional ARC persists coherently
 * across banners — or whether it fractures into unrelated moments.
 * A living campaign carries one continuous emotional age.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface EmotionalArcPersistenceReading {
  /** 0..10 — how coherently the emotional arc persists. */
  arc_persistence: number;
  /** The campaign's emotional age — banners since it opened. */
  emotional_age: number;
  /** 0..10 — how much the founding truth has decayed. */
  truth_decay: number;
  /** True when the arc still holds as one continuous story. */
  arc_holds: boolean;
  notes: string[];
}

export interface EmotionalArcPersistenceInput {
  trail: EmotionalTraceEntry[];
}

export function readEmotionalArcPersistence(input: EmotionalArcPersistenceInput): EmotionalArcPersistenceReading {
  const { trail } = input;
  const notes: string[] = [];

  const emotional_age = trail.length;
  if (emotional_age < 3) {
    return {
      arc_persistence: 7, emotional_age, truth_decay: 0, arc_holds: true,
      notes: ['emotional arc persistence: campaign too young — arc assumed coherent'],
    };
  }

  const window = trail.slice(0, 12);

  // Persistence — adjacent banners should be emotionally related
  // (same or neighbouring family), not jumping across the map.
  let coherentSteps = 0;
  for (let i = 1; i < window.length; i++) {
    if (window[i].family === window[i - 1].family) coherentSteps += 1;
    else coherentSteps += 0.5;   // a change is fine; a same-family hold is most coherent
  }
  const arc_persistence = round1(Math.min(10, (coherentSteps / (window.length - 1)) * 12));

  // Truth decay — the oldest truth's words still echoing means the
  // founding truth persists; total absence means it has decayed.
  const oldest = trail[trail.length - 1];
  const oldestWords = new Set(oldest.truth.toLowerCase().split(/\s+/).filter((w) => w.length >= 6));
  let echoes = 0;
  for (const t of window) {
    const words = t.truth.toLowerCase().split(/\s+/);
    if (words.some((w) => oldestWords.has(w))) echoes += 1;
  }
  const truth_decay = round1(Math.max(0, Math.min(10, 10 - (echoes / window.length) * 12)));

  const arc_holds = arc_persistence >= 5 && truth_decay < 7;

  notes.push(`emotional arc persistence: ${arc_persistence}/10 · emotional age ${emotional_age} · truth decay ${truth_decay}/10`);
  if (!arc_holds) notes.push('emotional arc persistence: the arc is fracturing — the campaign no longer reads as one continuous story');

  return { arc_persistence, emotional_age, truth_decay, arc_holds, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
