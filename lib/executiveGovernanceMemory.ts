/**
 * EXECUTIVE GOVERNANCE MEMORY
 *
 * Persistent FIFO memory of executive-governance observations. Same
 * observation stream → same memory state → same governance reading.
 *
 * STRICTLY observational. Append is the only mutating operation; the
 * resulting state is fully determined by the observation stream.
 *
 * Lives at data/memory/executive-governance-memory.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';
import {
  ALL_COGNITIVE_SYSTEMS, type CognitiveSystem,
} from './cognitiveWeightEvolution';
import type {
  ExecutiveGovernance, GovernanceRole, AuthorityTransitionEntry,
  GovernanceHistoryContext,
} from './executiveGovernanceEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'executive-governance-memory.json';

export const GOVERNANCE_OBSERVATION_LIMIT = 96;
export const STABILITY_TRACE_LIMIT = 64;
export const TRANSITION_LIMIT = 32;
export const PATTERN_LIMIT = 32;
export const RECENT_WINDOW = 12;

// ─── observation ──────────────────────────────────────────────

export interface GovernanceObservation {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  primaryExecutive: CognitiveSystem | null;
  /** Per-system authority (cognitive weight). */
  authorities: Record<CognitiveSystem, number>;
  /** Roles assigned this run (system → role). */
  roleByStystem: Partial<Record<CognitiveSystem, GovernanceRole>>;
  /** Stabilizers this run. */
  stabilizers: CognitiveSystem[];
  /** Suppressed systems this run. */
  suppressed: CognitiveSystem[];
  /** Whether the run avoided governance collapse (low frag, low tension). */
  avoidedCollapse: boolean;
  governanceStability: number;
  executiveLegitimacy: number;
  authorityFragmentation: number;
  adaptiveBalance: number;
}

export interface StabilityPoint {
  at: number;
  governanceStability: number;
  authorityFragmentation: number;
  executiveLegitimacy: number;
  adaptiveBalance: number;
}

// ─── state ─────────────────────────────────────────────────────

