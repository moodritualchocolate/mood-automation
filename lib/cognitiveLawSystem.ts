/**
 * COGNITIVE LAW SYSTEM (Phase 65 — Wave 6: Cognitive Civilization)
 *
 * When the civilization has refused the same thing enough times, the
 * refusal stops being a judgement and becomes a LAW — a standing
 * rule the civilization no longer re-debates. Laws are how a
 * civilization stops paying the cost of re-learning.
 */

import type { CivilizationState, CognitiveLaw } from './civilizationArchive';

export interface CognitiveLawReading {
  /** The laws the civilization has enacted. */
  laws: CognitiveLaw[];
  /** True when the current candidate violates a standing law. */
  violates_a_law: boolean;
  /** The law the candidate violates, if any. */
  violated_law: CognitiveLaw | null;
  notes: string[];
}

export interface CognitiveLawInput {
  state: CivilizationState;
  /** A short descriptor of the current candidate, screened against the laws. */
  candidateDescriptor: string;
}

export function readCognitiveLaws(input: CognitiveLawInput): CognitiveLawReading {
  const { state, candidateDescriptor } = input;
  const notes: string[] = [];
  const desc = candidateDescriptor.toLowerCase();

  let violated_law: CognitiveLaw | null = null;
  for (const law of state.laws) {
    const basisWords = law.basis.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5);
    if (basisWords.length >= 2 && basisWords.filter((w) => desc.includes(w)).length >= 2) {
      violated_law = law;
      break;
    }
  }

  if (violated_law) {
    notes.push(`cognitive law: the candidate violates a standing law — "${violated_law.law}"`);
  } else if (state.laws.length) {
    notes.push(`cognitive law: ${state.laws.length} law(s) on the books; the candidate is within them`);
  } else {
    notes.push('cognitive law: the civilization has not yet enacted a law');
  }

  return { laws: state.laws, violates_a_law: violated_law !== null, violated_law, notes };
}

/**
 * Enact a law when a pattern has recurred enough to stop being a
 * judgement. The basis must be a short, specific descriptor of the
 * refused pattern.
 */
export function enactLaw(state: CivilizationState, law: string, basis: string): CivilizationState {
  const id = basis.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48);
  if (state.laws.some((l) => l.id === id)) return state;
  state.laws.push({
    id, law, basis,
    enactedGeneration: state.generation,
  });
  return state;
}

/**
 * Consider enacting a law from the decision archive — when the
 * civilization has refused the same verdict-pattern repeatedly.
 */
export function considerLawFromHistory(state: CivilizationState): CivilizationState {
  // If the archive shows 4+ identity-protecting refusals, the
  // civilization enacts a law protecting identity over optimization.
  const identityRefusals = state.decisionArchive.filter(
    (d) => !d.optimizationWon && (d.verdict === 'block' || d.verdict.startsWith('reject')),
  ).length;
  if (identityRefusals >= 4) {
    enactLaw(state,
      'identity is never traded for optimization — the council shall refuse it without re-debate',
      'identity optimization refusal pattern',
    );
  }
  return state;
}
