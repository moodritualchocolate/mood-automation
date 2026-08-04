/**
 * OPERATOR CALIBRATION RECONCILIATION LONGITUDINAL VIEW
 *
 * Read-only analyzer. Surfaces:
 *   - highest agreement projection types
 *   - strongest operator intuition domains
 *   - weakest operator intuition domains
 *   - improving alignment trends
 *   - chronic disagreement patterns
 *   - operator-overtrust patterns
 *   - operator-undertrust patterns
 *   - convergence trajectories
 *   - divergence heatmaps
 *   - operator-vs-system evolution
 *   - fatigue-state reconciliation
 *   - trust-state reconciliation
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  OperatorCalibrationReconciliationMemoryState,
} from './operatorCalibrationReconciliationMemory';
import type {
  OperatorCalibrationReconciliationReport,
  OperatorCalibrationReconciliation,
  ReconciliationRelationshipType,
} from './operatorCalibrationReconciliation';

// ─── shape ─────────────────────────────────────────────────────

export interface AgreementRow {
  projectionType: string;
  agreement: number;
  relationship: ReconciliationRelationshipType;
}

export interface IntuitionRankingRow {
  projectionType: string;
  trustSensitivity: number;
  fatigueSensitivity: number;
  durabilitySensitivity: number;
  compositeAccuracy: number;
}

export interface RelationshipFrequencyRow {
  projectionType: string;
  dominantRelationship: ReconciliationRelationshipType;
  count: number;
  totalSnapshots: number;
}

export interface DivergenceHeatmapRow {
  projectionType: string;
  trajectory: number[];     // deltas over recent window
  averageAbsDelta: number;
}

export interface OperatorEvolutionRow {
  operatorId: string;
  totalSnapshots: number;
  recentAlignmentTrend: 'improving' | 'degrading' | 'stable' | 'establishing';
}

export type ReconciliationTrend =
  | 'no-history' | 'establishing'
  | 'agreement-improving' | 'agreement-degrading' | 'agreement-stable';

export interface OperatorCalibrationReconciliationLongitudinalView {
  present: boolean;
  statement: string;
  trend: ReconciliationTrend;
  /** The prominent notice rendered first in the panel. */
  observationOnlyNotice: string;

  totalSnapshots: number;
  operatorId: string;

  current: OperatorCalibrationReconciliationReport | null;

  highestAgreement: AgreementRow[];
  chronicDisagreement: AgreementRow[];

  strongestIntuitionDomains: IntuitionRankingRow[];
  weakestIntuitionDomains: IntuitionRankingRow[];

  improvingAlignmentTypes: RelationshipFrequencyRow[];
  unstableIntuitionTypes: RelationshipFrequencyRow[];
  overtrustPatterns: RelationshipFrequencyRow[];
  undertrustPatterns: RelationshipFrequencyRow[];

  divergenceHeatmap: DivergenceHeatmapRow[];
  operatorEvolution: OperatorEvolutionRow[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── derivations ──────────────────────────────────────────────

function classifyTrend(
  state: OperatorCalibrationReconciliationMemoryState,
  operatorId: string,
): ReconciliationTrend {
  if (state.totalSnapshots === 0) return 'no-history';
  const opSnapshots = state.snapshots.filter((s) => s.operatorId === operatorId);
  if (opSnapshots.length < 4) return 'establishing';
  // Average agreement across early vs recent.
  const tail = opSnapshots.slice(-12);
  const half = Math.floor(tail.length / 2);
  const earlyAgreement = avg(tail.slice(0, half).flatMap((s) =>
    Object.values(s.perTypeSummary).map((r) => r.agreement)));
  const recentAgreement = avg(tail.slice(half).flatMap((s) =>
    Object.values(s.perTypeSummary).map((r) => r.agreement)));
  const delta = recentAgreement - earlyAgreement;
  if (delta > 0.6) return 'agreement-improving';
  if (delta < -0.6) return 'agreement-degrading';
  return 'agreement-stable';
}

function highestAgreement(report: OperatorCalibrationReconciliationReport | null): AgreementRow[] {
  if (!report) return [];
  return report.reconciliations
    .filter((r) => r.agreementLevel >= 6)
    .map((r) => ({
      projectionType: r.projectionType,
      agreement: r.agreementLevel,
      relationship: r.relationshipType,
    }))
    .sort((a, b) => b.agreement - a.agreement)
    .slice(0, 5);
}

function chronicDisagreement(report: OperatorCalibrationReconciliationReport | null): AgreementRow[] {
  if (!report) return [];
  return report.reconciliations
    .filter((r) => r.agreementLevel <= 5)
    .map((r) => ({
      projectionType: r.projectionType,
      agreement: r.agreementLevel,
      relationship: r.relationshipType,
    }))
    .sort((a, b) => a.agreement - b.agreement)
    .slice(0, 5);
}

function intuitionRankingRow(r: OperatorCalibrationReconciliation): IntuitionRankingRow {
  return {
    projectionType: r.projectionType,
    trustSensitivity: r.operatorAccuracy.trustSensitivity,
    fatigueSensitivity: r.operatorAccuracy.fatigueSensitivity,
    durabilitySensitivity: r.operatorAccuracy.durabilitySensitivity,
    compositeAccuracy: round1(
      (r.operatorAccuracy.trustSensitivity +
       r.operatorAccuracy.fatigueSensitivity +
       r.operatorAccuracy.durabilitySensitivity) / 3,
    ),
  };
}

function strongestIntuitionDomains(report: OperatorCalibrationReconciliationReport | null): IntuitionRankingRow[] {
  if (!report) return [];
  return report.reconciliations
    .map(intuitionRankingRow)
    .filter((r) => r.compositeAccuracy >= 6)
    .sort((a, b) => b.compositeAccuracy - a.compositeAccuracy)
    .slice(0, 5);
}

function weakestIntuitionDomains(report: OperatorCalibrationReconciliationReport | null): IntuitionRankingRow[] {
  if (!report) return [];
  return report.reconciliations
    .map(intuitionRankingRow)
    .filter((r) => r.compositeAccuracy <= 4)
    .sort((a, b) => a.compositeAccuracy - b.compositeAccuracy)
    .slice(0, 4);
}

function relationshipFrequencyRows(
  state: OperatorCalibrationReconciliationMemoryState,
  operatorId: string,
  target: ReconciliationRelationshipType,
): RelationshipFrequencyRow[] {
  const out: RelationshipFrequencyRow[] = [];
  for (const [key, counts] of Object.entries(state.relationshipCounts)) {
    const [opId, projectionType] = key.split('|');
    if (opId !== operatorId) continue;
    const targetCount = counts[target] ?? 0;
    if (targetCount === 0) continue;
    const totalForType = Object.values(counts).reduce((a, b) => a + b, 0);
    // Only include if target is the dominant relationship.
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!dominant || dominant[0] !== target) continue;
    out.push({
      projectionType,
      dominantRelationship: target,
      count: targetCount,
      totalSnapshots: totalForType,
    });
  }
  return out.sort((a, b) => b.count - a.count).slice(0, 5);
}

