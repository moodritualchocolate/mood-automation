/**
 * EMOTIONAL FORECASTING (Phase 24)
 *
 * Predicts where the subject's emotional state is moving NEXT —
 * not where it is. Phase 24 is the system's first genuinely
 * predictive layer.
 *
 * The forecast is deliberately UN-dramatic. Modern emotional
 * movement is mostly slow, non-linear, and unresolved. A forecast
 * that predicts a clean collapse or a clean recovery is, almost
 * always, wrong — and the meta-critic refuses it.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { EmotionalTraceEntry } from './humanMemory';

export type ForecastDirection =
  | 'deeper-into-the-same'
  | 'slow-drift-to-numbness'
  | 'escalation-to-overwhelm'
  | 'a-small-unstable-relief'
  | 'sideways-no-real-change'
  | 'quiet-erosion';

export interface EmotionalForecastReading {
  direction: ForecastDirection;
  /** 0..10 — confidence in the forecast. */
  forecast_confidence: number;
  /** 0..10 — how psychologically inevitable the forecast reads. */
  inevitability: number;
  /** True when the forecast is too clean / dramatic / linear. */
  forecast_too_clean: boolean;
  notes: string[];
}

export interface EmotionalForecastingInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  recentTrail: EmotionalTraceEntry[];
}

const FAMILY_TO_FORECAST: Record<HumanState['family'], ForecastDirection> = {
  fatigue:         'slow-drift-to-numbness',
  overstimulation: 'escalation-to-overwhelm',
  avoidance:       'quiet-erosion',
  numbness:        'deeper-into-the-same',
  pressure:        'escalation-to-overwhelm',
  fragmentation:  'sideways-no-real-change',
  paralysis:       'quiet-erosion',
  collapse:        'a-small-unstable-relief',
};

const CLEAN_RESOLUTION = /\b(finally (better|okay|free|healed)|turned a corner|came out the other side|everything changed|breakthrough)\b/i;

export function readEmotionalForecasting(input: EmotionalForecastingInput): EmotionalForecastReading {
  const { state, truth, recentTrail } = input;
  const notes: string[] = [];

  const direction = FAMILY_TO_FORECAST[state.family];

  // Confidence rises with trail depth + family recurrence.
  const sameFamilyCount = recentTrail.slice(0, 12).filter((t) => t.family === state.family).length;
  let forecast_confidence = Math.min(9, 3 + sameFamilyCount);
  if (recentTrail.length < 4) forecast_confidence = Math.min(forecast_confidence, 4);

  const forecast_too_clean = CLEAN_RESOLUTION.test(truth.truth);

  let inevitability = 6;
  if (sameFamilyCount >= 3) inevitability += 2;          // the trail confirms the trajectory
  if (forecast_too_clean) inevitability -= 5;             // clean resolution is rarely inevitable
  inevitability = Math.max(0, Math.min(10, inevitability));

  notes.push(`emotional forecast: ${direction} (confidence ${forecast_confidence}/10, inevitability ${inevitability}/10)`);
  if (forecast_too_clean) notes.push('WARNING: the forecast resolves too cleanly — modern emotional movement is rarely linear');

  return { direction, forecast_confidence, inevitability, forecast_too_clean, notes };
}
