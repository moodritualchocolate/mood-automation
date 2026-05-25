/**
 * EVOLUTION ENGINE (Wave 41)
 *
 * Deterministic civilization evolution physics. NOT a genetic
 * algorithm. NOT stochastic. Mutations are reproducible
 * transformations of a structural genome derived from accumulated
 * operational pressure (collapse recurrence + regret + scars +
 * survivability failures + ecology instability + continuity
 * fragmentation). Each candidate lineage is simulated at four
 * horizons (+10/+50/+100/+250) via Wave 36's projectHorizon using
 * the lineage's genome-derived gradient profile. Fitness scores
 * select the dominant lineage with hysteresis.
 *
 * Same history → same evolution tree.
 */

import type {
  CivilizationGenome, CivilizationLineage, FitnessSample,
  EvolutionMemoryState, EvolutionaryPressureSample, GenerationEvent,
  MutationOrigin, GenomeKey, CivilizationSpecies, CollapseEvent,
} from './evolutionMemory';
import { ALL_GENOME_KEYS, SEED_GENOME } from './evolutionMemory';
import type { RegulationGradients } from './cognitiveGovernance';
import type { SimulatedState } from './consequenceMemory';
import { projectHorizon } from './strategicSimulation';
import type { CounterfactualMemoryState } from './counterfactualMemory';
import type { HistoricalMemoryState } from './historicalMemory';
import type { MissionContinuityState } from './missionContinuityMemory';
import type { ResourceEconomyState } from './resourceEconomyMemory';
import type { InternalEcologyState } from './internalEcologyMemory';
import type { MetaCognitiveState } from './metaCognitive';

// ─── tuning constants ──────────────────────────────────────────

/** Events between evolution-cycle attempts. */
export const GENERATION_INTERVAL_EVENTS = 12;
/** Minimum pressure to trigger a generation cycle. */
export const GENERATION_PRESSURE_THRESHOLD = 2.0;
/** Children spawned per generation when pressure warrants. */
export const CHILDREN_PER_GENERATION = 4;
/** Min selection-score margin a challenger must beat dominant by to take over. */
export const DOMINANCE_MARGIN = 0.6;
/** Generation persistence required before dominant change allowed. */
export const DOMINANCE_HYSTERESIS_GENERATIONS = 1;
/** Max per-key mutation delta. */
export const MAX_MUTATION_DELTA = 0.25;
/** EWMA alpha for lineage fitness. */
export const FITNESS_EWMA_ALPHA = 0.25;
/** Extinction risk threshold above which a lineage is marked extinct. */
export const EXTINCTION_RISK_THRESHOLD = 0.85;
/** Sustained sub-3 selection-score events to start extinction. */
export const EXTINCTION_LOW_SCORE_THRESHOLD = 3;
export const EVOLUTION_BIAS_CLAMP = 0.20;

// ─── helpers ──────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp01(n: number): number { return clamp(0, 1, n); }
function clamp10(n: number): number { return clamp(0, 10, n); }
function clampBias(n: number): number { return clamp(-EVOLUTION_BIAS_CLAMP, EVOLUTION_BIAS_CLAMP, n); }
function round2(n: number): number { return Math.round(n * 100) / 100; }
function round3(n: number): number { return Math.round(n * 1000) / 1000; }

// ─── genome → governance gradients ────────────────────────────

/** Pure deterministic mapping from a civilization genome to a
 *  RegulationGradients profile. Used both for evolution simulation
 *  AND for applying EvolutionBias to the live governance. */
export function genomeToGradients(g: CivilizationGenome): RegulationGradients {
  return {
    cognitionThroughput:  round2(clamp01(1.0 - g.governanceRigidity * 0.6 + g.explorationTolerance * 0.1)),
    escalationPermission: round2(clamp01(1.0 - g.governanceRigidity * 0.7 - g.continuityPreservation * 0.1)),
    explorationIntensity: round2(clamp01(g.explorationTolerance * 0.8 + 0.1)),
    deferAcceptance:      round2(clamp01(0.2 + g.continuityPreservation * 0.5 + g.recoveryWeighting * 0.2)),
    recoveryWeighting:    round2(clamp01(g.recoveryWeighting * 0.7 + g.collapseResponse * 0.2)),
    burstTolerance:       round2(clamp01(0.3 + g.explorationTolerance * 0.5 - g.governanceRigidity * 0.2)),
  };
}

