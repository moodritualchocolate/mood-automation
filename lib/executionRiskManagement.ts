/**
 * EXECUTION RISK MANAGEMENT (Phase 190 — Wave 12: Autonomous Action Architecture)
 *
 * Acting in the world carries risk. This module sizes the risk of an
 * action before it ships — and refuses to let an unmanaged risk reach
 * the audience.
 */

export interface ExecutionRiskReading {
  /** 0..10 — total execution risk of the action. */
  execution_risk: number;
  /** True when the risk has been brought within acceptable bounds. */
  risk_is_managed: boolean;
  dominant_risk: string;
  notes: string[];
}

export interface ExecutionRiskInput {
  /** True when the decision is irreversible (Wave 11). */
  irreversible: boolean;
  /** 0..10 — black-swan exposure (Wave 11). */
  blackSwanExposure: number;
  /** True when reality coupling is failing. */
  couplingFailing: boolean;
  /** 0..10 — strategic debt. */
  strategicDebt: number;
}

export function readExecutionRiskManagement(input: ExecutionRiskInput): ExecutionRiskReading {
  const { irreversible, blackSwanExposure, couplingFailing, strategicDebt } = input;
  const notes: string[] = [];

  let execution_risk = 0;
  if (irreversible) execution_risk += 3;
  execution_risk += blackSwanExposure * 0.3;
  if (couplingFailing) execution_risk += 3;
  execution_risk += strategicDebt * 0.2;
  execution_risk = round1(Math.min(10, execution_risk));

  const risk_is_managed = execution_risk < 6;

  const dominant_risk =
    couplingFailing ? 'the coupling to reality is failing — the action would be aimed blind'
    : irreversible ? 'the action is irreversible — a mistake could not be recalled'
    : blackSwanExposure >= 7 ? 'high black-swan exposure — an unmodelled shock would compound the action'
    : strategicDebt >= 7 ? 'strategic debt amplifies any execution error'
    : 'no single dominant risk — execution risk is diffuse and low';

  notes.push(`execution risk management: ${execution_risk}/10 — ${risk_is_managed ? 'risk is managed' : 'RISK UNMANAGED'} — ${dominant_risk}`);
  return { execution_risk, risk_is_managed, dominant_risk, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
