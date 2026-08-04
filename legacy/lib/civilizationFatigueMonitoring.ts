/**
 * CIVILIZATION FATIGUE MONITORING (Phase 80 — Wave 7: Reality Organism)
 *
 * Monitors the fatigue of the whole organism-civilization — not a
 * single banner's fatigue, but the accumulated tiredness of the
 * entire system across its life. A fatigued civilization makes worse
 * decisions and must be allowed to recover.
 */

import type { OrganismVitalState } from './persistentOrganismCore';

export interface CivilizationFatigueReading {
  /** 0..10 — the whole organism's accumulated fatigue. */
  civilization_fatigue: number;
  /** True when the civilization is fatigued enough to need recovery. */
  needs_recovery: boolean;
  /** The dominant source of the fatigue. */
  fatigue_source: string;
  notes: string[];
}

export interface CivilizationFatigueInput {
  organism: OrganismVitalState;
  /** 0..10 — environmental load (Phase 71). */
  environmentalLoad: number;
}

export function readCivilizationFatigue(input: CivilizationFatigueInput): CivilizationFatigueReading {
  const { organism, environmentalLoad } = input;
  const notes: string[] = [];

  let civilization_fatigue = 0;
  civilization_fatigue += organism.stressAccumulation * 0.35;
  civilization_fatigue += (10 - organism.energyReserves) * 0.3;
  civilization_fatigue += organism.complexityLoad * 0.2;
  civilization_fatigue += Math.min(2, organism.consecutiveActions * 0.3);
  civilization_fatigue += environmentalLoad * 0.15;
  civilization_fatigue = round1(Math.min(10, civilization_fatigue));

  const needs_recovery = civilization_fatigue >= 6.5;

  // The dominant source.
  const sources: Array<[string, number]> = [
    ['accumulated stress', organism.stressAccumulation],
    ['depleted energy', 10 - organism.energyReserves],
    ['internal complexity', organism.complexityLoad],
    ['relentless activity', organism.consecutiveActions],
  ];
  const fatigue_source = [...sources].sort((a, b) => b[1] - a[1])[0][0];

  notes.push(`civilization fatigue: ${civilization_fatigue}/10 — dominant source: ${fatigue_source}`);
  if (needs_recovery) notes.push('civilization fatigue: the organism-civilization needs recovery before it makes another decision');

  return { civilization_fatigue, needs_recovery, fatigue_source, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
