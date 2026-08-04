/**
 * IDENTITY SOVEREIGNTY BUDGET (Phase 345 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Sovereignty is finite — every compromise spends from it. This
 * module tracks the budget.
 */

export interface IdentitySovereigntyBudgetReading {
  budget: number;
  /** True when sovereignty can be afforded. */
  can_afford: boolean;
  notes: string[];
}

export interface IdentitySovereigntyBudgetInput {
  sovereigntyScore: number;
  spending: boolean;
}

export function readIdentitySovereigntyBudget(input: IdentitySovereigntyBudgetInput): IdentitySovereigntyBudgetReading {
  const { sovereigntyScore, spending } = input;
  const notes: string[] = [];

  const projected = spending ? sovereigntyScore - 0.5 : sovereigntyScore;
  const can_afford = projected >= 3;

  notes.push(`identity sovereignty budget: ${sovereigntyScore}/10 — ${can_afford ? 'can afford' : 'DEPLETED'}`);
  return { budget: sovereigntyScore, can_afford, notes };
}
