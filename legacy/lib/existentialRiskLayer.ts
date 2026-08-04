/**
 * EXISTENTIAL RISK LAYER (Phase 89 — Wave 7: Reality Organism)
 *
 * Most risks an organism survives. A few it does not. This layer
 * detects EXISTENTIAL risk — the convergence of conditions that
 * threaten the organism itself, not merely a single banner: energy
 * collapse, runaway stress, a decaying civilization, a mutated
 * ideology, an immune system that keeps losing. When existential
 * risk is high the organism must stop and protect itself.
 */

import type { OrganismVitalState } from './persistentOrganismCore';
import type { CivilizationStabilityReading } from './civilizationStabilityLayer';
import type { IdeologicalMutationReading } from './ideologicalMutationDetection';
import type { StabilityPreservationReading } from './autonomousStabilityPreservation';

export interface ExistentialRiskReading {
  /** 0..10 — how close the organism is to existential failure. */
  existential_risk: number;
  /** True when existential risk is high enough to threaten survival. */
  organism_at_risk: boolean;
  /** The risks currently converging on the organism. */
  risk_signals: string[];
  /** The single most dangerous risk, or null when none. */
  dominant_risk: string | null;
  /** What survival now requires of the organism. */
  survival_imperative: string;
  notes: string[];
}

export interface ExistentialRiskInput {
  organism: OrganismVitalState;
  civilization: CivilizationStabilityReading;
  mutation: IdeologicalMutationReading;
  preservation: StabilityPreservationReading;
}

export function readExistentialRisk(input: ExistentialRiskInput): ExistentialRiskReading {
  const { organism, civilization, mutation, preservation } = input;
  const notes: string[] = [];
  const risk_signals: string[] = [];

  // Weighted risks — each pushes the organism toward existential
  // failure by a different amount.
  const weighted: Array<{ weight: number; signal: string }> = [];

  if (organism.energyReserves <= 2) {
    weighted.push({ weight: 4, signal: `energy reserves are critically low (${organism.energyReserves}/10)` });
  } else if (organism.energyReserves <= 4) {
    weighted.push({ weight: 2, signal: `energy reserves are depleted (${organism.energyReserves}/10)` });
  }
  if (organism.stressAccumulation >= 9) {
    weighted.push({ weight: 3, signal: `stress has accumulated past tolerance (${organism.stressAccumulation}/10)` });
  } else if (organism.stressAccumulation >= 7) {
    weighted.push({ weight: 1.5, signal: `stress is dangerously high (${organism.stressAccumulation}/10)` });
  }
  if (civilization.is_decaying) {
    weighted.push({ weight: 3, signal: 'the civilization beneath the organism is decaying' });
  }
  if (mutation.mutation_detected) {
    weighted.push({ weight: 3, signal: 'the founding ideology has mutated — the organism is losing its identity' });
  }
  if (preservation.stability_threat >= 8) {
    weighted.push({ weight: 2, signal: 'autonomic stability preservation reports a severe threat' });
  }
  // An immune system that keeps losing its encounters is itself an
  // existential signal — the organism cannot defend itself.
  const recentImmune = organism.immuneMemory.slice(-6);
  if (recentImmune.length >= 4) {
    const losses = recentImmune.filter((r) => !r.survived).length;
    if (losses / recentImmune.length >= 0.5) {
      weighted.push({ weight: 2, signal: `the immune system is failing — ${losses}/${recentImmune.length} recent threats not survived` });
    }
  }

  for (const w of weighted) risk_signals.push(w.signal);
  let existential_risk = round1(Math.min(10, weighted.reduce((s, w) => s + w.weight, 0)));

  // Convergence amplifies — three or more independent existential
  // signals at once is more than the sum of its parts.
  if (weighted.length >= 3) existential_risk = round1(Math.min(10, existential_risk + 1.5));

  const organism_at_risk = existential_risk >= 7;

  const dominant = weighted.slice().sort((a, b) => b.weight - a.weight)[0] ?? null;
  const dominant_risk = dominant ? dominant.signal : null;

  let survival_imperative: string;
  if (organism_at_risk) {
    survival_imperative = 'survival imperative: the organism must stop, rest, and protect its core — it must not act again until the risk recedes';
  } else if (existential_risk >= 4) {
    survival_imperative = 'survival imperative: the organism must act only with restraint and recover deliberately';
  } else {
    survival_imperative = 'survival imperative: none — the organism is not under existential threat';
  }

  notes.push(`existential risk: ${existential_risk}/10 — ${organism_at_risk ? 'ORGANISM AT RISK' : 'survivable'}`);
  if (risk_signals.length) notes.push(`existential risk signals: ${risk_signals.join('; ')}`);
  notes.push(survival_imperative);

  return {
    existential_risk, organism_at_risk, risk_signals, dominant_risk,
    survival_imperative, notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
