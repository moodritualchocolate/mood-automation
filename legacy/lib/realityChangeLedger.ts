/**
 * REALITY CHANGE LEDGER (Phase 307 — Wave 14: Live Civilization Coupling)
 *
 * A ledger of (action → reality change) entries. Honest accountability
 * for what the brand has actually moved.
 */

export interface RealityChangeLedgerReading {
  /** True when a reality change was logged this cycle. */
  recorded: boolean;
  /** Total reality changes attributed to the brand. */
  total_changes: number;
  /** Running attribution share. */
  running_attribution_share: number;
  notes: string[];
}

export interface RealityChangeLedgerInput {
  realityChanged: boolean;
  attributionShare: number;
  priorChanges: number;
  priorAttributionAvg: number;
}

export function readRealityChangeLedger(input: RealityChangeLedgerInput): RealityChangeLedgerReading {
  const { realityChanged, attributionShare, priorChanges, priorAttributionAvg } = input;
  const notes: string[] = [];

  const recorded = realityChanged && attributionShare > 0;
  const total_changes = priorChanges + (recorded ? 1 : 0);
  const running_attribution_share = total_changes > 0
    ? round1((priorAttributionAvg * priorChanges + (recorded ? attributionShare : 0)) / total_changes)
    : 0;

  notes.push(`reality change ledger: ${recorded ? 'recorded' : 'no change'} — total ${total_changes}, avg attribution ${running_attribution_share}/10`);
  return { recorded, total_changes, running_attribution_share, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
