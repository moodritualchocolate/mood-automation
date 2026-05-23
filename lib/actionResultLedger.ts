/**
 * ACTION RESULT LEDGER (Phase 237 — Wave 13: Reality Feedback Infrastructure)
 *
 * Every action ends in a result. This ledger pairs them, so the
 * organism's record of "we did X" always carries "and it became Y."
 * Without it, the action layer can never honestly grade itself.
 */

export interface ActionResultEntry {
  action_summary: string;
  result_summary: string;
  net_outcome: number;  // -10..10
}

export interface ActionResultLedgerReading {
  /** True when the action/result pairing was recorded this cycle. */
  recorded: boolean;
  /** Total entries on the ledger. */
  entries_total: number;
  /** Running average of net outcomes. */
  running_outcome_average: number;
  latest_entry: ActionResultEntry | null;
  notes: string[];
}

export interface ActionResultLedgerInput {
  /** True when an action shipped this cycle. */
  actionShipped: boolean;
  /** -10..10 — observed trust shift after the action. */
  trustShift: number;
  /** 0..10 — meaning persistence after the action. */
  meaningPersistence: number;
  /** Prior entries on the ledger. */
  priorEntries: number;
  /** Running outcome average so far. */
  priorAverage: number;
}

export function readActionResultLedger(input: ActionResultLedgerInput): ActionResultLedgerReading {
  const { actionShipped, trustShift, meaningPersistence, priorEntries, priorAverage } = input;
  const notes: string[] = [];

  if (!actionShipped) {
    return {
      recorded: false, entries_total: priorEntries, running_outcome_average: priorAverage,
      latest_entry: null,
      notes: ['action result ledger: no action this cycle — nothing to record'],
    };
  }

  const net_outcome = round1(trustShift + (meaningPersistence - 5) * 0.4);
  const latest_entry: ActionResultEntry = {
    action_summary: 'a banner shipped this cycle',
    result_summary: `trust shift ${trustShift}, meaning persistence ${meaningPersistence}/10`,
    net_outcome,
  };
  const entries_total = priorEntries + 1;
  const running_outcome_average = round1((priorAverage * priorEntries + net_outcome) / entries_total);

  notes.push(`action result ledger: recorded entry #${entries_total} (outcome ${net_outcome}) — running average ${running_outcome_average}`);
  return { recorded: true, entries_total, running_outcome_average, latest_entry, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
