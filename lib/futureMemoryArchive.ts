/**
 * FUTURE MEMORY ARCHIVE (Phase 170 — Wave 11: Strategic Future Intelligence)
 *
 * A strategic mind must remember its own predictions to know whether
 * to trust them. This archive tracks how many futures the organism has
 * forecast and reports its calibration — overconfident, calibrated, or
 * over-cautious.
 */

export type ForecastCalibration = 'overconfident' | 'calibrated' | 'over-cautious' | 'unproven';

export interface FutureMemoryReading {
  predictions_logged: number;
  /** 0..10 — estimated accuracy of the organism's forecasting. */
  prediction_accuracy: number;
  calibration: ForecastCalibration;
  notes: string[];
}

export interface FutureMemoryInput {
  /** Predictions logged across the strategic state's life. */
  predictionsLogged: number;
  planningCycles: number;
  /** Ratio of future-compounding decisions to total. */
  futureCompoundedCount: number;
  nowOptimizedCount: number;
}

export function readFutureMemoryArchive(input: FutureMemoryInput): FutureMemoryReading {
  const { predictionsLogged, planningCycles, futureCompoundedCount, nowOptimizedCount } = input;
  const notes: string[] = [];

  const decided = futureCompoundedCount + nowOptimizedCount;

  if (predictionsLogged < 4) {
    return {
      predictions_logged: predictionsLogged, prediction_accuracy: 5, calibration: 'unproven',
      notes: ['future memory archive: too few logged predictions to judge calibration'],
    };
  }

  // A mind that compounds futures and then survives is well-calibrated;
  // one that keeps optimizing for now mis-forecast its own discipline.
  const futureShare = decided > 0 ? futureCompoundedCount / decided : 0.5;
  const prediction_accuracy = round1(Math.max(0, Math.min(10, 4 + futureShare * 6)));

  const calibration: ForecastCalibration =
    futureShare >= 0.65 ? 'calibrated' :
    futureShare <= 0.35 ? 'overconfident' : 'over-cautious';

  notes.push(`future memory archive: ${predictionsLogged} predictions across ${planningCycles} cycles — ${calibration} (accuracy ${prediction_accuracy}/10)`);
  return { predictions_logged: predictionsLogged, prediction_accuracy, calibration, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
