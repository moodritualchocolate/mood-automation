/**
 * POPULATION PRESSURE ATTRIBUTION (Phase 395 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Attributes pressure on the brand to specific population segments —
 * so capture by one segment can be detected as a one-sided thing.
 */

export interface PopulationPressureAttributionReading {
  /** True when pressure is dominated by one segment. */
  one_sided: boolean;
  dominant_segment: string | null;
  notes: string[];
}

export interface PopulationPressureAttributionInput {
  loudestSegment: string;
  segmentDominance: number;
}

export function readPopulationPressureAttribution(input: PopulationPressureAttributionInput): PopulationPressureAttributionReading {
  const { loudestSegment, segmentDominance } = input;
  const notes: string[] = [];

  const one_sided = segmentDominance >= 7;
  const dominant_segment = one_sided ? loudestSegment : null;

  notes.push(`population pressure attribution: ${one_sided ? `ONE-SIDED (${dominant_segment})` : 'balanced'}`);
  return { one_sided, dominant_segment, notes };
}
