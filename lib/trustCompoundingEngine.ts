/**
 * TRUST COMPOUNDING ENGINE (Phase 156 — Wave 11: Strategic Future Intelligence)
 *
 * Trust earned and held does not add — it compounds. This engine
 * models the compounding: whether trust is being left to grow on
 * itself, or being withdrawn before it can.
 */

export interface TrustCompoundingReading {
  /** True when trust is being left to compound. */
  trust_compounding: boolean;
  /** 0..10 — the rate at which trust is compounding (negative = withdrawing). */
  compounding_rate: number;
  /** 0..10 — projected trust several cycles out. */
  projected_trust: number;
  notes: string[];
}

export interface TrustCompoundingInput {
  /** 0..10 — current accumulated trust. */
  trustLevel: number;
  trustForming: boolean;
  trustDecaying: boolean;
  /** Times strategic patience has been honored. */
  patienceHonored: number;
}

export function readTrustCompounding(input: TrustCompoundingInput): TrustCompoundingReading {
  const { trustLevel, trustForming, trustDecaying, patienceHonored } = input;
  const notes: string[] = [];

  let compounding_rate = 0;
  if (trustForming) compounding_rate += 2;
  if (trustDecaying) compounding_rate -= 3;
  compounding_rate += Math.min(2, patienceHonored * 0.3);
  compounding_rate = round1(Math.max(-5, Math.min(5, compounding_rate)));

  const trust_compounding = compounding_rate > 0.5 && !trustDecaying;

  // Project three cycles forward at the current rate.
  const projected_trust = round1(Math.max(0, Math.min(10, trustLevel + compounding_rate * 0.9)));

  notes.push(`trust compounding engine: ${trust_compounding ? 'compounding' : 'not compounding'} ` +
    `(rate ${compounding_rate}/cycle) → projected ${projected_trust}/10`);
  return { trust_compounding, compounding_rate, projected_trust, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
