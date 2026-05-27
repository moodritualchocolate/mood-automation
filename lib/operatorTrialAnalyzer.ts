/**
 * OPERATOR TRIAL ANALYZER (pure, observational)
 *
 * Analyzes which sandbox candidates operators actually chose,
 * which they rejected, which were tested, and which received
 * outcome data. Pure function — no I/O, no winner selection,
 * no autonomous action.
 *
 * STRICT CONTRACT:
 *   - never names a "best" trial
 *   - never recommends a candidate
 *   - never triggers generation or publishing
 *   - phrasing observational only
 */

import type { OperatorCreativeTrial, TrialStatus } from './operatorCreativeTrialMemory';

// ─── output ───────────────────────────────────────────────────

export interface TrialStatusBreakdown {
  proposed: number;
  approved: number;
  rejected: number;
  tested: number;
  outcomeAttached: number;
}

export interface MutationChoiceCount {
  mutationType: string;
  proposed: number;
  approved: number;
  rejected: number;
  tested: number;
  outcomeAttached: number;
  /** approved+tested+outcome-attached / total */
  followThroughRate: number;
}

export interface FormulaChoiceCount {
  formula: string;
  totalTrials: number;
  approvalRate: number;       // approved / total (0..1)
  outcomeAttachmentRate: number;
}

export interface OperatorActivity {
  operatorId: string;
  totalTrials: number;
  approvalRate: number;
  outcomeAttachmentRate: number;
}

