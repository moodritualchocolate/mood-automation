/**
 * EXECUTIVE GOVERNANCE LONGITUDINAL VIEW
 *
 * Read-only analyzer over executive governance memory + a current
 * governance snapshot. Surfaces:
 *
 *   - which systems repeatedly lead (executive ranking)
 *   - which systems stabilize trust
 *   - which systems destabilize cognition
 *   - recurring governance structures
 *   - suppression cycles
 *   - executive legitimacy over time
 *   - contextual leadership transitions
 *   - governance collapse patterns
 *   - authority concentration risk
 *   - fragmentation governance drift
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  ExecutiveGovernanceMemoryState, GovernanceObservation, StabilityPoint,
} from './executiveGovernanceMemory';
import type {
  ExecutiveGovernance, AuthorityTransitionEntry,
} from './executiveGovernanceEngine';
import {
  ALL_COGNITIVE_SYSTEMS, type CognitiveSystem,
} from './cognitiveWeightEvolution';

// ─── shape ─────────────────────────────────────────────────────

export interface ExecutiveRankingRow {
  system: CognitiveSystem;
  executiveCount: number;
  share: number;
  authorityEwma: number;
}

export interface StabilizerRankingRow {
  system: CognitiveSystem;
  stabilizerCount: number;
  share: number;
}

export interface SuppressionCycleRow {
  system: CognitiveSystem;
  totalSuppressions: number;
  shadowEmergences: number;
  predictiveRatio: number;        // shadowEmergences / max(1, totalSuppressions)
}

export interface GovernanceCollapseRow {
  pattern: string;
  count: number;
}

export interface TransitionRow {
  fromSystem: CognitiveSystem;
  toSystem: CognitiveSystem;
  count: number;
}

export interface AuthorityConcentrationRow {
  system: CognitiveSystem;
  share: number;
  consecutive: number;
  concentrationScore: number;
}

export interface GovernanceTrendPoint {
  at: number;
  governanceStability: number;
  authorityFragmentation: number;
  executiveLegitimacy: number;
}

export type GovernanceTrend =
  | 'no-history' | 'establishing' | 'stable' | 'fragmentation-rising' | 'consolidating';

export interface ExecutiveGovernanceLongitudinalView {
  present: boolean;
  statement: string;
  governanceTrend: GovernanceTrend;

  totalObservations: number;
  averageStability: number;
  averageFragmentation: number;
  averageLegitimacy: number;

  current: ExecutiveGovernance | null;

  executiveRanking: ExecutiveRankingRow[];
  stabilizerRanking: StabilizerRankingRow[];
  suppressionCycles: SuppressionCycleRow[];
  recurringGovernanceStructures: GovernanceCollapseRow[];
  governanceCollapsePatterns: GovernanceCollapseRow[];
  authorityTransitions: TransitionRow[];
  authorityConcentrationRanking: AuthorityConcentrationRow[];
  stabilityTrace: GovernanceTrendPoint[];

  /** Systems whose authority EWMA has dropped substantially vs early window. */
  recentlyLosingAuthority: AuthorityConcentrationRow[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── derivations ───────────────────────────────────────────────

function classifyGovernance(trace: StabilityPoint[]): GovernanceTrend {
  if (trace.length === 0) return 'no-history';
  if (trace.length < 4) return 'establishing';
  const half = Math.floor(trace.length / 2);
  const earlyFrag = avg(trace.slice(0, half).map((p) => p.authorityFragmentation));
  const recentFrag = avg(trace.slice(half).map((p) => p.authorityFragmentation));
  const delta = recentFrag - earlyFrag;
  if (delta > 0.8) return 'fragmentation-rising';
  if (delta < -0.8) return 'consolidating';
  return 'stable';
}

function executiveRanking(state: ExecutiveGovernanceMemoryState): ExecutiveRankingRow[] {
  const total = Object.values(state.executiveCounts).reduce((a, b) => a + b, 0);
  return ALL_COGNITIVE_SYSTEMS
    .map((s) => ({
      system: s,
      executiveCount: state.executiveCounts[s] ?? 0,
      share: total > 0 ? round2((state.executiveCounts[s] ?? 0) / total) : 0,
      authorityEwma: round1(state.authorityEwma[s] ?? 0),
    }))
    .filter((r) => r.executiveCount > 0 || r.authorityEwma >= 5)
    .sort((a, b) =>
      b.executiveCount !== a.executiveCount
        ? b.executiveCount - a.executiveCount
        : b.authorityEwma - a.authorityEwma,
    )
    .slice(0, 8);
}

function stabilizerRanking(state: ExecutiveGovernanceMemoryState): StabilizerRankingRow[] {
  const total = Object.values(state.stabilizerCounts).reduce((a, b) => a + b, 0);
  return ALL_COGNITIVE_SYSTEMS
    .map((s) => ({
      system: s,
      stabilizerCount: state.stabilizerCounts[s] ?? 0,
      share: total > 0 ? round2((state.stabilizerCounts[s] ?? 0) / total) : 0,
    }))
    .filter((r) => r.stabilizerCount > 0)
    .sort((a, b) => b.stabilizerCount - a.stabilizerCount)
    .slice(0, 6);
}

function suppressionCycles(state: ExecutiveGovernanceMemoryState): SuppressionCycleRow[] {
  // Count suppressions from observation tail.
  const suppressionCounts: Record<string, number> = {};
  for (const o of state.observations) {
    for (const s of o.suppressed) {
      suppressionCounts[s] = (suppressionCounts[s] ?? 0) + 1;
    }
  }
  return ALL_COGNITIVE_SYSTEMS
    .map((s) => {
      const total = suppressionCounts[s] ?? 0;
      const shadow = state.shadowEmergenceCounts[s] ?? 0;
      return {
        system: s,
        totalSuppressions: total,
        shadowEmergences: shadow,
        predictiveRatio: round2(shadow / Math.max(1, total)),
      };
    })
    .filter((r) => r.totalSuppressions >= 2 || r.shadowEmergences >= 2)
    .sort((a, b) => b.predictiveRatio - a.predictiveRatio || b.shadowEmergences - a.shadowEmergences)
    .slice(0, 5);
}

function recurringGovernanceStructures(state: ExecutiveGovernanceMemoryState): GovernanceCollapseRow[] {
  return Object.entries(state.governanceFingerprintCounts)
    .map(([pattern, count]) => ({ pattern, count }))
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function governanceCollapsePatterns(state: ExecutiveGovernanceMemoryState): GovernanceCollapseRow[] {
  return Object.entries(state.destabilizationPatternCounts)
    .map(([pattern, count]) => ({ pattern, count }))
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function authorityTransitions(state: ExecutiveGovernanceMemoryState): TransitionRow[] {
  const counts = new Map<string, number>();
  for (const t of state.recentTransitions) {
    const key = `${t.fromSystem}→${t.toSystem}`;
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

function authorityConcentrationRanking(state: ExecutiveGovernanceMemoryState): AuthorityConcentrationRow[] {
  const total = state.totalObservations;
  return ALL_COGNITIVE_SYSTEMS
    .map((s) => {
      const execCount = state.executiveCounts[s] ?? 0;
      const consecutive = state.consecutiveExecutiveRuns[s] ?? 0;
      const share = total > 0 ? execCount / total : 0;
      const concentrationScore = round1(Math.min(10, share * 10 * 0.6 + consecutive * 0.4));
      return {
        system: s,
        share: round2(share),
        consecutive,
        concentrationScore,
      };
    })
    .filter((r) => r.share >= 0.15 || r.consecutive >= 2)
    .sort((a, b) => b.concentrationScore - a.concentrationScore)
    .slice(0, 5);
}

function recentlyLosingAuthority(state: ExecutiveGovernanceMemoryState): AuthorityConcentrationRow[] {
  // Compare last-N average authority to EWMA. Systems with material drop = losing.
  const recent = state.observations.slice(-12);
  if (recent.length < 3) return [];
  const rows: AuthorityConcentrationRow[] = [];
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    const recentAvg = avg(recent.map((o) => o.authorities[s] ?? 0));
    const historical = state.authorityEwma[s] ?? recentAvg;
    const drop = historical - recentAvg;
    if (drop >= 1) {
      rows.push({
        system: s,
        share: round2(state.executiveCounts[s] ?? 0 / Math.max(1, state.totalObservations)),
        consecutive: state.consecutiveExecutiveRuns[s] ?? 0,
        concentrationScore: round1(drop),
      });
    }
  }
  return rows.sort((a, b) => b.concentrationScore - a.concentrationScore).slice(0, 4);
}

// ─── main builder ──────────────────────────────────────────────

export interface ExecutiveGovernanceViewInput {
  memory: ExecutiveGovernanceMemoryState | null;
  current?: ExecutiveGovernance | null;
}

export function buildExecutiveGovernanceLongitudinalView(
  input: ExecutiveGovernanceViewInput,
): ExecutiveGovernanceLongitudinalView {
  const mem = input.memory;

  if (!mem || mem.totalObservations === 0) {
    return {
      present: false,
      statement: 'no executive governance history yet — internal leadership structures have not formed',
      governanceTrend: 'no-history',
      totalObservations: 0,
      averageStability: 5,
      averageFragmentation: 0,
      averageLegitimacy: 5,
      current: input.current ?? null,
      executiveRanking: [],
      stabilizerRanking: [],
      suppressionCycles: [],
      recurringGovernanceStructures: [],
      governanceCollapsePatterns: [],
      authorityTransitions: [],
      authorityConcentrationRanking: [],
      stabilityTrace: [],
      recentlyLosingAuthority: [],
    };
  }

  const observations = mem.observations;
  const total = mem.totalObservations;

  const averageStability     = round1(avg(observations.map((o) => o.governanceStability)));
  const averageFragmentation = round1(avg(observations.map((o) => o.authorityFragmentation)));
  const averageLegitimacy    = round1(avg(observations.map((o) => o.executiveLegitimacy)));

  const stabilityTrace: GovernanceTrendPoint[] = mem.stabilityTrace
    .slice(-24)
    .map((p) => ({
      at: p.at,
      governanceStability: round1(p.governanceStability),
      authorityFragmentation: round1(p.authorityFragmentation),
      executiveLegitimacy: round1(p.executiveLegitimacy),
    }));

  const governanceTrend = classifyGovernance(mem.stabilityTrace);

  const statement = (() => {
    if (governanceTrend === 'fragmentation-rising') {
      return `governance fragmentation rising — authority structures destabilizing across ${total} observations`;
    }
    if (governanceTrend === 'consolidating') {
      return `governance consolidating — executive structures stabilizing across ${total} observations`;
    }
    if (governanceTrend === 'stable') {
      return `governance stable — average legitimacy ${averageLegitimacy.toFixed(1)}/10 across ${total} observations`;
    }
    return `establishing governance baseline — ${total} observation(s) recorded`;
  })();

  return {
    present: true,
    statement,
    governanceTrend,
    totalObservations: total,
    averageStability,
    averageFragmentation,
    averageLegitimacy,
    current: input.current ?? null,
    executiveRanking: executiveRanking(mem),
    stabilizerRanking: stabilizerRanking(mem),
    suppressionCycles: suppressionCycles(mem),
    recurringGovernanceStructures: recurringGovernanceStructures(mem),
    governanceCollapsePatterns: governanceCollapsePatterns(mem),
    authorityTransitions: authorityTransitions(mem),
    authorityConcentrationRanking: authorityConcentrationRanking(mem),
    stabilityTrace,
    recentlyLosingAuthority: recentlyLosingAuthority(mem),
  };
}
