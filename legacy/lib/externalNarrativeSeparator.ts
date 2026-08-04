/**
 * EXTERNAL NARRATIVE SEPARATOR (Phase 370 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Separates external narratives about the brand from the brand's own
 * narrative — so the external never becomes the internal.
 */

export interface ExternalNarrativeSeparatorReading {
  separation_holds: boolean;
  /** True when an external narrative is being mistaken for the brand's own. */
  blurring_detected: boolean;
  notes: string[];
}

export interface ExternalNarrativeSeparatorInput {
  externalNarrativeStrong: boolean;
  brandAdoptingIt: boolean;
}

export function readExternalNarrativeSeparator(input: ExternalNarrativeSeparatorInput): ExternalNarrativeSeparatorReading {
  const { externalNarrativeStrong, brandAdoptingIt } = input;
  const notes: string[] = [];

  const blurring_detected = externalNarrativeStrong && brandAdoptingIt;
  const separation_holds = !blurring_detected;

  notes.push(`external narrative separator: ${separation_holds ? 'separated' : 'BLURRING'}`);
  return { separation_holds, blurring_detected, notes };
}
