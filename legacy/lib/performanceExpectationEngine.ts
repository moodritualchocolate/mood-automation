/**
 * PERFORMANCE EXPECTATION ENGINE (pure, observational)
 *
 * Produces DESCRIPTIVE PERFORMANCE BANDS for a campaign plan.
 *
 * IMPORTANT — this engine NEVER predicts performance:
 *   - bands are descriptive ranges, NOT promises
 *   - bands are historically-associated, NOT guarantees
 *   - bands are clamped to coarse industry-norm context, NOT
 *     extrapolation from any single client's history
 *   - the engine never says "you will get X views" — it says
 *     "publications historically observed alongside this structure
 *     have shown engagement in the band Y..Z, requires more
 *     evidence"
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never predicts a metric value
 *   - never guarantees a metric value
 *   - never claims a "best" or "optimal" band
 *   - allowed phrasing: "historically observed alongside",
 *     "may carry memory weight", "operator review required",
 *     "requires more evidence", "descriptive band"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize,
 *     viral, dopamine, outrage, manipulat, exploit
 *
 * The operator validates every band against their own market /
 * platform / audience reality.
 */

import type { Formula } from '@/core/types';
import type { CampaignGoal, CampaignMarket, CampaignPhase } from './campaignPlannerEngine';
import type { PerformanceAnalyzerReading } from './performanceAnalyzer';

// ─── input ────────────────────────────────────────────────────

export interface PerformanceExpectationInput {
  goal: CampaignGoal;
  formula: Formula;
  market: CampaignMarket;
  audience: string;
  budgetUSD: number;
  durationDays: number;
  phases: CampaignPhase[];
  /** Optional prior performance reading the operator may have logged. */
  performanceAnalysis?: PerformanceAnalyzerReading | null;
}

// ─── output ───────────────────────────────────────────────────

export interface Band {
  low: number;
  high: number;
  unit: string;
  /** Plain-language descriptive note. */
  note: string;
  /** "industry-norm" = coarse public norm · "prior-evidence" = anchored
   *  to operator-logged performance · "operator-validates" always. */
  source: 'industry-norm' | 'prior-evidence' | 'mixed';
}

