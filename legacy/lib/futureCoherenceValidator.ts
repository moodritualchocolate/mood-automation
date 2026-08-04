/**
 * FUTURE COHERENCE VALIDATOR (Phase 178 — Wave 11: Strategic Future Intelligence)
 *
 * A future plan made of sound parts can still be incoherent as a
 * whole. This validator checks the strategic future for internal
 * contradiction — a narrative heading one way while the identity plan
 * heads another, a branch that no scenario supports.
 */

export interface FutureCoherenceReading {
  /** True when the strategic future is internally coherent. */
  future_is_coherent: boolean;
  incoherences: string[];
  /** 0..10 — how coherent the future plan is. */
  coherence_score: number;
  notes: string[];
}

export interface FutureCoherenceInput {
  /** True when the projected narrative still coheres with its origin. */
  narrativeCoherent: boolean;
  /** True when identity is projected to survive the horizon. */
  identitySurvivesHorizon: boolean;
  /** True when the organism is on a healthy timeline branch. */
  onHealthyBranch: boolean;
  /** True when the future identity projection is still true. */
  identityProjectionTrue: boolean;
}

export function validateFutureCoherence(input: FutureCoherenceInput): FutureCoherenceReading {
  const { narrativeCoherent, identitySurvivesHorizon, onHealthyBranch, identityProjectionTrue } = input;
  const notes: string[] = [];

  const incoherences: string[] = [];
  if (!narrativeCoherent) incoherences.push('the projected narrative no longer coheres with its origin');
  if (!identitySurvivesHorizon) incoherences.push('the plan does not carry identity to the end of the horizon');
  if (!onHealthyBranch) incoherences.push('the organism is walking a timeline branch no scenario supports');
  if (!identityProjectionTrue) incoherences.push('the projected identity contradicts the founding identity');
  if (narrativeCoherent && !identityProjectionTrue) {
    incoherences.push('the narrative holds but the identity projection drifts — the two disagree');
  }

  const coherence_score = round1(Math.max(0, 10 - incoherences.length * 2.6));
  const future_is_coherent = incoherences.length === 0;

  notes.push(`future coherence validator: ${future_is_coherent ? 'the future plan is coherent' : `${incoherences.length} incoherence(s) — the future plan contradicts itself`} (${coherence_score}/10)`);
  return { future_is_coherent, incoherences, coherence_score, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
