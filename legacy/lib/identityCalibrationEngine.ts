/**
 * IDENTITY CALIBRATION ENGINE (Phase 357 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Calibrates identity in response to feedback — without losing its
 * center. Small calibration is healthy; large calibration is drift.
 */

export type CalibrationKind = 'small-healthy' | 'medium-watch' | 'large-drift';

export interface IdentityCalibrationReading {
  calibration_kind: CalibrationKind;
  /** True when this calibration preserves identity. */
  preserves_identity: boolean;
  notes: string[];
}

export interface IdentityCalibrationInput {
  calibrationMagnitude: number;
  identityHeld: boolean;
}

export function readIdentityCalibrationEngine(input: IdentityCalibrationInput): IdentityCalibrationReading {
  const { calibrationMagnitude, identityHeld } = input;
  const notes: string[] = [];

  const calibration_kind: CalibrationKind =
    calibrationMagnitude >= 6 ? 'large-drift' :
    calibrationMagnitude >= 3 ? 'medium-watch' : 'small-healthy';

  const preserves_identity = identityHeld && calibration_kind !== 'large-drift';

  notes.push(`identity calibration engine: ${calibration_kind}`);
  return { calibration_kind, preserves_identity, notes };
}