// ─── pressure-to-mutation mapping ─────────────────────────────

/** For each MutationOrigin, deterministic per-key delta directions
 *  signed by what the pressure suggests. */
const MUTATION_DIRECTIONS: Record<MutationOrigin, Partial<Record<GenomeKey, number>>> = {
  'collapse-recurrence': {
    collapseResponse:          +1,
    continuityPreservation:    +1,
    governanceRigidity:        +1,
    explorationTolerance:      -1,
    strategicHorizonWeighting: +1,
  },
  'regret-accumulation': {
    doctrineWeighting:         +1,
    mutationTolerance:         +1,
    governanceRigidity:        -1,
    strategicHorizonWeighting: +1,
  },
  'doctrine-scars': {
    doctrineWeighting:         +1,
    explorationTolerance:      -1,
    continuityPreservation:    +1,
  },
  'survivability-failure': {
    recoveryWeighting:         +1,
    collapseResponse:          +1,
    governanceRigidity:        +1,
    explorationTolerance:      -1,
  },
  'ecology-instability': {
    ecologySensitivity:        +1,
    governanceRigidity:        +1,
    mutationTolerance:         -1,
  },
  'continuity-fragmentation': {
    continuityPreservation:    +1,
    strategicHorizonWeighting: +1,
    explorationTolerance:      -1,
  },
  'historical-precedent': {
    doctrineWeighting:         +1,
    governanceRigidity:        +1,
  },
  'seed': {},
};

/** Generate a deterministic mutation vector from a pressure source
 *  and intensity (0..10). Magnitude scales with intensity. */
export function generateMutationVector(
  origin: MutationOrigin, intensity: number,
): Partial<Record<GenomeKey, number>> {
  const dirs = MUTATION_DIRECTIONS[origin];
  if (!dirs) return {};
  const magnitude = clamp(0.02, MAX_MUTATION_DELTA, (intensity / 10) * MAX_MUTATION_DELTA);
  const out: Partial<Record<GenomeKey, number>> = {};
  for (const [k, dir] of Object.entries(dirs) as [GenomeKey, number][]) {
    out[k] = round3(dir * magnitude);
  }
  return out;
}

export function applyMutation(parent: CivilizationGenome, vector: Partial<Record<GenomeKey, number>>): CivilizationGenome {
  const out = { ...parent };
  for (const k of ALL_GENOME_KEYS) {
    const delta = vector[k] ?? 0;
    out[k] = round3(clamp01(parent[k] + delta));
  }
  return out;
}

// ─── pressure computation ─────────────────────────────────────

export interface EvolutionPressureSignal {
  historical: HistoricalMemoryState | null;
  counterfactual: CounterfactualMemoryState | null;
  mission: MissionContinuityState | null;
  resource: ResourceEconomyState | null;
  ecology: InternalEcologyState | null;
  meta: MetaCognitiveState | null;
}