export interface PerformanceExpectationReading {
  /** Per-phase descriptive bands. */
  perPhaseBands: Array<{
    phaseId: CampaignPhase['phaseId'];
    impressionsBand: Band;
    engagementRateBand: Band;
    completionRateBand: Band;
    saveRateBand: Band;
  }>;
  /** Aggregate campaign bands for the full duration. */
  aggregate: {
    impressionsBand: Band;
    engagementRateBand: Band;
    completionRateBand: Band;
    saveRateBand: Band;
    estimatedAssetsExplored: { low: number; high: number };
  };
  /** Disclaimers — surfaced wherever bands are shown. */
  disclaimers: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Performance bands are DESCRIPTIVE only. The engine never predicts, ' +
  'never guarantees, never names an optimal target. The operator validates ' +
  'every band against their own market / platform / audience reality. ' +
  'Human remains final authority.';

const DESCRIPTIVE_DISCLAIMERS = [
  'bands are historically observed alongside similar structures',
  'bands are NOT promises, NOT forecasts, NOT targets',
  'every band requires operator validation against current market reality',
  'system never spends budget · system never publishes · system never auto-approves',
];

// ─── helpers ──────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function r3(n: number): number { return Math.round(n * 1000) / 1000; }

/** Coarse industry-norm bands for engagement rate by channel mix.
 *  These are PUBLICLY observed wide bands — operator validates. */
const NORM_ENGAGEMENT_BAND: Record<CampaignMarket, { low: number; high: number }> = {
  israel: { low: 0.02, high: 0.09 },
  global: { low: 0.015, high: 0.08 },
};
const NORM_COMPLETION_BAND: Record<CampaignMarket, { low: number; high: number }> = {
  israel: { low: 0.20, high: 0.55 },
  global: { low: 0.18, high: 0.50 },
};
const NORM_SAVE_RATE_BAND: Record<CampaignMarket, { low: number; high: number }> = {
  israel: { low: 0.005, high: 0.04 },
  global: { low: 0.004, high: 0.03 },
};

/** Coarse CPM ranges by market — descriptive only, operator validates. */
const NORM_CPM_USD: Record<CampaignMarket, { low: number; high: number }> = {
  israel: { low: 2.0, high: 8.0 },
  global: { low: 3.0, high: 12.0 },
};

function phaseGoalEngagementBias(goal: CampaignGoal, phaseId: CampaignPhase['phaseId']): { lo: number; hi: number } {
  // Multipliers on the norm band. Coarse descriptive only.
  if (goal === 'audience-retention' || goal === 'community-build') {
    if (phaseId === 'continuation' || phaseId === 'observation') return { lo: 1.0, hi: 1.2 };
  }
  if (goal === 'reactivation' && phaseId === 'invitation') return { lo: 0.9, hi: 1.1 };
  if (goal === 'product-trial' && phaseId === 'invitation') return { lo: 1.0, hi: 1.15 };
  return { lo: 0.85, hi: 1.0 };
}

function bandFromNorm(
  baseLow: number, baseHigh: number, biasLo: number, biasHi: number,
  unit: string, source: Band['source'], note: string,
): Band {
  const low = clamp(baseLow * biasLo, 0, 10);
  const high = clamp(baseHigh * biasHi, 0, 10);
  return {
    low: unit === '%' ? r1(low * 100) : (unit.includes('rate') ? r3(low) : r1(low)),
    high: unit === '%' ? r1(high * 100) : (unit.includes('rate') ? r3(high) : r1(high)),
    unit,
    note,
    source,
  };
}

/** Anchor bands toward operator-logged performance when available. */
function anchorBandWithPrior(band: Band, prior: number | null): Band {
  if (prior == null || !Number.isFinite(prior) || prior <= 0) return band;
  // Soft anchor — shift the band toward the prior mean by ~30%.
  const center = (band.low + band.high) / 2;
  const shift = (prior - center) * 0.3;
  return {
    ...band,
    low: r3(Math.max(0, band.low + shift)),
    high: r3(Math.max(0, band.high + shift)),
    source: 'mixed',
    note: band.note + ' · anchored softly to operator-logged prior',
  };
}

/** Coarse impressions band derived from paid-media spend and CPM range. */
function impressionsBandFromBudget(paidMediaUSD: number, market: CampaignMarket, note: string): Band {
  const cpmLow = NORM_CPM_USD[market].low;
  const cpmHigh = NORM_CPM_USD[market].high;
  if (paidMediaUSD <= 0) {
    return {
      low: 0, high: 0,
      unit: 'impressions',
      note: 'paid-media spend is 0 — descriptive band is 0 · organic reach not estimated',
      source: 'industry-norm',
    };
  }
  // impressions = spend / CPM × 1000  (higher cpm → fewer impressions)
  const low = (paidMediaUSD / cpmHigh) * 1000;
  const high = (paidMediaUSD / cpmLow) * 1000;
  return {
    low: Math.round(low),
    high: Math.round(high),
    unit: 'impressions',
    note,
    source: 'industry-norm',
  };
}

// ─── main ─────────────────────────────────────────────────────

export function buildPerformanceExpectation(
  input: PerformanceExpectationInput,
): PerformanceExpectationReading {
  // Prior-evidence anchors — only used when operator has logged enough perf data.
  let priorEngagement: number | null = null;
  let priorCompletion: number | null = null;
  let priorSaveRate: number | null = null;
  if (input.performanceAnalysis && input.performanceAnalysis.totalPerformances >= 3) {
    const allChannels = input.performanceAnalysis.perChannel;
    if (allChannels.length > 0) {
      priorEngagement = allChannels.reduce((a, c) => a + c.averageEngagementRate, 0) / allChannels.length;
      priorCompletion = allChannels.reduce((a, c) => a + c.averageCompletionRate, 0) / allChannels.length;
    }
  }

  // Per-phase bands.
  const perPhaseBands = input.phases.map((phase) => {
    const bias = phaseGoalEngagementBias(input.goal, phase.phaseId);
    const engNorm = NORM_ENGAGEMENT_BAND[input.market];
    const cmpNorm = NORM_COMPLETION_BAND[input.market];
    const savNorm = NORM_SAVE_RATE_BAND[input.market];
    const phasePaidShare = phase.budgetShare; // operator pays manually
    const phasePaidMediaUSD = phase.budgetUSD * 0.6; // coarse assumption matching planner
    const impressionsBand = impressionsBandFromBudget(
      phasePaidMediaUSD, input.market,
      `phase ${phase.phaseId} · paid-media reserve ${Math.round(phasePaidMediaUSD)} USD · cpm range $${NORM_CPM_USD[input.market].low}-$${NORM_CPM_USD[input.market].high}`,
    );
    let engagementBand = bandFromNorm(
      engNorm.low, engNorm.high, bias.lo, bias.hi, 'rate (0..1)', 'industry-norm',
      `engagement rate historically observed alongside ${input.market}-market campaigns at the ${phase.phaseId} phase`,
    );
    engagementBand = anchorBandWithPrior(engagementBand, priorEngagement);
    let completionBand = bandFromNorm(
      cmpNorm.low, cmpNorm.high, bias.lo, bias.hi, 'rate (0..1)', 'industry-norm',
      `completion rate historically observed alongside ${input.formula} formula video at the ${phase.phaseId} phase`,
    );
    completionBand = anchorBandWithPrior(completionBand, priorCompletion);
    let saveBand = bandFromNorm(
      savNorm.low, savNorm.high, bias.lo, bias.hi, 'rate (0..1)', 'industry-norm',
      `save rate historically observed alongside restrained creative at the ${phase.phaseId} phase`,
    );
    saveBand = anchorBandWithPrior(saveBand, priorSaveRate);
    void phasePaidShare;
    return {
      phaseId: phase.phaseId,
      impressionsBand,
      engagementRateBand: engagementBand,
      completionRateBand: completionBand,
      saveRateBand: saveBand,
    };
  });

  // Aggregate bands.
  const totalImpressionsLow = perPhaseBands.reduce((a, p) => a + p.impressionsBand.low, 0);
  const totalImpressionsHigh = perPhaseBands.reduce((a, p) => a + p.impressionsBand.high, 0);
  const aggEngLow = perPhaseBands.length === 0 ? 0 : perPhaseBands.reduce((a, p) => a + p.engagementRateBand.low, 0) / perPhaseBands.length;
  const aggEngHigh = perPhaseBands.length === 0 ? 0 : perPhaseBands.reduce((a, p) => a + p.engagementRateBand.high, 0) / perPhaseBands.length;
  const aggCmpLow = perPhaseBands.length === 0 ? 0 : perPhaseBands.reduce((a, p) => a + p.completionRateBand.low, 0) / perPhaseBands.length;
  const aggCmpHigh = perPhaseBands.length === 0 ? 0 : perPhaseBands.reduce((a, p) => a + p.completionRateBand.high, 0) / perPhaseBands.length;
  const aggSavLow = perPhaseBands.length === 0 ? 0 : perPhaseBands.reduce((a, p) => a + p.saveRateBand.low, 0) / perPhaseBands.length;
  const aggSavHigh = perPhaseBands.length === 0 ? 0 : perPhaseBands.reduce((a, p) => a + p.saveRateBand.high, 0) / perPhaseBands.length;
  const weeklyCadence = Math.max(2, Math.round(input.durationDays / 7));

  const aggregate = {
    impressionsBand: {
      low: totalImpressionsLow, high: totalImpressionsHigh, unit: 'impressions',
      note: `aggregate · summed across ${perPhaseBands.length} phase(s)`,
      source: 'industry-norm' as const,
    },
    engagementRateBand: {
      low: r3(aggEngLow), high: r3(aggEngHigh), unit: 'rate (0..1)',
      note: 'aggregate engagement rate · descriptive band only · operator validates',
      source: (priorEngagement != null ? 'mixed' : 'industry-norm') as Band['source'],
    },
    completionRateBand: {
      low: r3(aggCmpLow), high: r3(aggCmpHigh), unit: 'rate (0..1)',
      note: 'aggregate completion rate · descriptive band only · operator validates',
      source: (priorCompletion != null ? 'mixed' : 'industry-norm') as Band['source'],
    },
    saveRateBand: {
      low: r3(aggSavLow), high: r3(aggSavHigh), unit: 'rate (0..1)',
      note: 'aggregate save rate · descriptive band only · operator validates',
      source: 'industry-norm' as const,
    },
    estimatedAssetsExplored: {
      low: Math.max(4, weeklyCadence * 2),
      high: Math.max(8, weeklyCadence * 4),
    },
  };

  const notes: string[] = [];
  notes.push('descriptive bands only · operator validates every band against current market reality');
  if (priorEngagement != null) {
    notes.push(`bands softly anchored to operator-logged prior engagement ≈ ${r3(priorEngagement)} · requires more evidence`);
  } else {
    notes.push('no operator-logged prior performance · bands fall back to industry-norm ranges only');
  }
  notes.push('paid-media spend is operator-only · the system never spends');

  return {
    perPhaseBands,
    aggregate,
    disclaimers: DESCRIPTIVE_DISCLAIMERS,
    notes,
    reasonCodes: [
      `goal:${input.goal}`, `formula:${input.formula}`, `market:${input.market}`,
      `budgetUSD:${input.budgetUSD}`, `durationDays:${input.durationDays}`,
      `phases:${perPhaseBands.length}`,
      `priorEvidence:${priorEngagement != null ? 'yes' : 'no'}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
