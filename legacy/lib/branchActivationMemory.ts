/**
 * BRANCH ACTIVATION MEMORY
 *
 * Persistent FIFO memory of human-supervised branch activations.
 * Each activation records:
 *   - which branch the operator chose
 *   - the campaign-evolution snapshot at activation time
 *   - the predicted impact (from the counterfactual that surfaced it)
 *   - measured deltas in subsequent runs (read-only observation)
 *
 * STRICTLY observational. Append-only on the activation event.
 * Subsequent runs update only outcome-delta fields on UNRESOLVED
 * activations — never the original activation parameters.
 *
 * Lives at data/memory/branch-activation-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'branch-activation-memory.json';

export const BRANCH_ACTIVATION_LIMIT = 96;
/** Resolve an activation after this many post-activation observations. */
export const RESOLUTION_WINDOW = 4;
/** Cap on distinct operator IDs / per-branch entries / projection types. */
export const PERSPECTIVE_LIMIT = 32;

// ─── activation record ────────────────────────────────────────

export type BranchActivationResult = 'recovered' | 'failed' | 'mixed' | 'pending';

export interface BranchActivationRecord {
  id: string;
  activatedAt: number;
  /** Operator chose this branch from the surfaced possibleBranches. */
  branchName: string;
  /** Source counterfactual projection category — used to track
   *  simulation-vs-reality accuracy per projection type. */
  counterfactualType: string;
  /** Campaign-evolution context captured at activation time. */
  fromPhase: string;
  fromExecutive: string | null;
  fromIdentityVector: string | null;
  fromArchetype: string | null;
  /** Predicted impact (from the counterfactual projection that surfaced it). */
  predictedTrustImpact: number;
  predictedFatigueImpact: number;
  predictedDurabilityImpact: number;
  predictedRisk: number;
  predictedDurabilityPotential: number;
  /** Baseline scalars captured at activation time. */
  baselineTrustMomentum: number;
  baselineFatiguePressure: number;
  baselineDurability: number;
  baselineCampaignHealth: number;
  /** Operator-supplied identifier (default 'anonymous'). */
  operatorId: string;
  reason: string | null;
  /** Updated by subsequent runs (read-only observation of reality). */
  observationsAfter: number;
  measuredTrustDelta: number;
  measuredFatigueDelta: number;
  measuredDurabilityDelta: number;
  measuredHealthDelta: number;
  measuredDecayDelta: number;
  resolved: boolean;
  resolutionResult: BranchActivationResult;
}

// ─── aggregates ───────────────────────────────────────────────

export interface PerBranchOutcomeAggregate {
  count: number;
  successfulRecoveries: number;
  failures: number;
  trustDeltaSum: number;
  fatigueDeltaSum: number;
  durabilityDeltaSum: number;
  healthDeltaSum: number;
  decayDeltaSum: number;
}

export interface PerOperatorAggregate {
  count: number;
  branchCounts: Record<string, number>;
  predictedRiskSum: number;
  trustPositivePicks: number;
  noveltyLeaningPicks: number;
}

export interface PerProjectionAggregate {
  sampleSize: number;
  /** Predictions where the measured impact direction matched the
   *  predicted direction on the dominant axis (trust or durability). */
  correctPredictions: number;
}

// ─── state ─────────────────────────────────────────────────────

