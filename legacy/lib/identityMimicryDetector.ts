/**
 * IDENTITY MIMICRY DETECTOR (Phase 376 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Catches the brand mimicking another brand or voice — a form of
 * identity dissolution.
 */

export interface IdentityMimicryReading {
  mimicry_detected: boolean;
  mimicked_target: string | null;
  notes: string[];
}

export interface IdentityMimicryInput {
  copyingCompetitor: boolean;
  copyingInfluencer: boolean;
}

export function readIdentityMimicryDetector(input: IdentityMimicryInput): IdentityMimicryReading {
  const { copyingCompetitor, copyingInfluencer } = input;
  const notes: string[] = [];

  const mimicked_target = copyingCompetitor ? 'a competitor'
    : copyingInfluencer ? 'an influencer'
    : null;

  const mimicry_detected = mimicked_target !== null;

  notes.push(`identity mimicry detector: ${mimicry_detected ? `MIMICKING ${mimicked_target}` : 'distinct'}`);
  return { mimicry_detected, mimicked_target, notes };
}
