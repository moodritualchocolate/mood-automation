/**
 * ACTION ACCOUNTABILITY LEDGER (Phase 217 — Wave 12: Autonomous Action Architecture)
 *
 * Autonomy without accountability is just unsupervised machinery. This
 * ledger reads the running account of what the organism has done and
 * withheld — and whether that record would survive being looked at.
 */

export interface ActionAccountabilityReading {
  /** True when the action record is accountable — defensible if reviewed. */
  record_is_accountable: boolean;
  /** 0..10 — how defensible the action history is. */
  accountability_score: number;
  ledger_summary: string;
  notes: string[];
}

export interface ActionAccountabilityInput {
  actionsAuthorized: number;
  actionsWithheld: number;
  compulsiveSignals: number;
  overreachCount: number;
}

export function readActionAccountabilityLedger(input: ActionAccountabilityInput): ActionAccountabilityReading {
  const { actionsAuthorized, actionsWithheld, compulsiveSignals, overreachCount } = input;
  const notes: string[] = [];

  let accountability_score = 8;
  accountability_score -= compulsiveSignals * 1.5;
  accountability_score -= overreachCount * 1;
  if (actionsAuthorized + actionsWithheld > 0 && actionsWithheld === 0) accountability_score -= 1.5;
  accountability_score = round1(Math.max(0, Math.min(10, accountability_score)));

  const record_is_accountable = accountability_score >= 6 && compulsiveSignals === 0;

  const ledger_summary = `${actionsAuthorized} acted, ${actionsWithheld} withheld, ` +
    `${compulsiveSignals} compulsive episode(s), ${overreachCount} overreach(es)`;

  notes.push(`action accountability ledger: ${record_is_accountable ? 'accountable' : 'NOT ACCOUNTABLE'} ` +
    `(${accountability_score}/10) — ${ledger_summary}`);
  return { record_is_accountable, accountability_score, ledger_summary, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
