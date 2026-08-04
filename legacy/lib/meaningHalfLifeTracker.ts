/**
 * MEANING HALF-LIFE TRACKER (Phase 422 — Wave 16)
 */
export interface MeaningHalfLifeReading { half_life_cycles: number; long_lived: boolean; notes: string[]; }
export interface MeaningHalfLifeInput { persistenceScore: number; }
export function readMeaningHalfLifeTracker(input: MeaningHalfLifeInput): MeaningHalfLifeReading {
  const half_life_cycles = Math.max(1, Math.round(input.persistenceScore));
  const long_lived = half_life_cycles >= 5;
  return { half_life_cycles, long_lived, notes: [`meaning half-life tracker: ~${half_life_cycles} cycles`] };
}
