/**
 * POPULARITY SIGNAL DECOUPLER (Phase 332 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Decouples the brand's decisions from raw popularity metrics — so
 * a popular signal cannot drag the brand off its axis on its own.
 */

export interface PopularitySignalDecouplerReading {
  /** True when popularity is properly decoupled from decisions. */
  popularity_decoupled: boolean;
  popularity_weight: number;   // 0..10 (lower = better)
  notes: string[];
}

export interface PopularitySignalDecouplerInput {
  decisionFollowedPopularity: boolean;
  ignoredPopularityWhenWrong: boolean;
}

export function readPopularitySignalDecoupler(input: PopularitySignalDecouplerInput): PopularitySignalDecouplerReading {
  const { decisionFollowedPopularity, ignoredPopularityWhenWrong } = input;
  const notes: string[] = [];

  const popularity_weight = decisionFollowedPopularity ? 8 : ignoredPopularityWhenWrong ? 1 : 4;
  const popularity_decoupled = popularity_weight <= 4;

  notes.push(`popularity signal decoupler: ${popularity_decoupled ? 'decoupled' : 'COUPLED'} (weight ${popularity_weight}/10)`);
  return { popularity_decoupled, popularity_weight, notes };
}
