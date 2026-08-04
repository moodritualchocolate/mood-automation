/**
 * LONGITUDINAL QUALITY VIEW (Phase Next)
 *
 * Pure read-only view-model builder. Joins three persistent sources:
 *   - data/memory/ad-strategy-memory.json
 *   - data/memory/copywriter-memory.json
 *   - data/memory/copy-quality-memory.json
 *
 * Produces a calm brand-health snapshot — trust + dignity trends,
 * repetition pressure, audience fatigue ranking, forbidden-trigger
 * leaderboard, mirror success rate, and per-axis quality averages.
 *
 * NOT analytics. NOT a gate. NOT a critic input. Deterministic.
 */

import type {
  AdStrategyMemoryState, AudienceArchetype, RiskSample,
} from './adStrategyMemory';
import type { CopywriterMemoryState } from './copywriterMemory';
import type { CopyQualityMemoryState, CopyQualitySample } from './copyQualityMemory';

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── shape ─────────────────────────────────────────────────────

export type QualityDriftStatus =
  | 'no-history'
  | 'establishing'
  | 'healthy'
  | 'cautious'
  | 'eroding'
  | 'critical';

export interface TrendPoint {
  at: number;
  value: number;
}

export interface AudienceFatigueRow {
  audience: AudienceArchetype;
  usageCount: number;
  recency: number;
}

export interface ForbiddenTriggerRow {
  phrase: string;
  count: number;
  lastAt: number;
}

export interface AxisAverageRow {
  axis: 'copyIntegrity' | 'trustSafety' | 'dignitySafety' | 'repetitionConcern'
      | 'proofAdequacy' | 'ctaRestraint' | 'hebrewNaturalness' | 'strategicCopyFit';
  averageRecent: number;       // recent N samples
  averageOverall: number;
  /** Difference between recent and overall averages — signed drift. */
  driftRecentVsOverall: number;
}

export interface QualityLongitudinalView {
  present: boolean;
  driftStatus: QualityDriftStatus;
  statement: string;

  // Current snapshot values
  trustDebtCurrent: number;
  brandDignityCurrent: number;
  dignityErosionCurrent: number;
  repeatedStructuresCurrent: number;

  // Trend timeseries (short, capped)
  trustDebtTrend: TrendPoint[];
  brandRiskTrend: TrendPoint[];
  repetitionRiskTrend: TrendPoint[];
  copyIntegrityTrend: TrendPoint[];
  repetitionConcernTrend: TrendPoint[];
  proofAdequacyTrend: TrendPoint[];
  hebrewNaturalnessTrend: TrendPoint[];
  strategicCopyFitTrend: TrendPoint[];

  // Aggregates
  audienceFatigueRanking: AudienceFatigueRow[];
  topForbiddenTriggers: ForbiddenTriggerRow[];
  mirrorSuccessRate: number;          // 0..1 — mirrors per copies produced
  mirrorCount: number;
  totalCopiesProduced: number;
  totalStrategyAssessments: number;
  totalCopyQualitySamples: number;

  // Per-axis averages + drift
  axisAverages: AxisAverageRow[];
}

// ─── helpers ──────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function riskSamplesToPoints(samples: RiskSample[], field: 'trustDebt' | 'brandRisk' | 'repetitionRisk'): TrendPoint[] {
  return samples.slice(-16).map((s) => ({ at: s.at, value: s[field] }));
}

function qualitySamplesToPoints(samples: CopyQualitySample[], field: keyof CopyQualitySample): TrendPoint[] {
  return samples.slice(-16)
    .filter((s) => typeof s[field] === 'number')
    .map((s) => ({ at: s.at, value: s[field] as number }));
}

function rankAudienceFatigue(memory: AdStrategyMemoryState): AudienceFatigueRow[] {
  return Object.values(memory.audienceFatigue)
    .filter((r) => r.usageCount > 0)
    .map((r) => ({ audience: r.audience, usageCount: r.usageCount, recency: round2(r.recency) }))
    .sort((a, b) =>
      b.usageCount !== a.usageCount
        ? b.usageCount - a.usageCount
        : b.recency - a.recency,
    )
    .slice(0, 6);
}

function rankForbiddenTriggers(memory: CopywriterMemoryState): ForbiddenTriggerRow[] {
  const counts = new Map<string, { count: number; lastAt: number }>();
  for (const trig of memory.forbiddenTriggers) {
    const cur = counts.get(trig.phrase) ?? { count: 0, lastAt: 0 };
    counts.set(trig.phrase, {
      count: cur.count + 1,
      lastAt: Math.max(cur.lastAt, trig.at),
    });
  }
  return [...counts.entries()]
    .map(([phrase, v]) => ({ phrase, count: v.count, lastAt: v.lastAt }))
    .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
    .slice(0, 6);
}

function axisAverages(samples: CopyQualitySample[]): AxisAverageRow[] {
  if (samples.length === 0) return [];
  const recent = samples.slice(-8);
  const fields: AxisAverageRow['axis'][] = [
    'copyIntegrity', 'trustSafety', 'dignitySafety', 'repetitionConcern',
    'proofAdequacy', 'ctaRestraint', 'hebrewNaturalness', 'strategicCopyFit',
  ];
  return fields.map((field) => {
    const recentAvg = round1(avg(recent.map((s) => s[field] as number)));
    const overallAvg = round1(avg(samples.map((s) => s[field] as number)));
    return { axis: field, averageRecent: recentAvg, averageOverall: overallAvg, driftRecentVsOverall: round1(recentAvg - overallAvg) };
  });
}

// ─── drift classification ────────────────────────────────────

