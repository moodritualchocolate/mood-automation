/**
 * IDENTITY BLEEDING PREVENTION LAYER (Phase 384 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Prevents pieces of identity from "bleeding out" into the field —
 * being adopted by others until the brand loses its own use of them.
 */

export interface IdentityBleedingPreventionReading {
  prevention_active: boolean;
  bleeding_detected: boolean;
  notes: string[];
}

export interface IdentityBleedingPreventionInput {
  signaturePhraseUsedByOthers: boolean;
  visualSignatureBeingCopied: boolean;
}

export function readIdentityBleedingPreventionLayer(input: IdentityBleedingPreventionInput): IdentityBleedingPreventionReading {
  const { signaturePhraseUsedByOthers, visualSignatureBeingCopied } = input;
  const notes: string[] = [];

  const bleeding_detected = signaturePhraseUsedByOthers || visualSignatureBeingCopied;
  const prevention_active = bleeding_detected;

  notes.push(`identity bleeding prevention layer: ${bleeding_detected ? 'bleeding — prevention active' : 'no bleeding'}`);
  return { prevention_active, bleeding_detected, notes };
}