export function computeEvolutionaryPressure(
  sig: EvolutionPressureSignal,
): EvolutionaryPressureSample {
  // collapse-recurrence: sum of historical archetype confidence
  const collapseRecurrenceContrib = sig.historical
    ? Math.min(10, Object.values(sig.historical.collapseArchetypes)
        .reduce((a, c) => a + c.recurrenceConfidence * 2.5, 0))
    : 0;
  // regret-accumulation: max counterfactual regret pressure
  const regretContrib = sig.counterfactual
    ? Math.min(10, Object.values(sig.counterfactual.regrets)
        .filter((r) => r.strategyId !== 'actual')
        .reduce((m, r) => Math.max(m, r.accumulatedPressure), 0))
    : 0;
  // doctrine-scars: total scar intensity / 3
  const doctrineScarsContrib = sig.historical
    ? Math.min(10, Object.values(sig.historical.scars).reduce((a, s) => a + s.intensity, 0) / 3)
    : 0;
  // survivability-failure: how far reliability is below 5
  const reliabilityFail = Math.max(0, 5 - (sig.meta?.cumulativeReliabilityScore ?? 7));
  const survivabilityFailureContrib = reliabilityFail * 1.5;
  // ecology-instability: volatility field + unstable/exhausted states
  const ecologyInstabilityContrib = sig.ecology
    ? Math.min(10,
        sig.ecology.volatilityField
        + (sig.ecology.state === 'unstable' || sig.ecology.state === 'exhausted' ? 3 : 0)
      )
    : 0;
  // continuity-fragmentation: existential drift + low continuity strength
  const continuityFragmentationContrib = sig.mission
    ? Math.min(10, sig.mission.existentialDrift + Math.max(0, 5 - sig.mission.continuityStrength) * 0.5)
    : 0;

  // Composite pressure: weighted mean of contributions, scaled to 0..10
  const composite = clamp10(
    collapseRecurrenceContrib       * 0.20 +
    regretContrib                   * 0.15 +
    doctrineScarsContrib            * 0.15 +
    survivabilityFailureContrib     * 0.15 +
    ecologyInstabilityContrib       * 0.15 +
    continuityFragmentationContrib  * 0.20,
  );

  return {
    at: Date.now(), tick: 0,
    pressure: round2(composite),
    collapseRecurrenceContrib: round2(collapseRecurrenceContrib),
    regretContrib: round2(regretContrib),
    doctrineScarsContrib: round2(doctrineScarsContrib),
    survivabilityFailureContrib: round2(survivabilityFailureContrib),
    ecologyInstabilityContrib: round2(ecologyInstabilityContrib),
    continuityFragmentationContrib: round2(continuityFragmentationContrib),
  };
}

/** Pick the top-N pressure sources to spawn children from. */
export function rankPressureSources(sample: EvolutionaryPressureSample, n: number): MutationOrigin[] {
  const entries: Array<{ origin: MutationOrigin; value: number }> = [
    { origin: 'collapse-recurrence',      value: sample.collapseRecurrenceContrib },
    { origin: 'regret-accumulation',      value: sample.regretContrib },
    { origin: 'doctrine-scars',           value: sample.doctrineScarsContrib },
    { origin: 'survivability-failure',    value: sample.survivabilityFailureContrib },
    { origin: 'ecology-instability',      value: sample.ecologyInstabilityContrib },
    { origin: 'continuity-fragmentation', value: sample.continuityFragmentationContrib },
  ];
  return entries
    .filter((e) => e.value > 0.3)
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .map((e) => e.origin);
}

// ─── fitness simulation ──────────────────────────────────────

