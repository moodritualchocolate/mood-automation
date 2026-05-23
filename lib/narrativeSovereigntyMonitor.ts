/**
 * NARRATIVE SOVEREIGNTY MONITOR (Phase 360 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Continuous monitor on whether the brand's narrative is staying its
 * own across cycles.
 */

export interface NarrativeSovereigntyMonitorReading {
  /** True when narrative sovereignty is intact. */
  sovereignty_intact: boolean;
  /** 0..10 — sovereignty score. */
  sovereignty: number;
  notes: string[];
}

export interface NarrativeSovereigntyMonitorInput {
  narrativeSovereign: boolean;
  cyclesOfBorrowing: number;
}

export function readNarrativeSovereigntyMonitor(input: NarrativeSovereigntyMonitorInput): NarrativeSovereigntyMonitorReading {
  const { narrativeSovereign, cyclesOfBorrowing } = input;
  const notes: string[] = [];

  const sovereignty = round1(Math.max(0, (narrativeSovereign ? 9 : 4) - cyclesOfBorrowing * 0.8));
  const sovereignty_intact = sovereignty >= 6;

  notes.push(`narrative sovereignty monitor: ${sovereignty_intact ? 'intact' : 'COMPROMISED'} (${sovereignty}/10)`);
  return { sovereignty_intact, sovereignty, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