function divergenceHeatmap(
  state: OperatorCalibrationReconciliationMemoryState,
  operatorId: string,
): DivergenceHeatmapRow[] {
  const out: DivergenceHeatmapRow[] = [];
  for (const [key, trajectory] of Object.entries(state.perTypeTrajectory)) {
    const [opId, projectionType] = key.split('|');
    if (opId !== operatorId) continue;
    if (trajectory.length < 2) continue;
    const recent = trajectory.slice(-12);
    const averageAbsDelta = round1(
      avg(recent.map((p) => Math.abs(p.delta))),
    );
    out.push({
      projectionType,
      trajectory: recent.map((p) => round1(p.delta)),
      averageAbsDelta,
    });
  }
  return out.sort((a, b) => b.averageAbsDelta - a.averageAbsDelta).slice(0, 6);
}

function operatorEvolution(
  state: OperatorCalibrationReconciliationMemoryState,
): OperatorEvolutionRow[] {
  const out: OperatorEvolutionRow[] = [];
  for (const [operatorId, count] of Object.entries(state.operatorUpdateCounts)) {
    const opSnaps = state.snapshots.filter((s) => s.operatorId === operatorId);
    let trend: OperatorEvolutionRow['recentAlignmentTrend'] = 'establishing';
    if (opSnaps.length >= 4) {
      const tail = opSnaps.slice(-12);
      const half = Math.floor(tail.length / 2);
      const earlyAg = avg(tail.slice(0, half).flatMap((s) =>
        Object.values(s.perTypeSummary).map((r) => r.agreement)));
      const recentAg = avg(tail.slice(half).flatMap((s) =>
        Object.values(s.perTypeSummary).map((r) => r.agreement)));
      const d = recentAg - earlyAg;
      if (d > 0.6) trend = 'improving';
      else if (d < -0.6) trend = 'degrading';
      else trend = 'stable';
    }
    out.push({
      operatorId,
      totalSnapshots: count,
      recentAlignmentTrend: trend,
    });
  }
  return out.sort((a, b) => b.totalSnapshots - a.totalSnapshots).slice(0, 5);
}

