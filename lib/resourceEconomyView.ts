/**
 * RESOURCE ECONOMY VIEW (Wave 38)
 *
 * Dashboard view model for operational metabolism. Surfaces the
 * seven resource levels, flow rates (burn vs restore), collapse
 * state, species allocation pressure, cross-species conflicts,
 * and per-resource exhaustion forecast. NO gamification, NO
 * personality framing — every value is a deterministic numeric
 * measurement.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  ResourceEconomyState, ResourceId, CollapseState,
  SpeciesAllocation, AllocationConflict, ExhaustionForecast,
  ResourceLevels,
} from './resourceEconomyMemory';
import { ALL_RESOURCES, RESOURCE_BASELINES } from './resourceEconomyMemory';
import {
  computeExhaustionForecasts, computeScarcityBias, type ScarcityBias,
} from './resourceEconomyEngine';

export interface ResourceRow {
  id: ResourceId;
  level: number;
  baseline: number;
  lastDelta: number;
  emaRate: number;
  burnRate: number;
  restoreRate: number;
  exhaustionEvents: number | null;
}

export interface ResourceEconomyViewModel {
  present: boolean;
  collapseState: CollapseState;
  reserveAggregate: number;
  status: 'healthy' | 'cautionary' | 'critical';
  resources: ResourceRow[];
  speciesAllocation: SpeciesAllocation[];
  allocationConflicts: AllocationConflict[];
  scarcityBias: ScarcityBias;
  totalConsumed: number;
  totalRestored: number;
  totalUpdates: number;
  /** Most-recent collapse classifications that aren't 'healthy'. */
  recentObservations: Array<{
    tick: number;
    resource: ResourceId;
    level: number;
    delta: number;
  }>;
  statement: string;
}

const ZERO_BIAS: ScarcityBias = {
  cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
  deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
};

const CRITICAL_COLLAPSES: CollapseState[] = [
  'liquidity-collapse', 'depleted',
  'contradiction-fragile', 'recovery-locked',
  'exploration-bankrupt', 'starvation-risk',
];

export function buildResourceEconomyView(snap: RuntimeSnapshot): ResourceEconomyViewModel {
  const re = snap.resourceEconomy ?? null;
  if (!re) {
    return {
      present: false,
      collapseState: 'healthy',
      reserveAggregate: 56,
      status: 'healthy',
      resources: [],
      speciesAllocation: [],
      allocationConflicts: [],
      scarcityBias: ZERO_BIAS,
      totalConsumed: 0,
      totalRestored: 0,
      totalUpdates: 0,
      recentObservations: [],
      statement: 'resource economy has not observed a cognitive event yet — seven resources at baseline equilibrium',
    };
  }

  const forecasts = computeExhaustionForecasts(re);
  const resources: ResourceRow[] = ALL_RESOURCES.map((id) => {
    const f = re.flows[id];
    const forecast = forecasts.find((x) => x.resource === id);
    return {
      id,
      level: re.levels[id],
      baseline: RESOURCE_BASELINES[id],
      lastDelta: f.lastDelta,
      emaRate: f.emaRate,
      burnRate: f.burnRate,
      restoreRate: f.restoreRate,
      exhaustionEvents: forecast?.eventsToZero ?? null,
    };
  });

  const status: ResourceEconomyViewModel['status'] =
    CRITICAL_COLLAPSES.includes(re.collapseState) ? 'critical' :
    re.collapseState === 'overextended' ? 'cautionary' :
    re.reserveAggregate < 40 ? 'cautionary' :
    'healthy';

  const scarcityBias = computeScarcityBias(re.levels);

  const recentObservations = re.observationHistory
    .slice(-8).reverse()
    .map((o) => ({ tick: o.tick, resource: o.resource, level: o.level, delta: o.delta }));

  const statement = (() => {
    if (re.collapseState !== 'healthy') {
      return `resource economy ${re.collapseState.toUpperCase().replace(/-/g, ' ')} — ` +
        `aggregate ${re.reserveAggregate}/100, ${re.allocationConflicts.length} active allocation conflict${re.allocationConflicts.length === 1 ? '' : 's'}`;
    }
    if (status === 'cautionary') {
      return `resource economy strained — aggregate ${re.reserveAggregate}/100, scarcity bias pulling defer +${scarcityBias.deferAcceptance.toFixed(2)} / recovery +${scarcityBias.recoveryWeighting.toFixed(2)}`;
    }
    return `resource economy healthy — aggregate ${re.reserveAggregate}/100, lifetime consumed ${re.totalConsumed.toFixed(0)} restored ${re.totalRestored.toFixed(0)}`;
  })();

  return {
    present: true,
    collapseState: re.collapseState,
    reserveAggregate: re.reserveAggregate,
    status,
    resources,
    speciesAllocation: re.speciesAllocation,
    allocationConflicts: re.allocationConflicts,
    scarcityBias,
    totalConsumed: re.totalConsumed,
    totalRestored: re.totalRestored,
    totalUpdates: re.totalUpdates,
    recentObservations,
    statement,
  };
}
