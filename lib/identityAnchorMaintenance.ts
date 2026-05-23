/**
 * IDENTITY ANCHOR MAINTENANCE (Phase 342 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Continuously maintains the identity anchors — the founding
 * commitments that keep the brand from drifting.
 */

export interface IdentityAnchorMaintenanceReading {
  /** True when anchors are being actively maintained. */
  anchors_maintained: boolean;
  /** 0..10 — anchor strength. */
  anchor_strength: number;
  notes: string[];
}

export interface IdentityAnchorMaintenanceInput {
  invariantsScore: number;
  immuneVigor: number;
  sovereigntyScore: number;
}

export function readIdentityAnchorMaintenance(input: IdentityAnchorMaintenanceInput): IdentityAnchorMaintenanceReading {
  const { invariantsScore, immuneVigor, sovereigntyScore } = input;
  const notes: string[] = [];

  const anchor_strength = round1((invariantsScore * 0.4 + immuneVigor * 0.3 + sovereigntyScore * 0.3));
  const anchors_maintained = anchor_strength >= 6;

  notes.push(`identity anchor maintenance: ${anchors_maintained ? 'maintained' : 'WEAKENING'} (${anchor_strength}/10)`);
  return { anchors_maintained, anchor_strength, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
