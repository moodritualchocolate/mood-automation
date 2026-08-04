/**
 * TREND PULL FORCE MONITOR (Phase 341 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Measures the gravitational pull a current trend exerts on the brand.
 */

export interface TrendPullForceReading {
  /** 0..10 — current trend pull force. */
  pull_force: number;
  /** True when pull is strong enough to pull the brand off-axis. */
  pull_is_dangerous: boolean;
  notes: string[];
}

export interface TrendPullForceInput {
  trendVelocity: number;
  brandDistanceFromTrend: number;
}

export function readTrendPullForceMonitor(input: TrendPullForceInput): TrendPullForceReading {
  const { trendVelocity, brandDistanceFromTrend } = input;
  const notes: string[] = [];

  const pull_force = round1(Math.min(10, trendVelocity * 0.7 + (10 - brandDistanceFromTrend) * 0.3));
  const pull_is_dangerous = pull_force >= 7;

  notes.push(`trend pull force monitor: ${pull_force}/10 — ${pull_is_dangerous ? 'DANGEROUS' : 'safe'}`);
  return { pull_force, pull_is_dangerous, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
