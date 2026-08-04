/**
 * EMOTIONAL TRUTH ALIGNMENT (Phase 225 — Wave 13: Reality Feedback Infrastructure)
 *
 * An action carries an intended feeling; the world receives some
 * other feeling. This module measures the alignment — whether what
 * the action MEANT to feel matches what it actually felt.
 */

export interface EmotionalTruthAlignmentReading {
  /** 0..10 — alignment between intended and received feeling. */
  alignment: number;
  /** True when the action's emotional truth landed as intended. */
  aligned: boolean;
  divergence: string;
  notes: string[];
}

export interface EmotionalTruthAlignmentInput {
  /** -10..10 — intended emotional valence of the action. */
  intendedValence: number;
  /** -10..10 — received emotional valence from audience reactions. */
  receivedValence: number;
  /** 0..10 — intended emotional intensity. */
  intendedIntensity: number;
  /** 0..10 — received intensity proxy. */
  receivedIntensity: number;
}

export function readEmotionalTruthAlignment(input: EmotionalTruthAlignmentInput): EmotionalTruthAlignmentReading {
  const { intendedValence, receivedValence, intendedIntensity, receivedIntensity } = input;
  const notes: string[] = [];

  const valenceGap = Math.abs(intendedValence - receivedValence);
  const intensityGap = Math.abs(intendedIntensity - receivedIntensity);
  const alignment = round1(Math.max(0, 10 - valenceGap * 0.6 - intensityGap * 0.4));

  const aligned = alignment >= 6;

  const divergence = aligned
    ? 'intended and received feeling match — the emotional truth landed'
    : valenceGap >= 4
      ? `intended valence ${intendedValence} but received ${receivedValence} — the action felt other than meant`
      : `intended intensity ${intendedIntensity}/10 but received ${receivedIntensity}/10 — the volume did not match`;

  notes.push(`emotional truth alignment: ${alignment}/10 — ${divergence}`);
  return { alignment, aligned, divergence, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
