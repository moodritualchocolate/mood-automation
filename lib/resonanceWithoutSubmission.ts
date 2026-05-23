/**
 * RESONANCE WITHOUT SUBMISSION (Phase 327 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The hardest balance: resonate with the audience without submitting
 * to it. This module names the difference — speaking IN their language
 * (good) versus speaking AS them (capture).
 */

export interface ResonanceWithoutSubmissionReading {
  /** True when the brand resonates without submitting. */
  resonance_is_sovereign: boolean;
  submission_signals: string[];
  notes: string[];
}

export interface ResonanceWithoutSubmissionInput {
  speaksInTheirLanguage: boolean;
  speaksAsThem: boolean;
  keepsItsOwnAngle: boolean;
}

export function readResonanceWithoutSubmission(input: ResonanceWithoutSubmissionInput): ResonanceWithoutSubmissionReading {
  const { speaksInTheirLanguage, speaksAsThem, keepsItsOwnAngle } = input;
  const notes: string[] = [];

  const submission_signals: string[] = [];
  if (speaksAsThem) submission_signals.push('speaking AS the audience instead of TO it');
  if (!keepsItsOwnAngle) submission_signals.push('the brand no longer has its own angle');

  const resonance_is_sovereign = speaksInTheirLanguage && keepsItsOwnAngle && !speaksAsThem;

  notes.push(`resonance without submission: ${resonance_is_sovereign ? 'SOVEREIGN resonance' : 'submission detected'}` +
    (submission_signals.length > 0 ? ` — ${submission_signals.join('; ')}` : ''));
  return { resonance_is_sovereign, submission_signals, notes };
}
