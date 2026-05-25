/**
 * COGNITIVE WEIGHT LONGITUDINAL VIEW
 *
 * Read-only analyzer over the cognitive weight memory + a current
 * evolution snapshot. Surfaces:
 *
 *   - dominant systems over time
 *   - collapsing systems (high EWMA → low recent)
 *   - unstable authority transitions
 *   - recurring authority shifts
 *   - environmental dependency (sensitivity profile)
 *   - cognitive fragmentation trend
 *   - "which brains the system trusts most lately"
 *   - "which brains are losing authority"
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  CognitiveWeightMemoryState, FragmentationPoint,
} from './cognitiveWeightMemory';
import {
  ALL_COGNITIVE_SYSTEMS, type CognitiveSystem,
  type CognitiveWeightEvolution,
} from './cognitiveWeightEvolution';

// ─── shape ─────────────────────────────────────────────────────

export interface SystemDominanceRow {
  system: CognitiveSystem;
  count: number;
  share: number;
  ewmaWeight: number;
}

export interface CollapsingSystemRow {
  system: CognitiveSystem;
  historicalWeight: number;
  recentWeight: number;
  collapseDelta: number;          // historical - recent (positive = collapsing)
}

export interface AuthorityTransitionRow {
  fromSystem: CognitiveSystem;
  toSystem: CognitiveSystem;
  count: number;
}

export interface FragmentationTrendPoint {
  at: number;
  globalStability: number;
  cognitiveFragmentation: number;
}

export type FragmentationTrend = 'no-history' | 'establishing' | 'stable' | 'rising' | 'falling';

export interface CognitiveWeightLongitudinalView {
  present: boolean;
  statement: string;
  fragmentationTrend: FragmentationTrend;

  totalObservations: number;
  averageStability: number;
  averageAdaptationPressure: number;
  averageFragmentation: number;

  current: CognitiveWeightEvolution | null;

  systemDominanceRanking: SystemDominanceRow[];
  collapsingSystems: CollapsingSystemRow[];
  authorityTransitions: AuthorityTransitionRow[];
  fragmentationTrace: FragmentationTrendPoint[];

  trustedRecently: SystemDominanceRow[];
  losingAuthority: CollapsingSystemRow[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── derivations ───────────────────────────────────────────────

function classifyFragmentation(trace: FragmentationPoint[]): FragmentationTrend {
  if (trace.length === 0) return 'no-history';
  if (trace.length < 4) return 'establishing';
  const half = Math.floor(trace.length / 2);
  const early = avg(trace.slice(0, half).map((p) => p.cognitiveFragmentation));
  const recent = avg(trace.slice(half).map((p) => p.cognitiveFragmentation));
  const delta = recent - early;
  if (delta > 0.8) return 'rising';
  if (delta < -0.8) return 'falling';
  return 'stable';
}

function systemDominanceRanking(state: CognitiveWeightMemoryState): SystemDominanceRow[] {
  const total = Object.values(state.dominanceCounts).reduce((a, b) => a + b, 0);
  return ALL_COGNITIVE_SYSTEMS
    .map((s) => ({
      system: s,
      count: state.dominanceCounts[s] ?? 0,
      share: total > 0 ? round2((state.dominanceCounts[s] ?? 0) / total) : 0,
      ewmaWeight: round1(state.ewmaWeights[s] ?? 5),
    }))
    .filter((r) => r.count > 0 || r.ewmaWeight !== 5)
    .sort((a, b) =>
      b.count !== a.count
        ? b.count - a.count
        : b.ewmaWeight - a.ewmaWeight,
    )
    .slice(0, 8);
}

function collapsingSystems(state: CognitiveWeightMemoryState): CollapsingSystemRow[] {
  // Compare full-EWMA against the average of the last RECENT_WINDOW observations.
  const recent = state.observations.slice(-12);
  if (recent.length < 3) return [];
  const recentAvg = {} as Record<CognitiveSystem, number>;
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    recentAvg[s] = avg(recent.map((o) => o.weights[s] ?? 5));
  }
  return ALL_COGNITIVE_SYSTEMS
    .map((s) => {
      const historical = round1(state.ewmaWeights[s] ?? 5);
      const recentW = round1(recentAvg[s]);
      return {
        system: s,
        historicalWeight: historical,
        recentWeight: recentW,
        collapseDelta: round1(historical - recentW),
      };
    })
    .filter((r) => r.collapseDelta >= 0.6)
    .sort((a, b) => b.collapseDelta - a.collapseDelta)
    .slice(0, 5);
}

function authorityTransitions(state: CognitiveWeightMemoryState): AuthorityTransitionRow[] {
  const observations = state.observations;
  if (observations.length < 2) return [];
  const counts = new Map<string, number>();
  for (let i = 1; i < observations.length; i++) {
    const prev = observations[i - 1].dominantSystem;
    const cur  = observations[i].dominantSystem;
    if (!prev || !cur || prev === cur) continue;
    const key = `${prev}→${cur}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [fromSystem, toSystem] = key.split('→') as [CognitiveSystem, CognitiveSystem];
      return { fromSystem, toSystem, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

// ─── main builder ──────────────────────────────────────────────

export interface CognitiveWeightLongitudinalViewInput {
  memory: CognitiveWeightMemoryState | null;
  current?: CognitiveWeightEvolution | null;
}

export function buildCognitiveWeightLongitudinalView(
  input: CognitiveWeightLongitudinalViewInput,
): CognitiveWeightLongitudinalView {
  const mem = input.memory;

  if (!mem || mem.totalObservations === 0) {
    return {
      present: false,
      statement: 'no cognitive weight history yet — the system has not yet observed its own brains under pressure',
      fragmentationTrend: 'no-history',
      totalObservations: 0,
      averageStability: 10,
      averageAdaptationPressure: 0,
      averageFragmentation: 0,
      current: input.current ?? null,
      systemDominanceRanking: [],
      collapsingSystems: [],
      authorityTransitions: [],
      fragmentationTrace: [],
      trustedRecently: [],
      losingAuthority: [],
    };
  }

  const observations = mem.observations;
  const total = mem.totalObservations;

  const averageStability         = round1(avg(observations.map((o) => o.globalStability)));
  const averageAdaptationPressure= round1(avg(observations.map((o) => o.adaptationPressure)));
  const averageFragmentation     = round1(avg(observations.map((o) => o.cognitiveFragmentation)));

  const systemDominance = systemDominanceRanking(mem);
  const collapsing = collapsingSystems(mem);
  const transitions = authorityTransitions(mem);

  const fragmentationTrace: FragmentationTrendPoint[] = mem.fragmentationTrace
    .slice(-24)
    .map((p) => ({
      at: p.at,
      globalStability: round1(p.globalStability),
      cognitiveFragmentation: round1(p.cognitiveFragmentation),
    }));

  const fragmentationTrend = classifyFragmentation(mem.fragmentationTrace);

  // "Trusted recently" = top-EWMA system(s) with strong recent
  // dominance.
  const trustedRecently = systemDominance
    .filter((r) => r.ewmaWeight >= 5.5)
    .slice(0, 5);

  // "Losing authority" overlaps with collapsing but emphasizes systems
  // that *had* dominance and lost it.
  const losingAuthority = collapsing.slice(0, 5);

  const statement = (() => {
    if (fragmentationTrend === 'rising')   return `cognitive fragmentation rising — internal authority re-balancing across ${total} observations`;
    if (fragmentationTrend === 'falling')  return `cognitive fragmentation settling — internal hierarchy stabilizing across ${total} observations`;
    if (fragmentationTrend === 'stable')   return `cognitive hierarchy stable — average fragmentation ${averageFragmentation.toFixed(1)}/10 across ${total} observations`;
    return `establishing baseline cognitive weight history — ${total} observation(s) recorded`;
  })();

  return {
    present: true,
    statement,
    fragmentationTrend,
    totalObservations: total,
    averageStability,
    averageAdaptationPressure,
    averageFragmentation,
    current: input.current ?? null,
    systemDominanceRanking: systemDominance,
    collapsingSystems: collapsing,
    authorityTransitions: transitions,
    fragmentationTrace,
    trustedRecently,
    losingAuthority,
  };
}
