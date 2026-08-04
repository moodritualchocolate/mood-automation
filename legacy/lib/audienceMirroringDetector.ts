/**
 * AUDIENCE MIRRORING DETECTOR (Phase 358 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Catches the brand mirroring the audience instead of speaking to it.
 */

export interface AudienceMirroringReading {
  is_mirroring: boolean;
  mirror_intensity: number;
  notes: string[];
}

export interface AudienceMirroringInput {
  voiceMimicry: boolean;
  positionEcho: boolean;
}

export function readAudienceMirroringDetector(input: AudienceMirroringInput): AudienceMirroringReading {
  const { voiceMimicry, positionEcho } = input;
  const notes: string[] = [];

  const mirror_intensity = (voiceMimicry ? 5 : 0) + (positionEcho ? 5 : 0);
  const is_mirroring = mirror_intensity >= 5;

  notes.push(`audience mirroring detector: ${is_mirroring ? 'MIRRORING' : 'distinct'} (${mirror_intensity}/10)`);
  return { is_mirroring, mirror_intensity, notes };
}
