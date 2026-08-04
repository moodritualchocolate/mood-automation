/**
 * CAMPAIGN LIFECYCLE MEMORY
 *
 * Persistent FIFO memory of campaign-evolution observations. Same
 * observation stream → same memory state → same evolution reading.
 *
 * STRICTLY observational. Append is the only mutating operation.
 *
 * Lives at data/memory/campaign-evolution-memory.json (matching the
 * spec's storage name).
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';
import type {
  CampaignEvolution, CampaignPhase, CampaignLifecycleHistoryContext,
} from './campaignLifecycleEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'campaign-evolution-memory.json';

export const CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT = 96;
export const HEALTH_TRACE_LIMIT = 64;
export const RECENT_PATTERN_WINDOW = 16;
export const PATTERN_STAT_LIMIT = 32;

// ─── observation ──────────────────────────────────────────────

export interface CampaignLifecycleObservation {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  patternFingerprint: string;
  currentPhase: CampaignPhase;
  campaignHealth: number;
  trustMomentum: number;
  fatiguePressure: number;
  decayRisk: number;
  creativeFreshness: number;
  strategicDurability: number;
  branchReadiness: number;
  audienceRotationNeed: number;
  currentAudience: string | null;
  primaryBranchCandidate: string | null;
}

export interface HealthTracePoint {
  at: number;
  campaignHealth: number;
  trustMomentum: number;
  fatiguePressure: number;
  decayRisk: number;
  creativeFreshness: number;
  branchReadiness: number;
  audienceRotationNeed: number;
  strategicDurability: number;
  phase: CampaignPhase;
}

// ─── state ─────────────────────────────────────────────────────

export interface CampaignLifecycleMemoryState {
  observations: CampaignLifecycleObservation[];
  /** Rolling pattern history — last RECENT_PATTERN_WINDOW fingerprints. */
  recentPatterns: string[];
  /** Per-phase counts. */
  phaseCounts: Record<CampaignPhase, number>;
  /** Per-pattern counts. */
  patternCounts: Record<string, number>;
  /** Per-pattern accumulated campaign health (avg = sum / count). */
  patternHealthStats: Record<string, { count: number; healthSum: number }>;
  /** Audience EWMA fatigue. */
  audienceFatigueEwma: Record<string, number>;
  /** Health trace (FIFO). */
  healthTrace: HealthTracePoint[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function emptyPhaseCounts(): Record<CampaignPhase, number> {
  return {
    forming: 0, testing: 0, compounding: 0, fatiguing: 0,
    decaying: 0, 'needs-branch': 0, 'needs-rest': 0,
    'strategically-stable': 0,
  };
}

export function createInitialCampaignLifecycleMemory(): CampaignLifecycleMemoryState {
  return {
    observations: [],
    recentPatterns: [],
    phaseCounts: emptyPhaseCounts(),
    patternCounts: {},
    patternHealthStats: {},
    audienceFatigueEwma: {},
    healthTrace: [],
    totalObservations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

function ewma(prev: number, current: number): number {
  return prev * 0.7 + current * 0.3;
}

function capPatternMap<T>(table: Record<string, T>, sortKey: (v: T) => number): Record<string, T> {
  if (Object.keys(table).length <= PATTERN_STAT_LIMIT) return table;
  const entries = Object.entries(table).sort((a, b) => sortKey(b[1]) - sortKey(a[1])).slice(0, PATTERN_STAT_LIMIT);
  return Object.fromEntries(entries);
}

export function applyCampaignLifecycleObservation(
  state: CampaignLifecycleMemoryState,
  obs: CampaignLifecycleObservation,
): CampaignLifecycleMemoryState {
  // Phase counts.
  const nextPhase = { ...state.phaseCounts };
  nextPhase[obs.currentPhase] = (nextPhase[obs.currentPhase] ?? 0) + 1;

  // Pattern counts + per-pattern health stats.
  let nextPatternCounts = { ...state.patternCounts };
  nextPatternCounts[obs.patternFingerprint] = (nextPatternCounts[obs.patternFingerprint] ?? 0) + 1;
  nextPatternCounts = capPatternMap(nextPatternCounts, (v) => v);

  let nextPatternHealth = { ...state.patternHealthStats };
  const cur = nextPatternHealth[obs.patternFingerprint] ?? { count: 0, healthSum: 0 };
  nextPatternHealth[obs.patternFingerprint] = {
    count: cur.count + 1,
    healthSum: cur.healthSum + obs.campaignHealth,
  };
  nextPatternHealth = capPatternMap(nextPatternHealth, (v) => v.count);

  // Audience fatigue EWMA — increase the current-audience entry.
  const nextAudFatigue = { ...state.audienceFatigueEwma };
  if (obs.currentAudience) {
    const prev = nextAudFatigue[obs.currentAudience] ?? 0;
    // Apparent fatigue this run = audienceRotationNeed (a composite that
    // already includes audienceNumbness). EWMA-smoothed.
    nextAudFatigue[obs.currentAudience] = ewma(prev, obs.audienceRotationNeed);
  }

  // Recent patterns FIFO window.
  const nextRecentPatterns = [...state.recentPatterns, obs.patternFingerprint]
    .slice(-RECENT_PATTERN_WINDOW);

  return {
    observations: [...state.observations, obs].slice(-CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT),
    recentPatterns: nextRecentPatterns,
    phaseCounts: nextPhase,
    patternCounts: nextPatternCounts,
    patternHealthStats: nextPatternHealth,
    audienceFatigueEwma: nextAudFatigue,
    healthTrace: [...state.healthTrace, {
      at: obs.at,
      campaignHealth: obs.campaignHealth,
      trustMomentum: obs.trustMomentum,
      fatiguePressure: obs.fatiguePressure,
      decayRisk: obs.decayRisk,
      creativeFreshness: obs.creativeFreshness,
      branchReadiness: obs.branchReadiness,
      audienceRotationNeed: obs.audienceRotationNeed,
      strategicDurability: obs.strategicDurability,
      phase: obs.currentPhase,
    }].slice(-HEALTH_TRACE_LIMIT),
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── history context for the engine ───────────────────────────

export function buildCampaignLifecycleHistoryContext(
  state: CampaignLifecycleMemoryState | null,
): CampaignLifecycleHistoryContext | null {
  if (!state || state.totalObservations === 0) return null;
  const tail = state.healthTrace.slice(-8);
  const recentTrustDurability = tail.length > 0
    ? tail.reduce((a, p) => a + p.trustMomentum, 0) / tail.length : 5;
  const recentFatiguePressure = tail.length > 0
    ? tail.reduce((a, p) => a + p.fatiguePressure, 0) / tail.length : 0;
  const recentDecayRisk = tail.length > 0
    ? tail.reduce((a, p) => a + p.decayRisk, 0) / tail.length : 0;
  return {
    observationCount: state.totalObservations,
    recentPatterns: state.recentPatterns,
    recentTrustDurability,
    recentFatiguePressure,
    recentDecayRisk,
    recentPhases: state.healthTrace.slice(-12).map((p) => p.phase),
    audienceFatigue: state.audienceFatigueEwma,
    patternCounts: state.patternCounts,
    patternHealthStats: state.patternHealthStats,
  };
}

// ─── observation builder ──────────────────────────────────────

export function buildCampaignLifecycleObservation(args: {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  evolution: CampaignEvolution;
}): CampaignLifecycleObservation {
  const e = args.evolution;
  return {
    at: args.at,
    bannerId: args.bannerId,
    formula: args.formula,
    campaignMode: args.campaignMode,
    patternFingerprint: e.campaignMemoryFingerprint.join('|') || 'none',
    currentPhase: e.currentPhase,
    campaignHealth: e.campaignHealth,
    trustMomentum: e.trustMomentum,
    fatiguePressure: e.fatiguePressure,
    decayRisk: e.decayRisk,
    creativeFreshness: e.creativeFreshness,
    strategicDurability: e.strategicDurability,
    branchReadiness: e.branchReadiness,
    audienceRotationNeed: e.audienceRotationNeed,
    currentAudience: e.audienceEvolution.currentAudience,
    primaryBranchCandidate: e.possibleBranches[0]?.branchName ?? null,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodCampaignLifecycle?: CampaignLifecycleMemoryState };

export interface CampaignLifecycleMemoryStore {
  read(): Promise<CampaignLifecycleMemoryState>;
  append(obs: CampaignLifecycleObservation): Promise<CampaignLifecycleMemoryState>;
  save(state: CampaignLifecycleMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCampaignLifecycleMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CampaignLifecycleMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CampaignLifecycleMemoryStore = {
    async read() {
      if (g.__moodCampaignLifecycle) return g.__moodCampaignLifecycle;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<CampaignLifecycleMemoryState>;
        g.__moodCampaignLifecycle = {
          ...createInitialCampaignLifecycleMemory(),
          ...parsed,
          phaseCounts:           { ...emptyPhaseCounts(), ...(parsed.phaseCounts ?? {}) },
          patternCounts:         { ...(parsed.patternCounts ?? {}) },
          patternHealthStats:    { ...(parsed.patternHealthStats ?? {}) },
          audienceFatigueEwma:   { ...(parsed.audienceFatigueEwma ?? {}) },
        };
      } catch {
        g.__moodCampaignLifecycle = createInitialCampaignLifecycleMemory();
      }
      return g.__moodCampaignLifecycle;
    },
    async append(obs) {
      const cur = await store.read();
      const next = applyCampaignLifecycleObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations = state.observations.slice(-CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT);
      state.healthTrace = state.healthTrace.slice(-HEALTH_TRACE_LIMIT);
      state.recentPatterns = state.recentPatterns.slice(-RECENT_PATTERN_WINDOW);
      state.updatedAt = nowMs();
      g.__moodCampaignLifecycle = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCampaignLifecycle = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordCampaignLifecycleObservation(
  obs: CampaignLifecycleObservation,
): Promise<void> {
  try {
    await createCampaignLifecycleMemoryStore().append(obs);
  } catch {
    // non-fatal — never blocks generation
  }
}
