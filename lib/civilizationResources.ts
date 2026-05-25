/**
 * CIVILIZATION RESOURCES (Wave 42)
 *
 * Ten finite global resource pools shared across all civilization
 * lineages. Each civilization consumes from + contributes to the
 * SAME pools — no civilization evolves in isolation now.
 *
 * Resource economic profiles are derived deterministically from the
 * civilization's genome (no stochasticity). Aggregate consumption
 * across all active lineages depletes pools; passive regeneration
 * partially restores them.
 *
 * NOT mood. NOT story. Civilizational market physics.
 */

import type {
  CivilizationGenome, CivilizationLineage, CivilizationSpecies,
} from './evolutionMemory';

// ─── ten finite resource pools ─────────────────────────────────

export type ResourceId =
  | 'cognitiveEnergy'
  | 'recoveryCapacity'
  | 'governanceBandwidth'
  | 'mutationCapacity'
  | 'continuityReserve'
  | 'ecologicalStability'
  | 'adaptationLiquidity'
  | 'strategicAttention'
  | 'explorationBudget'
  | 'survivabilityCapital';

export const ALL_MARKET_RESOURCES: ResourceId[] = [
  'cognitiveEnergy', 'recoveryCapacity', 'governanceBandwidth',
  'mutationCapacity', 'continuityReserve', 'ecologicalStability',
  'adaptationLiquidity', 'strategicAttention', 'explorationBudget',
  'survivabilityCapital',
];

/** Homeostatic baseline each pool drifts toward absent activity. */
export const MARKET_RESOURCE_BASELINES: Record<ResourceId, number> = {
  cognitiveEnergy:       55,
  recoveryCapacity:      55,
  governanceBandwidth:   55,
  mutationCapacity:      55,
  continuityReserve:     60,
  ecologicalStability:   60,
  adaptationLiquidity:   55,
  strategicAttention:    55,
  explorationBudget:     55,
  survivabilityCapital:  60,
};

export const MARKET_RESOURCE_MAX = 100;

export interface MarketResourceLevels {
  cognitiveEnergy: number;
  recoveryCapacity: number;
  governanceBandwidth: number;
  mutationCapacity: number;
  continuityReserve: number;
  ecologicalStability: number;
  adaptationLiquidity: number;
  strategicAttention: number;
  explorationBudget: number;
  survivabilityCapital: number;
}

// ─── per-civilization economic profile ────────────────────────

export interface EconomicProfile {
  /** Per-resource consumption rate this event (≥ 0). */
  consumption: Record<ResourceId, number>;
  /** Per-resource production rate this event (≥ 0). */
  production: Record<ResourceId, number>;
  /** Aggregate efficiency = total production / total consumption.
   *  ≥ 1.0 = net producer; < 1.0 = net consumer. */
  efficiency: number;
  /** 0..1 — bias toward retaining produced resources rather than
   *  contributing back to the commons. */
  hoardingTendency: number;
  /** 0..10 — composite measure of long-horizon viability. */
  sustainabilityScore: number;
  /** 0..1 — how aggressively this civ extracts from scarce pools. */
  extractionPressure: number;
  /** 0..1 — how vulnerable this civ is to scarcity-driven collapse. */
  collapseSensitivity: number;
  /** 0..1 — willingness to participate in coalitions. */
  tradeCapacity: number;
  /** 0..10 — surplus held as future-investment cushion. */
  strategicReserve: number;
  /** 0..10 — operational cost of adapting to scarcity events. */
  adaptationCost: number;
}

// ─── deterministic genome → economic profile ──────────────────

