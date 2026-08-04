/**
 * ADAPTIVE REGULATION VIEW (Wave 34)
 *
 * Combined dashboard view for both adaptive thresholds (from
 * adaptiveRegulation.ts) and meta-cognitive reliability metrics
 * (from metaCognitive store).
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type { MetaCognitiveState } from './metaCognitive';
import { summarizeAdaptiveRegulation } from './adaptiveRegulation';
import type { AdaptiveRegulationSummary } from './adaptiveRegulation';

export interface AdaptiveRegulationViewModel {
  present: boolean;
  thresholds: AdaptiveRegulationSummary;
  meta: {
    cognitionStability: number;
    reasoningDecay: number;
    predictionReliability: number;
    recoveryEfficiencyTrend: number;
    cumulativeReliabilityScore: number;
    openPredictionsCount: number;
    closedPredictionsCount: number;
    recentClosedPredictions: Array<{
      deferTick: number;
      outcome: 'improved' | 'unchanged' | 'worsened';
      reliabilityScore: number;
    }>;
  };
  /** Pretty status badge for the panel. */
  status: 'baseline' | 'biasing' | 'volatile';
  statement: string;
}

function lastValue(arr: { value: number }[], fallback: number): number {
  if (arr.length === 0) return fallback;
  return arr[arr.length - 1].value;
}

export function buildAdaptiveRegulationView(snap: RuntimeSnapshot): AdaptiveRegulationViewModel {
  const sm = snap.selfModel ?? null;
  const mc = snap.metaCognitive ?? null;

  const thresholds = summarizeAdaptiveRegulation(sm);

  const cognitionStability       = lastValue(mc?.cognitionStabilityHistory ?? [], 7);
  const reasoningDecay           = lastValue(mc?.reasoningDecayHistory ?? [], 0);
  const predictionReliability    = lastValue(mc?.predictionReliabilityHistory ?? [], 7);
  const recoveryEfficiencyTrend  = lastValue(mc?.recoveryEfficiencyTrendHistory ?? [], 5);
  const cumulativeReliabilityScore = mc?.cumulativeReliabilityScore ?? 7;
  const openPredictionsCount     = mc?.openPredictions.length ?? 0;
  const closedPredictionsCount   = mc?.closedPredictions.length ?? 0;
  const recentClosedPredictions = (mc?.closedPredictions ?? [])
    .slice(-5)
    .reverse()
    .filter((p) => p.outcome && p.reliabilityScore != null)
    .map((p) => ({
      deferTick: p.deferTick,
      outcome: p.outcome as 'improved' | 'unchanged' | 'worsened',
      reliabilityScore: p.reliabilityScore as number,
    }));

  // Compute biasing intensity for the status banding.
  const biasMagnitude = Math.abs(thresholds.escalationThreshold.delta)
    + Math.abs(thresholds.defer.fragmentationRiskNow.adaptive - thresholds.defer.fragmentationRiskNow.base)
    + Math.abs(thresholds.rest.energyLow.adaptive - thresholds.rest.energyLow.base);
  const status: AdaptiveRegulationViewModel['status'] =
    cumulativeReliabilityScore < 4 ? 'volatile' :
    biasMagnitude > 1.0 ? 'biasing' :
    'baseline';

  const statement = status === 'volatile'
    ? `reliability VOLATILE — composite score ${cumulativeReliabilityScore}/10`
    : status === 'biasing'
      ? `adaptive thresholds active — escalation ${thresholds.escalationThreshold.adaptive}, defer-now frag-risk ${thresholds.defer.fragmentationRiskNow.adaptive}, rest energy-low ${thresholds.rest.energyLow.adaptive}`
      : `regulation at baseline — no traits strong enough to bias thresholds yet`;

  return {
    present: sm != null || mc != null,
    thresholds,
    meta: {
      cognitionStability,
      reasoningDecay,
      predictionReliability,
      recoveryEfficiencyTrend,
      cumulativeReliabilityScore,
      openPredictionsCount,
      closedPredictionsCount,
      recentClosedPredictions,
    },
    status,
    statement,
  };
}
