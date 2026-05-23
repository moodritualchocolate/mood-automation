/**
 * LIVE COUPLING COHERENCE VALIDATOR (Phase 317 — Wave 14: Live Civilization Coupling)
 *
 * Checks that the live coupling layer's conclusions agree with each
 * other. A live impact while drift is high, an opportunity while a
 * crisis is active — these are caught before they propagate.
 */

export interface LiveCouplingCoherenceReading {
  /** True when the live coupling layer is internally coherent. */
  live_coupling_is_coherent: boolean;
  incoherences: string[];
  /** 0..10 — coherence score. */
  coherence_score: number;
  notes: string[];
}

export interface LiveCouplingCoherenceInput {
  realityChanged: boolean;
  driftDetected: boolean;
  opportunityOpen: boolean;
  crisisActive: boolean;
  attributionAudit: boolean;
}

export function readLiveCouplingCoherenceValidator(input: LiveCouplingCoherenceInput): LiveCouplingCoherenceReading {
  const { realityChanged, driftDetected, opportunityOpen, crisisActive, attributionAudit } = input;
  const notes: string[] = [];

  const incoherences: string[] = [];
  if (realityChanged && driftDetected) incoherences.push('claiming reality change while live coupling is drifting');
  if (opportunityOpen && crisisActive) incoherences.push('reading an opportunity inside an active crisis');
  if (realityChanged && !attributionAudit) incoherences.push('reality change claimed without passing attribution audit');

  const coherence_score = round1(Math.max(0, 10 - incoherences.length * 3));
  const live_coupling_is_coherent = incoherences.length === 0;

  notes.push(`live coupling coherence validator: ${live_coupling_is_coherent ? 'coherent' : `${incoherences.length} incoherence(s)`} (${coherence_score}/10)`);
  return { live_coupling_is_coherent, incoherences, coherence_score, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
