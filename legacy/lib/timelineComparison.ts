/**
 * TIMELINE COMPARISON (Wave 43)
 *
 * Deterministic comparison of branch projections. Ranks all eight
 * strategies by compositeScore, detects missed opportunities
 * (alternate strategies that would have avoided collapse), detects
 * false recoveries (branches whose short-horizon survivability
 * exceeded long-horizon by a threshold).
 *
 * Outputs feed the regret engine + the dashboard.
 */

import type {
  StrategyBranchResult, StrategyId, MissedOpportunity, FalseRecovery,
  TimelineRanking,
} from './counterfactualMemory';

// ─── tuning constants ──────────────────────────────────────────

/** Min survivability delta for a missed-opportunity log. */
export const MISSED_OPPORTUNITY_SURVIVABILITY_THRESHOLD = 0.20;
/** Min short→long survivability drop to flag a false recovery. */
export const FALSE_RECOVERY_DEGRADATION_THRESHOLD = 0.25;
/** Critical entry on the long horizon counts as collapse risk. */
export const COLLAPSE_LONG_SURVIVABILITY_THRESHOLD = 0.45;

// ─── helpers ──────────────────────────────────────────────────

function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── ranking ──────────────────────────────────────────────────

export function rankBranches(branches: StrategyBranchResult[], at: number, tick: number): TimelineRanking {
  const sorted = [...branches].sort((a, b) => b.compositeScore - a.compositeScore);
  const ranking: StrategyId[] = sorted.map((b) => b.strategyId);
  const topScore = sorted[0]?.compositeScore ?? 0;
  const actualWasTop = ranking[0] === 'actual';
  return { at, tick, ranking, topScore, actualWasTop };
}

// ─── missed opportunity detection ─────────────────────────────

export function detectMissedOpportunities(
  branches: StrategyBranchResult[], at: number, tick: number,
): MissedOpportunity[] {
  const actual = branches.find((b) => b.strategyId === 'actual');
  if (!actual) return [];
  // Actual is in collapse-risk if its long survivability is low OR it
  // entered critical territory.
  const actualLongSurv = actual.horizons.long.survivability;
  const actualWouldCollapse =
    actualLongSurv < COLLAPSE_LONG_SURVIVABILITY_THRESHOLD
    || actual.horizons.long.enteredCritical;
  if (!actualWouldCollapse) return [];

  const opportunities: MissedOpportunity[] = [];
  for (const b of branches) {
    if (b.strategyId === 'actual') continue;
    const advantage = b.horizons.long.survivability - actualLongSurv;
    const branchEscapedCollapse =
      b.horizons.long.survivability >= COLLAPSE_LONG_SURVIVABILITY_THRESHOLD
      && !b.horizons.long.enteredCritical;
    if (advantage >= MISSED_OPPORTUNITY_SURVIVABILITY_THRESHOLD && branchEscapedCollapse) {
      opportunities.push({
        at, tick,
        alternateStrategy: b.strategyId,
        avoidedCollapseRisk: round2(advantage),
        actualLongSurvivability: actualLongSurv,
        alternateLongSurvivability: b.horizons.long.survivability,
      });
    }
  }
  return opportunities;
}

// ─── false recovery detection ─────────────────────────────────

export function detectFalseRecoveries(
  branches: StrategyBranchResult[], at: number, tick: number,
): FalseRecovery[] {
  const recoveries: FalseRecovery[] = [];
  for (const b of branches) {
    const shortSurv = b.horizons.short.survivability;
    const longSurv = b.horizons.long.survivability;
    // Looked successful short-term (>= 0.7) but degraded by >= threshold by long horizon.
    if (shortSurv >= 0.7 && (shortSurv - longSurv) >= FALSE_RECOVERY_DEGRADATION_THRESHOLD) {
      recoveries.push({
        at, tick,
        strategyId: b.strategyId,
        shortHorizonSurvivability: shortSurv,
        longHorizonSurvivability: longSurv,
        degradationDelta: round2(shortSurv - longSurv),
      });
    }
  }
  return recoveries;
}

// ─── delta computation per alternate vs actual ────────────────

export interface StrategyDelta {
  strategyId: StrategyId;
  survivabilityDelta: number;
  continuityDelta: number;     // approximated from coherence
  efficiencyDelta: number;     // approximated from inverse-tension + budget retention
}

export function computeStrategyDeltas(branches: StrategyBranchResult[]): StrategyDelta[] {
  const actual = branches.find((b) => b.strategyId === 'actual');
  if (!actual) return [];
  const actualLong = actual.horizons.long.endState;
  const actualSurv = actual.horizons.long.survivability;
  // efficiency proxy = (10 - tension) + budget/50 (each 0..1) normalized
  const actualEff = ((10 - actualLong.maxTension) / 10) * 0.5 + (actualLong.budget / 50) * 0.5;
  const actualCont = actualLong.coherence / 10;

  return branches
    .filter((b) => b.strategyId !== 'actual')
    .map((b) => {
      const bLong = b.horizons.long.endState;
      const bEff = ((10 - bLong.maxTension) / 10) * 0.5 + (bLong.budget / 50) * 0.5;
      const bCont = bLong.coherence / 10;
      return {
        strategyId: b.strategyId,
        survivabilityDelta: round2(b.horizons.long.survivability - actualSurv),
        continuityDelta:    round2(bCont - actualCont),
        efficiencyDelta:    round2(bEff - actualEff),
      };
    });
}
