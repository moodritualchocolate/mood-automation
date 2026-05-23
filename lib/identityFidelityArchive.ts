/**
 * IDENTITY FIDELITY ARCHIVE (Phase 391 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Archives a fidelity score across the campaign's life — how true the
 * brand has stayed to itself, cycle by cycle.
 */

export interface IdentityFidelityArchiveReading {
  /** 0..10 — overall fidelity across the archive. */
  fidelity: number;
  /** True when fidelity has been kept above the bar. */
  fidelity_kept: boolean;
  notes: string[];
}

export interface IdentityFidelityArchiveInput {
  truthChosenOverPopularity: number;
  popularityChosenOverTruth: number;
}

export function readIdentityFidelityArchive(input: IdentityFidelityArchiveInput): IdentityFidelityArchiveReading {
  const { truthChosenOverPopularity, popularityChosenOverTruth } = input;
  const notes: string[] = [];

  const total = truthChosenOverPopularity + popularityChosenOverTruth;
  const fidelity = total > 0 ? round1((truthChosenOverPopularity / total) * 10) : 8;
  const fidelity_kept = fidelity >= 6;

  notes.push(`identity fidelity archive: ${fidelity}/10 — ${fidelity_kept ? 'kept' : 'broken'}`);
  return { fidelity, fidelity_kept, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
