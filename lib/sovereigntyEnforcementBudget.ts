/**
 * SOVEREIGNTY ENFORCEMENT BUDGET (Phase 378 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Tracks the budget for sovereignty enforcement — refusing capture
 * costs energy, and that energy is finite.
 */

export interface SovereigntyEnforcementBudgetReading {
  budget: number;
  /** True when there is enough budget to enforce sovereignty. */
  can_enforce: boolean;
  notes: string[];
}

export interface SovereigntyEnforcementBudgetInput {
  immuneResponses: number;
  capacityForMore: number;
}

export function readSovereigntyEnforcementBudget(input: SovereigntyEnforcementBudgetInput): SovereigntyEnforcementBudgetReading {
  const { immuneResponses, capacityForMore } = input;
  const notes: string[] = [];

  const budget = round1(Math.max(0, capacityForMore - immuneResponses * 0.3));
  const can_enforce = budget >= 3;

  notes.push(`sovereignty enforcement budget: ${budget}/10 — ${can_enforce ? 'can enforce' : 'depleted'}`);
  return { budget, can_enforce, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
