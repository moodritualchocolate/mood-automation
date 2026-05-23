/**
 * SELF-BETRAYAL EARLY WARNING (Phase 373 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Flags the small moves that precede self-betrayal — so the brand can
 * pull back before crossing the line.
 */

export interface SelfBetrayalEarlyWarningReading {
  /** True when early warning signs are present. */
  warning_signs_present: boolean;
  signs: string[];
  notes: string[];
}

export interface SelfBetrayalEarlyWarningInput {
  softeningPosition: boolean;
  hedgingValue: boolean;
  apologisingForTruth: boolean;
}

export function readSelfBetrayalEarlyWarning(input: SelfBetrayalEarlyWarningInput): SelfBetrayalEarlyWarningReading {
  const { softeningPosition, hedgingValue, apologisingForTruth } = input;
  const notes: string[] = [];

  const signs: string[] = [];
  if (softeningPosition) signs.push('softening a position to keep peace');
  if (hedgingValue) signs.push('hedging a stated value');
  if (apologisingForTruth) signs.push('apologising for telling the truth');

  const warning_signs_present = signs.length >= 1;

  notes.push(`self-betrayal early warning: ${warning_signs_present ? `WARNING — ${signs.join('; ')}` : 'clean'}`);
  return { warning_signs_present, signs, notes };
}
