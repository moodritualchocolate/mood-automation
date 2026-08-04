/**
 * POPULIST DRIFT DETECTOR (Phase 344 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Catches drift toward saying-what-the-majority-wants-to-hear.
 */

export interface PopulistDriftReading {
  populist_drift: boolean;
  drift_score: number;
  notes: string[];
}

export interface PopulistDriftInput {
  hewToMajorityPosition: boolean;
  avoidedUnpopularTruth: boolean;
}

export function readPopulistDriftDetector(input: PopulistDriftInput): PopulistDriftReading {
  const { hewToMajorityPosition, avoidedUnpopularTruth } = input;
  const notes: string[] = [];

  const drift_score = (hewToMajorityPosition ? 5 : 0) + (avoidedUnpopularTruth ? 5 : 0);
  const populist_drift = drift_score >= 5;

  notes.push(`populist drift detector: ${populist_drift ? 'DRIFT' : 'sovereign'} (${drift_score}/10)`);
  return { populist_drift, drift_score, notes };
}
