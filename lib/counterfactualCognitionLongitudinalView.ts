/**
 * COUNTERFACTUAL COGNITION LONGITUDINAL VIEW
 *
 * Read-only analyzer. Surfaces "if leader X had led recently, runs
 * would have averaged +Y trust impact" by aggregating projection
 * memory across all observations.
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  CounterfactualCognitionMemoryState, PathwayAggregate,
} from './counterfactualCognitionMemory';
import type {
  CampaignArchetype, CounterfactualCognition,
} from './counterfactualCognitionEngine';
import type { CognitiveSystem } from './cognitiveWeightEvolution';

// ─── shape ─────────────────────────────────────────────────────

export interface PathwayRow {
  alternateLeader: CognitiveSystem;
  archetype: CampaignArchetype;
  count: number;
  averageTrustImpact: number;
  averageFatigueImpact: number;
  averageDurabilityImpact: number;
  averageDivergence: number;
  averagePlausibility: number;
}

export interface ArchetypeFrequencyRow {
  archetype: CampaignArchetype;
  count: number;
  share: number;
}

export interface LeaderShareRow {
  leader: string;
  count: number;
  share: number;
}

export type CounterfactualTrend =
  | 'no-history' | 'establishing' | 'stable'
  | 'trust-optimal-shifting' | 'durability-optimal-shifting';

export interface CounterfactualCognitionLongitudinalView {
  present: boolean;
  statement: string;
  trend: CounterfactualTrend;

  totalObservations: number;

  current: CounterfactualCognition | null;

  /** Most-recurring (leader × archetype) pathways. */
  recurringPathways: PathwayRow[];
  /** Highest average trust impact across all pathways with >=2 observations. */
  highTrustPathways: PathwayRow[];
  /** Highest average durability impact across all pathways with >=2 observations. */
  highDurabilityPathways: PathwayRow[];
  /** Most fatigue-relieving paths (lowest fatigueImpact). */
  fatigueRelievingPathways: PathwayRow[];

  archetypeProjectionFrequency: ArchetypeFrequencyRow[];
  trustOptimizedFrequency: ArchetypeFrequencyRow[];
  durabilityOptimizedFrequency: ArchetypeFrequencyRow[];
  actualLeaderShares: LeaderShareRow[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function aggregatesToRows(
  table: Record<string, PathwayAggregate>,
): PathwayRow[] {
  return Object.entries(table)
    .map(([key, agg]) => {
      const [leader, archetype] = key.split('|') as [CognitiveSystem, CampaignArchetype];
      const count = Math.max(1, agg.count);
      return {
        alternateLeader: leader,
        archetype,
        count: agg.count,
        averageTrustImpact: round1(agg.trustImpactSum / count),
        averageFatigueImpact: round1(agg.fatigueImpactSum / count),
        averageDurabilityImpact: round1(agg.durabilityImpactSum / count),
        averageDivergence: round1(agg.divergenceSum / count),
        averagePlausibility: round1(agg.plausibilitySum / count),
      };
    });
}

// ─── trend classifier ────────────────────────────────────────

function classifyTrend(
  state: CounterfactualCognitionMemoryState,
): CounterfactualTrend {
  if (state.totalObservations === 0) return 'no-history';
  if (state.observations.length < 4) return 'establishing';
  // Compare the trust-optimized archetype distribution in early vs
  // recent halves of the observation tail.
  const obs = state.observations;
  const half = Math.floor(obs.length / 2);
  const early = obs.slice(0, half);
  const recent = obs.slice(half);
  const earlyTrust = early[0]?.trustOptimizedArchetype;
  const recentTrust = recent[recent.length - 1]?.trustOptimizedArchetype;
  if (earlyTrust && recentTrust && earlyTrust !== recentTrust) {
    return 'trust-optimal-shifting';
  }
  const earlyDur = early[0]?.durabilityOptimizedArchetype;
  const recentDur = recent[recent.length - 1]?.durabilityOptimizedArchetype;
  if (earlyDur && recentDur && earlyDur !== recentDur) {
    return 'durability-optimal-shifting';
  }
  return 'stable';
}

// ─── main builder ──────────────────────────────────────────────

export interface CounterfactualCognitionViewInput {
  memory: CounterfactualCognitionMemoryState | null;
  current?: CounterfactualCognition | null;
}

export function buildCounterfactualCognitionLongitudinalView(
  input: CounterfactualCognitionViewInput,
): CounterfactualCognitionLongitudinalView {
  const mem = input.memory;

  if (!mem || mem.totalObservations === 0) {
    return {
      present: false,
      statement: 'no counterfactual cognition history yet — multi-path strategic simulation has not run',
      trend: 'no-history',
      totalObservations: 0,
      current: input.current ?? null,
      recurringPathways: [],
      highTrustPathways: [],
      highDurabilityPathways: [],
      fatigueRelievingPathways: [],
      archetypeProjectionFrequency: [],
      trustOptimizedFrequency: [],
      durabilityOptimizedFrequency: [],
      actualLeaderShares: [],
    };
  }

  const total = mem.totalObservations;
  const trend = classifyTrend(mem);

  const allRows = aggregatesToRows(mem.pathwayStats);

  const recurringPathways = allRows
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count || b.averagePlausibility - a.averagePlausibility)
    .slice(0, 6);

  const highTrustPathways = allRows
    .filter((r) => r.count >= 2 && r.averageTrustImpact >= 2)
    .sort((a, b) => b.averageTrustImpact - a.averageTrustImpact)
    .slice(0, 5);

  const highDurabilityPathways = allRows
    .filter((r) => r.count >= 2 && r.averageDurabilityImpact >= 2)
    .sort((a, b) => b.averageDurabilityImpact - a.averageDurabilityImpact)
    .slice(0, 5);

  const fatigueRelievingPathways = allRows
    .filter((r) => r.count >= 2 && r.averageFatigueImpact <= -1)
    .sort((a, b) => a.averageFatigueImpact - b.averageFatigueImpact)
    .slice(0, 5);

  const totalArchProjections = Object.values(mem.archetypeProjectionCounts).reduce((a, b) => a + b, 0);
  const archetypeProjectionFrequency: ArchetypeFrequencyRow[] = Object.entries(mem.archetypeProjectionCounts)
    .map(([archetype, count]) => ({
      archetype: archetype as CampaignArchetype,
      count,
      share: totalArchProjections > 0 ? round2(count / totalArchProjections) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totalTrustOpt = Object.values(mem.trustOptimizedCounts).reduce((a, b) => a + b, 0);
  const trustOptimizedFrequency: ArchetypeFrequencyRow[] = Object.entries(mem.trustOptimizedCounts)
    .map(([archetype, count]) => ({
      archetype: archetype as CampaignArchetype,
      count,
      share: totalTrustOpt > 0 ? round2(count / totalTrustOpt) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalDurOpt = Object.values(mem.durabilityOptimizedCounts).reduce((a, b) => a + b, 0);
  const durabilityOptimizedFrequency: ArchetypeFrequencyRow[] = Object.entries(mem.durabilityOptimizedCounts)
    .map(([archetype, count]) => ({
      archetype: archetype as CampaignArchetype,
      count,
      share: totalDurOpt > 0 ? round2(count / totalDurOpt) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalActualLeaders = Object.values(mem.actualLeaderCounts).reduce((a, b) => a + b, 0);
  const actualLeaderShares: LeaderShareRow[] = Object.entries(mem.actualLeaderCounts)
    .map(([leader, count]) => ({
      leader,
      count,
      share: totalActualLeaders > 0 ? round2(count / totalActualLeaders) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const statement = (() => {
    if (trend === 'trust-optimal-shifting') {
      return `trust-optimal archetype has shifted over time — different paths emerging as best-trust across ${total} observations`;
    }
    if (trend === 'durability-optimal-shifting') {
      return `durability-optimal archetype has shifted — different paths emerging as best-durability across ${total} observations`;
    }
    if (trend === 'stable') {
      return `counterfactual simulation stable — same archetypes recur as best-trust/durability across ${total} observations`;
    }
    return `establishing counterfactual baseline — ${total} observation(s) recorded`;
  })();

  return {
    present: true,
    statement,
    trend,
    totalObservations: total,
    current: input.current ?? null,
    recurringPathways,
    highTrustPathways,
    highDurabilityPathways,
    fatigueRelievingPathways,
    archetypeProjectionFrequency,
    trustOptimizedFrequency,
    durabilityOptimizedFrequency,
    actualLeaderShares,
  };
}
