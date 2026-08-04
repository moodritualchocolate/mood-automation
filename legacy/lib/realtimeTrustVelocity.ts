/**
 * REALTIME TRUST VELOCITY (Phase 309 — Wave 14: Live Civilization Coupling)
 *
 * The instantaneous rate of trust movement — what's happening to
 * trust right now, not over a campaign.
 */

export type TrustVelocityKind = 'gaining' | 'holding' | 'losing';

export interface RealtimeTrustVelocityReading {
  velocity_kind: TrustVelocityKind;
  /** -10..10 — rate of live trust change. */
  velocity: number;
  notes: string[];
}

export interface RealtimeTrustVelocityInput {
  liveTrust: number;
  trustEarlier: number;
}

export function readRealtimeTrustVelocity(input: RealtimeTrustVelocityInput): RealtimeTrustVelocityReading {
  const { liveTrust, trustEarlier } = input;
  const notes: string[] = [];

  const velocity = round1(liveTrust - trustEarlier);
  const velocity_kind: TrustVelocityKind =
    velocity >= 0.3 ? 'gaining' : velocity <= -0.3 ? 'losing' : 'holding';

  notes.push(`realtime trust velocity: ${velocity_kind} (Δ ${velocity})`);
  return { velocity_kind, velocity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