export interface BranchActivationMemoryState {
  activations: BranchActivationRecord[];
  perBranch: Record<string, PerBranchOutcomeAggregate>;
  perOperator: Record<string, PerOperatorAggregate>;
  perProjectionType: Record<string, PerProjectionAggregate>;
  totalActivations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialBranchActivationMemory(): BranchActivationMemoryState {
  return {
    activations: [],
    perBranch: {},
    perOperator: {},
    perProjectionType: {},
    totalActivations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── deterministic ID ─────────────────────────────────────────

export function buildActivationId(
  at: number, branchName: string, operatorId: string, totalSoFar: number,
): string {
  return `ba-${at}-${branchName}-${operatorId}-${totalSoFar}`;
}

// ─── pure transforms ──────────────────────────────────────────

function capRecord<T>(table: Record<string, T>, sortKey: (v: T) => number): Record<string, T> {
  if (Object.keys(table).length <= PERSPECTIVE_LIMIT) return table;
  const entries = Object.entries(table).sort((a, b) => sortKey(b[1]) - sortKey(a[1])).slice(0, PERSPECTIVE_LIMIT);
  return Object.fromEntries(entries);
}

/** Append a new activation record. Returns the new state. */
export function appendActivation(
  state: BranchActivationMemoryState, record: BranchActivationRecord,
): BranchActivationMemoryState {
  // Per-branch + per-operator initial bookkeeping (counts only —
  // outcome deltas accumulate later via resolveActivation).
  const nextPerBranch = { ...state.perBranch };
  const curBranch = nextPerBranch[record.branchName] ?? {
    count: 0, successfulRecoveries: 0, failures: 0,
    trustDeltaSum: 0, fatigueDeltaSum: 0,
    durabilityDeltaSum: 0, healthDeltaSum: 0, decayDeltaSum: 0,
  };
  nextPerBranch[record.branchName] = { ...curBranch, count: curBranch.count + 1 };

  const nextPerOperator = { ...state.perOperator };
  const curOp = nextPerOperator[record.operatorId] ?? {
    count: 0, branchCounts: {}, predictedRiskSum: 0,
    trustPositivePicks: 0, noveltyLeaningPicks: 0,
  };
  const isTrustPositive = record.predictedTrustImpact > 0;
  // Novelty-leaning archetypes — fixed set keyed by branch name.
  const noveltyBranches = new Set([
    'novelty-surge', 'viral-instability', 'high-curiosity-hook-heavy',
  ]);
  const isNoveltyLeaning = noveltyBranches.has(record.branchName);
  nextPerOperator[record.operatorId] = {
    count: curOp.count + 1,
    branchCounts: {
      ...curOp.branchCounts,
      [record.branchName]: (curOp.branchCounts[record.branchName] ?? 0) + 1,
    },
    predictedRiskSum: curOp.predictedRiskSum + record.predictedRisk,
    trustPositivePicks: curOp.trustPositivePicks + (isTrustPositive ? 1 : 0),
    noveltyLeaningPicks: curOp.noveltyLeaningPicks + (isNoveltyLeaning ? 1 : 0),
  };

  // Per-projection-type bookkeeping (sample-size only at activation;
  // correctPredictions is set on resolve).
  const nextPerProjectionType = { ...state.perProjectionType };
  const curProj = nextPerProjectionType[record.counterfactualType] ?? {
    sampleSize: 0, correctPredictions: 0,
  };
  nextPerProjectionType[record.counterfactualType] = {
    ...curProj, sampleSize: curProj.sampleSize + 1,
  };

  return {
    activations: [...state.activations, record].slice(-BRANCH_ACTIVATION_LIMIT),
    perBranch: capRecord(nextPerBranch, (v) => v.count),
    perOperator: capRecord(nextPerOperator, (v) => v.count),
    perProjectionType: capRecord(nextPerProjectionType, (v) => v.sampleSize),
    totalActivations: state.totalActivations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.activatedAt,
    updatedAt: record.activatedAt,
  };
}

// ─── post-activation observation ──────────────────────────────

export interface PostActivationSample {
  at: number;
  campaignHealth: number;
  trustMomentum: number;
  fatiguePressure: number;
  strategicDurability: number;
  decayRisk: number;
}

/** Update unresolved activations with a new post-activation sample.
 *  Records the cumulative deltas relative to each activation's
 *  baseline. Pure — returns the new state. */
export function applyPostActivationSample(
  state: BranchActivationMemoryState, sample: PostActivationSample,
): BranchActivationMemoryState {
  const nextActivations: BranchActivationRecord[] = [];
  const nextPerBranch = { ...state.perBranch };
  const nextPerProjectionType = { ...state.perProjectionType };

  for (const a of state.activations) {
    if (a.resolved || sample.at <= a.activatedAt) {
      nextActivations.push(a);
      continue;
    }
    const trustDelta     = sample.trustMomentum     - a.baselineTrustMomentum;
    const fatigueDelta   = sample.fatiguePressure   - a.baselineFatiguePressure;
    const durabilityDelta= sample.strategicDurability - a.baselineDurability;
    const healthDelta    = sample.campaignHealth    - a.baselineCampaignHealth;
    // Decay delta — derived from fatigue + decayRisk shift.
    const decayDelta     = (sample.fatiguePressure - a.baselineFatiguePressure) * 0.5 +
                           (sample.decayRisk -
                            (a.baselineFatiguePressure * 0.3)) * 0.5;

    const observationsAfter = a.observationsAfter + 1;
    // Accumulate delta SUMS so the final stored delta is the
    // observations-after average × observationsAfter (we store the
    // raw cumulative sum and report averages via the analyzer).
    const measuredTrustDelta = a.measuredTrustDelta + trustDelta;
    const measuredFatigueDelta = a.measuredFatigueDelta + fatigueDelta;
    const measuredDurabilityDelta = a.measuredDurabilityDelta + durabilityDelta;
    const measuredHealthDelta = a.measuredHealthDelta + healthDelta;
    const measuredDecayDelta = a.measuredDecayDelta + decayDelta;

    let resolved: boolean = a.resolved;
    let resolutionResult: BranchActivationResult = a.resolutionResult;

    if (observationsAfter >= RESOLUTION_WINDOW) {
      resolved = true;
      // Compute average per-observation deltas.
      const avgTrust = measuredTrustDelta / observationsAfter;
      const avgFatigue = measuredFatigueDelta / observationsAfter;
      const avgDurability = measuredDurabilityDelta / observationsAfter;
      // Recovery means: trust went up, fatigue went down, or durability went up.
      const trustWin = avgTrust >= 0.5;
      const fatigueWin = avgFatigue <= -0.5;
      const durabilityWin = avgDurability >= 0.5;
      const wins = [trustWin, fatigueWin, durabilityWin].filter(Boolean).length;
      const losses = [avgTrust <= -0.5, avgFatigue >= 0.5, avgDurability <= -0.5]
        .filter(Boolean).length;
      if (wins >= 2) resolutionResult = 'recovered';
      else if (losses >= 2) resolutionResult = 'failed';
      else resolutionResult = 'mixed';

      // Update per-branch aggregate on resolution.
      const cur = nextPerBranch[a.branchName] ?? {
        count: 0, successfulRecoveries: 0, failures: 0,
        trustDeltaSum: 0, fatigueDeltaSum: 0,
        durabilityDeltaSum: 0, healthDeltaSum: 0, decayDeltaSum: 0,
      };
      nextPerBranch[a.branchName] = {
        ...cur,
        successfulRecoveries: cur.successfulRecoveries + (resolutionResult === 'recovered' ? 1 : 0),
        failures: cur.failures + (resolutionResult === 'failed' ? 1 : 0),
        trustDeltaSum: cur.trustDeltaSum + avgTrust,
        fatigueDeltaSum: cur.fatigueDeltaSum + avgFatigue,
        durabilityDeltaSum: cur.durabilityDeltaSum + avgDurability,
        healthDeltaSum: cur.healthDeltaSum + (measuredHealthDelta / observationsAfter),
        decayDeltaSum: cur.decayDeltaSum + (measuredDecayDelta / observationsAfter),
      };

      // Update per-projection-type accuracy.
      // Prediction is "correct" when:
      //   (predictedTrustImpact >= 0.5 && avgTrust >= 0.5) OR
      //   (predictedDurabilityImpact >= 0.5 && avgDurability >= 0.5) OR
      //   (predictedFatigueImpact <= -0.5 && avgFatigue <= -0.5)
      const correct =
        (a.predictedTrustImpact >= 0.5 && avgTrust >= 0.5) ||
        (a.predictedDurabilityImpact >= 0.5 && avgDurability >= 0.5) ||
        (a.predictedFatigueImpact <= -0.5 && avgFatigue <= -0.5);
      const curProj = nextPerProjectionType[a.counterfactualType] ?? {
        sampleSize: 0, correctPredictions: 0,
      };
      nextPerProjectionType[a.counterfactualType] = {
        ...curProj,
        correctPredictions: curProj.correctPredictions + (correct ? 1 : 0),
      };
    }

    nextActivations.push({
      ...a,
      observationsAfter,
      measuredTrustDelta,
      measuredFatigueDelta,
      measuredDurabilityDelta,
      measuredHealthDelta,
      measuredDecayDelta,
      resolved,
      resolutionResult,
    });
  }

  return {
    ...state,
    activations: nextActivations.slice(-BRANCH_ACTIVATION_LIMIT),
    perBranch: nextPerBranch,
    perProjectionType: nextPerProjectionType,
    updatedAt: sample.at,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodBranchActivation?: BranchActivationMemoryState };

export interface BranchActivationMemoryStore {
  read(): Promise<BranchActivationMemoryState>;
  append(record: BranchActivationRecord): Promise<BranchActivationMemoryState>;
  observe(sample: PostActivationSample): Promise<BranchActivationMemoryState>;
  save(state: BranchActivationMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createBranchActivationMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): BranchActivationMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: BranchActivationMemoryStore = {
    async read() {
      if (g.__moodBranchActivation) return g.__moodBranchActivation;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<BranchActivationMemoryState>;
        g.__moodBranchActivation = {
          ...createInitialBranchActivationMemory(),
          ...parsed,
          perBranch:         { ...(parsed.perBranch ?? {}) },
          perOperator:       { ...(parsed.perOperator ?? {}) },
          perProjectionType: { ...(parsed.perProjectionType ?? {}) },
        };
      } catch {
        g.__moodBranchActivation = createInitialBranchActivationMemory();
      }
      return g.__moodBranchActivation;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendActivation(cur, record);
      await store.save(next);
      return next;
    },
    async observe(sample) {
      const cur = await store.read();
      const next = applyPostActivationSample(cur, sample);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.activations = state.activations.slice(-BRANCH_ACTIVATION_LIMIT);
      state.updatedAt = nowMs();
      g.__moodBranchActivation = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodBranchActivation = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer for post-activation samples ─────────

export async function recordPostActivationSample(
  sample: PostActivationSample,
): Promise<void> {
  try {
    await createBranchActivationMemoryStore().observe(sample);
  } catch {
    // non-fatal — never blocks generation
  }
}
