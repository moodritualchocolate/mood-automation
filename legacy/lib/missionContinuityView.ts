/**
 * MISSION CONTINUITY VIEW (Wave 40)
 *
 * Dashboard view model for civilizational continuity physics.
 * Surfaces all ten top-level metrics, the mission vectors with
 * lineage information, drift history, conflict log, lineage
 * mutations, and the MissionBias / pressure contribution.
 *
 * Scientific. Operational. Civilizational. NO philosophy language.
 * NO consciousness framing.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  MissionContinuityState, MissionVector, DriftObservation,
  LineageEvent, ContinuityConflict, CivilizationState,
  StrategicDirection,
} from './missionContinuityMemory';
import {
  computeMissionBias, missionPressureContribution, type MissionBias,
} from './missionContinuityEngine';

export interface MissionVectorRow {
  id: string;
  strategicDirection: StrategicDirection;
  parentVectorId: string | null;
  persistenceWeight: number;
  historicalReinforcement: number;
  continuityAnchor: number;
  abandonmentResistance: number;
  mutationTolerance: number;
  activationState: MissionVector['activationState'];
  ageEvents: number;
  isMutation: boolean;
}

export interface MissionContinuityViewModel {
  present: boolean;
  civilizationState: CivilizationState;
  status: 'coherent' | 'drifting' | 'critical';
  statePersistenceTicks: number;
  civilizationAge: number;
  continuityStrength: number;
  missionIntegrity: number;
  existentialDrift: number;
  lineageStability: number;
  longHorizonCoherence: number;
  adaptationContinuity: number;
  strategicPersistence: number;
  missionPressure: number;
  continuityMomentum: number;
  vectors: MissionVectorRow[];
  recentDriftEvents: DriftObservation[];
  recentLineageEvents: LineageEvent[];
  recentConflicts: ContinuityConflict[];
  bias: MissionBias;
  simulationPressureContribution: number;
  totalUpdates: number;
  statement: string;
}

const ZERO_BIAS: MissionBias = {
  cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
  deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
};

const CRITICAL_STATES: CivilizationState[] = [
  'mission-exhausted', 'fractured', 'continuity-fragile', 'over-mutated',
];
const DRIFTING_STATES: CivilizationState[] = ['drifting'];

export function buildMissionContinuityView(snap: RuntimeSnapshot): MissionContinuityViewModel {
  const mc = snap.missionContinuity ?? null;
  if (!mc) {
    return {
      present: false,
      civilizationState: 'coherent',
      status: 'coherent',
      statePersistenceTicks: 0,
      civilizationAge: 0,
      continuityStrength: 5,
      missionIntegrity: 7,
      existentialDrift: 0,
      lineageStability: 5,
      longHorizonCoherence: 6,
      adaptationContinuity: 6,
      strategicPersistence: 0,
      missionPressure: 0,
      continuityMomentum: 0,
      vectors: [],
      recentDriftEvents: [],
      recentLineageEvents: [],
      recentConflicts: [],
      bias: ZERO_BIAS,
      simulationPressureContribution: 0,
      totalUpdates: 0,
      statement: 'mission continuity has not observed a cognitive event yet — civilization at seed equilibrium',
    };
  }

  const vectors: MissionVectorRow[] = mc.vectors.map((v) => ({
    id: v.id,
    strategicDirection: v.strategicDirection,
    parentVectorId: v.parentVectorId,
    persistenceWeight: v.persistenceWeight,
    historicalReinforcement: v.historicalReinforcement,
    continuityAnchor: v.continuityAnchor,
    abandonmentResistance: v.abandonmentResistance,
    mutationTolerance: v.mutationTolerance,
    activationState: v.activationState,
    ageEvents: Math.max(0, mc.civilizationAge - v.originatingEpoch),
    isMutation: v.parentVectorId !== null,
  }));

  const status: MissionContinuityViewModel['status'] =
    CRITICAL_STATES.includes(mc.state) ? 'critical' :
    DRIFTING_STATES.includes(mc.state) ? 'drifting' :
    'coherent';

  const bias = computeMissionBias(mc);
  const simulationPressureContribution = missionPressureContribution(mc);

  const statement = (() => {
    if (mc.state === 'mission-exhausted') {
      return `civilization MISSION-EXHAUSTED — continuity ${mc.continuityStrength.toFixed(1)}/10, age ${mc.civilizationAge}; no active vectors`;
    }
    if (mc.state === 'fractured') {
      return `civilization FRACTURED — drift ${mc.existentialDrift.toFixed(1)}/10, integrity ${mc.missionIntegrity.toFixed(1)}/10`;
    }
    if (mc.state === 'drifting') {
      return `civilization drifting — drift ${mc.existentialDrift.toFixed(1)}/10 (held ${mc.statePersistenceTicks}ev), pressure ${mc.missionPressure.toFixed(1)}/10`;
    }
    if (mc.state === 'continuity-fragile') {
      return `civilization continuity-fragile — continuity ${mc.continuityStrength.toFixed(1)}/10, integrity ${mc.missionIntegrity.toFixed(1)}/10`;
    }
    if (mc.state === 'over-mutated') {
      const mutations = mc.vectors.filter((v) => v.parentVectorId !== null).length;
      return `civilization over-mutated — ${mutations} mutated vectors, lineage stability ${mc.lineageStability.toFixed(1)}/10`;
    }
    if (mc.state === 'lineage-preserved') {
      return `civilization lineage-preserved — lineage stability ${mc.lineageStability.toFixed(1)}/10, persistence ${mc.strategicPersistence.toFixed(1)}/10`;
    }
    if (mc.state === 'adaptive-stable') {
      return `civilization adaptive-stable — adaptation continuity ${mc.adaptationContinuity.toFixed(1)}/10, drift ${mc.existentialDrift.toFixed(1)}/10`;
    }
    return `civilization coherent — continuity ${mc.continuityStrength.toFixed(1)}/10, integrity ${mc.missionIntegrity.toFixed(1)}/10, momentum ${mc.continuityMomentum >= 0 ? '+' : ''}${mc.continuityMomentum.toFixed(2)}`;
  })();

  return {
    present: true,
    civilizationState: mc.state,
    status,
    statePersistenceTicks: mc.statePersistenceTicks,
    civilizationAge: mc.civilizationAge,
    continuityStrength: mc.continuityStrength,
    missionIntegrity: mc.missionIntegrity,
    existentialDrift: mc.existentialDrift,
    lineageStability: mc.lineageStability,
    longHorizonCoherence: mc.longHorizonCoherence,
    adaptationContinuity: mc.adaptationContinuity,
    strategicPersistence: mc.strategicPersistence,
    missionPressure: mc.missionPressure,
    continuityMomentum: mc.continuityMomentum,
    vectors,
    recentDriftEvents: mc.driftHistory.slice(-6).reverse(),
    recentLineageEvents: mc.lineageEvents.slice(-6).reverse(),
    recentConflicts: mc.recentConflicts.slice(-6).reverse(),
    bias,
    simulationPressureContribution,
    totalUpdates: mc.totalUpdates,
    statement,
  };
}
