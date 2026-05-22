/**
 * REAWAKENING TRIGGERS (Phase 40 — Strategic Campaign Lifecycles / Wave 4)
 *
 * Detects when a DORMANT truth — a direction the campaign retired
 * earlier — can be reawakened. A retired truth is not dead; it is
 * resting until the moment is right to return to it.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface DormantTruth {
  family: string;
  lastSeenAgo: number;          // banners ago
  sampleTruth: string;
}

export interface ReawakeningTriggersReading {
  /** Dormant truths the campaign could reawaken. */
  dormant_truths: DormantTruth[];
  /** The dormant truth most ready to reawaken, if any. */
  reawaken_candidate: DormantTruth | null;
  /** 0..10 — probability a reawakening would land well. */
  reawakening_probability: number;
  notes: string[];
}

export interface ReawakeningTriggersInput {
  trail: EmotionalTraceEntry[];
}

export function readReawakeningTriggers(input: ReawakeningTriggersInput): ReawakeningTriggersReading {
  const { trail } = input;
  const notes: string[] = [];

  if (trail.length < 8) {
    return {
      dormant_truths: [], reawaken_candidate: null, reawakening_probability: 0,
      notes: ['reawakening triggers: campaign too young to have dormant truths'],
    };
  }

  // A family is dormant when it appeared early but not in the recent
  // window — it has rested long enough to feel fresh again.
  const recent = trail.slice(0, 6);
  const older = trail.slice(6);
  const recentFamilies = new Set(recent.map((t) => t.family));
  const olderFamilies = new Map<string, EmotionalTraceEntry>();
  for (const t of older) {
    if (!olderFamilies.has(t.family)) olderFamilies.set(t.family, t);
  }

  const dormant_truths: DormantTruth[] = [];
  for (const [family, entry] of olderFamilies) {
    if (!recentFamilies.has(family)) {
      const lastSeenAgo = trail.findIndex((t) => t.family === family);
      dormant_truths.push({
        family,
        lastSeenAgo: lastSeenAgo < 0 ? trail.length : lastSeenAgo,
        sampleTruth: entry.truth.slice(0, 70),
      });
    }
  }
  dormant_truths.sort((a, b) => b.lastSeenAgo - a.lastSeenAgo);

  const reawaken_candidate = dormant_truths[0] ?? null;
  // The longer a truth has rested (without being forgotten entirely),
  // the better a reawakening lands — peaking around 8-14 banners ago.
  let reawakening_probability = 0;
  if (reawaken_candidate) {
    const ago = reawaken_candidate.lastSeenAgo;
    reawakening_probability = round1(Math.min(10, ago >= 6 && ago <= 16 ? 7 + (ago - 6) * 0.2 : 3));
  }

  if (reawaken_candidate) {
    notes.push(`reawakening triggers: "${reawaken_candidate.family}" has been dormant ${reawaken_candidate.lastSeenAgo} banners — reawakening probability ${reawakening_probability}/10`);
  } else {
    notes.push('reawakening triggers: no dormant truth ready to reawaken');
  }

  return { dormant_truths, reawaken_candidate, reawakening_probability, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
