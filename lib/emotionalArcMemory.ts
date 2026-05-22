/**
 * EMOTIONAL ARC MEMORY (Phase 31 — Emotional Continuity Runtime / Wave 2)
 *
 * Tracks the campaign's emotional ARC across banners — where the
 * campaign has been, and where the arc is in its progression.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export type EmotionalArc =
  | 'opening' | 'deepening' | 'escalating' | 'quieting'
  | 'aftermath' | 'stalled' | 'unformed';

export interface EmotionalArcMemoryReading {
  active_arc: EmotionalArc;
  /** 0..10 — how far the arc has progressed. */
  arc_progression: number;
  /** True when the arc has stalled (no movement across recent banners). */
  arc_stalled: boolean;
  /** The family sequence of the recent campaign. */
  recent_sequence: string[];
  notes: string[];
}

export interface EmotionalArcMemoryInput {
  trail: EmotionalTraceEntry[];
}

const SEVERITY: Record<string, number> = {
  overstimulation: 2, fragmentation: 3, pressure: 4, avoidance: 5,
  fatigue: 6, paralysis: 7, numbness: 8, collapse: 9,
};

export function readEmotionalArcMemory(input: EmotionalArcMemoryInput): EmotionalArcMemoryReading {
  const { trail } = input;
  const notes: string[] = [];

  const window = trail.slice(0, 8);
  const recent_sequence = window.map((t) => t.family).reverse();

  if (window.length < 3) {
    return {
      active_arc: window.length === 0 ? 'unformed' : 'opening',
      arc_progression: window.length * 2,
      arc_stalled: false,
      recent_sequence,
      notes: ['emotional arc: the campaign arc is still opening'],
    };
  }

  // Trend the severity across the recent window (oldest → newest).
  const sev = recent_sequence.map((f) => SEVERITY[f] ?? 5);
  const firstHalf = sev.slice(0, Math.floor(sev.length / 2));
  const secondHalf = sev.slice(Math.floor(sev.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / Math.max(1, firstHalf.length);
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / Math.max(1, secondHalf.length);
  const delta = secondAvg - firstAvg;

  const distinct = new Set(recent_sequence).size;
  const arc_stalled = distinct <= 1 && window.length >= 4;

  let active_arc: EmotionalArc;
  if (arc_stalled) active_arc = 'stalled';
  else if (delta >= 1.5) active_arc = 'escalating';
  else if (delta <= -1.5) active_arc = 'quieting';
  else if (distinct >= 4) active_arc = 'deepening';
  else active_arc = 'aftermath';

  const arc_progression = Math.min(10, round1(3 + window.length * 0.7 + distinct * 0.5));

  notes.push(`emotional arc: ${active_arc} (progression ${arc_progression}/10) — ${recent_sequence.join(' → ')}`);
  if (arc_stalled) notes.push('emotional arc: the arc has STALLED — the campaign is not moving');

  return { active_arc, arc_progression, arc_stalled, recent_sequence, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
