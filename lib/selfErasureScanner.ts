/**
 * SELF-ERASURE SCANNER (Phase 347 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Self-erasure is the brand actively removing pieces of itself to fit
 * the audience.
 */

export interface SelfErasureReading {
  is_erasing: boolean;
  erased_what: string | null;
  notes: string[];
}

export interface SelfErasureInput {
  removedDistinctiveTrait: boolean;
  suppressedFoundingClaim: boolean;
}

export function readSelfErasureScanner(input: SelfErasureInput): SelfErasureReading {
  const { removedDistinctiveTrait, suppressedFoundingClaim } = input;
  const notes: string[] = [];

  const erased_what = suppressedFoundingClaim ? 'a founding claim was suppressed' :
    removedDistinctiveTrait ? 'a distinctive trait was sanded off' : null;

  const is_erasing = erased_what !== null;

  notes.push(`self-erasure scanner: ${is_erasing ? `ERASING — ${erased_what}` : 'intact'}`);
  return { is_erasing, erased_what, notes };
}
