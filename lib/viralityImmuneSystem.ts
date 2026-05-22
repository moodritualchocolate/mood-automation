/**
 * VIRALITY IMMUNE SYSTEM (Phase 33 — Anti-Optimization / Wave 2)
 *
 * An immune response against shallow virality — meme collapse,
 * TikTokification, the dilution of identity into whatever format is
 * currently rewarded. Virality is not refused; SHALLOW virality is.
 */

export interface ViralityImmuneReading {
  /** 0..10 — risk that the banner is reaching for shallow virality. */
  virality_risk: number;
  /** True when the immune system should reject the viral reach. */
  immune_response_triggered: boolean;
  /** Named shallow-virality signatures. */
  signatures: string[];
  notes: string[];
}

export interface ViralityImmuneInput {
  /** 0..10 — viral-pattern contamination (Phase 21). */
  viralContamination: number;
  /** True when over-circulated viral vocabulary is present. */
  usesOverCirculatedVocab: boolean;
  /** 0..10 — how performative the audience comments are. */
  commentPerformativeness: number;
  /** 0..10 — emergence / truth strength. */
  truthStrength: number;
}

export function readViralityImmuneSystem(input: ViralityImmuneInput): ViralityImmuneReading {
  const { viralContamination, usesOverCirculatedVocab, commentPerformativeness, truthStrength } = input;
  const notes: string[] = [];
  const signatures: string[] = [];

  if (usesOverCirculatedVocab) signatures.push('over-circulated-viral-vocabulary');
  if (viralContamination >= 4) signatures.push('viral-pattern-contamination');
  if (commentPerformativeness >= 6) signatures.push('performative-comment-field');

  let virality_risk = 0;
  virality_risk += viralContamination * 0.4;
  virality_risk += signatures.length * 1.8;
  if (truthStrength < 5 && signatures.length > 0) virality_risk += 2;
  virality_risk = Math.min(10, round1(virality_risk));

  // The immune system triggers when virality is shallow — high risk
  // with a truth too weak to justify the reach.
  const immune_response_triggered = virality_risk >= 6 && truthStrength < 6;

  if (immune_response_triggered) {
    notes.push(`virality immune system: TRIGGERED — shallow virality reach (${signatures.join(', ')})`);
  } else if (virality_risk >= 4) {
    notes.push('virality immune system: mild virality reach — watching it');
  } else {
    notes.push('virality immune system: clear — no shallow-virality reach');
  }

  return { virality_risk, immune_response_triggered, signatures, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
