/**
 * INTERNAL COMPLEXITY REGULATION (Phase 85 — Wave 7: Reality Organism)
 *
 * A 70-phase cognition stack can collapse under its own complexity.
 * This module is the organism's regulator — it watches the internal
 * complexity load and, when the system is over-thinking, calls for
 * simplification: trust the core, quiet the periphery.
 */

import type { OrganismVitalState } from './persistentOrganismCore';

export interface ComplexityRegulationReading {
  /** 0..10 — the organism's internal complexity load. */
  complexity_load: number;
  /** True when the system is over-thinking and should simplify. */
  over_thinking: boolean;
  /** The regulation instruction. */
  regulation: string;
  notes: string[];
}

export interface ComplexityRegulationInput {
  organism: OrganismVitalState;
  /** Count of internal contradictions / conflicts surfaced this run. */
  contradictionCount: number;
  /** Count of soft signals the cognition stack produced this run. */
  softSignalCount: number;
}

export function readInternalComplexityRegulation(input: ComplexityRegulationInput): ComplexityRegulationReading {
  const { organism, contradictionCount, softSignalCount } = input;
  const notes: string[] = [];

  let complexity_load = organism.complexityLoad;
  complexity_load += Math.min(3, contradictionCount * 0.6);
  complexity_load += Math.min(3, Math.max(0, softSignalCount - 20) * 0.2);
  complexity_load = round1(Math.min(10, complexity_load));

  const over_thinking = complexity_load >= 7;
  const regulation = over_thinking
    ? 'the system is over-thinking — regulate: trust the core human truth and quiet the peripheral cognition'
    : 'internal complexity is within healthy bounds — no regulation required';

  notes.push(`internal complexity regulation: load ${complexity_load}/10 — ${regulation}`);
  return { complexity_load, over_thinking, regulation, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
