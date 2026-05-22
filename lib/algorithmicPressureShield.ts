/**
 * ALGORITHMIC PRESSURE SHIELD (Phase 33 — Anti-Optimization / Wave 2)
 *
 * Shields the campaign from algorithmic drift — the slow pull toward
 * platform-native formats: hook addiction, CTA overuse, emotional
 * simplification, the pressure to become more legible to a feed and
 * less true to a human.
 */

import type { CreativeDirection } from '@/core/types';

export interface AlgorithmicPressureReading {
  /** 0..10 — how much algorithmic pressure the banner is under. */
  algorithmic_pressure: number;
  /** Named platform-native drift signatures. */
  drift_signatures: string[];
  /** True when the banner is becoming platform-native at truth's cost. */
  becoming_platform_native: boolean;
  notes: string[];
}

export interface AlgorithmicPressureInput {
  direction: CreativeDirection;
  /** 0..10 — emergence / truth strength. */
  truthStrength: number;
  /** True when the campaign drift detector flagged trend contamination. */
  trendContaminationFlagged: boolean;
}

export function readAlgorithmicPressure(input: AlgorithmicPressureInput): AlgorithmicPressureReading {
  const { direction, truthStrength, trendContaminationFlagged } = input;
  const notes: string[] = [];
  const drift_signatures: string[] = [];

  // Hook addiction — loud typography as the default voice.
  if (direction.typographyDominance === 'loud') drift_signatures.push('hook-addiction');
  // CTA overuse — an aggressive, non-integrated CTA.
  if (direction.ctaBehavior === 'corner' || direction.ctaBehavior === 'editorial') {
    // these are fine; the risky one is a loud, separate CTA
  }
  // Emotional simplification — low restraint flattens nuance.
  if (direction.restraint < 0.35) drift_signatures.push('emotional-simplification');
  // Trend contamination — surfaced by the campaign drift detector.
  if (trendContaminationFlagged) drift_signatures.push('trend-contamination');

  let algorithmic_pressure = drift_signatures.length * 2.5;
  if (truthStrength < 5 && drift_signatures.length > 0) algorithmic_pressure += 2;
  algorithmic_pressure = Math.min(10, round1(algorithmic_pressure));

  const becoming_platform_native = drift_signatures.length >= 2 && truthStrength < 6;

  if (becoming_platform_native) {
    notes.push(`algorithmic pressure: the banner is becoming platform-native at truth's cost — ${drift_signatures.join(', ')}`);
  } else if (drift_signatures.length) {
    notes.push(`algorithmic pressure: mild platform drift — ${drift_signatures.join(', ')}`);
  } else {
    notes.push('algorithmic pressure: none — the banner is not bending toward the feed');
  }

  return { algorithmic_pressure, drift_signatures, becoming_platform_native, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