function zeroResourceMap(): Record<ResourceId, number> {
  const m: Partial<Record<ResourceId, number>> = {};
  for (const r of ALL_MARKET_RESOURCES) m[r] = 0;
  return m as Record<ResourceId, number>;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

export function genomeToEconomicProfile(genome: CivilizationGenome): EconomicProfile {
  const consumption = zeroResourceMap();
  const production = zeroResourceMap();

  // Consumption profile (each civ consumes from the commons proportional
  // to its dominant traits). Magnitudes 0..1.
  consumption.cognitiveEnergy      = round2(0.3 + genome.governanceRigidity * 0.2 + genome.explorationTolerance * 0.2);
  consumption.recoveryCapacity     = round2(0.2 + genome.collapseResponse * 0.3);
  consumption.governanceBandwidth  = round2(0.2 + genome.governanceRigidity * 0.5);
  consumption.mutationCapacity     = round2(0.15 + genome.mutationTolerance * 0.6 + genome.explorationTolerance * 0.2);
  consumption.continuityReserve    = round2(0.15 + (1 - genome.continuityPreservation) * 0.4);
  consumption.ecologicalStability  = round2(0.15 + genome.explorationTolerance * 0.4 + (1 - genome.continuityPreservation) * 0.2);
  consumption.adaptationLiquidity  = round2(0.2 + genome.mutationTolerance * 0.3 + genome.ecologySensitivity * 0.2);
  consumption.strategicAttention   = round2(0.2 + genome.strategicHorizonWeighting * 0.5);
  consumption.explorationBudget    = round2(0.1 + genome.explorationTolerance * 0.7);
  consumption.survivabilityCapital = round2(0.15 + (1 - genome.collapseResponse) * 0.3);

  // Production profile (each civ contributes to the commons proportional
  // to complementary traits).
  production.recoveryCapacity      = round2(genome.recoveryWeighting * 0.6);
  production.continuityReserve     = round2(genome.continuityPreservation * 0.7);
  production.ecologicalStability   = round2(genome.continuityPreservation * 0.4 + genome.collapseResponse * 0.3);
  production.governanceBandwidth   = round2(genome.governanceRigidity * 0.4);
  production.survivabilityCapital  = round2(genome.collapseResponse * 0.5 + genome.recoveryWeighting * 0.2);
  production.adaptationLiquidity   = round2(genome.ecologySensitivity * 0.4 + genome.mutationTolerance * 0.2);
  production.cognitiveEnergy       = round2(genome.recoveryWeighting * 0.3);
  production.mutationCapacity      = round2(genome.mutationTolerance * 0.3);
  production.strategicAttention    = round2(genome.strategicHorizonWeighting * 0.3);
  production.explorationBudget     = round2(genome.explorationTolerance * 0.2);

  const totalConsumption = ALL_MARKET_RESOURCES.reduce((a, r) => a + consumption[r], 0);
  const totalProduction = ALL_MARKET_RESOURCES.reduce((a, r) => a + production[r], 0);
  const efficiency = totalConsumption === 0 ? 1 : round2(totalProduction / totalConsumption);

  // Derived behavioral metrics (each 0..1 or 0..10).
  const hoardingTendency = round2(Math.min(1,
    (genome.governanceRigidity + (1 - genome.recoveryWeighting) + (1 - genome.continuityPreservation)) / 3,
  ));
  const sustainabilityScore = round2(Math.min(10, Math.max(0,
    efficiency * 4 + genome.continuityPreservation * 3 + genome.collapseResponse * 2,
  )));
  const extractionPressure = round2(Math.min(1,
    (totalConsumption - totalProduction) > 0 ? (totalConsumption - totalProduction) / 5 : 0,
  ));
  const collapseSensitivity = round2(Math.min(1,
    (1 - genome.collapseResponse) * 0.5 + (1 - genome.continuityPreservation) * 0.5,
  ));
  const tradeCapacity = round2(Math.min(1,
    (genome.continuityPreservation + genome.ecologySensitivity + (1 - genome.governanceRigidity)) / 3,
  ));
  const strategicReserve = round2(Math.min(10,
    genome.strategicHorizonWeighting * 6 + genome.continuityPreservation * 3,
  ));
  const adaptationCost = round2(Math.min(10,
    genome.governanceRigidity * 5 + (1 - genome.mutationTolerance) * 3,
  ));

  return {
    consumption, production, efficiency,
    hoardingTendency, sustainabilityScore, extractionPressure,
    collapseSensitivity, tradeCapacity, strategicReserve, adaptationCost,
  };
}

// ─── inter-civilization effect modifiers ───────────────────────

/** Per-species global externality. Magnitudes scale with the
 *  species' aggregate presence (sum of selectionScores). Each value
 *  is a per-event additive effect on the corresponding pool. */
export const SPECIES_EXTERNALITIES: Record<CivilizationSpecies, Partial<Record<ResourceId, number>>> = {
  'unspeciated':              {},
  'expansion-civilization':   { ecologicalStability: -0.4, strategicAttention: -0.3, explorationBudget: -0.3, mutationCapacity: -0.2 },
  'preservation-civilization': { ecologicalStability: +0.5, continuityReserve: +0.4, survivabilityCapital: +0.3 },
  'adaptive-civilization':    { adaptationLiquidity: +0.3, mutationCapacity: +0.2 },
  'mutation-civilization':    { ecologicalStability: -0.3, mutationCapacity: -0.4, adaptationLiquidity: +0.2 },
  'governance-civilization':  { governanceBandwidth: -0.5, ecologicalStability: +0.2, survivabilityCapital: +0.2 },
  'recovery-civilization':    { recoveryCapacity: +0.5, ecologicalStability: +0.2, cognitiveEnergy: +0.3 },
  'continuity-civilization':  { continuityReserve: +0.5, strategicAttention: +0.3, survivabilityCapital: +0.2 },
};
