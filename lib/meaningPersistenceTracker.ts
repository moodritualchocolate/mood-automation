/**
 * MEANING PERSISTENCE TRACKER (Phase 250 — Wave 13: Reality Feedback Infrastructure)
 *
 * The hardest test of an action is whether its meaning persists after
 * the moment ends. This tracker reads the persistence — whether the
 * meaning is still working inside people days after the action shipped.
 */

export interface MeaningPersistenceReading {
  /** 0..10 — how strongly the meaning still persists. */
  persistence_score: number;
  /** True when the meaning genuinely outlived the moment. */
  meaning_persists: boolean;
  persistence_note: string;
  notes: string[];
}

export interface MeaningPersistenceInput {
  /** 0..10 — current persistence score in the feedback state. */
  priorPersistence: number;
  /** 0..10 — emotional echo magnitude. */
  echoMagnitude: number;
  /** True when the action is being carried second-hand. */
  beingCarried: boolean;
  /** 0..10 — how authentic the reactions were. */
  reactionAuthenticity: number;
}

export function readMeaningPersistenceTracker(input: MeaningPersistenceInput): MeaningPersistenceReading {
  const { priorPersistence, echoMagnitude, beingCarried, reactionAuthenticity } = input;
  const notes: string[] = [];

  let persistence_score = priorPersistence * 0.4 + echoMagnitude * 0.35;
  persistence_score += reactionAuthenticity * 0.15;
  if (beingCarried) persistence_score += 1.5;
  persistence_score = round1(Math.max(0, Math.min(10, persistence_score)));

  const meaning_persists = persistence_score >= 6;

  const persistence_note = meaning_persists
    ? 'the meaning is still working — the action outlived the moment'
    : persistence_score >= 4
      ? 'the meaning is fading but not gone — it half-persists'
      : 'the meaning evaporated with the moment — nothing carried';

  notes.push(`meaning persistence tracker: ${persistence_score}/10 — ${persistence_note}`);
  return { persistence_score, meaning_persists, persistence_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
