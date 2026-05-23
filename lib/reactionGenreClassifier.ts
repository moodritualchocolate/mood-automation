/**
 * REACTION GENRE CLASSIFIER (Phase 248 — Wave 13: Reality Feedback Infrastructure)
 *
 * Reactions come in kinds — applause, agreement, argument, recognition,
 * indifference. This module classifies the dominant kind so the
 * organism reads not just the volume of feedback but its shape.
 */

export type ReactionGenre =
  | 'applause' | 'recognition' | 'agreement' | 'argument' | 'indifference';

export interface ReactionGenreReading {
  dominant_genre: ReactionGenre;
  /** 0..10 — confidence in the classification. */
  confidence: number;
  genre_note: string;
  notes: string[];
}

export interface ReactionGenreInput {
  /** 0..10 — emotional intensity in the average reaction. */
  averageIntensity: number;
  /** 0..10 — average trust signal in reactions. */
  averageTrustSignal: number;
  /** True when contradictions appeared in reception. */
  contradictionDetected: boolean;
  /** Number of reactions observed. */
  reactionCount: number;
}

export function readReactionGenreClassifier(input: ReactionGenreInput): ReactionGenreReading {
  const { averageIntensity, averageTrustSignal, contradictionDetected, reactionCount } = input;
  const notes: string[] = [];

  const dominant_genre: ReactionGenre =
    reactionCount === 0 ? 'indifference' :
    contradictionDetected ? 'argument' :
    averageTrustSignal >= 6 && averageIntensity <= 5 ? 'recognition' :
    averageIntensity >= 7 ? 'applause' : 'agreement';

  const confidence = round1(Math.min(10, 3 + reactionCount * 0.5 + Math.abs(averageTrustSignal - 5) * 0.5));

  const genre_note =
    dominant_genre === 'recognition' ? 'recognition — the deepest reaction; the audience saw what the brand was'
    : dominant_genre === 'agreement' ? 'agreement — the audience went along; warm but not deep'
    : dominant_genre === 'applause' ? 'applause — loud but shallow; verify with second-hand resonance'
    : dominant_genre === 'argument' ? 'argument — the audience is pushing back; the action provoked dissent'
    : 'indifference — the action did not get a reaction worth classifying';

  notes.push(`reaction genre classifier: ${dominant_genre} (${confidence}/10) — ${genre_note}`);
  return { dominant_genre, confidence, genre_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
