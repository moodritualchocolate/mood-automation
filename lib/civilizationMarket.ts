/**
 * CIVILIZATION MARKET (Wave 42)
 *
 * Deterministic multi-civilization competitive ecosystem. All Wave 41
 * evolution-memory lineages consume from + contribute to the same
 * ten global resource pools. Coalitions emerge when production/
 * consumption profiles are complementary AND mutual survivability
 * gain is sustained. Monopolies are detected from consumption share
 * + persistence. Cascade collapses propagate when a dominant
 * consumer goes extinct.
 *
 * NOT a chat simulation. NOT personalities. Civilizational market
 * physics — deterministic, inspectable, reproducible.
 *
 * Lives at data/memory/civilization-market.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  CivilizationLineage, CivilizationSpecies,
} from './evolutionMemory';
import type {
  MarketResourceLevels, ResourceId, EconomicProfile,
} from './civilizationResources';
import {
  ALL_MARKET_RESOURCES, MARKET_RESOURCE_BASELINES, MARKET_RESOURCE_MAX,
  genomeToEconomicProfile, SPECIES_EXTERNALITIES,
} from './civilizationResources';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'civilization-market.json';

export const RESOURCE_HISTORY_LIMIT = 32;
export const COALITION_HISTORY_LIMIT = 32;
export const CASCADE_HISTORY_LIMIT = 24;
export const MONOPOLY_HISTORY_LIMIT = 24;

// ─── tuning constants ──────────────────────────────────────────

/** Pool decay per event when nothing produces. */
export const RESOURCE_PASSIVE_DECAY = 0.05;
/** Pool regen per event toward baseline. */
export const RESOURCE_HOMEOSTATIC_RATE = 0.06;
/** Max per-event delta to a pool (prevents jumps). */
export const RESOURCE_MAX_DELTA = 4.0;
/** Total consumption scale: multiplied by aggregate-civ-influence
 *  to keep magnitudes sensible. */
export const CONSUMPTION_SCALE = 0.6;
export const PRODUCTION_SCALE = 0.6;

/** Coalition emergence: lineages with complementary profiles must
 *  demonstrate mutual survivability gain over sustained ticks. */
export const COALITION_FORM_THRESHOLD = 5;
export const COALITION_FORM_TICKS = 6;
export const COALITION_DECAY_PER_EVENT = 0.05;
export const COALITION_STRENGTH_CAP = 10;
/** Max new coalitions formed per event to prevent saturation. */
export const MAX_NEW_COALITIONS_PER_EVENT = 3;

/** Monopoly: consumption share above this threshold for sustained ticks. */
export const MONOPOLY_SHARE_THRESHOLD = 0.40;
export const MONOPOLY_PERSISTENCE_TICKS = 5;

/** Cascade collapse: when a dominant consumer (share > threshold) goes
 *  extinct, shock the most-consumed pools. */
export const CASCADE_TRIGGER_SHARE = 0.30;
export const CASCADE_SHOCK_MAGNITUDE = 8;

