/**
 * LIVE COUPLING MEMORY ARCHIVE (Phase 308 — Wave 14: Live Civilization Coupling)
 *
 * The persistent memory of live coupling — the organism's record of
 * how it has been present (or absent) across cycles.
 */

export interface LiveCouplingMemoryArchiveReading {
  /** True when the archive is deep enough to draw lessons from. */
  archive_is_meaningful: boolean;
  /** 0..10 — depth of the live coupling memory. */
  memory_depth: number;
  archive_summary: string;
  notes: string[];
}

export interface LiveCouplingMemoryArchiveInput {
  couplingCycles: number;
  meaningsCarried: number;
  noveltyChased: number;
  silencesObserved: number;
}

export function readLiveCouplingMemoryArchive(input: LiveCouplingMemoryArchiveInput): LiveCouplingMemoryArchiveReading {
  const { couplingCycles, meaningsCarried, noveltyChased, silencesObserved } = input;
  const notes: string[] = [];

  const memory_depth = round1(Math.min(10, couplingCycles * 0.3 + meaningsCarried * 0.4 + silencesObserved * 0.2));
  const archive_is_meaningful = memory_depth >= 4 && couplingCycles >= 3;

  const archive_summary = `${couplingCycles} live cycles · ${meaningsCarried} meaning(s) carried · ${noveltyChased} novelty chase(s) · ${silencesObserved} silence(s)`;

  notes.push(`live coupling memory archive: ${memory_depth}/10 — ${archive_summary}`);
  return { archive_is_meaningful, memory_depth, archive_summary, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
