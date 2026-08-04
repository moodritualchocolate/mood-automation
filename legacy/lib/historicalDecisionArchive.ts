/**
 * HISTORICAL DECISION ARCHIVE (Phase 64 — Wave 6: Cognitive Civilization)
 *
 * Every decision the civilization has made is archived with its
 * context — so the system can explain any decision HISTORICALLY:
 * "we decided this because, across these generations, we have
 * consistently decided this way".
 */

import type { CivilizationState, ArchivedDecision } from './civilizationArchive';

export interface DecisionArchiveReading {
  /** How many decisions the archive holds. */
  archived_count: number;
  /** Verdict distribution across the civilization's whole history. */
  verdict_distribution: Record<string, number>;
  /** 0..10 — how much the archive shows optimization beating identity. */
  optimization_dominance: number;
  /** A historical precedent for the current verdict, if one exists. */
  precedent: string | null;
  notes: string[];
}

export interface DecisionArchiveInput {
  state: CivilizationState;
  /** The verdict the current run is reaching. */
  currentVerdict: string;
}

export function readDecisionArchive(input: DecisionArchiveInput): DecisionArchiveReading {
  const { state, currentVerdict } = input;
  const notes: string[] = [];
  const archive = state.decisionArchive;

  const verdict_distribution: Record<string, number> = {};
  for (const d of archive) verdict_distribution[d.verdict] = (verdict_distribution[d.verdict] ?? 0) + 1;

  const optWins = archive.filter((d) => d.optimizationWon).length;
  const optimization_dominance = archive.length
    ? round1(Math.min(10, (optWins / archive.length) * 10))
    : 0;

  // A precedent — has the civilization reached this verdict before,
  // and how often.
  const sameVerdictCount = verdict_distribution[currentVerdict] ?? 0;
  const precedent = sameVerdictCount >= 2
    ? `the civilization has reached "${currentVerdict}" ${sameVerdictCount} times before — there is precedent`
    : null;

  notes.push(`historical decision archive: ${archive.length} decisions archived, optimization dominance ${optimization_dominance}/10`);
  if (precedent) notes.push(`historical decision archive: ${precedent}`);

  return { archived_count: archive.length, verdict_distribution, optimization_dominance, precedent, notes };
}

/** Archive one decision into the civilization's permanent record. */
export function archiveDecision(
  state: CivilizationState,
  decision: Omit<ArchivedDecision, 'generation' | 'ts'>,
): CivilizationState {
  state.decisionArchive.push({
    ...decision,
    generation: state.generation,
    ts: Date.now(),
  });
  if (decision.optimizationWon) state.optimizationWins += 1;
  else state.identityWins += 1;
  return state;
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