export interface OperatorTrialAnalysis {
  totalTrials: number;
  statusBreakdown: TrialStatusBreakdown;
  perMutationChoices: MutationChoiceCount[];
  perFormulaChoices: FormulaChoiceCount[];
  operatorActivity: OperatorActivity[];
  /** Trials currently in non-terminal states. */
  pendingTrialIds: string[];
  /** Recent slice for display (sorted descending). */
  recentTrials: OperatorCreativeTrial[];
  /** Aggregate approval rate (approved+tested+outcome / total). */
  overallFollowThroughRate: number;
  /** Aggregate outcome-attachment rate. */
  overallOutcomeAttachmentRate: number;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the analyzer surfaces operator decision patterns. ' +
  'It never selects, recommends, or executes a trial.';

function r2(n: number): number { return Math.round(n * 100) / 100; }

const TERMINAL_STATUSES: ReadonlySet<TrialStatus> = new Set(['rejected', 'outcome-attached']);
const FOLLOW_THROUGH_STATUSES: ReadonlySet<TrialStatus> = new Set(['approved', 'tested', 'outcome-attached']);

// ─── main ─────────────────────────────────────────────────────

export function analyzeOperatorTrials(
  trials: OperatorCreativeTrial[],
): OperatorTrialAnalysis {
  const statusBreakdown: TrialStatusBreakdown = {
    proposed: 0, approved: 0, rejected: 0, tested: 0, outcomeAttached: 0,
  };
  for (const t of trials) {
    if (t.status === 'proposed') statusBreakdown.proposed += 1;
    else if (t.status === 'approved') statusBreakdown.approved += 1;
    else if (t.status === 'rejected') statusBreakdown.rejected += 1;
    else if (t.status === 'tested') statusBreakdown.tested += 1;
    else if (t.status === 'outcome-attached') statusBreakdown.outcomeAttached += 1;
  }

  // ── per-mutation counts ────────────────────────────────────
  const byMutation = new Map<string, OperatorCreativeTrial[]>();
  for (const t of trials) {
    if (!byMutation.has(t.mutationType)) byMutation.set(t.mutationType, []);
    byMutation.get(t.mutationType)!.push(t);
  }
  const perMutationChoices: MutationChoiceCount[] = [];
  for (const [mutationType, list] of byMutation) {
    const counts = { proposed: 0, approved: 0, rejected: 0, tested: 0, outcomeAttached: 0 };
    for (const t of list) {
      if (t.status === 'proposed') counts.proposed += 1;
      else if (t.status === 'approved') counts.approved += 1;
      else if (t.status === 'rejected') counts.rejected += 1;
      else if (t.status === 'tested') counts.tested += 1;
      else if (t.status === 'outcome-attached') counts.outcomeAttached += 1;
    }
    const followThrough = list.filter((t) => FOLLOW_THROUGH_STATUSES.has(t.status)).length;
    perMutationChoices.push({
      mutationType,
      ...counts,
      followThroughRate: list.length === 0 ? 0 : r2(followThrough / list.length),
    });
  }
  perMutationChoices.sort((a, b) =>
    (b.approved + b.tested + b.outcomeAttached) - (a.approved + a.tested + a.outcomeAttached) ||
    a.mutationType.localeCompare(b.mutationType),
  );

  // ── per-formula counts ─────────────────────────────────────
  const byFormula = new Map<string, OperatorCreativeTrial[]>();
  for (const t of trials) {
    if (!byFormula.has(t.formula)) byFormula.set(t.formula, []);
    byFormula.get(t.formula)!.push(t);
  }
  const perFormulaChoices: FormulaChoiceCount[] = [];
  for (const [formula, list] of byFormula) {
    const approvedLike = list.filter((t) => FOLLOW_THROUGH_STATUSES.has(t.status)).length;
    const outcomeAttached = list.filter((t) => t.status === 'outcome-attached').length;
    perFormulaChoices.push({
      formula,
      totalTrials: list.length,
      approvalRate: list.length === 0 ? 0 : r2(approvedLike / list.length),
      outcomeAttachmentRate: list.length === 0 ? 0 : r2(outcomeAttached / list.length),
    });
  }
  perFormulaChoices.sort((a, b) =>
    b.totalTrials - a.totalTrials ||
    a.formula.localeCompare(b.formula),
  );

  // ── per-operator activity ──────────────────────────────────
  const byOperator = new Map<string, OperatorCreativeTrial[]>();
  for (const t of trials) {
    if (!byOperator.has(t.operatorId)) byOperator.set(t.operatorId, []);
    byOperator.get(t.operatorId)!.push(t);
  }
  const operatorActivity: OperatorActivity[] = [];
  for (const [operatorId, list] of byOperator) {
    const approvedLike = list.filter((t) => FOLLOW_THROUGH_STATUSES.has(t.status)).length;
    const outcomeAttached = list.filter((t) => t.status === 'outcome-attached').length;
    operatorActivity.push({
      operatorId,
      totalTrials: list.length,
      approvalRate: list.length === 0 ? 0 : r2(approvedLike / list.length),
      outcomeAttachmentRate: list.length === 0 ? 0 : r2(outcomeAttached / list.length),
    });
  }
  operatorActivity.sort((a, b) =>
    b.totalTrials - a.totalTrials ||
    a.operatorId.localeCompare(b.operatorId),
  );

  // ── pending trials + recents ───────────────────────────────
  const pendingTrialIds = trials
    .filter((t) => !TERMINAL_STATUSES.has(t.status))
    .map((t) => t.trialId);

  const recentTrials = [...trials]
    .sort((a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt)
    .slice(0, 16);

  // ── aggregates ─────────────────────────────────────────────
  const followThroughTotal = trials.filter((t) => FOLLOW_THROUGH_STATUSES.has(t.status)).length;
  const overallFollowThroughRate = trials.length === 0 ? 0 : r2(followThroughTotal / trials.length);
  const overallOutcomeAttachmentRate = trials.length === 0
    ? 0
    : r2(statusBreakdown.outcomeAttached / trials.length);

  return {
    totalTrials: trials.length,
    statusBreakdown,
    perMutationChoices,
    perFormulaChoices,
    operatorActivity,
    pendingTrialIds,
    recentTrials,
    overallFollowThroughRate,
    overallOutcomeAttachmentRate,
    reasonCodes: [
      `total:${trials.length}`,
      `proposed:${statusBreakdown.proposed}`,
      `approved:${statusBreakdown.approved}`,
      `rejected:${statusBreakdown.rejected}`,
      `tested:${statusBreakdown.tested}`,
      `outcome-attached:${statusBreakdown.outcomeAttached}`,
      `follow-through-rate:${overallFollowThroughRate}`,
      `outcome-attachment-rate:${overallOutcomeAttachmentRate}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