export const MARKET_BIAS_CLAMP = 0.20;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp01(n: number): number { return clamp(0, 1, n); }
function clamp10(n: number): number { return clamp(0, 10, n); }
function clamp100(n: number): number { return clamp(0, MARKET_RESOURCE_MAX, n); }
function clampBias(n: number): number { return clamp(-MARKET_BIAS_CLAMP, MARKET_BIAS_CLAMP, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── market types ──────────────────────────────────────────────

export interface ResourceFlow {
  /** Net delta this event. */
  lastDelta: number;
  /** EWMA-smoothed rate. */
  emaRate: number;
  /** EWMA-smoothed consumption rate (negative deltas only). */
  consumptionRate: number;
  /** EWMA-smoothed production rate (positive deltas only). */
  productionRate: number;
}

export interface CivilizationEconomyRecord {
  lineageId: string;
  species: CivilizationSpecies;
  profile: EconomicProfile;
  /** Aggregate consumption share across all civs this event. 0..1. */
  consumptionShare: number;
  /** Aggregate production share. 0..1. */
  productionShare: number;
  /** EWMA-smoothed survivability ROI = sustainabilityScore - extractionPressure. */
  survivabilityROI: number;
  /** Lineage's contribution-weighted selectionScore (used for influence). */
  effectiveInfluence: number;
}

export interface Coalition {
  coalitionId: string;
  memberLineageIds: string[];
  formedAtTick: number;
  formedAt: number;
  /** 0..10 — coalition stability (rises with sustained mutual benefit). */
  strength: number;
  /** Per-event consecutive-benefit counter — used for formation hysteresis. */
  consecutiveBeneficialEvents: number;
  /** Aggregate efficiency of the coalition. */
  aggregateEfficiency: number;
  /** Last-event flag — currently still beneficial? */
  active: boolean;
  /** Last-event score delta — used for decay vs growth. */
  lastBenefitScore: number;
}

export interface MonopolyEvent {
  at: number;
  tick: number;
  lineageId: string;
  consumptionShare: number;
  persistedTicks: number;
}

export interface CascadeCollapseEvent {
  at: number;
  tick: number;
  collapsedLineageId: string;
  collapsedShare: number;
  /** Pool name → shock magnitude applied. */
  shockedPools: Array<{ pool: ResourceId; shock: number }>;
  /** Other lineages whose effectiveInfluence dropped > threshold. */
  downstreamLineages: string[];
}

export interface ResourceObservation {
  at: number;
  tick: number;
  pool: ResourceId;
  level: number;
  delta: number;
}

export interface MarketPressureSample {
  at: number;
  tick: number;
  pressure: number;                    // 0..10 composite
  scarcityContrib: number;
  monopolizationContrib: number;
  ecologicalInstabilityContrib: number;
  coalitionFragilityContrib: number;
  resourceDepletionContrib: number;
  extinctionConcentrationContrib: number;
  collapsePropagationContrib: number;
}

export type EcosystemState =
  | 'balanced'
  | 'competitive'
  | 'monopolized'
  | 'scarcity-stressed'
  | 'coalition-stabilized'
  | 'cascade-collapsing'
  | 'ecologically-fragile';

export interface CivilizationMarketState {
  /** Global resource pools. */
  resources: MarketResourceLevels;
  /** Per-pool flow tracking. */
  flows: Record<ResourceId, ResourceFlow>;
  /** Per-civilization economic records, keyed by lineageId. */
  economyRecords: Record<string, CivilizationEconomyRecord>;
  /** Active coalitions, keyed by coalitionId. */
  coalitions: Record<string, Coalition>;
  /** Tracker for monopoly persistence — keyed by lineageId. */
  monopolyTracker: Record<string, { share: number; persistedTicks: number }>;
  /** Logged monopoly events. */
  monopolies: MonopolyEvent[];
  /** Logged cascade collapses. */
  cascades: CascadeCollapseEvent[];
  /** Significant resource observations FIFO. */
  observations: ResourceObservation[];
  /** Recent market pressure samples. */
  pressureHistory: MarketPressureSample[];
  /** Current composite market pressure 0..10. */
  marketPressure: number;
  /** Aggregate ecosystem state classification. */
  ecosystemState: EcosystemState;
  ecosystemPersistenceTicks: number;
  /** Lifetime totals. */
  totalCascadeCollapses: number;
  totalMonopolies: number;
  totalCoalitionsFormed: number;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function seedFlows(): Record<ResourceId, ResourceFlow> {
  const f: Partial<Record<ResourceId, ResourceFlow>> = {};
  for (const r of ALL_MARKET_RESOURCES) {
    f[r] = { lastDelta: 0, emaRate: 0, consumptionRate: 0, productionRate: 0 };
  }
  return f as Record<ResourceId, ResourceFlow>;
}

export function createInitialMarket(): CivilizationMarketState {
  return {
    resources: { ...MARKET_RESOURCE_BASELINES },
    flows: seedFlows(),
    economyRecords: {},
    coalitions: {},
    monopolyTracker: {},
    monopolies: [],
    cascades: [],
    observations: [],
    pressureHistory: [],
    marketPressure: 0,
    ecosystemState: 'balanced',
    ecosystemPersistenceTicks: 0,
    totalCascadeCollapses: 0,
    totalMonopolies: 0,
    totalCoalitionsFormed: 0,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodMarket?: CivilizationMarketState };

export interface CivilizationMarketStore {
  read(): Promise<CivilizationMarketState>;
  save(state: CivilizationMarketState): Promise<void>;
  reset(): Promise<void>;
}

export function createCivilizationMarketStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CivilizationMarketStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodMarket) return g.__moodMarket;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodMarket = {
          ...createInitialMarket(),
          ...(JSON.parse(txt) as Partial<CivilizationMarketState>),
        };
      } catch {
        g.__moodMarket = createInitialMarket();
      }
      return g.__moodMarket;
    },
    async save(state) {
      state.observations = state.observations.slice(-RESOURCE_HISTORY_LIMIT);
      state.monopolies = state.monopolies.slice(-MONOPOLY_HISTORY_LIMIT);
      state.cascades = state.cascades.slice(-CASCADE_HISTORY_LIMIT);
      state.pressureHistory = state.pressureHistory.slice(-RESOURCE_HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodMarket = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodMarket = undefined;
    },
  };
}