function simulateLineageFitness(
  lineage: CivilizationLineage, start: SimulatedState,
): { sample: FitnessSample; collapses: CollapseEvent[] } {
  const gradients = genomeToGradients(lineage.genome);
  const h10 = projectHorizon(start, gradients, 10);
  const h50 = projectHorizon(start, gradients, 50);
  const h100 = projectHorizon(start, gradients, 100);
  const h250 = projectHorizon(start, gradients, 250);

  // longSurvivability from +250
  const longSurvivability = h250.survivability;
  // continuityIntegrity from end-coherence at +100
  const continuityIntegrity = h100.endState.coherence;
  // ecologicalBalance: lower tension + stress = higher balance
  const ecologicalBalance = clamp10(
    ((10 - h100.endState.maxTension) + (10 - h100.endState.stress)) / 2,
  );
  // collapseResistance: inverse of critical-region flags weighted
  const criticalCount = [h10, h50, h100, h250].filter((h) => h.enteredCritical).length;
  const collapseResistance = clamp10(10 - criticalCount * 2.5);
  // recoveryCapability: budget + energy at +100
  const recoveryCapability = clamp10((h100.endState.budget / 5) + h100.endState.energy * 0.5);
  // strategicConsistency: short and long survivability aligned (low variance)
  const survVariance = Math.max(0, h10.survivability - longSurvivability);
  const strategicConsistency = clamp10(10 - survVariance * 15);
  // civilizationPersistence: reliability at +250
  const civilizationPersistence = h250.endState.reliability;

  // Composite fitness — weighted mean prioritizing long-horizon over short.
  const composite = clamp10(
    longSurvivability       * 0.25 * 10  // 0..2.5
    + continuityIntegrity   * 0.15
    + ecologicalBalance     * 0.10
    + collapseResistance    * 0.15
    + recoveryCapability    * 0.10
    + strategicConsistency  * 0.10
    + civilizationPersistence * 0.15,
  );

  const sample: FitnessSample = {
    at: Date.now(), tick: 0,
    longSurvivability: round2(longSurvivability),
    continuityIntegrity: round2(continuityIntegrity),
    ecologicalBalance: round2(ecologicalBalance),
    collapseResistance: round2(collapseResistance),
    recoveryCapability: round2(recoveryCapability),
    strategicConsistency: round2(strategicConsistency),
    civilizationPersistence: round2(civilizationPersistence),
    composite: round2(composite),
  };

  // Collapse events: log any critical horizon
  const collapses: CollapseEvent[] = [];
  if (h10.enteredCritical) collapses.push({ at: Date.now(), tick: 0, horizon: 10, severity: round2((1 - h10.survivability) * 10) });
  if (h50.enteredCritical) collapses.push({ at: Date.now(), tick: 0, horizon: 50, severity: round2((1 - h50.survivability) * 10) });
  if (h100.enteredCritical) collapses.push({ at: Date.now(), tick: 0, horizon: 100, severity: round2((1 - h100.survivability) * 10) });
  if (h250.enteredCritical) collapses.push({ at: Date.now(), tick: 0, horizon: 250, severity: round2((1 - h250.survivability) * 10) });

  return { sample, collapses };
}

// ─── species classification ──────────────────────────────────

export function classifySpecies(genome: CivilizationGenome): CivilizationSpecies {
  // Identify the dominant trait.
  const traits: Array<{ key: GenomeKey; value: number }> = ALL_GENOME_KEYS.map((k) => ({
    key: k, value: genome[k],
  }));
  // Compute differences from 0.5 neutral.
  const deviations = traits.map((t) => ({ ...t, dev: Math.abs(t.value - 0.5) }));
  const maxDev = Math.max(...deviations.map((d) => d.dev));
  if (maxDev < 0.10) return 'unspeciated';
  const dominant = deviations.find((d) => d.dev === maxDev)!;
  const aboveAverage = dominant.value > 0.5;
  if (dominant.key === 'continuityPreservation' && aboveAverage) return 'continuity-civilization';
  if (dominant.key === 'governanceRigidity' && aboveAverage) return 'governance-civilization';
  if (dominant.key === 'recoveryWeighting' && aboveAverage) return 'recovery-civilization';
  if (dominant.key === 'mutationTolerance' && aboveAverage) return 'mutation-civilization';
  if (dominant.key === 'explorationTolerance' && aboveAverage) return 'expansion-civilization';
  if (dominant.key === 'collapseResponse' && aboveAverage) return 'preservation-civilization';
  return 'adaptive-civilization';
}

// ─── lineage update ──────────────────────────────────────────

