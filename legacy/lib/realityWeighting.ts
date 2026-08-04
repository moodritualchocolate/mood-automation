/**
 * REALITY WEIGHTING (Phase 16)
 *
 * Weights signals by RECOGNITION DEPTH, not volume.
 *
 * The spec's rule:
 *   10 comments saying "this is literally my life"
 *   should outweigh
 *   100k shallow likes.
 *
 * The engine takes the ingested signals + the candidate banner's
 * truth, and returns:
 *
 *   discovered_from_reality_score — 0..10 — how strongly the truth
 *                                    resonates with deep-recognition
 *                                    signals
 *   generated_from_aesthetics_only — boolean — true when the truth
 *                                    matches NO ingested signal at
 *                                    sufficient depth
 *
 * The meta-critic uses these to answer the spec's headline question
 * for Phase 16:
 *
 *   "Was this emotional truth discovered from reality,
 *    or generated from internal aesthetics?"
 */

import type { IngestedSignal } from './realityIngestion';

export interface WeightingReading {
  /** 0..10 — high when the truth resonates with deep-recognition signals. */
  discovered_from_reality_score: number;
  /** True when NO ingested signal at depth >= 7 resonates with the truth. */
  generated_from_aesthetics_only: boolean;
  /** Signals that matched, ordered by weight × overlap. */
  resonating_signals: Array<{
    signal: IngestedSignal;
    overlap: number;        // 0..1
    weighted_contribution: number;
  }>;
  /** Volume-weighted sources that influenced the score. */
  signal_volume_by_source: Record<string, number>;
  notes: string[];
}

export interface WeightingInput {
  truthText: string;
  tensionText?: string;
  ingestedSignals: IngestedSignal[];
  /** Only signals at or above this weight count. Default 6 — below
   *  this they are considered "shallow likes" in the spec's language. */
  minDepth?: number;
}

export function weightReality(input: WeightingInput): WeightingReading {
  const { truthText, tensionText, ingestedSignals, minDepth = 6 } = input;
  const fullText = `${truthText} ${tensionText ?? ''}`;
  const notes: string[] = [];

  const deepSignals = ingestedSignals.filter((s) => s.emotional_weight >= minDepth);
  const fullTokens = tokenize(fullText);

  const resonating: WeightingReading['resonating_signals'] = [];
  const signal_volume_by_source: Record<string, number> = {};
  let totalWeighted = 0;

  for (const signal of deepSignals) {
    const sTokens = tokenize(signal.text);
    let overlap = jaccard(fullTokens, sTokens);
    // Tag boost — when the signal has a topical tag that appears
    // (as a tokenised phrase) in the candidate text, increase overlap.
    const tagBoost = signal.topical_tags.some((tag) =>
      fullText.toLowerCase().includes(tag.replace(/-/g, ' '))) ? 0.15 : 0;
    overlap += tagBoost;
    if (overlap >= 0.2) {
      // weighted_contribution = overlap × emotional_weight (NOT × volume).
      const weighted_contribution = overlap * signal.emotional_weight;
      resonating.push({ signal, overlap, weighted_contribution });
      totalWeighted += weighted_contribution;
      signal_volume_by_source[signal.source] = (signal_volume_by_source[signal.source] ?? 0) + 1;
    }
  }
  resonating.sort((a, b) => b.weighted_contribution - a.weighted_contribution);

  // Score — emotional_weight × overlap dominates; volume contributes
  // only marginally. The cap is 10.
  const discovered_from_reality_score = Math.min(10, totalWeighted * 0.6 + Math.min(2, resonating.length * 0.3));

  const generated_from_aesthetics_only =
    resonating.filter((r) => r.overlap >= 0.3 && r.signal.emotional_weight >= 8).length === 0;

  if (resonating.length === 0) {
    notes.push('no ingested signal at depth resonates with this truth — the truth may be generated, not discovered');
  } else if (resonating.length === 1) {
    notes.push(`resonates with 1 deep signal (overlap ${resonating[0].overlap.toFixed(2)})`);
  } else {
    notes.push(`resonates with ${resonating.length} deep signals · top contribution ${resonating[0].weighted_contribution.toFixed(2)}`);
  }
  if (generated_from_aesthetics_only && resonating.length > 0) {
    notes.push('only shallow resonance — no STRONG recognition signal matches');
  }

  return {
    discovered_from_reality_score,
    generated_from_aesthetics_only,
    resonating_signals: resonating.slice(0, 5),
    signal_volume_by_source,
    notes,
  };
}

function tokenize(text: string): Set<string> {
  const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'this', 'that', 'is', 'am', 'are', 'was', 'i', 'you', 'me', 'my', 'your', 'his', 'her', 'we', 'they', 'them', 'it', 'be', 'to', 'of', 'in', 'on', 'at', 'so', 'too', 'as', 'do', 'does', 'did', 'have', 'has', 'had', 'just', 'still']);
  return new Set(
    text.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
