/**
 * CONTRADICTION DETECTION LAYER (Phase 144 — Wave 10: Reality Coupling Architecture)
 *
 * The most dangerous failure of a coupled organism is believing one
 * thing about itself while reality says another. This layer compares
 * the organism's self-model against the external feedback and surfaces
 * the contradictions — the places the organism is lying to itself.
 */

export interface RealityContradiction {
  self_belief: string;
  reality_says: string;
}

export interface ContradictionDetectionReading {
  contradictions: RealityContradiction[];
  /** True when the organism's self-model diverges from reality. */
  contradiction_detected: boolean;
  /** The sharpest contradiction, or null when self-model and reality agree. */
  the_contradiction: RealityContradiction | null;
  notes: string[];
}

export interface ContradictionDetectionInput {
  /** The organism's self-model — Wave 7 said it was adapting. */
  organismBelievesItIsAdapting: boolean;
  /** The organism's self-model — Wave 8 said the runtime was coordinated. */
  runtimeBelievesItIsCoordinated: boolean;
  /** Reality: trust is decaying. */
  trustIsDecaying: boolean;
  /** Reality: the audience is exhausted / past threshold. */
  audienceExhausted: boolean;
  /** Reality: the engagement would read as stimulus. */
  readsAsStimulus: boolean;
  /** Reality: authenticity is eroding. */
  authenticityEroding: boolean;
}

export function detectRealityContradiction(input: ContradictionDetectionInput): ContradictionDetectionReading {
  const notes: string[] = [];
  const contradictions: RealityContradiction[] = [];

  if (input.organismBelievesItIsAdapting && input.trustIsDecaying) {
    contradictions.push({
      self_belief: 'the organism believes it is adapting to reality',
      reality_says: 'reality says trust is decaying — the audience is withdrawing',
    });
  }
  if (input.organismBelievesItIsAdapting && input.readsAsStimulus) {
    contradictions.push({
      self_belief: 'the organism believes it is resonating',
      reality_says: 'reality says the response would be stimulus, not resonance',
    });
  }
  if (input.runtimeBelievesItIsCoordinated && input.audienceExhausted) {
    contradictions.push({
      self_belief: 'the runtime believes it is coordinated and ready to ship',
      reality_says: 'reality says the audience is exhausted — coordination cannot fix an exhausted listener',
    });
  }
  if (!input.readsAsStimulus && input.authenticityEroding) {
    contradictions.push({
      self_belief: 'the organism believes this run is authentic',
      reality_says: 'reality says the authenticity reserve is still eroding',
    });
  }

  const contradiction_detected = contradictions.length > 0;
  const the_contradiction = contradictions[0] ?? null;

  notes.push(contradiction_detected
    ? `contradiction detection layer: ${contradictions.length} contradiction(s) — the organism's self-model diverges from reality`
    : 'contradiction detection layer: the organism\'s self-model agrees with reality');
  return { contradictions, contradiction_detected, the_contradiction, notes };
}
