/**
 * IDENTITY COMPROMISE LEDGER (Phase 368 — Wave 15: Identity Preservation Under Live Reality)
 *
 * A defensible ledger of every identity compromise — auditable
 * accountability for what the brand gave up and when.
 */

export interface IdentityCompromiseLedgerReading {
  /** Total ledger entries. */
  entries: number;
  /** True when the ledger is in a defensible state. */
  defensible: boolean;
  notes: string[];
}

export interface IdentityCompromiseLedgerInput {
  priorEntries: number;
  newCompromise: boolean;
}

export function readIdentityCompromiseLedger(input: IdentityCompromiseLedgerInput): IdentityCompromiseLedgerReading {
  const { priorEntries, newCompromise } = input;
  const notes: string[] = [];

  const entries = priorEntries + (newCompromise ? 1 : 0);
  const defensible = entries < 4;

  notes.push(`identity compromise ledger: ${entries} entries — ${defensible ? 'defensible' : 'NOT defensible'}`);
  return { entries, defensible, notes };
}
