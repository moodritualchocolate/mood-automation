/**
 * IDENTITY CORROSION PREVENTION (Phase 359 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Actively prevents the slow chemical-style corrosion of identity from
 * accumulating small compromises.
 */

export interface IdentityCorrosionPreventionReading {
  /** True when prevention is actively running. */
  prevention_active: boolean;
  prevention_action: string;
  notes: string[];
}

export interface IdentityCorrosionPreventionInput {
  erosionRate: number;
  compromiseCountThisCycle: number;
}

export function readIdentityCorrosionPrevention(input: IdentityCorrosionPreventionInput): IdentityCorrosionPreventionReading {
  const { erosionRate, compromiseCountThisCycle } = input;
  const notes: string[] = [];

  const prevention_active = erosionRate >= 4 || compromiseCountThisCycle >= 1;
  const prevention_action = prevention_active
    ? 'actively neutralising small compromises before they accumulate'
    : 'no corrosion pressure — prevention is on standby';

  notes.push(`identity corrosion prevention: ${prevention_action}`);
  return { prevention_active, prevention_action, notes };
}
