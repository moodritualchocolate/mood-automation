/**
 * ACTION REVERSIBILITY PLANNER (Phase 204 — Wave 12: Autonomous Action Architecture)
 *
 * Wave 11 detects irreversibility; this module plans for it. Before an
 * action ships, it ensures a path back exists — or, when none does,
 * insists the action clear a far higher bar.
 */

export interface ActionReversibilityReading {
  /** True when a path to undo the action has been planned. */
  reversal_path_exists: boolean;
  reversal_plan: string;
  /** True when an irreversible action is being allowed through anyway. */
  irreversible_action_proceeding: boolean;
  notes: string[];
}

export interface ActionReversibilityInput {
  /** True when the decision is irreversible (Wave 11). */
  irreversible: boolean;
  /** True when the action would still proceed. */
  actionProceeding: boolean;
  /** 0..10 — how strongly the action is justified. */
  justificationStrength: number;
}

export function readActionReversibilityPlanner(input: ActionReversibilityInput): ActionReversibilityReading {
  const { irreversible, actionProceeding, justificationStrength } = input;
  const notes: string[] = [];

  const reversal_path_exists = !irreversible;

  const reversal_plan = reversal_path_exists
    ? 'a path back exists — if the action misses, it can be corrected next cycle'
    : 'no path back — this action must be treated as permanent';

  // An irreversible action may proceed only when its justification is
  // overwhelming.
  const irreversible_action_proceeding =
    irreversible && actionProceeding && justificationStrength < 8.5;

  notes.push(`action reversibility planner: ${reversal_plan}` +
    (irreversible_action_proceeding ? ' — an irreversible action is proceeding without an overwhelming case' : ''));
  return { reversal_path_exists, reversal_plan, irreversible_action_proceeding, notes };
}
