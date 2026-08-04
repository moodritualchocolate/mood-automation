/**
 * LIVE COUPLING DRIFT CORRECTION (Phase 303 — Wave 14: Live Civilization Coupling)
 *
 * When live drift is detected, this module proposes the correction
 * to bring the organism back into coupling.
 */

export interface LiveCouplingDriftCorrectionReading {
  /** True when a correction is being proposed this cycle. */
  correction_proposed: boolean;
  correction: string;
  notes: string[];
}

export interface LiveCouplingDriftCorrectionInput {
  driftDetected: boolean;
  driftMagnitude: number;
}

export function readLiveCouplingDriftCorrection(input: LiveCouplingDriftCorrectionInput): LiveCouplingDriftCorrectionReading {
  const { driftDetected, driftMagnitude } = input;
  const notes: string[] = [];

  const correction_proposed = driftDetected;

  const correction = !correction_proposed
    ? 'no correction needed — live coupling is on track'
    : driftMagnitude >= 7
      ? 'stop ingesting and rebuild — drift is too large to correct in place'
      : 'recalibrate against fresh ingested signal — drift is correctable in flight';

  notes.push(`live coupling drift correction: ${correction}`);
  return { correction_proposed, correction, notes };
}
