/**
 * STRATEGIC ENERGY ALLOCATION (Phase 73 — Wave 7: Reality Organism)
 *
 * The organism has finite energy. This module decides how much of it
 * this run deserves — a full commitment, a minimal one, or none at
 * all (conserve). A healthy organism does not spend its last reserves
 * on an ordinary banner.
 */

import type { OrganismVitalState } from './persistentOrganismCore';

export type EnergyAllocation = 'full-commitment' | 'measured-spend' | 'minimal-spend' | 'conserve';

export interface StrategicEnergyReading {
  allocation: EnergyAllocation;
  /** 0..10 — how much energy this run should cost. */
  energy_budget: number;
  /** True when the organism must conserve rather than spend. */
  must_conserve: boolean;
  reason: string;
  notes: string[];
}

export interface StrategicEnergyInput {
  organism: OrganismVitalState;
  /** 0..10 — how strategically worth-it this run is (Phase 36). */
  strategicWeight: number;
  /** 0..10 — environmental load (Phase 71). */
  environmentalLoad: number;
}

export function allocateStrategicEnergy(input: StrategicEnergyInput): StrategicEnergyReading {
  const { organism, strategicWeight, environmentalLoad } = input;
  const notes: string[] = [];

  const reserves = organism.energyReserves;
  let allocation: EnergyAllocation;
  let energy_budget: number;
  let reason: string;

  if (reserves <= 3) {
    allocation = 'conserve';
    energy_budget = 0.5;
    reason = `energy reserves are critically low (${reserves}/10) — the organism must conserve`;
  } else if (reserves <= 5 && strategicWeight < 6) {
    allocation = 'minimal-spend';
    energy_budget = 1;
    reason = `reserves are modest and the run is not strategically vital — spend minimally`;
  } else if (strategicWeight >= 8 && reserves >= 6) {
    allocation = 'full-commitment';
    energy_budget = 2.5;
    reason = `the run is strategically vital and reserves can bear it — full commitment`;
  } else {
    allocation = 'measured-spend';
    energy_budget = 1.6;
    reason = 'a measured spend — neither vital enough for full commitment nor low enough to conserve';
  }

  // A hostile environment raises the cost of every action.
  if (environmentalLoad >= 7) energy_budget = round1(energy_budget * 1.3);
  const must_conserve = allocation === 'conserve';

  notes.push(`strategic energy allocation: ${allocation} (budget ${energy_budget}) — ${reason}`);
  return { allocation, energy_budget, must_conserve, reason, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
