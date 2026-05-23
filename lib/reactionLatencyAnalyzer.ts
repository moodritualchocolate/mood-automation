/**
 * REACTION LATENCY ANALYZER (Phase 234 — Wave 13: Reality Feedback Infrastructure)
 *
 * Fast reactions are stimulus; slow reactions are thought. This module
 * analyses the latency profile of the audience's response, so the
 * organism knows whether the action triggered reflex or reflection.
 */

export type ReactionPattern = 'reflex' | 'considered' | 'delayed-truth' | 'no-reaction';

export interface ReactionLatencyReading {
  pattern: ReactionPattern;
  /** 0..10 — how thoughtful (vs reflexive) the reactions were. */
  thoughtfulness: number;
  pattern_note: string;
  notes: string[];
}

export interface ReactionLatencyInput {
  /** Number of immediate reactions (within first cycle). */
  immediateReactions: number;
  /** Number of reactions that arrived 1+ cycles later. */
  delayedReactions: number;
}

export function readReactionLatencyAnalyzer(input: ReactionLatencyInput): ReactionLatencyReading {
  const { immediateReactions, delayedReactions } = input;
  const notes: string[] = [];

  const total = immediateReactions + delayedReactions;
  if (total === 0) {
    return {
      pattern: 'no-reaction', thoughtfulness: 0, pattern_note: 'the audience did not react at all',
      notes: ['reaction latency analyzer: no reactions to analyze'],
    };
  }

  const delayedShare = delayedReactions / total;
  const thoughtfulness = round1(delayedShare * 10);

  const pattern: ReactionPattern =
    delayedShare >= 0.6 ? 'delayed-truth' :
    delayedShare >= 0.3 ? 'considered' : 'reflex';

  const pattern_note = pattern === 'delayed-truth'
    ? 'most reactions arrived cycles later — the action triggered reflection, not reflex'
    : pattern === 'considered' ? 'a healthy mix — some reflex, some thought'
    : 'reactions were almost all immediate — the action triggered reflex more than thought';

  notes.push(`reaction latency analyzer: ${pattern} (thoughtfulness ${thoughtfulness}/10) — ${pattern_note}`);
  return { pattern, thoughtfulness, pattern_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
