/**
 * FEEDBACK COHERENCE VALIDATOR (Phase 258 — Wave 13: Reality Feedback Infrastructure)
 *
 * The feedback layer's own conclusions must agree with each other. A
 * trust shift up while resonance reads collapse, a narrative landed
 * while a counter-narrative is forming — these are incoherences this
 * validator catches before the conclusions reach strategy.
 */

export interface FeedbackCoherenceReading {
  /** True when the feedback layer's conclusions agree with each other. */
  feedback_is_coherent: boolean;
  incoherences: string[];
  /** 0..10 — coherence of the feedback layer. */
  coherence_score: number;
  notes: string[];
}

export interface FeedbackCoherenceInput {
  trustGaining: boolean;
  resonanceCollapsed: boolean;
  narrativeLanded: boolean;
  counterNarrativeForming: boolean;
  signalHasIntegrity: boolean;
}

export function readFeedbackCoherenceValidator(input: FeedbackCoherenceInput): FeedbackCoherenceReading {
  const { trustGaining, resonanceCollapsed, narrativeLanded, counterNarrativeForming, signalHasIntegrity } = input;
  const notes: string[] = [];

  const incoherences: string[] = [];
  if (trustGaining && resonanceCollapsed) incoherences.push('trust is gaining while resonance has collapsed');
  if (narrativeLanded && counterNarrativeForming) incoherences.push('the narrative landed yet a counter-narrative is forming');
  if (!signalHasIntegrity) incoherences.push('conclusions are being drawn from a signal that lacks integrity');

  const coherence_score = round1(Math.max(0, 10 - incoherences.length * 3));
  const feedback_is_coherent = incoherences.length === 0;

  notes.push(`feedback coherence validator: ${feedback_is_coherent ? 'feedback layer is coherent' : `${incoherences.length} incoherence(s)`} (${coherence_score}/10)`);
  return { feedback_is_coherent, incoherences, coherence_score, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