// ─── update engine ────────────────────────────────────────────

export interface MarketSignal {
  at: number;
  tick: number;
  activeLineages: CivilizationLineage[];
  /** Lineage IDs that became extinct THIS event (used for cascade detection). */
  newlyExtinctIds: string[];
}

function updateFlow(prev: ResourceFlow, delta: number): ResourceFlow {
  const alpha = 0.2;
  const ema = prev.emaRate * (1 - alpha) + delta * alpha;
  return {
    lastDelta: round2(delta),
    emaRate: round2(ema),
    consumptionRate: round2(prev.consumptionRate * (1 - alpha) + (delta < 0 ? -delta : 0) * alpha),
    productionRate: round2(prev.productionRate * (1 - alpha) + (delta > 0 ? delta : 0) * alpha),
  };
}

function pickEcosystemState(
  s: CivilizationMarketState, hasActiveMonopoly: boolean, hasActiveCoalition: boolean,
  recentCascade: boolean,
): EcosystemState {
  if (recentCascade) return 'cascade-collapsing';
  if (hasActiveMonopoly) return 'monopolized';
  const avgResources = ALL_MARKET_RESOURCES.reduce((a, r) => a + s.resources[r], 0) / ALL_MARKET_RESOURCES.length;
  if (avgResources < 30) return 'scarcity-stressed';
  if (s.resources.ecologicalStability < 35) return 'ecologically-fragile';
  if (hasActiveCoalition) return 'coalition-stabilized';
  const activeCivs = Object.keys(s.economyRecords).length;
  if (activeCivs >= 3 && avgResources > 50) return 'competitive';
  return 'balanced';
}

const ECOSYSTEM_HYSTERESIS_TICKS = 4;

function transitionEcosystem(
  prev: EcosystemState, prevTicks: number, candidate: EcosystemState,
): { state: EcosystemState; ticks: number } {
  if (candidate === prev) return { state: prev, ticks: prevTicks + 1 };
  if (prevTicks < ECOSYSTEM_HYSTERESIS_TICKS) return { state: prev, ticks: prevTicks + 1 };
  return { state: candidate, ticks: 1 };
}

