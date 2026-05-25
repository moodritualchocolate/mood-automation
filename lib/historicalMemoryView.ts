/**
 * HISTORICAL MEMORY VIEW (Wave 42)
 *
 * Dashboard view model for civilizational precedent. Surfaces the
 * epoch timeline, doctrine recurrence table, scar pressures, collapse
 * archetypes, maturity score + state, and the HistoricalBias the
 * engine is currently exerting on governance.
 *
 * Scientific. Operational. Civilizational. NO lore aesthetics.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  HistoricalMemoryState, Epoch, Doctrine, DoctrineId, Scar,
  CollapseArchetype, CivilizationMaturityState, CivilizationTransition,
  EpochArchetype,
} from './historicalMemory';
import {
  computeHistoricalBias, historicalPressureContribution,
  type HistoricalBias,
} from './historicalMemoryEngine';

export interface EpochRow {
  id: string;
  archetype: EpochArchetype;
  startTick: number;
  endTick: number | null;
  duration: number;
  isActive: boolean;
  dominantSpecies: string | null;
  environmentSignature: string;
  continuityState: string;
  collapseRisk: number;
  resourceClimate: number;
  doctrineOutcomes: string[];
  totalEvents: number;
}

export interface DoctrineRow {
  doctrineId: DoctrineId;
  recurrenceCount: number;
  survivabilityImpact: number;
  continuityImpact: number;
  collapseAssociation: number;
  recoveryAssociation: number;
  longHorizonScore: number;
  lastObservedTick: number;
}

export interface ScarRow {
  doctrineId: string;
  intensity: number;
  incidentCount: number;
  averageHarm: number;
  lastIncidentTick: number;
}

export interface CollapseArchetypeRow {
  archetypeId: string;
  detectionCount: number;
  recurrenceConfidence: number;
  averageSeverity: number;
  lastDetectedTick: number;
}

export interface HistoricalMemoryViewModel {
  present: boolean;
  maturityState: CivilizationMaturityState;
  status: 'naive' | 'developing' | 'mature' | 'traumatized';
  maturityScore: number;
  maturityPersistenceTicks: number;
  totalEpochs: number;
  totalDoctrineMatches: number;
  activeEpoch: EpochRow | null;
  recentEpochs: EpochRow[];
  doctrines: DoctrineRow[];
  scars: ScarRow[];
  collapseArchetypes: CollapseArchetypeRow[];
  bias: HistoricalBias;
  simulationPressureContribution: number;
  recentTransitions: CivilizationTransition[];
  statement: string;
}

const ZERO_BIAS: HistoricalBias = {
  cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
  deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
};

function epochToRow(e: Epoch, currentTick: number): EpochRow {
  const isActive = e.endTick === null;
  const endTick = e.endTick ?? currentTick;
  return {
    id: e.id,
    archetype: e.archetype,
    startTick: e.startTick,
    endTick: e.endTick,
    duration: endTick - e.startTick,
    isActive,
    dominantSpecies: e.signature.dominantSpecies,
    environmentSignature: e.signature.environmentSignature,
    continuityState: e.signature.continuityState,
    collapseRisk: e.signature.collapseRisk,
    resourceClimate: e.signature.resourceClimate,
    doctrineOutcomes: e.doctrineOutcomes,
    totalEvents: e.totalEvents,
  };
}

export function buildHistoricalMemoryView(snap: RuntimeSnapshot): HistoricalMemoryViewModel {
  const h = snap.historicalMemory ?? null;
  if (!h) {
    return {
      present: false,
      maturityState: 'naive',
      status: 'naive',
      maturityScore: 0,
      maturityPersistenceTicks: 0,
      totalEpochs: 0,
      totalDoctrineMatches: 0,
      activeEpoch: null,
      recentEpochs: [],
      doctrines: [],
      scars: [],
      collapseArchetypes: [],
      bias: ZERO_BIAS,
      simulationPressureContribution: 0,
      recentTransitions: [],
      statement: 'historical memory has not observed a cognitive event yet — civilization in pre-history',
    };
  }

  const currentTick = h.epochs.length > 0
    ? Math.max(h.signatureSampleCount + h.epochs[h.epochs.length - 1].startTick, h.epochs[h.epochs.length - 1].startTick + 1)
    : 0;

  const epochRows: EpochRow[] = h.epochs.map((e) => epochToRow(e, currentTick));
  const activeEpoch = epochRows[epochRows.length - 1]?.isActive ? epochRows[epochRows.length - 1] : null;
  const recentEpochs = epochRows.slice(-6).reverse();

  const doctrines: DoctrineRow[] = Object.values(h.doctrines)
    .filter((d) => d.recurrenceCount > 0)
    .map((d) => ({
      doctrineId: d.doctrineId,
      recurrenceCount: d.recurrenceCount,
      survivabilityImpact: d.survivabilityImpact,
      continuityImpact: d.continuityImpact,
      collapseAssociation: d.collapseAssociation,
      recoveryAssociation: d.recoveryAssociation,
      longHorizonScore: d.longHorizonScore,
      lastObservedTick: d.lastObservedTick,
    }))
    .sort((a, b) => b.recurrenceCount - a.recurrenceCount);

  const scars: ScarRow[] = Object.values(h.scars)
    .filter((s) => s.intensity > 0.5)
    .map((s) => ({
      doctrineId: s.doctrineId,
      intensity: s.intensity,
      incidentCount: s.incidentCount,
      averageHarm: s.averageHarm,
      lastIncidentTick: s.lastIncidentTick,
    }))
    .sort((a, b) => b.intensity - a.intensity);

  const collapseArchetypes: CollapseArchetypeRow[] = Object.values(h.collapseArchetypes)
    .filter((c) => c.detectionCount > 0)
    .map((c) => ({
      archetypeId: c.archetypeId,
      detectionCount: c.detectionCount,
      recurrenceConfidence: c.recurrenceConfidence,
      averageSeverity: c.averageSeverity,
      lastDetectedTick: c.lastDetectedTick,
    }))
    .sort((a, b) => b.recurrenceConfidence - a.recurrenceConfidence);

  const bias = computeHistoricalBias(h);
  const simulationPressureContribution = historicalPressureContribution(h);

  const status: HistoricalMemoryViewModel['status'] =
    h.maturityState === 'over-traumatized' ? 'traumatized' :
    h.maturityState === 'naive' ? 'naive' :
    h.maturityState === 'mature-stable' || h.maturityState === 'continuity-trained' ? 'mature' :
    'developing';

  const statement = (() => {
    if (h.maturityState === 'naive') {
      return `civilization naive — ${h.totalEpochs} epoch${h.totalEpochs === 1 ? '' : 's'} of history, no scars formed`;
    }
    if (h.maturityState === 'over-traumatized') {
      const totalScarIntensity = Object.values(h.scars).reduce((a, s) => a + s.intensity, 0);
      return `civilization OVER-TRAUMATIZED — cumulative scar intensity ${totalScarIntensity.toFixed(1)}; historical bias heavy`;
    }
    if (h.maturityState === 'mature-stable') {
      return `civilization mature-stable — maturity ${h.maturityScore.toFixed(1)}/10, ${h.totalEpochs} epochs, ${doctrines.length} doctrines tracked`;
    }
    if (h.maturityState === 'scar-conditioned') {
      return `civilization scar-conditioned — ${scars.length} active scar${scars.length === 1 ? '' : 's'}, historical bias active`;
    }
    if (h.maturityState === 'collapse-sensitive') {
      const confirmedArchetypes = collapseArchetypes.filter((c) => c.recurrenceConfidence >= 0.4).length;
      return `civilization collapse-sensitive — ${confirmedArchetypes} confirmed collapse archetype${confirmedArchetypes === 1 ? '' : 's'}, recurrence avoidance active`;
    }
    return `civilization ${h.maturityState} — maturity ${h.maturityScore.toFixed(1)}/10, held ${h.maturityPersistenceTicks}ev`;
  })();

  return {
    present: true,
    maturityState: h.maturityState,
    status,
    maturityScore: h.maturityScore,
    maturityPersistenceTicks: h.maturityPersistenceTicks,
    totalEpochs: h.totalEpochs,
    totalDoctrineMatches: h.totalDoctrineMatches,
    activeEpoch,
    recentEpochs,
    doctrines,
    scars,
    collapseArchetypes,
    bias,
    simulationPressureContribution,
    recentTransitions: h.transitions.slice(-6).reverse(),
    statement,
  };
}
