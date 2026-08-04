/**
 * IDENTITY INTEGRITY HEALTH SCORE (Phase 362 — Wave 15: Identity Preservation Under Live Reality)
 *
 * One number summarising the health of identity integrity.
 */

export interface IdentityIntegrityHealthScoreReading {
  /** 0..10 — composite health score. */
  health: number;
  is_healthy: boolean;
  notes: string[];
}

export interface IdentityIntegrityHealthScoreInput {
  invariantsScore: number;
  sovereigntyScore: number;
  resilienceScore: number;
  resonanceSovereign: boolean;
}

export function readIdentityIntegrityHealthScore(input: IdentityIntegrityHealthScoreInput): IdentityIntegrityHealthScoreReading {
  const { invariantsScore, sovereigntyScore, resilienceScore, resonanceSovereign } = input;
  const notes: string[] = [];

  const health = round1((invariantsScore * 0.3 + sovereigntyScore * 0.3 + resilienceScore * 0.25 + (resonanceSovereign ? 1.5 : 0)));
  const is_healthy = health >= 6;

  notes.push(`identity integrity health score: ${health}/10 — ${is_healthy ? 'healthy' : 'COMPROMISED'}`);
  return { health, is_healthy, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
