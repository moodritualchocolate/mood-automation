/**
 * META-COGNITIVE ENGINE (Wave 34)
 *
 * Deterministic update of meta-cognitive reliability metrics per
 * cognitive event. Reads post-update state from every layer and
 * computes:
 *
 *   cognitionStability  — recent identity coherence variance.
 *   reasoningDecay      — rate of revise/refuse review outcomes.
 *   predictionReliability — outcome of pending defer predictions.
 *   recoveryEfficiencyTrend — slope of recent rest effectiveness.
 *
 * Also manages open/closed prediction traces: when a defer fires,
 * snapshot the pre-defer assessment metrics; ~PREDICTION_WINDOW
 * events later, evaluate whether things improved.
 */

import type {
  MetaCognitiveState, MetricObservation, PredictionTrace,
} from './metaCognitive';
import { HISTORY_DELTA_THRESHOLD } from './metaCognitive';
import type { SelfModelMemoryState } from './selfModelMemory';
import type { TemporalAssessment } from './temporalIntelligenceView';
import type { TemporalMemoryState } from './temporalMemory';
import type { CurrentReview } from './operatingSystemCore';

/** Number of cognitive events after a defer before the prediction
 *  outcome is evaluated. ~5 events ≈ one short cognitive cycle. */
export const PREDICTION_WINDOW = 5;

function round1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }

function recordIfChanged(
  history: MetricObservation[],
  oldVal: number, newVal: number,
  at: number, tick: number,
): MetricObservation[] {
  const delta = newVal - oldVal;
  if (Math.abs(delta) < HISTORY_DELTA_THRESHOLD) return history;
  return [...history, { at, tick, value: round1(newVal), delta: round1(delta) }];
}

export interface MetaCognitiveSignal {
  at: number;
  tick: number;
  directiveName: string;
  /** Wave 26 — the review (if any) attached to this event. */
  currentReview?: CurrentReview | null;
  /** Wave 28 — true if rest just succeeded. */
  restFired: boolean;
  restEffectiveness?: number;  // 0..1 if available
  /** Wave 30 — true if defer just fired. */
  deferFired: boolean;
  /** Temporal snapshot at the moment of this event. */
  assessment: TemporalAssessment;
  /** Self-model coherence at the moment of this event. */
  selfModelIdentityCoherence: number;
}