export function updateLineageSelection(
  lineage: CivilizationLineage, sample: FitnessSample, collapses: CollapseEvent[],
  at: number, tick: number,
): CivilizationLineage {
  // EWMA selection score from composite fitness.
  const selectionScore = round2(
    lineage.selectionScore * (1 - FITNESS_EWMA_ALPHA) + sample.composite * FITNESS_EWMA_ALPHA,
  );
  // lineageStability: inverse of recent fitness variance.
  const recent = [...lineage.fitnessHistory.slice(-5), sample];
  let stability = 10;
  if (recent.length >= 3) {
    const mean = recent.reduce((a, s) => a + s.composite, 0) / recent.length;
    const variance = recent.reduce((a, s) => a + (s.composite - mean) ** 2, 0) / recent.length;
    stability = clamp10(10 - Math.sqrt(variance) * 3);
  }
  // adaptationEfficiency: bounce-back rate (latest - min recent)
  let adaptationEfficiency = lineage.adaptationEfficiency;
  if (recent.length >= 3) {
    const minRecent = Math.min(...recent.map((s) => s.composite));
    adaptationEfficiency = round2(clamp10(sample.composite - minRecent + 5));
  }
  // extinctionRisk: rises when selectionScore below threshold persists
  let extinctionRisk = lineage.extinctionRisk;
  if (selectionScore < EXTINCTION_LOW_SCORE_THRESHOLD) {
    extinctionRisk = round2(clamp01(extinctionRisk + 0.08));
  } else {
    extinctionRisk = round2(clamp01(extinctionRisk - 0.04));
  }

  return {
    ...lineage,
    selectionScore,
    lineageStability: round2(stability),
    adaptationEfficiency,
    extinctionRisk,
    fitnessHistory: [...lineage.fitnessHistory, sample],
    collapseHistory: [...lineage.collapseHistory, ...collapses],
    lastSampledTick: tick,
    lastSampledAt: at,
    sampleCount: lineage.sampleCount + 1,
  };
}

// ─── orchestration ───────────────────────────────────────────

export interface EvolutionSignal {
  at: number;
  tick: number;
  start: SimulatedState;
  pressureSignal: EvolutionPressureSignal;
}

