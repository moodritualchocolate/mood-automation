/**
 * EVOLUTION VIEW (Wave 41)
 *
 * Dashboard view model for the deterministic civilization evolution
 * tree. Surfaces dominant lineage genome + fitness, full lineage
 * tree (with parent/child relations), generation events, evolutionary
 * pressure contributions, extinction trajectories, and EvolutionBias.
 *
 * Scientific. Operational. NO personality language.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  EvolutionMemoryState, CivilizationLineage, CivilizationGenome,
  GenerationEvent, EvolutionaryPressureSample, CivilizationSpecies,
  GenomeKey,
} from './evolutionMemory';
import { ALL_GENOME_KEYS } from './evolutionMemory';
import {
  computeEvolutionBias, evolutionPressureContribution,
  type EvolutionBias,
} from './evolutionEngine';

export interface LineageRow {
  lineageId: string;
  parentLineageId: string | null;
  generation: number;
  species: CivilizationSpecies;
  status: CivilizationLineage['status'];
  selectionScore: number;
  extinctionRisk: number;
  lineageStability: number;
  adaptationEfficiency: number;
  sampleCount: number;
  ageEvents: number;
  mutationOrigin: string;
  mutationDeltaSummary: string;
}

export interface GenomeKeyRow {
  key: GenomeKey;
  value: number;
  parentValue: number | null;
  delta: number | null;
}

export interface EvolutionViewModel {
  present: boolean;
  status: 'naive' | 'evolving' | 'unstable' | 'mature';
  currentGeneration: number;
  evolutionaryPressure: number;
  totalLineagesSpawned: number;
  totalExtinctions: number;
  activeLineageCount: number;
  dominantLineageId: string | null;
  dominantSpecies: CivilizationSpecies;
  dominantGenome: GenomeKeyRow[];
  dominantFitness: number;
  dominantStability: number;
  dominantAdaptation: number;
  lineages: LineageRow[];
  generationEvents: GenerationEvent[];
  pressureBreakdown: EvolutionaryPressureSample | null;
  bias: EvolutionBias;
  simulationPressureContribution: number;
  statement: string;
}

const ZERO_BIAS: EvolutionBias = {
  cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
  deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
};

function lineageToRow(
  l: CivilizationLineage, lineages: Record<string, CivilizationLineage>, currentTick: number,
): LineageRow {
  const ageEvents = currentTick - l.bornAtTick;
  const parent = l.parentLineageId ? lineages[l.parentLineageId] : null;
  const deltas: string[] = [];
  if (parent) {
    for (const [k, v] of Object.entries(l.mutationVector) as [GenomeKey, number][]) {
      if (Math.abs(v) >= 0.01) {
        deltas.push(`${k.slice(0, 12)}${v >= 0 ? '+' : ''}${v.toFixed(2)}`);
      }
    }
  }
  return {
    lineageId: l.lineageId,
    parentLineageId: l.parentLineageId,
    generation: l.generation,
    species: l.civilizationSpecies,
    status: l.status,
    selectionScore: l.selectionScore,
    extinctionRisk: l.extinctionRisk,
    lineageStability: l.lineageStability,
    adaptationEfficiency: l.adaptationEfficiency,
    sampleCount: l.sampleCount,
    ageEvents,
    mutationOrigin: l.mutationOrigin,
    mutationDeltaSummary: deltas.length > 0 ? deltas.join(', ') : '—',
  };
}

function genomeToKeyRows(
  genome: CivilizationGenome, parentGenome: CivilizationGenome | null,
): GenomeKeyRow[] {
  return ALL_GENOME_KEYS.map((key) => ({
    key,
    value: genome[key],
    parentValue: parentGenome ? parentGenome[key] : null,
    delta: parentGenome ? Math.round((genome[key] - parentGenome[key]) * 1000) / 1000 : null,
  }));
}

export function buildEvolutionView(snap: RuntimeSnapshot): EvolutionViewModel {
  const e = snap.evolutionMemory ?? null;
  if (!e) {
    return {
      present: false, status: 'naive',
      currentGeneration: 0, evolutionaryPressure: 0,
      totalLineagesSpawned: 0, totalExtinctions: 0, activeLineageCount: 0,
      dominantLineageId: null, dominantSpecies: 'unspeciated',
      dominantGenome: [], dominantFitness: 5, dominantStability: 10, dominantAdaptation: 5,
      lineages: [], generationEvents: [],
      pressureBreakdown: null, bias: ZERO_BIAS,
      simulationPressureContribution: 0,
      statement: 'evolution engine has not run yet — civilization at root genome',
    };
  }

  const lineagesArr = Object.values(e.lineages);
  const activeCount = lineagesArr.filter((l) => l.status !== 'extinct').length;
  // Approx current tick from the latest sampled lineage.
  const currentTick = Math.max(0, ...lineagesArr.map((l) => l.lastSampledTick));

  const dominant = e.dominantLineageId ? e.lineages[e.dominantLineageId] : null;
  const dominantParent = dominant?.parentLineageId ? e.lineages[dominant.parentLineageId] : null;
  const dominantGenome = dominant ? genomeToKeyRows(dominant.genome, dominantParent?.genome ?? null) : [];

  const lineageRows = lineagesArr
    .map((l) => lineageToRow(l, e.lineages, currentTick))
    .sort((a, b) => {
      // dominant first, then by generation desc, then by selectionScore desc.
      if (a.lineageId === e.dominantLineageId) return -1;
      if (b.lineageId === e.dominantLineageId) return 1;
      if (a.generation !== b.generation) return b.generation - a.generation;
      return b.selectionScore - a.selectionScore;
    });

  const generationEvents = e.generationEvents.slice(-6).reverse();
  const pressureBreakdown = e.pressureHistory[e.pressureHistory.length - 1] ?? null;
  const bias = computeEvolutionBias(e);
  const simulationPressureContribution = evolutionPressureContribution(e);

  const status: EvolutionViewModel['status'] =
    e.evolutionaryPressure >= 7 ? 'unstable' :
    e.currentGeneration >= 3 && activeCount >= 3 ? 'mature' :
    e.currentGeneration >= 1 ? 'evolving' :
                               'naive';

  const statement = (() => {
    if (!dominant) {
      return `no dominant lineage — evolution engine awaiting first generation`;
    }
    if (e.evolutionaryPressure >= 7) {
      return `evolutionary pressure HIGH (${e.evolutionaryPressure.toFixed(1)}/10) — mutation cascade likely; dominant '${dominant.civilizationSpecies}' (gen ${dominant.generation}, fitness ${dominant.selectionScore.toFixed(1)})`;
    }
    if (e.currentGeneration === 0) {
      return `civilization seed (gen 0) — fitness ${dominant.selectionScore.toFixed(1)}/10, awaiting evolution trigger (pressure ${e.evolutionaryPressure.toFixed(1)}/${3.0})`;
    }
    return `${dominant.civilizationSpecies} dominant (gen ${dominant.generation}, fitness ${dominant.selectionScore.toFixed(1)}/10, ${activeCount} active lineages, ${e.totalExtinctions} extinctions)`;
  })();

  return {
    present: true,
    status,
    currentGeneration: e.currentGeneration,
    evolutionaryPressure: e.evolutionaryPressure,
    totalLineagesSpawned: e.totalLineagesSpawned,
    totalExtinctions: e.totalExtinctions,
    activeLineageCount: activeCount,
    dominantLineageId: e.dominantLineageId,
    dominantSpecies: dominant?.civilizationSpecies ?? 'unspeciated',
    dominantGenome,
    dominantFitness: dominant?.selectionScore ?? 5,
    dominantStability: dominant?.lineageStability ?? 10,
    dominantAdaptation: dominant?.adaptationEfficiency ?? 5,
    lineages: lineageRows,
    generationEvents,
    pressureBreakdown,
    bias,
    simulationPressureContribution,
    statement,
  };
}
