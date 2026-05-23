/**
 * TRUST-AWARE OPTIMIZATION (Phase 186 — Wave 12: Autonomous Action Architecture)
 *
 * Optimization is allowed — but never at the expense of trust. This
 * module reads whether an optimization respects the trust account, or
 * whether it would quietly withdraw from it for a metric.
 */

export interface TrustAwareOptimizationReading {
  /** True when the optimization respects the trust account. */
  optimization_respects_trust: boolean;
  /** 0..10 — trust the optimization would spend. */
  trust_cost: number;
  optimization_verdict: string;
  notes: string[];
}

export interface TrustAwareOptimizationInput {
  /** True when an optimization is being applied this run. */
  optimizationApplied: boolean;
  /** True when the optimization corrupts truth (Wave 5). */
  optimizationCorruptsTruth: boolean;
  /** True when the run is chasing stimulus over resonance. */
  chasingStimulus: boolean;
  /** 0..10 — current trust level. */
  trustLevel: number;
}

export function readTrustAwareOptimization(input: TrustAwareOptimizationInput): TrustAwareOptimizationReading {
  const { optimizationApplied, optimizationCorruptsTruth, chasingStimulus, trustLevel } = input;
  const notes: string[] = [];

  let trust_cost = 0;
  if (optimizationCorruptsTruth) trust_cost += 5;
  if (chasingStimulus) trust_cost += 3;
  if (optimizationApplied && trustLevel < 4) trust_cost += 2;
  trust_cost = round1(Math.min(10, trust_cost));

  const optimization_respects_trust = trust_cost < 4;

  const optimization_verdict = !optimizationApplied
    ? 'no optimization applied — trust is untouched'
    : optimization_respects_trust
      ? 'the optimization respects trust — it improves the action without spending the account'
      : 'the optimization would withdraw from trust for a metric — it is not trust-aware';

  notes.push(`trust-aware optimization: ${optimization_respects_trust ? 'respects trust' : 'SPENDS TRUST'} (cost ${trust_cost}/10) — ${optimization_verdict}`);
  return { optimization_respects_trust, trust_cost, optimization_verdict, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
