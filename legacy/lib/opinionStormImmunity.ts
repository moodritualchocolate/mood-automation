/**
 * OPINION STORM IMMUNITY (Phase 366 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Immunity to opinion storms — moments where collective opinion
 * mobilises against (or for) the brand and tries to reshape it.
 */

export interface OpinionStormImmunityReading {
  immune: boolean;
  /** 0..10 — current storm intensity. */
  storm_intensity: number;
  notes: string[];
}

export interface OpinionStormImmunityInput {
  stormIntensity: number;
  identityHeldThroughStorm: boolean;
}

export function readOpinionStormImmunity(input: OpinionStormImmunityInput): OpinionStormImmunityReading {
  const { stormIntensity, identityHeldThroughStorm } = input;
  const notes: string[] = [];

  const immune = stormIntensity < 5 || identityHeldThroughStorm;

  notes.push(`opinion storm immunity: ${immune ? 'IMMUNE' : 'capitulating'} (storm ${stormIntensity}/10)`);
  return { immune, storm_intensity: stormIntensity, notes };
}
