/**
 * AUTHENTICITY EROSION TRACKER (Phase 138 — Wave 10: Reality Coupling Architecture)
 *
 * Authenticity is a reserve, not a constant. Every time the organism
 * chases stimulus instead of speaking a truth, the reserve erodes a
 * little — and the erosion is cumulative. This tracker watches the
 * reserve across the coupling's life and flags when it is draining.
 */

export interface AuthenticityErosionReading {
  /** 0..10 — the organism's remaining authenticity reserve. */
  authenticity_reserve: number;
  /** How much the reserve eroded this cycle (negative = recovered). */
  erosion_this_cycle: number;
  /** True when authenticity is actively eroding. */
  authenticity_eroding: boolean;
  notes: string[];
}

export interface AuthenticityErosionInput {
  /** 0..10 — reserve carried from the persistent coupling state. */
  priorAuthenticity: number;
  optimizationCorrupts: boolean;
  /** True when the run reads as stimulus, not resonance (Phase 132). */
  readsAsStimulus: boolean;
  /** True when the platform reward is pulling toward noise (Phase 137). */
  platformRewardsNoise: boolean;
}

export function trackAuthenticityErosion(input: AuthenticityErosionInput): AuthenticityErosionReading {
  const { priorAuthenticity, optimizationCorrupts, readsAsStimulus, platformRewardsNoise } = input;
  const notes: string[] = [];

  let erosion_this_cycle = 0;
  if (optimizationCorrupts) erosion_this_cycle += 1.3;
  if (readsAsStimulus) erosion_this_cycle += 1.0;
  if (platformRewardsNoise) erosion_this_cycle += 0.5;
  // A clean cycle slowly restores the reserve.
  if (erosion_this_cycle === 0) erosion_this_cycle = -0.4;
  erosion_this_cycle = round1(erosion_this_cycle);

  const authenticity_reserve = round1(Math.max(0, Math.min(10, priorAuthenticity - erosion_this_cycle)));
  const authenticity_eroding = erosion_this_cycle > 0;

  notes.push(`authenticity erosion tracker: reserve ${authenticity_reserve}/10` +
    (authenticity_eroding ? ` — eroding ${erosion_this_cycle}/cycle` : ' — holding, slowly restoring'));
  return { authenticity_reserve, erosion_this_cycle, authenticity_eroding, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
