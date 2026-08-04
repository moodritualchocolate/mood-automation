/**
 * TRIAL OUTCOME ANALYZER (pure, observational)
 *
 * Joins operator creative trials with operator-supplied outcome
 * records and analyzes the relationship between trial decisions and
 * what was observed afterward.
 *
 * STRICT CONTRACT:
 *   - never selects a winner
 *   - never picks a "best" mutation type
 *   - never recommends a candidate
 *   - allowed phrasing only:
 *       "observed alongside", "historically associated",
 *       "operator-reported", "outcome-attached"
 */

import type { OperatorCreativeTrial } from './operatorCreativeTrialMemory';
import type { TrialOutcomeRecord } from './trialOutcomeMemory';

// ─── output ───────────────────────────────────────────────────

export interface TrialOutcomeLink {
  trialId: string;
  mutationType: string;
  formula: string;
  campaignMode: string | null;
  operatorId: string;
  trialStatus: string;
  outcomeCount: number;
  /** Outcome ids attached to this trial. */
  outcomeIds: string[];
  /** Outcome labels observed across this trial's outcomes. */
  observedLabels: string[];
  /** Platforms observed for this trial's outcomes. */
  platformsObserved: string[];
  audienceSegmentsObserved: string[];
}

export interface MutationOutcomeCount {
  mutationType: string;
  trialsWithOutcomes: number;
  totalOutcomes: number;
  /** Labels observed across all outcomes for this mutation type. */
  observedLabelDistribution: Record<string, number>;
  /** Top-3 labels by count. */
  dominantLabels: string[];
}

export interface FormulaOutcomeTendency {
  formula: string;
  trialsWithOutcomes: number;
  totalOutcomes: number;
  averageEngagement: number;
  /** Top outcome labels observed alongside this formula. */
  dominantLabels: string[];
}

export interface CampaignModeTendency {
  campaignMode: string;
  totalOutcomes: number;
  fatigueShare: number;        // 0..1
  resonanceShare: number;      // 0..1
  notes: string[];
}

export interface OperatorFollowThrough {
  operatorId: string;
  totalTrials: number;
  trialsWithOutcomes: number;
  followThroughRate: number;
}

export interface SandboxVsRealityRow {
  mutationType: string;
  trialsProposed: number;
  trialsWithOutcomes: number;
  /** Share of proposed trials that ultimately received outcome data. */
  reportingRate: number;
  observedLabelCount: number;
}

