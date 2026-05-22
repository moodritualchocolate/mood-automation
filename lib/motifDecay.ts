/**
 * MOTIF DECAY (Phase 31 — Emotional Continuity Runtime / Wave 2)
 *
 * Tracks the exhaustion of recurring MOTIFS — the objects, the
 * settings, the gestures the campaign keeps returning to. A motif
 * has a lifespan; past it, the motif decays into a tic.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface MotifDecayEntry {
  motif: string;
  count: number;
  /** 0..10 — how decayed the motif is (higher = more worn). */
  decay: number;
}

export interface MotifDecayReading {
  motifs: MotifDecayEntry[];
  /** The most decayed motif, if any. */
  most_decayed: MotifDecayEntry | null;
  /** True when at least one motif has decayed past use. */
  motif_decay_detected: boolean;
  notes: string[];
}

export interface MotifDecayInput {
  trail: EmotionalTraceEntry[];
  /** Symbolic objects in the candidate banner. */
  candidateMotifs: string[];
}

export function readMotifDecay(input: MotifDecayInput): MotifDecayReading {
  const { trail, candidateMotifs } = input;
  const notes: string[] = [];

  const window = trail.slice(0, 14);
  const counts: Record<string, number> = {};
  for (const t of window) {
    const hay = `${t.truth} ${t.residue}`.toLowerCase();
    for (const motif of new Set(candidateMotifs)) {
      if (hay.includes(motif.replace(/-/g, ' ')) || hay.includes(motif)) {
        counts[motif] = (counts[motif] ?? 0) + 1;
      }
    }
  }

  const motifs: MotifDecayEntry[] = candidateMotifs.map((m) => {
    const count = counts[m] ?? 0;
    // Decay rises sharply after 3 appearances.
    const decay = round1(Math.min(10, count <= 1 ? count * 1.5 : 3 + (count - 1) * 2.2));
    return { motif: m, count, decay };
  }).sort((a, b) => b.decay - a.decay);

  const most_decayed = motifs[0] && motifs[0].decay >= 6 ? motifs[0] : null;
  const motif_decay_detected = most_decayed !== null;

  if (most_decayed) notes.push(`motif decay: "${most_decayed.motif}" has decayed (×${most_decayed.count}, decay ${most_decayed.decay}/10)`);
  else notes.push('motif decay: no motif has decayed past use');

  return { motifs, most_decayed, motif_decay_detected, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