function classifyDrift(
  strategy: AdStrategyMemoryState | null,
  copywriter: CopywriterMemoryState | null,
  quality: CopyQualityMemoryState | null,
): { status: QualityDriftStatus; statement: string } {
  const totalAssessments = strategy?.totalAssessments ?? 0;
  const totalQuality = quality?.totalSamples ?? 0;
  if (totalAssessments === 0 && totalQuality === 0) {
    return { status: 'no-history', statement: 'not enough history yet — generate a few banners to populate the brand health monitor' };
  }
  if (totalAssessments < 3 || totalQuality < 3) {
    return { status: 'establishing', statement: `establishing baseline — ${totalAssessments} strategy assessment(s), ${totalQuality} quality sample(s) recorded` };
  }
  const trustDebt = strategy?.trustDebt ?? 0;
  const dignity   = strategy?.brandDignityScore ?? 7;
  const erosion   = copywriter?.dignityErosionScore ?? 0;
  const structure = copywriter?.repeatedStructuresScore ?? 0;
  const recentSamples = quality?.samples.slice(-8) ?? [];
  const recentIntegrity = avg(recentSamples.map((s) => s.copyIntegrity));

  // CRITICAL: high trust debt + low dignity + low integrity all at once
  if (trustDebt >= 7 && dignity <= 4 && recentIntegrity <= 4) {
    return { status: 'critical', statement: `brand health CRITICAL — trustDebt ${trustDebt}/10, brandDignity ${dignity}/10, recent integrity ${round1(recentIntegrity)}/10` };
  }
  // ERODING: trust debt rising, erosion or structure score elevated
  if (trustDebt >= 5 || erosion >= 4 || (recentIntegrity < 6 && structure >= 3)) {
    return { status: 'eroding', statement: `quality drift detected — trustDebt ${trustDebt}/10, dignityErosion ${erosion}/10, recent integrity ${round1(recentIntegrity)}/10` };
  }
  // CAUTIOUS
  if (trustDebt >= 3 || erosion >= 2 || recentIntegrity < 7) {
    return { status: 'cautious', statement: `cautious — minor pressure on trust/dignity; recent integrity ${round1(recentIntegrity)}/10` };
  }
  return {
    status: 'healthy',
    statement: `brand health steady — trustDebt ${trustDebt}/10, brandDignity ${dignity}/10, recent integrity ${round1(recentIntegrity)}/10 across ${totalQuality} samples`,
  };
}

// ─── main builder ─────────────────────────────────────────────

export interface LongitudinalInput {
  strategy: AdStrategyMemoryState | null;
  copywriter: CopywriterMemoryState | null;
  quality: CopyQualityMemoryState | null;
}

export function buildQualityLongitudinalView(input: LongitudinalInput): QualityLongitudinalView {
  const { strategy, copywriter, quality } = input;
  const { status, statement } = classifyDrift(strategy, copywriter, quality);

  const trustDebtCurrent      = strategy?.trustDebt ?? 0;
  const brandDignityCurrent   = strategy?.brandDignityScore ?? 7;
  const dignityErosionCurrent = copywriter?.dignityErosionScore ?? 0;
  const repeatedStructuresCurrent = copywriter?.repeatedStructuresScore ?? 0;

  const trustDebtTrend         = strategy ? riskSamplesToPoints(strategy.repetitionRiskHistory, 'trustDebt') : [];
  const brandRiskTrend         = strategy ? riskSamplesToPoints(strategy.repetitionRiskHistory, 'brandRisk') : [];
  const repetitionRiskTrend    = strategy ? riskSamplesToPoints(strategy.repetitionRiskHistory, 'repetitionRisk') : [];

  const copyIntegrityTrend     = quality ? qualitySamplesToPoints(quality.samples, 'copyIntegrity')     : [];
  const repetitionConcernTrend = quality ? qualitySamplesToPoints(quality.samples, 'repetitionConcern') : [];
  const proofAdequacyTrend     = quality ? qualitySamplesToPoints(quality.samples, 'proofAdequacy')     : [];
  const hebrewNaturalnessTrend = quality ? qualitySamplesToPoints(quality.samples, 'hebrewNaturalness') : [];
  const strategicCopyFitTrend  = quality ? qualitySamplesToPoints(quality.samples, 'strategicCopyFit')  : [];

  const audienceFatigueRanking = strategy ? rankAudienceFatigue(strategy) : [];
  const topForbiddenTriggers   = copywriter ? rankForbiddenTriggers(copywriter) : [];

  const totalCopies = copywriter?.totalCopiesProduced ?? 0;
  const mirrorCount = copywriter?.successfulMirrors.length ?? 0;
  const mirrorSuccessRate = totalCopies > 0 ? round2(mirrorCount / totalCopies) : 0;

  const axes = quality ? axisAverages(quality.samples) : [];

  return {
    present: status !== 'no-history',
    driftStatus: status,
    statement,

    trustDebtCurrent,
    brandDignityCurrent,
    dignityErosionCurrent,
    repeatedStructuresCurrent,

    trustDebtTrend,
    brandRiskTrend,
    repetitionRiskTrend,
    copyIntegrityTrend,
    repetitionConcernTrend,
    proofAdequacyTrend,
    hebrewNaturalnessTrend,
    strategicCopyFitTrend,

    audienceFatigueRanking,
    topForbiddenTriggers,
    mirrorSuccessRate,
    mirrorCount,
    totalCopiesProduced: totalCopies,
    totalStrategyAssessments: strategy?.totalAssessments ?? 0,
    totalCopyQualitySamples: quality?.totalSamples ?? 0,

    axisAverages: axes,
  };
}
