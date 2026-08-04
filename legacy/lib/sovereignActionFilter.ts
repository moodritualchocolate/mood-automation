/**
 * SOVEREIGN ACTION FILTER (Phase 393 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Filters actions through the sovereignty test — would this action be
 * taken absent external pressure?
 */

export interface SovereignActionFilterReading {
  /** True when the action passes the sovereignty filter. */
  action_passes: boolean;
  notes: string[];
}

export interface SovereignActionFilterInput {
  wouldTakeWithoutPressure: boolean;
  drivenByExternalPressure: boolean;
}

export function readSovereignActionFilter(input: SovereignActionFilterInput): SovereignActionFilterReading {
  const { wouldTakeWithoutPressure, drivenByExternalPressure } = input;
  const notes: string[] = [];

  const action_passes = wouldTakeWithoutPressure && !drivenByExternalPressure;

  notes.push(`sovereign action filter: ${action_passes ? 'PASS' : 'fail — pressured action'}`);
  return { action_passes, notes };
}