export function updateMarket(
  state: CivilizationMarketState, sig: MarketSignal,
): CivilizationMarketState {
  // 1. Compute economic profile per active lineage.
  const profiles: Map<string, EconomicProfile> = new Map();
  const lineageMap: Map<string, CivilizationLineage> = new Map();
  for (const l of sig.activeLineages) {
    profiles.set(l.lineageId, genomeToEconomicProfile(l.genome));
    lineageMap.set(l.lineageId, l);
  }

  // 2. Compute effective influence per lineage (scales by selectionScore;
  //    dominant lineage counts more in market).
  const influence: Map<string, number> = new Map();
  let totalInfluence = 0;
  for (const l of sig.activeLineages) {
    const w = l.status === 'dominant'  ? 1.0
           : l.status === 'declining' ? 0.5
           : l.status === 'active'    ? 0.75
                                       : 0;
    const eff = round2((l.selectionScore / 10) * w);
    influence.set(l.lineageId, eff);
    totalInfluence += eff;
  }

  // 3. Aggregate per-pool consumption + production scaled by influence.
  const aggregateConsumption: Record<ResourceId, number> = {} as Record<ResourceId, number>;
  const aggregateProduction:  Record<ResourceId, number> = {} as Record<ResourceId, number>;
  for (const r of ALL_MARKET_RESOURCES) {
    aggregateConsumption[r] = 0;
    aggregateProduction[r] = 0;
  }
  for (const [id, profile] of profiles.entries()) {
    const inf = influence.get(id) ?? 0;
    for (const r of ALL_MARKET_RESOURCES) {
      aggregateConsumption[r] += profile.consumption[r] * inf * CONSUMPTION_SCALE;
      aggregateProduction[r]  += profile.production[r]  * inf * PRODUCTION_SCALE;
    }
  }

  // 4. Apply species-level externalities (sum across civs of the same species).
  for (const l of sig.activeLineages) {
    const inf = influence.get(l.lineageId) ?? 0;
    const ext = SPECIES_EXTERNALITIES[l.civilizationSpecies];
    if (!ext) continue;
    for (const [r, e] of Object.entries(ext) as [ResourceId, number][]) {
      if (e > 0) aggregateProduction[r] += e * inf;
      else aggregateConsumption[r] += -e * inf;
    }
  }

  // 5. Evolve pools. Net = production - consumption + homeostatic drift - passive decay.
  const newResources: MarketResourceLevels = { ...state.resources };
  const newFlows: Record<ResourceId, ResourceFlow> = { ...state.flows };
  const newObservations: ResourceObservation[] = [];

  for (const r of ALL_MARKET_RESOURCES) {
    const current = newResources[r];
    const baseline = MARKET_RESOURCE_BASELINES[r];
    const consume = aggregateConsumption[r];
    const produce = aggregateProduction[r];
    const homeostatic = (baseline - current) * RESOURCE_HOMEOSTATIC_RATE;
    const decay = current > baseline ? RESOURCE_PASSIVE_DECAY * 0.5 : 0;
    let delta = produce - consume + homeostatic - decay;
    if (delta >  RESOURCE_MAX_DELTA) delta =  RESOURCE_MAX_DELTA;
    if (delta < -RESOURCE_MAX_DELTA) delta = -RESOURCE_MAX_DELTA;
    const next = round1(clamp100(current + delta));
    const realized = round2(next - current);
    newResources[r] = next;
    newFlows[r] = updateFlow(state.flows[r], realized);
    if (Math.abs(realized) >= 0.5) {
      newObservations.push({ at: sig.at, tick: sig.tick, pool: r, level: next, delta: realized });
    }
  }

  // 6. Per-civ economy records.
  const newEconomyRecords: Record<string, CivilizationEconomyRecord> = {};
  const totalAggregateConsumption = ALL_MARKET_RESOURCES.reduce((a, r) => a + aggregateConsumption[r], 0);
  const totalAggregateProduction = ALL_MARKET_RESOURCES.reduce((a, r) => a + aggregateProduction[r], 0);

  for (const l of sig.activeLineages) {
    const profile = profiles.get(l.lineageId)!;
    const inf = influence.get(l.lineageId) ?? 0;
    const civConsumption = ALL_MARKET_RESOURCES.reduce((a, r) => a + profile.consumption[r], 0) * inf * CONSUMPTION_SCALE;
    const civProduction = ALL_MARKET_RESOURCES.reduce((a, r) => a + profile.production[r], 0) * inf * PRODUCTION_SCALE;
    const consumptionShare = totalAggregateConsumption > 0 ? round2(civConsumption / totalAggregateConsumption) : 0;
    const productionShare = totalAggregateProduction > 0 ? round2(civProduction / totalAggregateProduction) : 0;
    const prevROI = state.economyRecords[l.lineageId]?.survivabilityROI ?? 0;
    const roiSample = profile.sustainabilityScore - profile.extractionPressure * 5;
    const survivabilityROI = round2(prevROI * 0.8 + roiSample * 0.2);

    newEconomyRecords[l.lineageId] = {
      lineageId: l.lineageId,
      species: l.civilizationSpecies,
      profile,
      consumptionShare, productionShare,
      survivabilityROI,
      effectiveInfluence: inf,
    };
  }

  // 7. Cascade collapse detection — when a previously-recorded lineage
  //    just went extinct AND had high consumption share.
  let cascades = state.cascades;
  let totalCascadeCollapses = state.totalCascadeCollapses;
  for (const extId of sig.newlyExtinctIds) {
    const priorRecord = state.economyRecords[extId];
    if (!priorRecord) continue;
    if (priorRecord.consumptionShare < CASCADE_TRIGGER_SHARE) continue;
    // Shock the pools the extinct civ was most consuming.
    const shocks: Array<{ pool: ResourceId; shock: number }> = [];
    for (const r of ALL_MARKET_RESOURCES) {
      const consumedFrom = priorRecord.profile.consumption[r];
      if (consumedFrom > 0.5) {
        // The collapse temporarily destabilizes this pool — drop it.
        const shock = -CASCADE_SHOCK_MAGNITUDE * consumedFrom * priorRecord.consumptionShare;
        newResources[r] = round1(clamp100(newResources[r] + shock));
        shocks.push({ pool: r, shock: round1(shock) });
      }
    }
    // Downstream effects: any lineages with high collapseSensitivity feel it.
    const downstreamLineages: string[] = [];
    for (const [id, rec] of Object.entries(newEconomyRecords)) {
      if (rec.profile.collapseSensitivity > 0.6) downstreamLineages.push(id);
    }
    cascades = [...cascades, {
      at: sig.at, tick: sig.tick,
      collapsedLineageId: extId,
      collapsedShare: priorRecord.consumptionShare,
      shockedPools: shocks,
      downstreamLineages,
    }];
    totalCascadeCollapses += 1;
  }

  // 8. Monopoly detection.
  const newMonopolyTracker = { ...state.monopolyTracker };
  let monopolies = state.monopolies;
  let totalMonopolies = state.totalMonopolies;
  let hasActiveMonopoly = false;
  for (const [id, rec] of Object.entries(newEconomyRecords)) {
    if (rec.consumptionShare >= MONOPOLY_SHARE_THRESHOLD) {
      const prev = newMonopolyTracker[id];
      const persistedTicks = (prev?.persistedTicks ?? 0) + 1;
      newMonopolyTracker[id] = { share: rec.consumptionShare, persistedTicks };
      if (persistedTicks === MONOPOLY_PERSISTENCE_TICKS) {
        // Newly-established monopoly — log it.
        monopolies = [...monopolies, {
          at: sig.at, tick: sig.tick,
          lineageId: id, consumptionShare: rec.consumptionShare,
          persistedTicks,
        }];
        totalMonopolies += 1;
      }
      if (persistedTicks >= MONOPOLY_PERSISTENCE_TICKS) hasActiveMonopoly = true;
    } else {
      delete newMonopolyTracker[id];
    }
  }

  // 9. Coalition formation/decay.
  const newCoalitions: Record<string, Coalition> = {};
  // First decay existing coalitions.
  for (const [id, coalition] of Object.entries(state.coalitions)) {
    const stillActive = coalition.memberLineageIds.every((mid) => newEconomyRecords[mid]);
    if (!stillActive) continue;
    // Re-evaluate mutual benefit: efficiency × tradeCapacity averaged.
    const aggregateEfficiency = round2(
      coalition.memberLineageIds
        .reduce((a, mid) => a + newEconomyRecords[mid].profile.efficiency, 0)
      / coalition.memberLineageIds.length,
    );
    const lastBenefitScore = round2(aggregateEfficiency * 5);
    const beneficial = lastBenefitScore > 4;
    const strength = round2(clamp(0, COALITION_STRENGTH_CAP,
      coalition.strength + (beneficial ? 0.3 : -COALITION_DECAY_PER_EVENT * 10),
    ));
    if (strength <= 0) continue;
    newCoalitions[id] = {
      ...coalition,
      strength, lastBenefitScore,
      aggregateEfficiency, active: beneficial,
      consecutiveBeneficialEvents: beneficial
        ? coalition.consecutiveBeneficialEvents + 1
        : Math.max(0, coalition.consecutiveBeneficialEvents - 1),
    };
  }

  // Detect new coalition candidates: pairs of active civs with complementary
  // profiles + high mutual tradeCapacity. Each civ pair is checked.
  const livingIds = Object.keys(newEconomyRecords);
  const coalitionFormationCounters: Record<string, number> = {};
  for (let i = 0; i < livingIds.length; i++) {
    for (let j = i + 1; j < livingIds.length; j++) {
      const a = newEconomyRecords[livingIds[i]];
      const b = newEconomyRecords[livingIds[j]];
      // Both partners must be active (selectionScore-weighted influence above
      // a meaningful threshold) AND have high trade capacity.
      if (a.effectiveInfluence < 0.3 || b.effectiveInfluence < 0.3) continue;
      if (a.profile.tradeCapacity < 0.45 || b.profile.tradeCapacity < 0.45) continue;
      // Complementarity: A produces what B consumes (or vice versa).
      let comp = 0;
      for (const r of ALL_MARKET_RESOURCES) {
        if (a.profile.production[r] > 0.25 && b.profile.consumption[r] > 0.25) comp += 1;
        if (b.profile.production[r] > 0.25 && a.profile.consumption[r] > 0.25) comp += 1;
      }
      if (comp < COALITION_FORM_THRESHOLD) continue;
      const pairKey = [livingIds[i], livingIds[j]].sort().join('+');
      const existingCoalition = Object.values(newCoalitions).find((c) =>
        c.memberLineageIds.length === 2
        && c.memberLineageIds.includes(livingIds[i])
        && c.memberLineageIds.includes(livingIds[j]));
      if (existingCoalition) continue;
      // Need sustained mutual benefit before forming — counter outside this loop.
      coalitionFormationCounters[pairKey] = comp;
    }
  }
  // Simple formation: any pair meeting the complementarity threshold this event
  // gets a small new coalition with starter strength. (formation hysteresis is
  // implemented through the per-event strength decay above — coalitions need
  // sustained benefit to grow.)
  let totalCoalitionsFormed = state.totalCoalitionsFormed;
  // Rank candidate pairs by complementarity; only form the top N per event.
  const candidatePairs = Object.entries(coalitionFormationCounters)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_NEW_COALITIONS_PER_EVENT);
  for (const [pairKey, comp] of candidatePairs) {
    const [a, b] = pairKey.split('+');
    const coalitionId = `coal-${pairKey}-${sig.tick}`;
    if (newCoalitions[coalitionId]) continue;
    // Don't form if already in an existing coalition
    const alreadyAllied = Object.values(newCoalitions).some((c) =>
      c.memberLineageIds.includes(a) && c.memberLineageIds.includes(b));
    if (alreadyAllied) continue;
    const memberRecs = [newEconomyRecords[a], newEconomyRecords[b]];
    const aggregateEfficiency = round2((memberRecs[0].profile.efficiency + memberRecs[1].profile.efficiency) / 2);
    newCoalitions[coalitionId] = {
      coalitionId,
      memberLineageIds: [a, b],
      formedAtTick: sig.tick, formedAt: sig.at,
      strength: 2 + comp * 0.5,
      consecutiveBeneficialEvents: 1,
      aggregateEfficiency,
      active: true,
      lastBenefitScore: round2(aggregateEfficiency * 5),
    };
    totalCoalitionsFormed += 1;
  }

  const hasActiveCoalition = Object.values(newCoalitions).some((c) => c.active && c.strength >= COALITION_FORM_TICKS);

  // 10. Market pressure composite.
  const avgResources = ALL_MARKET_RESOURCES.reduce((a, r) => a + newResources[r], 0) / ALL_MARKET_RESOURCES.length;
  const scarcityContrib = Math.max(0, (50 - avgResources) / 5);
  const maxShare = Object.values(newEconomyRecords).reduce((m, r) => Math.max(m, r.consumptionShare), 0);
  const monopolizationContrib = Math.max(0, (maxShare - 0.3) * 15);
  const ecologicalInstabilityContrib = Math.max(0, (60 - newResources.ecologicalStability) / 6);
  // Coalition fragility: capped 0..10 — share of coalitions that are weak.
  const totalCoalitionCount = Object.keys(newCoalitions).length;
  const fragileCount = Object.values(newCoalitions).filter((c) => c.strength < 3).length;
  const coalitionFragilityContrib = totalCoalitionCount > 0
    ? Math.min(10, (fragileCount / totalCoalitionCount) * 10)
    : 0;
  const resourceDepletionContrib = ALL_MARKET_RESOURCES.filter((r) => newResources[r] < 25).length * 1.5;
  const extinctConcentration = sig.activeLineages.length > 0
    ? (1 - sig.activeLineages.length / Object.keys(state.economyRecords).length)
    : 0;
  const extinctionConcentrationContrib = Math.max(0, extinctConcentration * 5);
  const collapsePropagationContrib = sig.newlyExtinctIds.length * 2;
  const compositePressure = clamp10(
    scarcityContrib * 0.20
    + monopolizationContrib * 0.20
    + ecologicalInstabilityContrib * 0.15
    + coalitionFragilityContrib * 0.10
    + resourceDepletionContrib * 0.10
    + extinctionConcentrationContrib * 0.10
    + collapsePropagationContrib * 0.15,
  );
  const pressureSample: MarketPressureSample = {
    at: sig.at, tick: sig.tick,
    pressure: round2(compositePressure),
    scarcityContrib: round2(scarcityContrib),
    monopolizationContrib: round2(monopolizationContrib),
    ecologicalInstabilityContrib: round2(ecologicalInstabilityContrib),
    coalitionFragilityContrib: round2(coalitionFragilityContrib),
    resourceDepletionContrib: round2(resourceDepletionContrib),
    extinctionConcentrationContrib: round2(extinctionConcentrationContrib),
    collapsePropagationContrib: round2(collapsePropagationContrib),
  };

  // 11. Ecosystem state classification with hysteresis.
  const recentCascade = sig.newlyExtinctIds.length > 0;
  const candidate = pickEcosystemState(
    { ...state, resources: newResources, economyRecords: newEconomyRecords } as CivilizationMarketState,
    hasActiveMonopoly, hasActiveCoalition, recentCascade,
  );
  const { state: ecosystemState, ticks: ecosystemPersistenceTicks } =
    transitionEcosystem(state.ecosystemState, state.ecosystemPersistenceTicks, candidate);

  return {
    resources: newResources,
    flows: newFlows,
    economyRecords: newEconomyRecords,
    coalitions: newCoalitions,
    monopolyTracker: newMonopolyTracker,
    monopolies,
    cascades,
    observations: [...state.observations, ...newObservations],
    pressureHistory: [...state.pressureHistory, pressureSample],
    marketPressure: round2(compositePressure),
    ecosystemState,
    ecosystemPersistenceTicks,
    totalCascadeCollapses,
    totalMonopolies,
    totalCoalitionsFormed,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? sig.at,
    updatedAt: sig.at,
  };
}

