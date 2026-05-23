/**
 * LIVE COUPLING RESONANCE ANCHOR (Phase 304 — Wave 14: Live Civilization Coupling)
 *
 * Names the durable resonance the organism is anchored to — what is
 * holding the coupling steady when the field gets noisy.
 */

export interface LiveCouplingResonanceAnchorReading {
  anchor: string;
  /** True when the anchor is genuinely holding. */
  anchor_holding: boolean;
  notes: string[];
}

export interface LiveCouplingResonanceAnchorInput {
  founding_truth_present: boolean;
  meaningDensity: number;
  identityHeld: boolean;
}

export function readLiveCouplingResonanceAnchor(input: LiveCouplingResonanceAnchorInput): LiveCouplingResonanceAnchorReading {
  const { founding_truth_present, meaningDensity, identityHeld } = input;
  const notes: string[] = [];

  const anchor = founding_truth_present && identityHeld
    ? 'the founding truth of the brand — "quiet, honest, slow"'
    : meaningDensity >= 5
      ? 'a moment of meaning that has held its shape across noise'
      : 'no clear anchor — the organism is coupling without a center';

  const anchor_holding = founding_truth_present && identityHeld;

  notes.push(`live coupling resonance anchor: ${anchor_holding ? 'HOLDING' : 'drift risk'} — "${anchor}"`);
  return { anchor, anchor_holding, notes };
}