export function updateEvolution(
  state: EvolutionMemoryState, sig: EvolutionSignal,
): EvolutionMemoryState {
  // 1. Sample fitness for all active (non-extinct) lineages.
  const lineages: Record<string, CivilizationLineage> = { ...state.lineages };
  for (const id of Object.keys(lineages)) {
    const l = lineages[id];
    if (l.status === 'extinct') continue;
    const { sample, collapses } = simulateLineageFitness(l, sig.start);
    lineages[id] = updateLineageSelection(l, { ...sample, at: sig.at, tick: sig.tick },
      collapses.map((c) => ({ ...c, at: sig.at, tick: sig.tick })), sig.at, sig.tick);
  }

  // 2. Mark extinction for lineages above risk threshold.
  let totalExtinctions = state.totalExtinctions;
  for (const id of Object.keys(lineages)) {
    const l = lineages[id];
    if (l.status === 'extinct') continue;
    if (l.extinctionRisk >= EXTINCTION_RISK_THRESHOLD && id !== state.dominantLineageId) {
      lineages[id] = {
        ...l, status: 'extinct',
        extinctionReason: `extinction risk ${l.extinctionRisk.toFixed(2)} at selection score ${l.selectionScore.toFixed(2)}`,
        extinctionAtTick: sig.tick,
      };
      totalExtinctions += 1;
    }
  }

  // 3. Compute evolutionary pressure.
  const pressureSample = {
    ...computeEvolutionaryPressure(sig.pressureSignal),
    at: sig.at, tick: sig.tick,
  };
  const evolutionaryPressure = pressureSample.pressure;

  // 4. Generation cycle: spawn children + select new dominant.
  const eventsSinceLastGeneration = state.eventsSinceLastGeneration + 1;
  let generationEvents = state.generationEvents;
  let currentGeneration = state.currentGeneration;
  let dominantLineageId = state.dominantLineageId;
  let dominantPersistenceTicks = state.dominantPersistenceTicks + 1;
  let totalLineagesSpawned = state.totalLineagesSpawned;
  let shouldRunGeneration = false;
  if (eventsSinceLastGeneration >= GENERATION_INTERVAL_EVENTS
      && evolutionaryPressure >= GENERATION_PRESSURE_THRESHOLD) {
    shouldRunGeneration = true;
  }

  let newEventsSinceLastGeneration = eventsSinceLastGeneration;
  if (shouldRunGeneration && dominantLineageId) {
    const dominant = lineages[dominantLineageId];
    const origins = rankPressureSources(pressureSample, CHILDREN_PER_GENERATION);
    const spawnedIds: string[] = [];
    const priorDominantId = dominantLineageId;

    for (let i = 0; i < origins.length; i++) {
      const origin = origins[i];
      const intensity = pressureSampleContribution(pressureSample, origin);
      const vector = generateMutationVector(origin, intensity);
      const childGenome = applyMutation(dominant.genome, vector);
      const childId = `lin-${origin}-g${currentGeneration + 1}-${i}-${sig.tick}`;
      const child: CivilizationLineage = {
        lineageId: childId,
        parentLineageId: dominant.lineageId,
        generation: currentGeneration + 1,
        bornAtTick: sig.tick,
        bornAt: sig.at,
        genome: childGenome,
        mutationVector: vector,
        mutationOrigin: origin,
        selectionReason: `spawned from ${origin} pressure ${intensity.toFixed(1)}`,
        extinctionReason: null,
        extinctionAtTick: null,
        fitnessHistory: [],
        collapseHistory: [],
        selectionScore: dominant.selectionScore,
        extinctionRisk: 0,
        lineageStability: 8,
        adaptationEfficiency: 5,
        status: 'active',
        civilizationSpecies: classifySpecies(childGenome),
        lastSampledTick: sig.tick,
        lastSampledAt: sig.at,
        sampleCount: 0,
      };
      // Sample fitness for newborn so it has a starting score.
      const { sample, collapses } = simulateLineageFitness(child, sig.start);
      const samplePlus = { ...sample, at: sig.at, tick: sig.tick };
      const collapsesPlus = collapses.map((c) => ({ ...c, at: sig.at, tick: sig.tick }));
      const sampled = updateLineageSelection(child, samplePlus, collapsesPlus, sig.at, sig.tick);
      lineages[childId] = sampled;
      spawnedIds.push(childId);
      totalLineagesSpawned += 1;
    }

    // Select new dominant — best selectionScore among (dominant + children + non-extinct siblings).
    const candidates = [
      ...spawnedIds.map((id) => lineages[id]),
      dominant,
      ...Object.values(lineages).filter((l) =>
        l.status !== 'extinct' && l.lineageId !== dominant.lineageId
        && !spawnedIds.includes(l.lineageId)),
    ];
    candidates.sort((a, b) => b.selectionScore - a.selectionScore);
    const challenger = candidates[0];
    let dominantShifted = false;
    let newDominantId = dominantLineageId;
    if (challenger.lineageId !== dominantLineageId) {
      // Hysteresis: must beat dominant by DOMINANCE_MARGIN AND prior dominant
      // must have held at least DOMINANCE_HYSTERESIS_GENERATIONS.
      const marginOk = (challenger.selectionScore - dominant.selectionScore) >= DOMINANCE_MARGIN;
      const generationsHeld = (currentGeneration + 1) - dominant.generation;
      if (marginOk && generationsHeld >= DOMINANCE_HYSTERESIS_GENERATIONS) {
        newDominantId = challenger.lineageId;
        dominantShifted = true;
        // Mark old dominant as declining.
        if (lineages[dominant.lineageId].status !== 'extinct') {
          lineages[dominant.lineageId] = { ...lineages[dominant.lineageId], status: 'declining' };
        }
        lineages[challenger.lineageId] = { ...lineages[challenger.lineageId], status: 'dominant' };
      }
    } else {
      // dominant retains its status
      lineages[dominantLineageId] = { ...lineages[dominantLineageId], status: 'dominant' };
    }

    currentGeneration += 1;
    dominantLineageId = newDominantId;
    if (dominantShifted) dominantPersistenceTicks = 1;
    newEventsSinceLastGeneration = 0;

    generationEvents = [...generationEvents, {
      at: sig.at, tick: sig.tick,
      generation: currentGeneration,
      spawnedLineageIds: spawnedIds,
      priorDominantId,
      newDominantId: dominantLineageId,
      triggerPressure: evolutionaryPressure,
      dominantShifted,
    }];
  }

  return {
    lineages,
    dominantLineageId,
    dominantPersistenceTicks,
    currentGeneration,
    eventsSinceLastGeneration: newEventsSinceLastGeneration,
    evolutionaryPressure,
    pressureHistory: [...state.pressureHistory, pressureSample],
    generationEvents,
    totalLineagesSpawned,
    totalExtinctions,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? sig.at,
    updatedAt: sig.at,
  };
}

