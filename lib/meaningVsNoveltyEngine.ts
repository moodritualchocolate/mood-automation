/**
 * MEANING VS NOVELTY ENGINE (Phase 268 — Wave 14: Live Civilization Coupling)
 *
 * Novelty is cheap; meaning is rare. This engine distinguishes one
 * from the other — refusing the organism's pull to chase the new at
 * the expense of the meaningful.
 */

export interface MeaningVsNoveltyReading {
  /** True when the run is built on meaning, not novelty. */
  is_meaning: boolean;
  /** -10..10 — positive favors meaning, negative favors novelty. */
  meaning_vs_novelty_balance: number;
  balance_note: string;
  notes: string[];
}

export interface MeaningVsNoveltyInput {
  /** 0..10 — meaning density of the run. */
  meaningDensity: number;
  /** 0..10 — novelty load of the run. */
  noveltyLoad: number;
  /** True when the moment is rewarding novelty over substance. */
  marketRewardsNovelty: boolean;
}

export function readMeaningVsNoveltyEngine(input: MeaningVsNoveltyInput): MeaningVsNoveltyReading {
  const { meaningDensity, noveltyLoad, marketRewardsNovelty } = input;
  const notes: string[] = [];

  let meaning_vs_novelty_balance = meaningDensity - noveltyLoad;
  if (marketRewardsNovelty) meaning_vs_novelty_balance -= 1;
  meaning_vs_novelty_balance = round1(meaning_vs_novelty_balance);

  const is_meaning = meaning_vs_novelty_balance >= 1;

  const balance_note = is_meaning
    ? 'the run is built on meaning — meaning density outpaces novelty load'
    : marketRewardsNovelty
      ? 'the run leans novelty — the market is rewarding it, but the trade is short-term'
      : 'the run leans novelty without market reason — refuse';

  notes.push(`meaning vs novelty engine: ${is_meaning ? 'MEANING' : 'novelty'} (balance ${meaning_vs_novelty_balance}) — ${balance_note}`);
  return { is_meaning, meaning_vs_novelty_balance, balance_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
