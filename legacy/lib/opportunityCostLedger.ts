/**
 * OPPORTUNITY COST LEDGER (Phase 167 — Wave 11: Strategic Future Intelligence)
 *
 * Every path taken is a set of paths refused. This ledger tracks the
 * cost of the futures the organism is not walking toward — so the
 * unseen price of a decision is never zero.
 */

import type { FutureScenarioReading } from './futureScenarioSimulation';

export interface OpportunityCostReading {
  /** 0..10 — the cost of the best path the organism is not taking. */
  opportunity_cost: number;
  costliest_path_not_taken: string;
  /** True when refused opportunities are accumulating into real cost. */
  cost_is_mounting: boolean;
  notes: string[];
}

export interface OpportunityCostInput {
  scenarios: FutureScenarioReading;
  /** Times strategic patience has been honored. */
  patienceHonored: number;
  /** Times the organism optimized for now. */
  nowOptimizedCount: number;
}

export function readOpportunityCost(input: OpportunityCostInput): OpportunityCostReading {
  const { scenarios, patienceHonored, nowOptimizedCount } = input;
  const notes: string[] = [];

  // The cost is the gap between the best case and what is most likely.
  let opportunity_cost = Math.max(0, scenarios.best_case.desirability - scenarios.most_likely.desirability);
  // Now-optimizing forecloses futures; patience, used well, does not.
  opportunity_cost += Math.min(3, nowOptimizedCount * 0.5);
  opportunity_cost -= Math.min(1.5, patienceHonored * 0.2);
  opportunity_cost = round1(Math.max(0, Math.min(10, opportunity_cost)));

  const costliest_path_not_taken = scenarios.best_case.name;
  const cost_is_mounting = opportunity_cost >= 6;

  notes.push(`opportunity cost ledger: ${opportunity_cost}/10` +
    (cost_is_mounting ? ` — MOUNTING, costliest forgone path: "${costliest_path_not_taken}"` : ''));
  return { opportunity_cost, costliest_path_not_taken, cost_is_mounting, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
