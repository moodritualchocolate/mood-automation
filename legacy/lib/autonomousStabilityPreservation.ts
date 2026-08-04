/**
 * AUTONOMOUS STABILITY PRESERVATION (Phase 88 — Wave 7: Reality Organism)
 *
 * The organism's autonomic self-preservation. Without being asked, it
 * protects its own stability — it will call for rest, for retrenchment,
 * for silence, the moment continued action would threaten the
 * organism itself.
 */

import type { OrganismVitalState } from './persistentOrganismCore';
import type { CivilizationFatigueReading } from './civilizationFatigueMonitoring';
import type { ComplexityRegulationReading } from './internalComplexityRegulation';

export interface StabilityPreservationReading {
  /** 0..10 — how much the organism's stability is under threat. */
  stability_threat: number;
  /** True when self-preservation calls for rest. */
  preservation_calls_for_rest: boolean;
  /** The autonomic protective action. */
  protective_action: string;
  notes: string[];
}

export interface StabilityPreservationInput {
  organism: OrganismVitalState;
  fatigue: CivilizationFatigueReading;
  complexity: ComplexityRegulationReading;
}

export function readAutonomousStabilityPreservation(input: StabilityPreservationInput): StabilityPreservationReading {
  const { organism, fatigue, complexity } = input;
  const notes: string[] = [];

  let stability_threat = 0;
  if (organism.energyReserves <= 3) stability_threat += 4;
  else if (organism.energyReserves <= 5) stability_threat += 2;
  if (fatigue.needs_recovery) stability_threat += 3;
  if (complexity.over_thinking) stability_threat += 2;
  if (organism.consecutiveActions >= 8) stability_threat += 2;
  stability_threat = round1(Math.min(10, stability_threat));

  const preservation_calls_for_rest = stability_threat >= 6;

  let protective_action: string;
  if (preservation_calls_for_rest) {
    protective_action = 'autonomic self-preservation: the organism protects itself — it must rest before it acts again';
  } else if (stability_threat >= 4) {
    protective_action = 'autonomic self-preservation: the organism should act lightly and recover soon';
  } else {
    protective_action = 'autonomic self-preservation: the organism is stable — no protective action required';
  }

  notes.push(`autonomous stability preservation: threat ${stability_threat}/10 — ${protective_action}`);
  return { stability_threat, preservation_calls_for_rest, protective_action, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
