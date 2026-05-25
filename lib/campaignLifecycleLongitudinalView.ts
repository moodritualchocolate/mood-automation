/**
 * CAMPAIGN LIFECYCLE LONGITUDINAL VIEW
 *
 * Read-only analyzer over campaign lifecycle memory + a current
 * evolution snapshot. Surfaces:
 *
 *   - campaign phase over time
 *   - trust momentum over time
 *   - fatigue pressure over time
 *   - creative decay trajectory
 *   - branch readiness trajectory
 *   - audience rotation pressure
 *   - durable campaign patterns
 *   - repeated fragile patterns
 *   - rest-needed signals
 *   - compounding signals
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  CampaignLifecycleMemoryState, CampaignLifecycleObservation, HealthTracePoint,
} from './campaignLifecycleMemory';
import type {
  CampaignPhase, CampaignEvolution,
} from './campaignLifecycleEngine';

// ─── shape ─────────────────────────────────────────────────────

export interface PhaseDistributionRow {
  phase: CampaignPhase;
  count: number;
  share: number;
}

export interface DurablePatternRow {
  pattern: string;
  count: number;
  averageHealth: number;
}

export interface FragilePatternRow {
  pattern: string;
  count: number;
  averageHealth: number;
}

export interface TrendPoint {
  at: number;
  value: number;
}

export interface AudienceFatigueRow {
  audience: string;
  ewmaFatigue: number;
}

export type LifecycleTrend =
  | 'no-history' | 'establishing'
  | 'compounding' | 'fatiguing' | 'stable'
  | 'branch-pressure-rising' | 'rest-needed-rising';

export interface CampaignLifecycleLongitudinalView {
  present: boolean;
  statement: string;
  trend: LifecycleTrend;

  totalObservations: number;
  averageCampaignHealth: number;
  averageTrustMomentum: number;
  averageFatiguePressure: number;
  averageDecayRisk: number;

  current: CampaignEvolution | null;

  phaseDistribution: PhaseDistributionRow[];
  campaignHealthTrace: TrendPoint[];
  trustMomentumTrace: TrendPoint[];
  fatiguePressureTrace: TrendPoint[];
  creativeFreshnessTrace: TrendPoint[];
  branchReadinessTrace: TrendPoint[];
  audienceRotationTrace: TrendPoint[];

  durablePatterns: DurablePatternRow[];
  fragilePatterns: FragilePatternRow[];
  recentPatterns: string[];
  audienceFatigueRanking: AudienceFatigueRow[];

  restNeededSignals: string[];
  compoundingSignals: string[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── trend classifier ────────────────────────────────────────

function classifyLifecycleTrend(
  state: CampaignLifecycleMemoryState,
): LifecycleTrend {
  if (state.totalObservations === 0) return 'no-history';
  if (state.healthTrace.length < 4) return 'establishing';

  // Count recent phases.
  const tail = state.healthTrace.slice(-8);
  const phaseCount = (p: CampaignPhase) => tail.filter((t) => t.phase === p).length;

  if (phaseCount('compounding') + phaseCount('strategically-stable') >= 4) return 'compounding';
  if (phaseCount('fatiguing') + phaseCount('decaying') >= 4) return 'fatiguing';
  if (phaseCount('needs-branch') >= 3) return 'branch-pressure-rising';
  if (phaseCount('needs-rest') >= 2) return 'rest-needed-rising';
  return 'stable';
}

// ─── derivations ──────────────────────────────────────────────

function phaseDistribution(state: CampaignLifecycleMemoryState): PhaseDistributionRow[] {
  const total = Object.values(state.phaseCounts).reduce((a, b) => a + b, 0);
  return (Object.keys(state.phaseCounts) as CampaignPhase[])
    .map((phase) => ({
      phase,
      count: state.phaseCounts[phase],
      share: total > 0 ? round2(state.phaseCounts[phase] / total) : 0,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

function durablePatterns(state: CampaignLifecycleMemoryState): DurablePatternRow[] {
  return Object.entries(state.patternHealthStats)
    .map(([pattern, { count, healthSum }]) => ({
      pattern, count,
      averageHealth: round1(healthSum / Math.max(1, count)),
    }))
    .filter((r) => r.count >= 2 && r.averageHealth >= 6)
    .sort((a, b) => b.averageHealth - a.averageHealth || b.count - a.count)
    .slice(0, 5);
}

function fragilePatterns(state: CampaignLifecycleMemoryState): FragilePatternRow[] {
  return Object.entries(state.patternHealthStats)
    .map(([pattern, { count, healthSum }]) => ({
      pattern, count,
      averageHealth: round1(healthSum / Math.max(1, count)),
    }))
    .filter((r) => r.count >= 2 && r.averageHealth <= 4)
    .sort((a, b) => a.averageHealth - b.averageHealth || b.count - a.count)
    .slice(0, 5);
}

function audienceFatigueRanking(state: CampaignLifecycleMemoryState): AudienceFatigueRow[] {
  return Object.entries(state.audienceFatigueEwma)
    .map(([audience, ewmaFatigue]) => ({ audience, ewmaFatigue: round1(ewmaFatigue) }))
    .filter((r) => r.ewmaFatigue >= 1)
    .sort((a, b) => b.ewmaFatigue - a.ewmaFatigue)
    .slice(0, 6);
}

function trace(
  points: HealthTracePoint[],
  field: 'campaignHealth' | 'trustMomentum' | 'fatiguePressure' |
         'creativeFreshness' | 'branchReadiness' | 'audienceRotationNeed' |
         'decayRisk',
): TrendPoint[] {
  return points.slice(-24).map((p) => ({ at: p.at, value: round1(p[field]) }));
}

function restNeededSignals(state: CampaignLifecycleMemoryState): string[] {
  const out: string[] = [];
  const tail = state.healthTrace.slice(-8);
  const restCount = tail.filter((p) => p.phase === 'needs-rest').length;
  if (restCount >= 2) out.push(`needs-rest phase recurring ×${restCount} in recent window`);
  const avgFatigue = avg(tail.map((p) => p.fatiguePressure));
  if (avgFatigue >= 7) out.push(`recent fatigue pressure averaging ${round1(avgFatigue)}/10`);
  const maxAud = Math.max(0, ...Object.values(state.audienceFatigueEwma));
  if (maxAud >= 7) out.push(`primary audience fatigue ewma ${round1(maxAud)}/10`);
  return out.slice(0, 4);
}

function compoundingSignals(state: CampaignLifecycleMemoryState): string[] {
  const out: string[] = [];
  const tail = state.healthTrace.slice(-8);
  const compCount = tail.filter((p) => p.phase === 'compounding' || p.phase === 'strategically-stable').length;
  if (compCount >= 3) out.push(`compounding / stable phase recurring ×${compCount} in recent window`);
  const avgTrust = avg(tail.map((p) => p.trustMomentum));
  if (avgTrust >= 7) out.push(`recent trust momentum averaging ${round1(avgTrust)}/10`);
  const avgHealth = avg(tail.map((p) => p.campaignHealth));
  if (avgHealth >= 7) out.push(`recent campaign health averaging ${round1(avgHealth)}/10`);
  return out.slice(0, 4);
}

// ─── main builder ──────────────────────────────────────────────

export interface CampaignLifecycleViewInput {
  memory: CampaignLifecycleMemoryState | null;
  current?: CampaignEvolution | null;
}

export function buildCampaignLifecycleLongitudinalView(
  input: CampaignLifecycleViewInput,
): CampaignLifecycleLongitudinalView {
  const mem = input.memory;

  if (!mem || mem.totalObservations === 0) {
    return {
      present: false,
      statement: 'no campaign lifecycle history yet — campaign evolution has not yet been observed',
      trend: 'no-history',
      totalObservations: 0,
      averageCampaignHealth: 5,
      averageTrustMomentum: 5,
      averageFatiguePressure: 0,
      averageDecayRisk: 0,
      current: input.current ?? null,
      phaseDistribution: [],
      campaignHealthTrace: [],
      trustMomentumTrace: [],
      fatiguePressureTrace: [],
      creativeFreshnessTrace: [],
      branchReadinessTrace: [],
      audienceRotationTrace: [],
      durablePatterns: [],
      fragilePatterns: [],
      recentPatterns: [],
      audienceFatigueRanking: [],
      restNeededSignals: [],
      compoundingSignals: [],
    };
  }

  const total = mem.totalObservations;
  const trend = classifyLifecycleTrend(mem);

  const observations = mem.observations;
  const averageCampaignHealth   = round1(avg(observations.map((o) => o.campaignHealth)));
  const averageTrustMomentum    = round1(avg(observations.map((o) => o.trustMomentum)));
  const averageFatiguePressure  = round1(avg(observations.map((o) => o.fatiguePressure)));
  const averageDecayRisk        = round1(avg(observations.map((o) => o.decayRisk)));

  const statement = (() => {
    switch (trend) {
      case 'compounding':
        return `campaign compounding — durable patterns recurring across ${total} observations`;
      case 'fatiguing':
        return `campaign fatiguing — saturation rising across ${total} observations`;
      case 'branch-pressure-rising':
        return `branch pressure rising — pattern recurrence forcing strategic variation`;
      case 'rest-needed-rising':
        return `rest signals recurring — audience saturated, recovery indicated`;
      case 'stable':
        return `campaign lifecycle stable — average health ${averageCampaignHealth.toFixed(1)}/10 across ${total} observations`;
      default:
        return `establishing campaign lifecycle baseline — ${total} observation(s) recorded`;
    }
  })();

  return {
    present: true,
    statement,
    trend,
    totalObservations: total,
    averageCampaignHealth,
    averageTrustMomentum,
    averageFatiguePressure,
    averageDecayRisk,
    current: input.current ?? null,
    phaseDistribution: phaseDistribution(mem),
    campaignHealthTrace:   trace(mem.healthTrace, 'campaignHealth'),
    trustMomentumTrace:    trace(mem.healthTrace, 'trustMomentum'),
    fatiguePressureTrace:  trace(mem.healthTrace, 'fatiguePressure'),
    creativeFreshnessTrace:trace(mem.healthTrace, 'creativeFreshness'),
    branchReadinessTrace:  trace(mem.healthTrace, 'branchReadiness'),
    audienceRotationTrace: trace(mem.healthTrace, 'audienceRotationNeed'),
    durablePatterns: durablePatterns(mem),
    fragilePatterns: fragilePatterns(mem),
    recentPatterns: mem.recentPatterns.slice(-8),
    audienceFatigueRanking: audienceFatigueRanking(mem),
    restNeededSignals: restNeededSignals(mem),
    compoundingSignals: compoundingSignals(mem),
  };
}
