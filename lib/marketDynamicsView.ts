/**
 * MARKET DYNAMICS VIEW (Wave 42)
 *
 * Dashboard view model for the deterministic multi-civilization
 * economy. Surfaces global resource pools, per-civ economy records
 * with consumption / production shares, coalitions, monopolies,
 * cascade collapses, market pressure breakdown, MarketBias.
 *
 * Operational economics — no narrative UI, no personality.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  CivilizationMarketState, EcosystemState, ResourceFlow,
  CivilizationEconomyRecord, Coalition, MonopolyEvent,
  CascadeCollapseEvent, MarketPressureSample,
} from './civilizationMarket';
import type {
  ResourceId, MarketResourceLevels,
} from './civilizationResources';
import {
  ALL_MARKET_RESOURCES, MARKET_RESOURCE_BASELINES,
} from './civilizationResources';
import {
  computeMarketBias, marketPressureContribution, type MarketBias,
} from './civilizationMarket';

export interface ResourceRow {
  id: ResourceId;
  level: number;
  baseline: number;
  lastDelta: number;
  emaRate: number;
  consumptionRate: number;
  productionRate: number;
}

export interface EconomyRow {
  lineageId: string;
  species: string;
  consumptionShare: number;
  productionShare: number;
  efficiency: number;
  sustainabilityScore: number;
  extractionPressure: number;
  survivabilityROI: number;
  effectiveInfluence: number;
}

export interface CoalitionRow {
  coalitionId: string;
  memberLineageIds: string[];
  strength: number;
  consecutiveBeneficialEvents: number;
  aggregateEfficiency: number;
  active: boolean;
}

export interface MarketDynamicsViewModel {
  present: boolean;
  ecosystemState: EcosystemState;
  status: 'balanced' | 'competitive' | 'stressed' | 'collapsing';
  ecosystemPersistenceTicks: number;
  marketPressure: number;
  pressureBreakdown: MarketPressureSample | null;
  resources: ResourceRow[];
  averageResourceLevel: number;
  economyRecords: EconomyRow[];
  coalitions: CoalitionRow[];
  monopolies: MonopolyEvent[];
  cascades: CascadeCollapseEvent[];
  totalCascadeCollapses: number;
  totalMonopolies: number;
  totalCoalitionsFormed: number;
  bias: MarketBias;
  simulationPressureContribution: number;
  statement: string;
}

const ZERO_BIAS: MarketBias = {
  cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
  deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
};

export function buildMarketDynamicsView(snap: RuntimeSnapshot): MarketDynamicsViewModel {
  const m = snap.civilizationMarket ?? null;
  if (!m) {
    return {
      present: false, ecosystemState: 'balanced', status: 'balanced',
      ecosystemPersistenceTicks: 0, marketPressure: 0,
      pressureBreakdown: null,
      resources: [], averageResourceLevel: 56,
      economyRecords: [], coalitions: [], monopolies: [], cascades: [],
      totalCascadeCollapses: 0, totalMonopolies: 0, totalCoalitionsFormed: 0,
      bias: ZERO_BIAS, simulationPressureContribution: 0,
      statement: 'civilization market has not observed an event yet — resource pools at baseline',
    };
  }

  const resources: ResourceRow[] = ALL_MARKET_RESOURCES.map((id) => {
    const f = m.flows[id];
    return {
      id,
      level: m.resources[id],
      baseline: MARKET_RESOURCE_BASELINES[id],
      lastDelta: f.lastDelta,
      emaRate: f.emaRate,
      consumptionRate: f.consumptionRate,
      productionRate: f.productionRate,
    };
  });
  const averageResourceLevel = Math.round(
    ALL_MARKET_RESOURCES.reduce((a, r) => a + m.resources[r], 0) / ALL_MARKET_RESOURCES.length * 10,
  ) / 10;

  const economyRecords: EconomyRow[] = Object.values(m.economyRecords)
    .map((rec) => ({
      lineageId: rec.lineageId,
      species: rec.species,
      consumptionShare: rec.consumptionShare,
      productionShare: rec.productionShare,
      efficiency: rec.profile.efficiency,
      sustainabilityScore: rec.profile.sustainabilityScore,
      extractionPressure: rec.profile.extractionPressure,
      survivabilityROI: rec.survivabilityROI,
      effectiveInfluence: rec.effectiveInfluence,
    }))
    .sort((a, b) => b.consumptionShare - a.consumptionShare);

  const coalitions: CoalitionRow[] = Object.values(m.coalitions)
    .map((c) => ({
      coalitionId: c.coalitionId,
      memberLineageIds: c.memberLineageIds,
      strength: c.strength,
      consecutiveBeneficialEvents: c.consecutiveBeneficialEvents,
      aggregateEfficiency: c.aggregateEfficiency,
      active: c.active,
    }))
    .sort((a, b) => b.strength - a.strength);

  const monopolies = m.monopolies.slice(-6).reverse();
  const cascades = m.cascades.slice(-6).reverse();
  const pressureBreakdown = m.pressureHistory[m.pressureHistory.length - 1] ?? null;
  const bias = computeMarketBias(m);
  const simulationPressureContribution = marketPressureContribution(m);

  const status: MarketDynamicsViewModel['status'] =
    m.ecosystemState === 'cascade-collapsing' ? 'collapsing' :
    m.ecosystemState === 'scarcity-stressed' || m.ecosystemState === 'ecologically-fragile' ? 'stressed' :
    m.ecosystemState === 'competitive' || m.ecosystemState === 'monopolized' ? 'competitive' :
    'balanced';

  const statement = (() => {
    if (m.ecosystemState === 'cascade-collapsing') {
      const recent = cascades[0];
      return recent
        ? `ecosystem CASCADE-COLLAPSING — '${recent.collapsedLineageId.slice(0, 24)}' (share ${recent.collapsedShare.toFixed(2)}) extinct; ${recent.shockedPools.length} pools shocked, ${recent.downstreamLineages.length} downstream lineages at risk`
        : `ecosystem CASCADE-COLLAPSING — collapse propagation active`;
    }
    if (m.ecosystemState === 'monopolized') {
      const top = economyRecords[0];
      return top
        ? `ecosystem MONOPOLIZED — '${top.lineageId.slice(0, 24)}' holds ${(top.consumptionShare * 100).toFixed(0)}% consumption share`
        : 'ecosystem monopolized';
    }
    if (m.ecosystemState === 'scarcity-stressed') {
      return `ecosystem scarcity-stressed — avg pool ${averageResourceLevel}/100, market pressure ${m.marketPressure.toFixed(1)}/10`;
    }
    if (m.ecosystemState === 'ecologically-fragile') {
      return `ecosystem ecologically-fragile — ecological stability ${m.resources.ecologicalStability.toFixed(1)}/100`;
    }
    if (m.ecosystemState === 'coalition-stabilized') {
      const strongCoalitions = coalitions.filter((c) => c.strength >= 5).length;
      return `ecosystem coalition-stabilized — ${strongCoalitions} strong coalition${strongCoalitions === 1 ? '' : 's'} sustaining resource sharing`;
    }
    if (m.ecosystemState === 'competitive') {
      return `ecosystem competitive — ${economyRecords.length} active civs, top consumption share ${(economyRecords[0]?.consumptionShare ?? 0).toFixed(2)}, pressure ${m.marketPressure.toFixed(1)}/10`;
    }
    return `ecosystem balanced — ${economyRecords.length} civs at avg pool ${averageResourceLevel}/100, pressure ${m.marketPressure.toFixed(1)}/10 (held ${m.ecosystemPersistenceTicks}ev)`;
  })();

  return {
    present: true,
    ecosystemState: m.ecosystemState,
    status,
    ecosystemPersistenceTicks: m.ecosystemPersistenceTicks,
    marketPressure: m.marketPressure,
    pressureBreakdown,
    resources,
    averageResourceLevel,
    economyRecords,
    coalitions,
    monopolies,
    cascades,
    totalCascadeCollapses: m.totalCascadeCollapses,
    totalMonopolies: m.totalMonopolies,
    totalCoalitionsFormed: m.totalCoalitionsFormed,
    bias,
    simulationPressureContribution,
    statement,
  };
}
