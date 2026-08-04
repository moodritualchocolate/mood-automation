/**
 * SELF-BETRAYAL DETECTOR (Phase 343 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Catches the deepest corruption: when the brand has betrayed its
 * own stated values for reach, approval, or relief.
 */

export interface SelfBetrayalReading {
  /** True when self-betrayal is detected. */
  self_betrayed: boolean;
  betrayal_kind: string | null;
  notes: string[];
}

export interface SelfBetrayalInput {
  contradictedOwnValues: boolean;
  abandonedStatedPrinciple: boolean;
  betrayedAdvocates: boolean;
}

export function readSelfBetrayalDetector(input: SelfBetrayalInput): SelfBetrayalReading {
  const { contradictedOwnValues, abandonedStatedPrinciple, betrayedAdvocates } = input;
  const notes: string[] = [];

  let betrayal_kind: string | null = null;
  if (abandonedStatedPrinciple) betrayal_kind = 'a stated principle was abandoned';
  else if (contradictedOwnValues) betrayal_kind = 'the brand contradicted its own values';
  else if (betrayedAdvocates) betrayal_kind = 'the brand turned on the people who had defended it';

  const self_betrayed = betrayal_kind !== null;

  notes.push(`self-betrayal detector: ${self_betrayed ? `BETRAYED — ${betrayal_kind}` : 'no self-betrayal'}`);
  return { self_betrayed, betrayal_kind, notes };
}
