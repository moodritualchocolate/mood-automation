/**
 * LIVE COUPLING HEALTH BALANCER (Phase 313 — Wave 14: Live Civilization Coupling)
 *
 * Balances live coupling load — refuses runs that would overload the
 * live coupling system itself.
 */

export interface LiveCouplingHealthBalancerReading {
  /** 0..10 — current load on the live coupling layer. */
  load: number;
  /** True when load is sustainable. */
  load_is_sustainable: boolean;
  notes: string[];
}

export interface LiveCouplingHealthBalancerInput {
  signalVolume: number;
  contradictionPressure: number;
  driftMagnitude: number;
}

export function readLiveCouplingHealthBalancer(input: LiveCouplingHealthBalancerInput): LiveCouplingHealthBalancerReading {
  const { signalVolume, contradictionPressure, driftMagnitude } = input;
  const notes: string[] = [];

  const load = round1(Math.min(10, signalVolume * 0.3 + contradictionPressure * 0.4 + driftMagnitude * 0.3));
  const load_is_sustainable = load < 7;

  notes.push(`live coupling health balancer: load ${load}/10 — ${load_is_sustainable ? 'sustainable' : 'OVERLOAD'}`);
  return { load, load_is_sustainable, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