function pressureSampleContribution(sample: EvolutionaryPressureSample, origin: MutationOrigin): number {
  switch (origin) {
    case 'collapse-recurrence':      return sample.collapseRecurrenceContrib;
    case 'regret-accumulation':      return sample.regretContrib;
    case 'doctrine-scars':           return sample.doctrineScarsContrib;
    case 'survivability-failure':    return sample.survivabilityFailureContrib;
    case 'ecology-instability':      return sample.ecologyInstabilityContrib;
    case 'continuity-fragmentation': return sample.continuityFragmentationContrib;
    default:                          return 0;
  }
}

// ─── evolution bias on governance ────────────────────────────

export interface EvolutionBias {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  deferAcceptance: number;
  recoveryWeighting: number;
  burstTolerance: number;
}

/** Compute governance bias from the dominant lineage's genome. Pulls
 *  governance toward the dominant lineage's gradient profile. Bounded
 *  ±0.20 per gradient. */
export function computeEvolutionBias(state: EvolutionMemoryState): EvolutionBias {
  if (!state.dominantLineageId) {
    return {
      cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
      deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
    };
  }
  const dominant = state.lineages[state.dominantLineageId];
  if (!dominant) {
    return {
      cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
      deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
    };
  }
  const profile = genomeToGradients(dominant.genome);
  // Bias = (profile - 0.5 neutral) × strength, where strength is
  // proportional to the dominant's selectionScore confidence.
  const strength = (dominant.selectionScore / 10) * 0.4;  // 0..0.4 multiplier
  return {
    cognitionThroughput:  clampBias(round2((profile.cognitionThroughput  - 0.5) * strength)),
    escalationPermission: clampBias(round2((profile.escalationPermission - 0.5) * strength)),
    explorationIntensity: clampBias(round2((profile.explorationIntensity - 0.5) * strength)),
    deferAcceptance:      clampBias(round2((profile.deferAcceptance      - 0.5) * strength)),
    recoveryWeighting:    clampBias(round2((profile.recoveryWeighting    - 0.5) * strength)),
    burstTolerance:       clampBias(round2((profile.burstTolerance       - 0.5) * strength)),
  };
}

export function applyEvolutionBias<G extends EvolutionBias>(gradients: G, bias: EvolutionBias): G {
  return {
    ...gradients,
    cognitionThroughput:  clamp01(round2(gradients.cognitionThroughput  + bias.cognitionThroughput)),
    escalationPermission: clamp01(round2(gradients.escalationPermission + bias.escalationPermission)),
    explorationIntensity: clamp01(round2(gradients.explorationIntensity + bias.explorationIntensity)),
    deferAcceptance:      clamp01(round2(gradients.deferAcceptance      + bias.deferAcceptance)),
    recoveryWeighting:    clamp01(round2(gradients.recoveryWeighting    + bias.recoveryWeighting)),
    burstTolerance:       clamp01(round2(gradients.burstTolerance       + bias.burstTolerance)),
  };
}

/** Simulation pressure from high evolutionary pressure. 0..0.2. */
export function evolutionPressureContribution(state: EvolutionMemoryState): number {
  if (state.evolutionaryPressure < 4) return 0;
  return round2(Math.min(0.2, (state.evolutionaryPressure - 4) * 0.04));
}
