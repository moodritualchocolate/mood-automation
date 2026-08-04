/**
 * LONG-HORIZON RISK BALANCE (Phase 171 — Wave 11: Strategic Future Intelligence)
 *
 * A future worth compounding toward carries risk; a future with no
 * risk is usually a future not worth having. This module balances the
 * long-horizon risk against the reward and names the posture: reckless,
 * balanced, or timid.
 */

import type { FutureScenarioReading } from './futureScenarioSimulation';

export type RiskPosture = 'reckless' | 'balanced' | 'timid';

export interface LongHorizonRiskReading {
  /** -10..10 — reward minus risk across the long horizon. */
  risk_reward_balance: number;
  balance: RiskPosture;
  /** True when the long-horizon bet is worth its risk. */
  long_horizon_worth_it: boolean;
  notes: string[];
}

export interface LongHorizonRiskInput {
  scenarios: FutureScenarioReading;
  /** 0..10 — anti-fragility of the future. */
  antifragility: number;
  /** 0..10 — accrued strategic debt. */
  strategicDebt: number;
}

export function readLongHorizonRisk(input: LongHorizonRiskInput): LongHorizonRiskReading {
  const { scenarios, antifragility, strategicDebt } = input;
  const notes: string[] = [];

  const reward = scenarios.best_case.desirability * scenarios.best_case.probability +
    scenarios.most_likely.desirability * scenarios.most_likely.probability;
  const risk = (10 - scenarios.worst_case.desirability) * scenarios.worst_case.probability +
    strategicDebt * 0.3 + (10 - antifragility) * 0.2;

  const risk_reward_balance = round1(reward - risk);

  const balance: RiskPosture =
    risk_reward_balance <= -1.5 ? 'reckless' :
    risk_reward_balance >= 3 && antifragility >= 5 ? 'balanced' :
    risk_reward_balance >= 3 ? 'reckless' :
    'timid';

  // Worth it when the balance is positive and the worst case is
  // survivable.
  const long_horizon_worth_it = risk_reward_balance > 0 && scenarios.worst_case.desirability > 2;

  notes.push(`long-horizon risk balance: ${risk_reward_balance} (${balance})` +
    (long_horizon_worth_it ? ' — the long-horizon bet is worth its risk' : ' — the bet does not justify its risk'));
  return { risk_reward_balance, balance, long_horizon_worth_it, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
