/**
 * TRUST EVOLUTION GRAPH (Phase 249 — Wave 13: Reality Feedback Infrastructure)
 *
 * Trust shifts cycle-by-cycle add up to a curve. This module reads
 * the long-arc shape of that curve — building, plateau, declining,
 * volatile — so trust is never judged on one cycle alone.
 */

export type TrustEvolutionShape = 'building' | 'plateau' | 'declining' | 'volatile';

export interface TrustEvolutionReading {
  evolution_shape: TrustEvolutionShape;
  /** -10..10 — net trust accumulated across the campaign's life. */
  trust_net_gain: number;
  /** True when the long arc is genuinely a building one. */
  arc_is_healthy: boolean;
  notes: string[];
}

export interface TrustEvolutionInput {
  /** -10..10 — net trust gain so far. */
  trustNetGain: number;
  /** Total trust shifts observed. */
  trustShiftCount: number;
  /** True when a sign-reversing shift has occurred. */
  hasReversed: boolean;
}

export function readTrustEvolutionGraph(input: TrustEvolutionInput): TrustEvolutionReading {
  const { trustNetGain, trustShiftCount, hasReversed } = input;
  const notes: string[] = [];

  const evolution_shape: TrustEvolutionShape =
    hasReversed && trustShiftCount >= 3 ? 'volatile' :
    trustNetGain >= 1 ? 'building' :
    trustNetGain <= -1 ? 'declining' : 'plateau';

  const arc_is_healthy = evolution_shape === 'building';

  notes.push(`trust evolution graph: ${evolution_shape} (net gain ${trustNetGain}, ${trustShiftCount} shift(s))`);
  return { evolution_shape, trust_net_gain: trustNetGain, arc_is_healthy, notes };
}
