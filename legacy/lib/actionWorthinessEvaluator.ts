/**
 * ACTION WORTHINESS EVALUATOR (Phase 210 — Wave 12: Autonomous Action Architecture)
 *
 * The final synthesis of the Wave 12 question. Authorization asks
 * "can we act?"; existence justification asks "should it exist?".
 * This evaluator merges every action signal into one verdict: is this
 * specific action, here, now, worthy of being taken?
 */

export interface ActionWorthinessReading {
  /** True when the action is worthy of being taken. */
  action_is_worthy: boolean;
  /** 0..10 — overall worthiness of the action. */
  worthiness_score: number;
  worthiness_verdict: string;
  notes: string[];
}

export interface ActionWorthinessInput {
  /** True when the action passed authorization. */
  authorized: boolean;
  /** True when the action should exist at all. */
  actionShouldExist: boolean;
  /** True when the intent behind it is genuine. */
  intentGenuine: boolean;
  /** True when the action is dignified. */
  dignified: boolean;
  /** 0..10 — execution risk. */
  executionRisk: number;
  /** True when the action is not overreaching. */
  notOverreaching: boolean;
}

export function readActionWorthinessEvaluator(input: ActionWorthinessInput): ActionWorthinessReading {
  const { authorized, actionShouldExist, intentGenuine, dignified, executionRisk, notOverreaching } = input;
  const notes: string[] = [];

  let worthiness_score = 0;
  if (authorized) worthiness_score += 2.5;
  if (actionShouldExist) worthiness_score += 2.5;
  if (intentGenuine) worthiness_score += 2;
  if (dignified) worthiness_score += 1.5;
  if (notOverreaching) worthiness_score += 1.5;
  worthiness_score -= executionRisk * 0.2;
  worthiness_score = round1(Math.max(0, Math.min(10, worthiness_score)));

  const action_is_worthy =
    authorized && actionShouldExist && intentGenuine && dignified && notOverreaching && worthiness_score >= 7;

  const worthiness_verdict = action_is_worthy
    ? 'this action is worthy — it has earned its place in the world'
    : !actionShouldExist ? 'unworthy — the action should not exist at all'
    : !intentGenuine ? 'unworthy — the intent behind the action is not genuine'
    : !dignified ? 'unworthy — the action is not dignified'
    : !authorized ? 'unworthy — the action is not authorized'
    : 'unworthy — the action does not clear the worthiness bar';

  notes.push(`action worthiness evaluator: ${action_is_worthy ? 'WORTHY' : 'unworthy'} (${worthiness_score}/10) — ${worthiness_verdict}`);
  return { action_is_worthy, worthiness_score, worthiness_verdict, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
