/**
 * NARRATIVE MOMENTUM (Phase 40 — Strategic Campaign Lifecycles / Wave 4)
 *
 * Measures whether the campaign's narrative is MOVING — gaining
 * momentum, holding, or stalled. A campaign with momentum pulls the
 * next banner forward; a stalled one repeats.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface NarrativeMomentumReading {
  /** 0..10 — how much narrative momentum the campaign has. */
  momentum: number;
  /** True when the narrative is genuinely advancing. */
  is_advancing: boolean;
  /** True when the narrative has stalled. */
  is_stalled: boolean;
  notes: string[];
}

export interface NarrativeMomentumInput {
  trail: EmotionalTraceEntry[];
}

export function readNarrativeMomentum(input: NarrativeMomentumInput): NarrativeMomentumReading {
  const { trail } = input;
  const notes: string[] = [];

  const window = trail.slice(0, 8);
  if (window.length < 3) {
    return {
      momentum: 6, is_advancing: true, is_stalled: false,
      notes: ['narrative momentum: campaign is opening — momentum assumed'],
    };
  }

  // Momentum = variety of families + variety of truths across the
  // window. A campaign that keeps moving has both.
  const families = new Set(window.map((t) => t.family)).size;
  const truths = new Set(window.map((t) => t.truth.toLowerCase().slice(0, 40))).size;
  const familyVariety = families / window.length;
  const truthVariety = truths / window.length;

  const momentum = round1(Math.min(10, (familyVariety * 5) + (truthVariety * 5)));
  const is_stalled = momentum < 4;
  const is_advancing = momentum >= 6;

  notes.push(`narrative momentum: ${momentum}/10 — ${is_stalled ? 'STALLED' : is_advancing ? 'advancing' : 'holding'}`);
  return { momentum, is_advancing, is_stalled, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