// ─── main builder ──────────────────────────────────────────────

export interface OperatorCalibrationReconciliationViewInput {
  memory: OperatorCalibrationReconciliationMemoryState | null;
  current?: OperatorCalibrationReconciliationReport | null;
  operatorId: string;
}

export const RECONCILIATION_OBSERVATION_NOTICE =
  'The system does not decide who is correct. It only observes agreement ' +
  'patterns between operator intuition and historical evidence.';

export function buildOperatorCalibrationReconciliationLongitudinalView(
  input: OperatorCalibrationReconciliationViewInput,
): OperatorCalibrationReconciliationLongitudinalView {
  const mem = input.memory;
  const current = input.current ?? null;
  const operatorId = input.operatorId;

  if (!mem || mem.totalSnapshots === 0) {
    return {
      present: !!current && current.totalReconciliations > 0,
      statement: current && current.totalReconciliations > 0
        ? `reconciliation baseline emerging — ${current.totalReconciliations} projection type(s) measured for "${operatorId}"`
        : 'no reconciliation history yet — operator intuition vs historical evidence has not been compared',
      trend: 'no-history',
      observationOnlyNotice: RECONCILIATION_OBSERVATION_NOTICE,
      totalSnapshots: 0,
      operatorId,
      current,
      highestAgreement: highestAgreement(current),
      chronicDisagreement: chronicDisagreement(current),
      strongestIntuitionDomains: strongestIntuitionDomains(current),
      weakestIntuitionDomains: weakestIntuitionDomains(current),
      improvingAlignmentTypes: [],
      unstableIntuitionTypes: [],
      overtrustPatterns: [],
      undertrustPatterns: [],
      divergenceHeatmap: [],
      operatorEvolution: [],
    };
  }

  const trend = classifyTrend(mem, operatorId);

  const statement = (() => {
    switch (trend) {
      case 'agreement-improving':
        return `operator-vs-system agreement improving across ${mem.totalSnapshots} snapshot(s) for "${operatorId}"`;
      case 'agreement-degrading':
        return `operator-vs-system agreement degrading across ${mem.totalSnapshots} snapshot(s) for "${operatorId}"`;
      case 'agreement-stable':
        return `operator-vs-system agreement stable across ${mem.totalSnapshots} snapshot(s) for "${operatorId}"`;
      default:
        return `establishing reconciliation baseline for "${operatorId}" — ${mem.totalSnapshots} snapshot(s) recorded`;
    }
  })();

  return {
    present: true,
    statement,
    trend,
    observationOnlyNotice: RECONCILIATION_OBSERVATION_NOTICE,
    totalSnapshots: mem.totalSnapshots,
    operatorId,
    current,
    highestAgreement: highestAgreement(current),
    chronicDisagreement: chronicDisagreement(current),
    strongestIntuitionDomains: strongestIntuitionDomains(current),
    weakestIntuitionDomains: weakestIntuitionDomains(current),
    improvingAlignmentTypes: relationshipFrequencyRows(mem, operatorId, 'improving-alignment'),
    unstableIntuitionTypes:  relationshipFrequencyRows(mem, operatorId, 'unstable-intuition'),
    overtrustPatterns:       relationshipFrequencyRows(mem, operatorId, 'historically-overconfident'),
    undertrustPatterns:      relationshipFrequencyRows(mem, operatorId, 'historically-underconfident'),
    divergenceHeatmap: divergenceHeatmap(mem, operatorId),
    operatorEvolution: operatorEvolution(mem),
  };
}
