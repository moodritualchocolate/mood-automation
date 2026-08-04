/**
 * ENVIRONMENT VIEW (Wave 39)
 *
 * Dashboard model for the external operational climate. Surfaces
 * the seven fields with their current level, last delta, EMA rate,
 * recent trajectory, the climate state with persistence counter,
 * the bidirectional coupling diagnostic, and the bias / multipliers
 * the environment is currently exerting on the rest of the system.
 *
 * Scientific. Operational. No worldbuilding aesthetics.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  EnvironmentMemoryState, EnvironmentLevels, EnvironmentFieldId,
  EnvironmentState, EnvironmentTrajectoryPoint, CouplingSignal,
} from './environmentMemory';
import { ALL_ENV_FIELDS, ENV_BASELINES } from './environmentMemory';
import {
  computeEnvironmentBias, environmentCostMultiplier,
  environmentRestorationMultiplier, environmentPressureContribution,
  type EnvironmentBias,
} from './environmentEngine';

export interface EnvironmentFieldRow {
  id: EnvironmentFieldId;
  level: number;
  baseline: number;
  lastDelta: number;
  emaRate: number;
  trajectory: EnvironmentTrajectoryPoint[];
}

export interface EnvironmentViewModel {
  present: boolean;
  state: EnvironmentState;
  /** Classification severity for the badge. */
  status: 'stable' | 'cautionary' | 'critical';
  statePersistenceTicks: number;
  fields: EnvironmentFieldRow[];
  bias: EnvironmentBias;
  costMultiplier: number;
  restorationMultiplier: number;
  simulationPressureContribution: number;
  coupling: CouplingSignal | null;
  organismImpactEMA: number;
  totalUpdates: number;
  recentObservations: Array<{
    tick: number;
    field: EnvironmentFieldId;
    level: number;
    delta: number;
  }>;
  statement: string;
}

const ZERO_BIAS: EnvironmentBias = {
  cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
  deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
};

const CRITICAL_STATES: EnvironmentState[] = [
  'hostile', 'collapse-prone', 'unstable',
  'depleted-climate', 'adaptive-fragile',
];

const CAUTIONARY_STATES: EnvironmentState[] = [
  'turbulent', 'high-noise',
];

export function buildEnvironmentView(snap: RuntimeSnapshot): EnvironmentViewModel {
  const env = snap.environment ?? null;
  if (!env) {
    return {
      present: false,
      state: 'stable',
      status: 'stable',
      statePersistenceTicks: 0,
      fields: [],
      bias: ZERO_BIAS,
      costMultiplier: 1,
      restorationMultiplier: 1,
      simulationPressureContribution: 0,
      coupling: null,
      organismImpactEMA: 0,
      totalUpdates: 0,
      recentObservations: [],
      statement: 'environment has not observed a cognitive event yet — climate at neutral baseline',
    };
  }

  const fields: EnvironmentFieldRow[] = ALL_ENV_FIELDS.map((id) => ({
    id,
    level: env.levels[id],
    baseline: ENV_BASELINES[id],
    lastDelta: env.momentum[id].lastDelta,
    emaRate: env.momentum[id].emaRate,
    trajectory: env.trajectories[id].slice(-8),
  }));

  const bias = computeEnvironmentBias(env.levels);
  const costMultiplier = environmentCostMultiplier(env);
  const restorationMultiplier = environmentRestorationMultiplier(env);
  const simulationPressureContribution = environmentPressureContribution(env);

  const status: EnvironmentViewModel['status'] =
    CRITICAL_STATES.includes(env.state) ? 'critical' :
    CAUTIONARY_STATES.includes(env.state) ? 'cautionary' :
    'stable';

  const recentObservations = env.observationHistory.slice(-8).reverse().map((o) => ({
    tick: o.tick, field: o.field, level: o.level, delta: o.delta,
  }));

  const statement = (() => {
    if (env.state === 'hostile') {
      return `environment HOSTILE — threat ${env.levels.threatPressure.toFixed(1)}/10, opportunity ${env.levels.opportunityDensity.toFixed(1)}/10; held for ${env.statePersistenceTicks} events`;
    }
    if (env.state === 'collapse-prone') {
      return `environment COLLAPSE-PRONE — threat ${env.levels.threatPressure.toFixed(1)}, volatility ${env.levels.volatility.toFixed(1)}; held ${env.statePersistenceTicks} events`;
    }
    if (env.state === 'unstable') {
      return `environment UNSTABLE — volatility ${env.levels.volatility.toFixed(1)}/10, stability ${env.levels.stabilityField.toFixed(1)}/10`;
    }
    if (env.state === 'adaptive-fragile') {
      return `environment ADAPTIVE-FRAGILE — adaptation difficulty ${env.levels.adaptationDifficulty.toFixed(1)}/10`;
    }
    if (env.state === 'depleted-climate') {
      return `environment depleted — recovery climate ${env.levels.recoveryClimate.toFixed(1)}/10; restoration multiplier ${restorationMultiplier.toFixed(2)}`;
    }
    if (env.state === 'opportunity-rich') {
      return `environment opportunity-rich — opportunity ${env.levels.opportunityDensity.toFixed(1)}/10, threat ${env.levels.threatPressure.toFixed(1)}/10`;
    }
    if (env.state === 'turbulent') {
      return `environment turbulent — volatility ${env.levels.volatility.toFixed(1)}/10, turbulence ${env.levels.informationTurbulence.toFixed(1)}/10`;
    }
    if (env.state === 'high-noise') {
      return `environment high-noise — information turbulence ${env.levels.informationTurbulence.toFixed(1)}/10`;
    }
    if (env.state === 'stable') {
      return `environment stable — stability ${env.levels.stabilityField.toFixed(1)}/10, volatility ${env.levels.volatility.toFixed(1)}/10; persisting ${env.statePersistenceTicks} events`;
    }
    return `environment survivable — no acute pressure (cost multiplier ${costMultiplier.toFixed(2)}×, organism impact ${env.organismImpactEMA.toFixed(2)})`;
  })();

  return {
    present: true,
    state: env.state,
    status,
    statePersistenceTicks: env.statePersistenceTicks,
    fields,
    bias,
    costMultiplier,
    restorationMultiplier,
    simulationPressureContribution,
    coupling: env.lastCoupling,
    organismImpactEMA: env.organismImpactEMA,
    totalUpdates: env.totalUpdates,
    recentObservations,
    statement,
  };
}
