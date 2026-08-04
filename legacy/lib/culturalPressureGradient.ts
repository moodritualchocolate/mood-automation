/**
 * CULTURAL PRESSURE GRADIENT (Phase 278 — Wave 14: Live Civilization Coupling)
 *
 * Where cultural pressure is rising fastest.
 */

export interface CulturalPressureGradientReading {
  /** -10..10 — direction & rate of pressure change. */
  pressure_gradient: number;
  /** True when pressure is climbing into a dangerous regime. */
  pressure_is_rising_dangerously: boolean;
  notes: string[];
}

export interface CulturalPressureGradientInput {
  pressureNow: number;
  pressureEarlier: number;
}

export function readCulturalPressureGradient(input: CulturalPressureGradientInput): CulturalPressureGradientReading {
  const { pressureNow, pressureEarlier } = input;
  const notes: string[] = [];

  const pressure_gradient = round1(pressureNow - pressureEarlier);
  const pressure_is_rising_dangerously = pressureNow >= 7 && pressure_gradient >= 1;

  notes.push(`cultural pressure gradient: Δ ${pressure_gradient} (now ${pressureNow})`);
  return { pressure_gradient, pressure_is_rising_dangerously, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
