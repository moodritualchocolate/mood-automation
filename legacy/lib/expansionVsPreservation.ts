/**
 * EXPANSION VS PRESERVATION ENGINE (Phase 76 — Wave 7: Reality Organism)
 *
 * A living organism must balance GROWTH against SURVIVAL. This module
 * decides whether the organism should expand — open new territory,
 * take a risk, reach — or preserve — consolidate, hold, protect what
 * it has. An organism that only expands burns out; one that only
 * preserves ossifies.
 */

import type { OrganismVitalState } from './persistentOrganismCore';

export type GrowthPosture = 'expand' | 'balanced-growth' | 'preserve' | 'retrench';

export interface ExpansionPreservationReading {
  posture: GrowthPosture;
  /** 0..10 — how much the organism can afford to expand. */
  expansion_capacity: number;
  reason: string;
  notes: string[];
}

export interface ExpansionPreservationInput {
  organism: OrganismVitalState;
  /** 0..10 — environmental load (Phase 71). */
  environmentalLoad: number;
  /** 0..10 — civilization stability (Wave 6). */
  civilizationStability: number;
}

export function readExpansionVsPreservation(input: ExpansionPreservationInput): ExpansionPreservationReading {
  const { organism, environmentalLoad, civilizationStability } = input;
  const notes: string[] = [];

  // Expansion capacity — energy and stability allow reach; stress and
  // a hostile environment forbid it.
  let expansion_capacity = 0;
  expansion_capacity += organism.energyReserves * 0.4;
  expansion_capacity += civilizationStability * 0.35;
  expansion_capacity -= organism.stressAccumulation * 0.25;
  expansion_capacity -= environmentalLoad * 0.2;
  expansion_capacity = round1(Math.max(0, Math.min(10, expansion_capacity + 2)));

  let posture: GrowthPosture;
  let reason: string;
  if (expansion_capacity >= 7) {
    posture = 'expand';
    reason = 'energy and stability are high — the organism can afford to reach into new territory';
  } else if (expansion_capacity >= 5) {
    posture = 'balanced-growth';
    reason = 'the organism can grow, but carefully — balance reach against consolidation';
  } else if (expansion_capacity >= 3) {
    posture = 'preserve';
    reason = 'the organism should consolidate and protect what it has, not reach';
  } else {
    posture = 'retrench';
    reason = 'energy is low and the environment is hostile — the organism must retrench and survive';
  }

  notes.push(`expansion vs preservation: ${posture} (capacity ${expansion_capacity}/10) — ${reason}`);
  return { posture, expansion_capacity, reason, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
