/**
 * LIVE COUPLING HEALTH (Phase 291 — Wave 14: Live Civilization Coupling)
 *
 * Continuous health of the live coupling itself — is the organism
 * staying coupled to reality, or beginning to drift?
 */

export interface LiveCouplingHealthReading {
  /** 0..10 — health of the live coupling. */
  health: number;
  /** True when live coupling is healthy enough to drive decisions. */
  is_healthy: boolean;
  failure_modes: string[];
  notes: string[];
}

export interface LiveCouplingHealthInput {
  liveSignalStrength: number;
  signalIsFresh: boolean;
  fieldIsCoherent: boolean;
  presenceScore: number;
}

export function readLiveCouplingHealth(input: LiveCouplingHealthInput): LiveCouplingHealthReading {
  const { liveSignalStrength, signalIsFresh, fieldIsCoherent, presenceScore } = input;
  const notes: string[] = [];

  const failure_modes: string[] = [];
  if (!signalIsFresh) failure_modes.push('live signal is stale');
  // Below 2 means there is essentially no live field to couple to;
  // above that, even a quiet field is workable telemetry.
  if (liveSignalStrength < 2) failure_modes.push('live signal is too thin');
  if (!fieldIsCoherent) failure_modes.push('field is polarised — coupling is unreliable');
  if (presenceScore < 3) failure_modes.push('brand presence is too low to couple');

  const health = round1(Math.max(0, 10 - failure_modes.length * 2.4));
  const is_healthy = failure_modes.length === 0;

  notes.push(`live coupling health: ${health}/10 — ${is_healthy ? 'healthy' : failure_modes.join(', ')}`);
  return { health, is_healthy, failure_modes, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
