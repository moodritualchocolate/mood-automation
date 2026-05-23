/**
 * RESTRAINT BUDGET RUNTIME (Phase 206 — Wave 12: Autonomous Action Architecture)
 *
 * Restraint is a finite, replenishable resource. Every action spends
 * it; every withholding restores it. This runtime reads the budget and
 * refuses action when restraint has run out — because an organism
 * that cannot afford restraint can only automate.
 */

export interface RestraintBudgetReading {
  /** 0..10 — restraint currently available. */
  restraint_budget: number;
  /** True when there is enough restraint to afford a deliberate action. */
  can_afford_action: boolean;
  budget_state: 'healthy' | 'low' | 'depleted';
  notes: string[];
}

export interface RestraintBudgetInput {
  /** 0..10 — restraint budget carried in the execution state. */
  restraintBudget: number;
  /** True when this run would spend restraint by acting. */
  actionWouldSpend: boolean;
}

export function readRestraintBudgetRuntime(input: RestraintBudgetInput): RestraintBudgetReading {
  const { restraintBudget, actionWouldSpend } = input;
  const notes: string[] = [];

  const projected = actionWouldSpend ? restraintBudget - 0.4 : restraintBudget;

  const budget_state: RestraintBudgetReading['budget_state'] =
    restraintBudget >= 5 ? 'healthy' : restraintBudget >= 2.5 ? 'low' : 'depleted';

  // The organism can afford an action only when acting would not push
  // restraint into depletion — a depleted budget means it can no
  // longer choose NOT to act, which is the definition of compulsion.
  const can_afford_action = projected >= 2;

  notes.push(`restraint budget runtime: ${restraintBudget}/10 (${budget_state}) — ` +
    (can_afford_action ? 'restraint can be afforded' : 'RESTRAINT DEPLETED — action would be compulsion'));
  return { restraint_budget: restraintBudget, can_afford_action, budget_state, notes };
}
