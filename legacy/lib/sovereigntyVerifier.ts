/**
 * SOVEREIGNTY VERIFIER (Phase 336 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Verifies the brand's sovereignty — that it is choosing freely, not
 * being driven by the field.
 */

export interface SovereigntyVerifierReading {
  /** True when sovereignty holds — the brand is choosing freely. */
  sovereignty_holds: boolean;
  /** 0..10 — sovereignty score. */
  sovereignty: number;
  notes: string[];
}

export interface SovereigntyVerifierInput {
  identityHeld: boolean;
  truthChosen: boolean;
  notCaptured: boolean;
  popularityDecoupled: boolean;
}

export function readSovereigntyVerifier(input: SovereigntyVerifierInput): SovereigntyVerifierReading {
  const { identityHeld, truthChosen, notCaptured, popularityDecoupled } = input;
  const notes: string[] = [];

  const components = [identityHeld, truthChosen, notCaptured, popularityDecoupled];
  const sovereignty = round1((components.filter(Boolean).length / components.length) * 10);
  const sovereignty_holds = sovereignty >= 7;

  notes.push(`sovereignty verifier: ${sovereignty_holds ? 'HOLDS' : 'compromised'} (${sovereignty}/10)`);
  return { sovereignty_holds, sovereignty, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
