/**
 * EMERGENT IDENTITY CONTINUITY (Phase 70 — Wave 6: Cognitive Civilization)
 *
 * The closing module of Wave 6 — the point at which the system stops
 * feeling like software and becomes a persistent strategic organism
 * WITH HISTORY. It synthesises the whole civilization — its
 * institutional memory, beliefs, myths, scars, laws, stability — into
 * one answer: has the identity persisted across the civilization's
 * entire life?
 *
 * The governing question of Wave 6: "Did this decision emerge from
 * accumulated civilization memory, or from temporary optimization
 * pressure?"
 */

import type { CivilizationState } from './civilizationArchive';
import type { InstitutionalMemoryReading } from './institutionalMemory';
import type { BeliefPersistenceReading } from './beliefPersistence';
import type { CivilizationStabilityReading } from './civilizationStabilityLayer';
import type { CognitiveLawReading } from './cognitiveLawSystem';
import type { ScarMemoryReading } from './psychologicalScarMemory';

export interface EmergentIdentityContinuityReading {
  /** 0..10 — how continuous the civilization's identity has been. */
  identity_continuity: number;
  /** True when this decision emerged from accumulated civilization memory. */
  emerged_from_civilization_memory: boolean;
  /** True when this decision was driven by temporary optimization pressure. */
  driven_by_optimization_pressure: boolean;
  /** The civilization's age, in generations. */
  civilization_age: number;
  /** A historical explanation of the decision. */
  historical_explanation: string;
  /** A one-line statement of the civilization's persisting identity. */
  identity_statement: string;
  notes: string[];
}

export interface EmergentIdentityContinuityInput {
  state: CivilizationState;
  institutional: InstitutionalMemoryReading;
  beliefs: BeliefPersistenceReading;
  stability: CivilizationStabilityReading;
  laws: CognitiveLawReading;
  scars: ScarMemoryReading;
  /** True when the current decision honoured identity over optimization. */
  identityHeld: boolean;
}

export function readEmergentIdentityContinuity(input: EmergentIdentityContinuityInput): EmergentIdentityContinuityReading {
  const { state, institutional, beliefs, stability, laws, scars, identityHeld } = input;
  const notes: string[] = [];

  const civilization_age = state.generation;

  // Identity continuity — built from institutional consistency, the
  // strength of inherited beliefs, and civilization stability.
  let identity_continuity = 0;
  identity_continuity += institutional.institutional_consistency * 0.35;
  identity_continuity += beliefs.belief_structure_strength * 0.25;
  identity_continuity += stability.stability * 0.4;
  identity_continuity = round1(Math.max(0, Math.min(10, identity_continuity)));

  // The decision emerged from civilization memory when it was shaped
  // by beliefs, laws, scars, or institutional precedent — and when it
  // held identity rather than bending to optimization.
  const shapedByMemory =
    beliefs.core_belief !== null ||
    laws.laws.length > 0 ||
    scars.active_scars.length > 0 ||
    institutional.remembered_sessions >= 5;
  const emerged_from_civilization_memory = shapedByMemory && identityHeld && !stability.is_decaying;
  const driven_by_optimization_pressure = !identityHeld || stability.is_decaying;

  const historical_explanation = civilization_age < 4
    ? 'the civilization is too young to explain this decision historically — it is still founding its memory'
    : `across ${civilization_age} generations the civilization has governed by "${institutional.dominant_governing_priority ?? 'a forming character'}", ` +
      `holds ${beliefs.held_beliefs.length} inherited belief(s) and ${laws.laws.length} law(s), ` +
      `and is currently ${stability.condition}; this decision ${emerged_from_civilization_memory ? 'emerged from that accumulated memory' : 'was driven by temporary pressure, not memory'}`;

  const identity_statement = stability.is_decaying
    ? 'the civilization\'s identity is decaying — optimization has been overriding what it believes'
    : `the civilization has held its identity across ${civilization_age} generations — ${beliefs.core_belief?.statement ?? 'its founding character endures'}`;

  notes.push(`emergent identity continuity: ${identity_continuity}/10 — ${emerged_from_civilization_memory ? 'emerged from civilization memory' : 'driven by optimization pressure'}`);
  notes.push(`historical explanation: ${historical_explanation}`);

  return {
    identity_continuity,
    emerged_from_civilization_memory,
    driven_by_optimization_pressure,
    civilization_age,
    historical_explanation,
    identity_statement,
    notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
