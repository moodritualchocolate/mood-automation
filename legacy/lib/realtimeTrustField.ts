/**
 * REALTIME TRUST FIELD (Phase 290 — Wave 14: Live Civilization Coupling)
 *
 * Trust as a live field — how much trust the brand can draw on right
 * this moment, separate from its long-run trust account.
 */

export type TrustFieldState = 'available' | 'limited' | 'spent';

export interface RealtimeTrustFieldReading {
  trust_state: TrustFieldState;
  /** 0..10 — live trust available. */
  live_trust: number;
  notes: string[];
}

export interface RealtimeTrustFieldInput {
  livingReputation: number;
  trustNetGain: number;
}

export function readRealtimeTrustField(input: RealtimeTrustFieldInput): RealtimeTrustFieldReading {
  const { livingReputation, trustNetGain } = input;
  const notes: string[] = [];

  const live_trust = round1(Math.max(0, Math.min(10, livingReputation + trustNetGain * 0.3)));

  const trust_state: TrustFieldState =
    live_trust >= 6 ? 'available' : live_trust >= 3 ? 'limited' : 'spent';

  notes.push(`realtime trust field: ${trust_state} (${live_trust}/10)`);
  return { trust_state, live_trust, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