export interface ExecutiveGovernanceMemoryState {
  observations: GovernanceObservation[];
  /** EWMA per system's authority. */
  authorityEwma: Record<CognitiveSystem, number>;
  /** Per-system squared-deviation accumulator → variance proxy. */
  authoritySumSquaredDev: Record<CognitiveSystem, number>;
  /** How many times each system was primary executive. */
  executiveCounts: Record<CognitiveSystem, number>;
  /** How many times each system was a stabilizer. */
  stabilizerCounts: Record<CognitiveSystem, number>;
  /** Per-system runs where it was SUPPRESSED but the run avoided
   *  collapse — signals shadow executive predictive accuracy. */
  shadowEmergenceCounts: Record<CognitiveSystem, number>;
  /** Current run count of consecutive runs as primary executive. */
  consecutiveExecutiveRuns: Record<CognitiveSystem, number>;
  /** Recent transitions tail. */
  recentTransitions: AuthorityTransitionEntry[];
  /** Stabilization / destabilization pattern counts. */
  stabilizationPatternCounts: Record<string, number>;
  destabilizationPatternCounts: Record<string, number>;
  /** Recurring governance fingerprint counts (executive + stabilizers). */
  governanceFingerprintCounts: Record<string, number>;
  stabilityTrace: StabilityPoint[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function emptyPerSystem<T>(value: T): Record<CognitiveSystem, T> {
  const out = {} as Record<CognitiveSystem, T>;
  for (const s of ALL_COGNITIVE_SYSTEMS) out[s] = value;
  return out;
}

export function createInitialExecutiveGovernanceMemory(): ExecutiveGovernanceMemoryState {
  return {
    observations: [],
    authorityEwma: emptyPerSystem(5),
    authoritySumSquaredDev: emptyPerSystem(0),
    executiveCounts: emptyPerSystem(0),
    stabilizerCounts: emptyPerSystem(0),
    shadowEmergenceCounts: emptyPerSystem(0),
    consecutiveExecutiveRuns: emptyPerSystem(0),
    recentTransitions: [],
    stabilizationPatternCounts: {},
    destabilizationPatternCounts: {},
    governanceFingerprintCounts: {},
    stabilityTrace: [],
    totalObservations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

function ewma(prev: number, current: number): number {
  return prev * 0.7 + current * 0.3;
}

function capPatternCounts(table: Record<string, number>): Record<string, number> {
  if (Object.keys(table).length <= PATTERN_LIMIT) return table;
  const entries = Object.entries(table).sort((a, b) => b[1] - a[1]).slice(0, PATTERN_LIMIT);
  return Object.fromEntries(entries);
}

function fingerprint(obs: GovernanceObservation): string {
  const exec = obs.primaryExecutive ?? 'none';
  const stab = obs.stabilizers.slice(0, 2).join('+') || 'none';
  return `${exec}|${stab}@${obs.campaignMode ?? 'auto'}`;
}

export function applyGovernanceObservation(
  state: ExecutiveGovernanceMemoryState,
  obs: GovernanceObservation,
): ExecutiveGovernanceMemoryState {
  // EWMA + variance accumulator.
  const nextEwma = { ...state.authorityEwma };
  const nextDev = { ...state.authoritySumSquaredDev };
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    const prev = state.authorityEwma[s];
    const current = obs.authorities[s] ?? 5;
    nextEwma[s] = ewma(prev, current);
    nextDev[s] = state.authoritySumSquaredDev[s] * 0.85 + Math.pow(current - prev, 2);
  }

  // Executive + consecutive-run bookkeeping.
  const nextExecutive = { ...state.executiveCounts };
  const nextConsecutive = { ...state.consecutiveExecutiveRuns };
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    if (obs.primaryExecutive === s) {
      nextExecutive[s] = (nextExecutive[s] ?? 0) + 1;
      nextConsecutive[s] = (nextConsecutive[s] ?? 0) + 1;
    } else {
      nextConsecutive[s] = 0;
    }
  }

  // Stabilizer counts.
  const nextStabilizer = { ...state.stabilizerCounts };
  for (const s of obs.stabilizers) {
    nextStabilizer[s] = (nextStabilizer[s] ?? 0) + 1;
  }

  // Shadow emergence: suppressed system + run avoided collapse.
  const nextShadow = { ...state.shadowEmergenceCounts };
  if (obs.avoidedCollapse) {
    for (const s of obs.suppressed) {
      nextShadow[s] = (nextShadow[s] ?? 0) + 1;
    }
  }

  // Transitions (compared to previous observation).
  const nextTransitions = [...state.recentTransitions];
  const prevObs = state.observations[state.observations.length - 1];
  if (prevObs && prevObs.primaryExecutive && obs.primaryExecutive &&
      prevObs.primaryExecutive !== obs.primaryExecutive) {
    nextTransitions.push({
      fromSystem: prevObs.primaryExecutive,
      toSystem: obs.primaryExecutive,
      recencyAt: obs.at,
    });
  }
  if (nextTransitions.length > TRANSITION_LIMIT) {
    nextTransitions.splice(0, nextTransitions.length - TRANSITION_LIMIT);
  }

  // Stabilization / destabilization patterns.
  // Stabilization: low fragmentation this run → record fingerprint.
  // Destabilization: high fragmentation this run → record fingerprint.
  const fp = fingerprint(obs);
  let nextStab = { ...state.stabilizationPatternCounts };
  let nextDestab = { ...state.destabilizationPatternCounts };
  if (obs.authorityFragmentation <= 3 && obs.governanceStability >= 7) {
    nextStab[fp] = (nextStab[fp] ?? 0) + 1;
  }
  if (obs.authorityFragmentation >= 6 || obs.governanceStability <= 4) {
    nextDestab[fp] = (nextDestab[fp] ?? 0) + 1;
  }
  nextStab = capPatternCounts(nextStab);
  nextDestab = capPatternCounts(nextDestab);

  // Governance fingerprint (recurrence regardless of polarity).
  let nextFingerprint = { ...state.governanceFingerprintCounts, [fp]: (state.governanceFingerprintCounts[fp] ?? 0) + 1 };
  nextFingerprint = capPatternCounts(nextFingerprint);

  return {
    observations: [...state.observations, obs].slice(-GOVERNANCE_OBSERVATION_LIMIT),
    authorityEwma: nextEwma,
    authoritySumSquaredDev: nextDev,
    executiveCounts: nextExecutive,
    stabilizerCounts: nextStabilizer,
    shadowEmergenceCounts: nextShadow,
    consecutiveExecutiveRuns: nextConsecutive,
    recentTransitions: nextTransitions,
    stabilizationPatternCounts: nextStab,
    destabilizationPatternCounts: nextDestab,
    governanceFingerprintCounts: nextFingerprint,
    stabilityTrace: [...state.stabilityTrace, {
      at: obs.at,
      governanceStability: obs.governanceStability,
      authorityFragmentation: obs.authorityFragmentation,
      executiveLegitimacy: obs.executiveLegitimacy,
      adaptiveBalance: obs.adaptiveBalance,
    }].slice(-STABILITY_TRACE_LIMIT),
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── history context for the engine ───────────────────────────

export function buildGovernanceHistoryContext(
  state: ExecutiveGovernanceMemoryState | null,
): GovernanceHistoryContext | null {
  if (!state || state.totalObservations === 0) return null;
  const variance = {} as Partial<Record<CognitiveSystem, number>>;
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    variance[s] = state.authoritySumSquaredDev[s] / Math.max(1, Math.min(RECENT_WINDOW, state.totalObservations));
  }
  const recentFrag = (() => {
    const tail = state.stabilityTrace.slice(-8);
    if (tail.length === 0) return 0;
    return tail.reduce((a, p) => a + p.authorityFragmentation, 0) / tail.length;
  })();
  const recentStab = (() => {
    const tail = state.stabilityTrace.slice(-8);
    if (tail.length === 0) return 5;
    return tail.reduce((a, p) => a + p.governanceStability, 0) / tail.length;
  })();
  return {
    authorityEwma: state.authorityEwma,
    variance,
    executiveCounts: state.executiveCounts,
    stabilizerCounts: state.stabilizerCounts,
    shadowEmergenceCounts: state.shadowEmergenceCounts,
    consecutiveExecutiveRuns: state.consecutiveExecutiveRuns,
    recentTransitions: state.recentTransitions.slice(-12),
    stabilizationPatternCounts: state.stabilizationPatternCounts,
    destabilizationPatternCounts: state.destabilizationPatternCounts,
    governanceFingerprintCounts: state.governanceFingerprintCounts,
    observationCount: state.totalObservations,
    recentFragmentation: recentFrag,
    recentStability: recentStab,
  };
}

// ─── observation builder ──────────────────────────────────────

export function buildGovernanceObservation(args: {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  governance: ExecutiveGovernance;
  authorities: Record<CognitiveSystem, number>;
  suppressed: CognitiveSystem[];
}): GovernanceObservation {
  const roleByStystem: Partial<Record<CognitiveSystem, GovernanceRole>> = {};
  const stabilizers: CognitiveSystem[] = [];
  for (const r of args.governance.governanceRoles) {
    roleByStystem[r.system] = r.role;
    if (r.role === 'stabilizer' || r.role === 'trust-guardian' || r.role === 'identity-preserver') {
      stabilizers.push(r.system);
    }
  }
  const avoidedCollapse =
    args.governance.governanceStability >= 5 &&
    args.governance.authorityFragmentation <= 6;
  return {
    at: args.at,
    bannerId: args.bannerId,
    formula: args.formula,
    campaignMode: args.campaignMode,
    primaryExecutive: args.governance.dominantGovernanceStructure.primaryExecutive,
    authorities: args.authorities,
    roleByStystem,
    stabilizers,
    suppressed: args.suppressed,
    avoidedCollapse,
    governanceStability: args.governance.governanceStability,
    executiveLegitimacy: args.governance.executiveLegitimacy,
    authorityFragmentation: args.governance.authorityFragmentation,
    adaptiveBalance: args.governance.adaptiveBalance,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodExecutiveGovernance?: ExecutiveGovernanceMemoryState };

export interface ExecutiveGovernanceMemoryStore {
  read(): Promise<ExecutiveGovernanceMemoryState>;
  append(obs: GovernanceObservation): Promise<ExecutiveGovernanceMemoryState>;
  save(state: ExecutiveGovernanceMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createExecutiveGovernanceMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): ExecutiveGovernanceMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: ExecutiveGovernanceMemoryStore = {
    async read() {
      if (g.__moodExecutiveGovernance) return g.__moodExecutiveGovernance;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<ExecutiveGovernanceMemoryState>;
        g.__moodExecutiveGovernance = {
          ...createInitialExecutiveGovernanceMemory(),
          ...parsed,
          authorityEwma:               { ...emptyPerSystem(5), ...(parsed.authorityEwma ?? {}) },
          authoritySumSquaredDev:      { ...emptyPerSystem(0), ...(parsed.authoritySumSquaredDev ?? {}) },
          executiveCounts:             { ...emptyPerSystem(0), ...(parsed.executiveCounts ?? {}) },
          stabilizerCounts:            { ...emptyPerSystem(0), ...(parsed.stabilizerCounts ?? {}) },
          shadowEmergenceCounts:       { ...emptyPerSystem(0), ...(parsed.shadowEmergenceCounts ?? {}) },
          consecutiveExecutiveRuns:    { ...emptyPerSystem(0), ...(parsed.consecutiveExecutiveRuns ?? {}) },
        };
      } catch {
        g.__moodExecutiveGovernance = createInitialExecutiveGovernanceMemory();
      }
      return g.__moodExecutiveGovernance;
    },
    async append(obs) {
      const cur = await store.read();
      const next = applyGovernanceObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations   = state.observations.slice(-GOVERNANCE_OBSERVATION_LIMIT);
      state.stabilityTrace = state.stabilityTrace.slice(-STABILITY_TRACE_LIMIT);
      state.recentTransitions = state.recentTransitions.slice(-TRANSITION_LIMIT);
      state.updatedAt = nowMs();
      g.__moodExecutiveGovernance = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodExecutiveGovernance = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordGovernanceObservation(
  obs: GovernanceObservation,
): Promise<void> {
  try {
    await createExecutiveGovernanceMemoryStore().append(obs);
  } catch {
    // non-fatal — never blocks generation
  }
}
