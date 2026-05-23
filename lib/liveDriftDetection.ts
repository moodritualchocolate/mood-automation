/**
 * LIVE DRIFT DETECTION (Phase 298 — Wave 14: Live Civilization Coupling)
 *
 * Detects drift in the live coupling — when the organism is starting
 * to mis-read the live field.
 */

export interface LiveDriftDetectionReading {
  /** True when live drift is detected. */
  drift_detected: boolean;
  /** 0..10 — drift magnitude. */
  drift_magnitude: number;
  notes: string[];
}

export interface LiveDriftDetectionInput {
  liveCouplingHealth: number;
  attributionFails: boolean;
  fieldIsCoherent: boolean;
}

export function readLiveDriftDetection(input: LiveDriftDetectionInput): LiveDriftDetectionReading {
  const { liveCouplingHealth, attributionFails, fieldIsCoherent } = input;
  const notes: string[] = [];

  let drift_magnitude = (10 - liveCouplingHealth) * 0.6;
  if (attributionFails) drift_magnitude += 2;
  if (!fieldIsCoherent) drift_magnitude += 1.5;
  drift_magnitude = round1(Math.max(0, Math.min(10, drift_magnitude)));

  const drift_detected = drift_magnitude >= 5;

  notes.push(`live drift detection: ${drift_detected ? 'DRIFT' : 'on track'} (${drift_magnitude}/10)`);
  return { drift_detected, drift_magnitude, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
