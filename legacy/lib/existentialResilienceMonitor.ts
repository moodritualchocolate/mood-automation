/**
 * EXISTENTIAL RESILIENCE MONITOR (Phase 399 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Reads the brand's resilience across its entire existence — has it
 * stayed itself across many cycles of pressure?
 */

export interface ExistentialResilienceReading {
  /** 0..10 — existential resilience. */
  resilience: number;
  /** True when the brand is existentially resilient. */
  is_resilient: boolean;
  notes: string[];
}

export interface ExistentialResilienceInput {
  cyclesLived: number;
  cyclesSovereign: number;
  cyclesCaptured: number;
}

export function readExistentialResilienceMonitor(input: ExistentialResilienceInput): ExistentialResilienceReading {
  const { cyclesLived, cyclesSovereign, cyclesCaptured } = input;
  const notes: string[] = [];

  const ratio = cyclesLived > 0 ? (cyclesSovereign - cyclesCaptured) / cyclesLived : 0;
  const resilience = round1(Math.max(0, Math.min(10, 5 + ratio * 5)));
  const is_resilient = resilience >= 6;

  notes.push(`existential resilience monitor: ${resilience}/10 — ${is_resilient ? 'resilient' : 'fragile'}`);
  return { resilience, is_resilient, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