export interface TrialOutcomeAnalysis {
  totalTrials: number;
  totalOutcomes: number;
  /** Trials with one-or-more outcomes attached. */
  trialOutcomeLinks: TrialOutcomeLink[];
  /** Trials with no outcomes yet. */
  orphanTrialIds: string[];
  /** Outcomes that reference a trialId we cannot find. */
  unmatchedOutcomeIds: string[];
  perMutationCounts: MutationOutcomeCount[];
  perFormulaTendencies: FormulaOutcomeTendency[];
  perCampaignModeTendencies: CampaignModeTendency[];
  perOperatorFollowThrough: OperatorFollowThrough[];
  sandboxVsReality: SandboxVsRealityRow[];
  overallReportingRate: number;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the analyzer joins operator-reported trial outcomes ' +
  'with operator-approved trials. Phrasing is restricted to "observed alongside" ' +
  'and "historically associated". The system never selects a winner.';

// ─── helpers ──────────────────────────────────────────────────

function r2(n: number): number { return Math.round(n * 100) / 100; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }

function engagementScore(o: TrialOutcomeRecord): number {
  const m = o.metrics ?? {};
  const saves = Math.min(1, (m.saves ?? 0) / 10);
  const comments = Math.min(1, (m.comments ?? 0) / 20);
  const shares = Math.min(1, (m.shares ?? 0) / 10);
  return clamp10(((m.retention ?? 0) * 0.4 + (m.scrollDepth ?? 0) * 0.15 +
    saves * 0.15 + comments * 0.1 + shares * 0.1 + (1 - (m.bounceRate ?? 0)) * 0.1) * 10);
}

const FATIGUE_LABEL_TOKENS = /fatigue|burnout|retention-decay|hook-collapse|visual-fatigue|exhaust/i;
const RESONANCE_LABEL_TOKENS = /resonance|trust-formation|replay|emotional-stillness|identity-reinforcement/i;

// ─── main ─────────────────────────────────────────────────────

export function analyzeTrialOutcomes(
  trials: OperatorCreativeTrial[],
  outcomes: TrialOutcomeRecord[],
): TrialOutcomeAnalysis {
  const outcomesByTrial = new Map<string, TrialOutcomeRecord[]>();
  for (const o of outcomes) {
    if (!outcomesByTrial.has(o.trialId)) outcomesByTrial.set(o.trialId, []);
    outcomesByTrial.get(o.trialId)!.push(o);
  }
  const trialIds = new Set(trials.map((t) => t.trialId));

  // ── per-trial links ───────────────────────────────────────
  const trialOutcomeLinks: TrialOutcomeLink[] = [];
  const orphanTrialIds: string[] = [];
  for (const t of trials) {
    const linked = outcomesByTrial.get(t.trialId) ?? [];
    if (linked.length === 0) {
      orphanTrialIds.push(t.trialId);
      continue;
    }
    const observedLabels = Array.from(new Set(linked.flatMap((o) => o.outcomeLabels)));
    const platformsObserved = Array.from(new Set(linked.map((o) => o.platform)));
    const audienceSegmentsObserved = Array.from(new Set(linked.map((o) => o.audienceSegment)));
    trialOutcomeLinks.push({
      trialId: t.trialId,
      mutationType: t.mutationType,
      formula: t.formula,
      campaignMode: t.campaignMode,
      operatorId: t.operatorId,
      trialStatus: t.status,
      outcomeCount: linked.length,
      outcomeIds: linked.map((o) => o.outcomeId),
      observedLabels: observedLabels.sort(),
      platformsObserved: platformsObserved.sort(),
      audienceSegmentsObserved: audienceSegmentsObserved.sort(),
    });
  }

  const unmatchedOutcomeIds = outcomes
    .filter((o) => !trialIds.has(o.trialId))
    .map((o) => o.outcomeId);

  // ── per-mutation counts ────────────────────────────────────
  const perMutationMap = new Map<string, { trials: Set<string>; outcomes: TrialOutcomeRecord[] }>();
  for (const t of trials) {
    if (!perMutationMap.has(t.mutationType)) {
      perMutationMap.set(t.mutationType, { trials: new Set(), outcomes: [] });
    }
    const bucket = perMutationMap.get(t.mutationType)!;
    const linked = outcomesByTrial.get(t.trialId) ?? [];
    if (linked.length > 0) bucket.trials.add(t.trialId);
    bucket.outcomes.push(...linked);
  }
  const perMutationCounts: MutationOutcomeCount[] = [];
  for (const [mutationType, bucket] of perMutationMap) {
    const labelCounts: Record<string, number> = {};
    for (const o of bucket.outcomes) {
      for (const l of o.outcomeLabels) labelCounts[l] = (labelCounts[l] ?? 0) + 1;
    }
    const sortedLabels = Object.entries(labelCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k)
      .slice(0, 3);
    perMutationCounts.push({
      mutationType,
      trialsWithOutcomes: bucket.trials.size,
      totalOutcomes: bucket.outcomes.length,
      observedLabelDistribution: labelCounts,
      dominantLabels: sortedLabels,
    });
  }
  perMutationCounts.sort((a, b) =>
    b.totalOutcomes - a.totalOutcomes ||
    a.mutationType.localeCompare(b.mutationType),
  );

  // ── per-formula tendencies ─────────────────────────────────
  const perFormulaMap = new Map<string, { trialsWithOutcomes: Set<string>; outcomes: TrialOutcomeRecord[] }>();
  for (const t of trials) {
    if (!perFormulaMap.has(t.formula)) {
      perFormulaMap.set(t.formula, { trialsWithOutcomes: new Set(), outcomes: [] });
    }
    const bucket = perFormulaMap.get(t.formula)!;
    const linked = outcomesByTrial.get(t.trialId) ?? [];
    if (linked.length > 0) bucket.trialsWithOutcomes.add(t.trialId);
    bucket.outcomes.push(...linked);
  }
  const perFormulaTendencies: FormulaOutcomeTendency[] = [];
  for (const [formula, bucket] of perFormulaMap) {
    const labelCounts: Record<string, number> = {};
    for (const o of bucket.outcomes) {
      for (const l of o.outcomeLabels) labelCounts[l] = (labelCounts[l] ?? 0) + 1;
    }
    const dominantLabels = Object.entries(labelCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k)
      .slice(0, 3);
    perFormulaTendencies.push({
      formula,
      trialsWithOutcomes: bucket.trialsWithOutcomes.size,
      totalOutcomes: bucket.outcomes.length,
      averageEngagement: bucket.outcomes.length === 0
        ? 0
        : r2(avg(bucket.outcomes.map(engagementScore))),
      dominantLabels,
    });
  }
  perFormulaTendencies.sort((a, b) =>
    b.totalOutcomes - a.totalOutcomes ||
    a.formula.localeCompare(b.formula),
  );

  // ── per-campaign-mode fatigue / resonance tendency ─────────
  const perModeMap = new Map<string, TrialOutcomeRecord[]>();
  for (const t of trials) {
    const mode = t.campaignMode ?? 'AUTO';
    const linked = outcomesByTrial.get(t.trialId) ?? [];
    if (linked.length === 0) continue;
    if (!perModeMap.has(mode)) perModeMap.set(mode, []);
    perModeMap.get(mode)!.push(...linked);
  }
  const perCampaignModeTendencies: CampaignModeTendency[] = [];
  for (const [campaignMode, records] of perModeMap) {
    const fatigueCount = records.filter((r) =>
      r.outcomeLabels.some((l) => FATIGUE_LABEL_TOKENS.test(l)),
    ).length;
    const resonanceCount = records.filter((r) =>
      r.outcomeLabels.some((l) => RESONANCE_LABEL_TOKENS.test(l)),
    ).length;
    const notes: string[] = [];
    if (records.length >= 3 && fatigueCount / records.length >= 0.4) {
      notes.push(`${campaignMode} historically associated with fatigue-class outcomes`);
    }
    if (records.length >= 3 && resonanceCount / records.length >= 0.4) {
      notes.push(`${campaignMode} observed alongside resonance-class outcomes`);
    }
    perCampaignModeTendencies.push({
      campaignMode,
      totalOutcomes: records.length,
      fatigueShare: records.length === 0 ? 0 : r2(fatigueCount / records.length),
      resonanceShare: records.length === 0 ? 0 : r2(resonanceCount / records.length),
      notes,
    });
  }
  perCampaignModeTendencies.sort((a, b) =>
    b.totalOutcomes - a.totalOutcomes ||
    a.campaignMode.localeCompare(b.campaignMode),
  );

  // ── per-operator follow-through ────────────────────────────
  const perOperator = new Map<string, { trials: Set<string>; trialsWithOutcomes: Set<string> }>();
  for (const t of trials) {
    if (!perOperator.has(t.operatorId)) perOperator.set(t.operatorId, { trials: new Set(), trialsWithOutcomes: new Set() });
    const b = perOperator.get(t.operatorId)!;
    b.trials.add(t.trialId);
    if ((outcomesByTrial.get(t.trialId)?.length ?? 0) > 0) b.trialsWithOutcomes.add(t.trialId);
  }
  const perOperatorFollowThrough: OperatorFollowThrough[] = [];
  for (const [operatorId, b] of perOperator) {
    const total = b.trials.size;
    const withOutcomes = b.trialsWithOutcomes.size;
    perOperatorFollowThrough.push({
      operatorId, totalTrials: total,
      trialsWithOutcomes: withOutcomes,
      followThroughRate: total === 0 ? 0 : r2(withOutcomes / total),
    });
  }
  perOperatorFollowThrough.sort((a, b) =>
    b.totalTrials - a.totalTrials ||
    a.operatorId.localeCompare(b.operatorId),
  );

  // ── sandbox-estimate vs reality ────────────────────────────
  // Aggregate per-mutationType: how many trials proposed, how many
  // ultimately received outcomes. Reporting rate is the only join
  // signal — no quality or "winner" comparison is computed.
  const proposedByMutation = new Map<string, number>();
  for (const t of trials) {
    proposedByMutation.set(t.mutationType, (proposedByMutation.get(t.mutationType) ?? 0) + 1);
  }
  const sandboxVsReality: SandboxVsRealityRow[] = [];
  for (const [mutationType, trialsProposed] of proposedByMutation) {
    const bucket = perMutationMap.get(mutationType) ?? { trials: new Set<string>(), outcomes: [] as TrialOutcomeRecord[] };
    const observedLabelCount = Object.keys(
      bucket.outcomes.reduce<Record<string, number>>((acc, o) => {
        for (const l of o.outcomeLabels) acc[l] = (acc[l] ?? 0) + 1;
        return acc;
      }, {}),
    ).length;
    sandboxVsReality.push({
      mutationType,
      trialsProposed,
      trialsWithOutcomes: bucket.trials.size,
      reportingRate: trialsProposed === 0 ? 0 : r2(bucket.trials.size / trialsProposed),
      observedLabelCount,
    });
  }
  sandboxVsReality.sort((a, b) =>
    b.trialsProposed - a.trialsProposed ||
    a.mutationType.localeCompare(b.mutationType),
  );

  const trialsWithAnyOutcome = trials.filter((t) => (outcomesByTrial.get(t.trialId)?.length ?? 0) > 0).length;
  const overallReportingRate = trials.length === 0
    ? 0
    : r2(trialsWithAnyOutcome / trials.length);

  return {
    totalTrials: trials.length,
    totalOutcomes: outcomes.length,
    trialOutcomeLinks,
    orphanTrialIds,
    unmatchedOutcomeIds,
    perMutationCounts,
    perFormulaTendencies,
    perCampaignModeTendencies,
    perOperatorFollowThrough,
    sandboxVsReality,
    overallReportingRate,
    reasonCodes: [
      `trials:${trials.length}`,
      `outcomes:${outcomes.length}`,
      `trial-outcome-links:${trialOutcomeLinks.length}`,
      `orphan-trials:${orphanTrialIds.length}`,
      `unmatched-outcomes:${unmatchedOutcomeIds.length}`,
      `overall-reporting-rate:${overallReportingRate}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
