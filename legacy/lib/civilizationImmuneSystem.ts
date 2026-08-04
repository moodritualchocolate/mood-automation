/**
 * CIVILIZATION IMMUNE SYSTEM (Phase 322 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Detects and rejects foreign elements trying to enter the brand —
 * external memes, trend pressures, audience demands that would
 * graft an alien part onto the body.
 */

export interface CivilizationImmuneSystemReading {
  /** True when an immune response was triggered this cycle. */
  immune_response_triggered: boolean;
  /** What was rejected. */
  foreign_element_rejected: string | null;
  /** 0..10 — current immune system vigor. */
  immune_vigor: number;
  notes: string[];
}

export interface CivilizationImmuneSystemInput {
  trendPressure: number;            // 0..10
  alienMemeIntrusion: boolean;
  audienceDemandsConformity: boolean;
  identitySovereignty: number;      // 0..10
}

export function readCivilizationImmuneSystem(input: CivilizationImmuneSystemInput): CivilizationImmuneSystemReading {
  const { trendPressure, alienMemeIntrusion, audienceDemandsConformity, identitySovereignty } = input;
  const notes: string[] = [];

  const immune_response_triggered = alienMemeIntrusion || trendPressure >= 7 || audienceDemandsConformity;
  const immune_vigor = round1(Math.min(10, identitySovereignty * 0.7 + 3));

  const foreign_element_rejected = !immune_response_triggered ? null
    : alienMemeIntrusion ? 'an alien meme tried to enter the brand'
    : audienceDemandsConformity ? 'audience pressure to conform to a trend'
    : 'high trend pressure pulling the brand off-axis';

  notes.push(`civilization immune system: ${immune_response_triggered ? `REJECTED — ${foreign_element_rejected}` : 'no immune response needed'} (vigor ${immune_vigor}/10)`);
  return { immune_response_triggered, foreign_element_rejected, immune_vigor, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