export function updateMetaCognitive(
  state: MetaCognitiveState,
  signal: MetaCognitiveSignal,
): MetaCognitiveState {
  let cognitionStabilityHistory = state.cognitionStabilityHistory;
  let reasoningDecayHistory = state.reasoningDecayHistory;
  let predictionReliabilityHistory = state.predictionReliabilityHistory;
  let recoveryEfficiencyTrendHistory = state.recoveryEfficiencyTrendHistory;

  // ─── 1. cognition stability ─────────────────────────────────
  // Variance of recent identity coherence observations. Low variance
  // = stable cognition; high = wobbly.
  const recentCoherenceValues = [
    signal.selfModelIdentityCoherence,
    ...state.cognitionStabilityHistory.slice(-6).map((o) => o.value),
  ];
  let cognitionStability = 7;
  if (recentCoherenceValues.length >= 3) {
    const mean = recentCoherenceValues.reduce((a, b) => a + b, 0) / recentCoherenceValues.length;
    const variance = recentCoherenceValues.reduce((a, b) => a + (b - mean) ** 2, 0) / recentCoherenceValues.length;
    cognitionStability = round1(clamp10(10 - Math.sqrt(variance) * 2));
  }
  const lastCognitionStability = state.cognitionStabilityHistory.length > 0
    ? state.cognitionStabilityHistory[state.cognitionStabilityHistory.length - 1].value
    : 7;
  cognitionStabilityHistory = recordIfChanged(
    cognitionStabilityHistory, lastCognitionStability, cognitionStability,
    signal.at, signal.tick,
  );

  // ─── 2. reasoning decay ─────────────────────────────────────
  // If this event was a review with revise-required or refused,
  // increment decay signal. Decay value tracked as fraction of
  // recent reviews that came back negative.
  // For determinism we approximate: take the temporal approval-
  // stability (already a derived measure) and invert it.
  // Low approvalStability = high reasoning decay.
  const reasoningDecay = round1(clamp10(10 - signal.assessment.approvalStability));
  const lastReasoningDecay = state.reasoningDecayHistory.length > 0
    ? state.reasoningDecayHistory[state.reasoningDecayHistory.length - 1].value
    : reasoningDecay;
  reasoningDecayHistory = recordIfChanged(
    reasoningDecayHistory, lastReasoningDecay, reasoningDecay,
    signal.at, signal.tick,
  );

  // ─── 3. prediction reliability ──────────────────────────────
  // a. If defer just fired, open a new prediction trace.
  let openPredictions = state.openPredictions;
  let closedPredictions = state.closedPredictions;
  if (signal.deferFired) {
    openPredictions = [...openPredictions, {
      deferAt: signal.at, deferTick: signal.tick,
      preDeferFragmentationRisk: signal.assessment.fragmentationRisk,
      preDeferCadenceHealth: signal.assessment.cadenceHealth,
    }];
  }

  // b. Close any open predictions whose window has elapsed.
  const stillOpen: PredictionTrace[] = [];
  const newlyClosed: PredictionTrace[] = [];
  for (const trace of openPredictions) {
    const ticksSinceDefer = signal.tick - trace.deferTick;
    if (ticksSinceDefer >= PREDICTION_WINDOW) {
      // Evaluate outcome by comparing current metrics to pre-defer.
      // Defer "predicted" that waiting would lead to recovery, so:
      // improved   = fragmentationRisk dropped OR cadenceHealth rose
      // worsened   = fragmentationRisk rose OR cadenceHealth dropped
      // unchanged  = both within ±1
      const fragDelta = signal.assessment.fragmentationRisk - trace.preDeferFragmentationRisk;
      const cadDelta = signal.assessment.cadenceHealth - trace.preDeferCadenceHealth;
      const netImprovement = (-fragDelta) + cadDelta;  // positive = better
      const outcome: PredictionTrace['outcome'] =
        netImprovement >= 2  ? 'improved' :
        netImprovement <= -2 ? 'worsened' :
                                'unchanged';
      const reliabilityScore = round1(clamp10(5 + netImprovement / 2));
      const closed: PredictionTrace = {
        ...trace,
        outcome,
        outcomeAt: signal.at,
        outcomeTick: signal.tick,
        reliabilityScore,
      };
      newlyClosed.push(closed);
    } else {
      stillOpen.push(trace);
    }
  }
  openPredictions = stillOpen;
  closedPredictions = [...closedPredictions, ...newlyClosed];

  // c. Compute current predictionReliability as mean of recent closed scores.
  const recentClosed = closedPredictions.slice(-8);
  const predictionReliability = recentClosed.length === 0
    ? 7  // no data — neutral baseline
    : round1(clamp10(
        recentClosed.reduce((a, b) => a + (b.reliabilityScore ?? 5), 0) / recentClosed.length,
      ));
  const lastPredictionReliability = state.predictionReliabilityHistory.length > 0
    ? state.predictionReliabilityHistory[state.predictionReliabilityHistory.length - 1].value
    : 7;
  if (newlyClosed.length > 0) {
    // only record when a prediction actually closed (real new evidence).
    predictionReliabilityHistory = recordIfChanged(
      predictionReliabilityHistory, lastPredictionReliability, predictionReliability,
      signal.at, signal.tick,
    );
    // Always record on first observation even if delta is small.
    if (predictionReliabilityHistory === state.predictionReliabilityHistory) {
      predictionReliabilityHistory = [...predictionReliabilityHistory, {
        at: signal.at, tick: signal.tick,
        value: predictionReliability, delta: round1(predictionReliability - lastPredictionReliability),
      }];
    }
  }

  // ─── 4. recovery efficiency trend ───────────────────────────
  // Use the temporal assessment's recoveryEfficiency as the current
  // value; trend is just the change from the previous observation.
  const recoveryEfficiencyTrend = round1(clamp10(signal.assessment.recoveryEfficiency));
  const lastRecoveryTrend = state.recoveryEfficiencyTrendHistory.length > 0
    ? state.recoveryEfficiencyTrendHistory[state.recoveryEfficiencyTrendHistory.length - 1].value
    : recoveryEfficiencyTrend;
  recoveryEfficiencyTrendHistory = recordIfChanged(
    recoveryEfficiencyTrendHistory, lastRecoveryTrend, recoveryEfficiencyTrend,
    signal.at, signal.tick,
  );

  // ─── composite reliability score ────────────────────────────
  const cumulativeReliabilityScore = round1(clamp10(
    (cognitionStability + (10 - reasoningDecay) + predictionReliability + recoveryEfficiencyTrend) / 4,
  ));

  return {
    cognitionStabilityHistory,
    reasoningDecayHistory,
    predictionReliabilityHistory,
    recoveryEfficiencyTrendHistory,
    openPredictions,
    closedPredictions,
    cumulativeReliabilityScore,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? signal.at,
    updatedAt: signal.at,
  };
}
