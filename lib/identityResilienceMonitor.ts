/**
 * IDENTITY RESILIENCE MONITOR (Phase 355 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Measures the brand's resilience to identity threats — how well it
 * springs back after a corruption attempt.
 */

export interface IdentityResilienceMonitorReading {
  /** 0..10 — resilience score. */
  resilience: number;
  /** True when resilience holds against current pressure. */
  is_resilient: boolean;
  notes: string[];
}

export interface IdentityResilienceMonitorInput {
  driftEventsRecovered: number;
  identityCorruptions: number;
}

export function readIdentityResilienceMonitor(input: IdentityResilienceMonitorInput): IdentityResilienceMonitorReading {
  const { driftEventsRecovered, identityCorruptions } = input;
  const notes: string[] = [];

  const ratio = identityCorruptions > 0 ? driftEventsRecovered / identityCorruptions : 1;
  const resilience = round1(Math.min(10, ratio * 10));
  const is_resilient = resilience >= 6;

  notes.push(`identity resilience monitor: ${resilience}/10 — ${is_resilient ? 'resilient' : 'brittle'}`);
  return { resilience, is_resilient, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
