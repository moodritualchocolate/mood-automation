/**
 * NOVELTY DECAY TRACKER (Phase 282 — Wave 14: Live Civilization Coupling)
 *
 * Novelty fades fast. This module tracks how quickly novelty is
 * decaying — so the organism does not lean on a fading novelty as if
 * it were durable.
 */

export type NoveltyDecayState = 'fresh' | 'fading' | 'decayed';

export interface NoveltyDecayReading {
  decay_state: NoveltyDecayState;
  /** 0..10 — remaining novelty. */
  remaining_novelty: number;
  notes: string[];
}

export interface NoveltyDecayInput {
  initialNovelty: number;
  cyclesSinceNew: number;
}

export function readNoveltyDecayTracker(input: NoveltyDecayInput): NoveltyDecayReading {
  const { initialNovelty, cyclesSinceNew } = input;
  const notes: string[] = [];

  const remaining_novelty = round1(Math.max(0, initialNovelty - cyclesSinceNew * 2));

  const decay_state: NoveltyDecayState =
    remaining_novelty >= 6 ? 'fresh' : remaining_novelty >= 2 ? 'fading' : 'decayed';

  notes.push(`novelty decay tracker: ${decay_state} (${remaining_novelty}/10 remaining)`);
  return { decay_state, remaining_novelty, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