// ─── market bias on governance ────────────────────────────────

export interface MarketBias {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  deferAcceptance: number;
  recoveryWeighting: number;
  burstTolerance: number;
}

/** Bias governance gradients from market conditions: scarcity →
 *  conservation; monopoly → throttle; ecological instability → defer. */
export function computeMarketBias(state: CivilizationMarketState): MarketBias {
  const avgResources = ALL_MARKET_RESOURCES.reduce((a, r) => a + state.resources[r], 0) / ALL_MARKET_RESOURCES.length;
  const scarcity = Math.max(0, (50 - avgResources) / 50);
  const ecologyFactor = Math.max(0, (60 - state.resources.ecologicalStability) / 60);
  const maxShare = Object.values(state.economyRecords).reduce((m, r) => Math.max(m, r.consumptionShare), 0);
  const monopolyFactor = Math.max(0, (maxShare - 0.3) * 1.5);
  const cascadeFactor = state.ecosystemState === 'cascade-collapsing' ? 1 : 0;

  return {
    cognitionThroughput:  clampBias(round2(-scarcity * 0.15 - monopolyFactor * 0.10 - cascadeFactor * 0.10)),
    escalationPermission: clampBias(round2(-scarcity * 0.10 - monopolyFactor * 0.10 - ecologyFactor * 0.10)),
    explorationIntensity: clampBias(round2(-scarcity * 0.20 - ecologyFactor * 0.10)),
    deferAcceptance:      clampBias(round2(+scarcity * 0.15 + ecologyFactor * 0.10 + cascadeFactor * 0.10)),
    recoveryWeighting:    clampBias(round2(+scarcity * 0.15 + ecologyFactor * 0.10)),
    burstTolerance:       clampBias(round2(-scarcity * 0.20 - cascadeFactor * 0.15)),
  };
}

export function applyMarketBias<G extends MarketBias>(gradients: G, bias: MarketBias): G {
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

/** Simulation pressure from market conditions. 0..0.2. */
export function marketPressureContribution(state: CivilizationMarketState): number {
  if (state.marketPressure < 4) return 0;
  return round2(Math.min(0.2, (state.marketPressure - 4) * 0.04));
}
