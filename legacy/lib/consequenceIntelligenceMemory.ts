/**
 * CONSEQUENCE INTELLIGENCE MEMORY
 *
 * Persistent FIFO of historical CONSEQUENCE EPISODES — pairs of
 * (condition_at_T-N, outcome_at_T) over the system's longitudinal
 * memory. The system learns to look back at what historically
 * happened AFTER similar conditions.
 *
 * Distinct from lib/consequenceMemory.ts (which stores strategic
 * simulations + verb cost maps). This file lives at
 * data/memory/consequence-intelligence-memory.json and tracks
 * causal correlation chains for the adaptive governance layer.
 *
 * STRICT CONTRACT:
 *   - append-only, FIFO-capped
 *   - never modifies any other memory file
 *   - never blocks generation (the recorder wraps in try/catch)
 *   - no ML, no embeddings, no external APIs
 *
 * Outcome labels are derived from the SIGNED delta between
 * condition and outcome snapshots — pure local computation. No
 * prediction; only retrospective labeling.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'consequence-intelligence-memory.json';

export const CONSEQUENCE_EPISODE_LIMIT = 128;
/** Window between condition and outcome, in drift observations. */
export const CONSEQUENCE_WINDOW = 4;

// ─── types ────────────────────────────────────────────────────

export type ConsequenceOutcome =
  | 'trust-recovered'
  | 'trust-collapsed'
  | 'fatigue-improved'
  | 'fatigue-worsened'
  | 'originality-restored'
  | 'originality-exhausted'
  | 'persuasion-collapsed'
  | 'persuasion-stabilized'
  | 'identity-stabilized'
  | 'identity-eroded'
  | 'convergence-accelerated'
  | 'convergence-reversed'
  | 'emotional-realism-improved'
  | 'emotional-flattening-worsened'
  | 'campaign-coherence-recovered'
  | 'campaign-coherence-degraded'
  | 'aggression-escalation-failed'
  | 'no-significant-change';

export interface ConditionSnapshot {
  at: number;
  formula: string | null;
  campaignMode: string | null;
  dominantRisk: string | null;
  adaptationPriority: string | null;
  cadenceState: string | null;
  mutationPressure: number;
  trustDebt: number;
  fatigue: number;
  originalityPressure: number;
  persuasionIntensity: number;
  visualConvergence: number;
  emotionalFlattening: number;
  mutationCount: number;
  stabilizationWindows: number;
}

export interface OutcomeDeltas {
  trustDebt: number;
  fatigue: number;
  originalityPressure: number;
  persuasionVariance: number;
  visualConvergence: number;
  emotionalFlattening: number;
  overallCreativeHealth: number;
}

export interface ConsequenceEpisode {
  conditionAt: number;
  outcomeAt: number;
  windowSize: number;
  condition: ConditionSnapshot;
  downstreamOutcome: ConsequenceOutcome;
  outcomeMagnitude: number;
  deltas: OutcomeDeltas;
  secondaryOutcomes: ConsequenceOutcome[];
}

// ─── state ────────────────────────────────────────────────────

export interface ConsequenceMemoryState {
  episodes: ConsequenceEpisode[];
  totalEpisodes: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialConsequenceMemory(): ConsequenceMemoryState {
  return { episodes: [], totalEpisodes: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── outcome labeling (pure) ──────────────────────────────────

const OUTCOME_DELTA_THRESHOLD = 2.0;

const AXIS_LABELS: Array<{
  axis: keyof OutcomeDeltas;
  rising: ConsequenceOutcome;
  falling: ConsequenceOutcome;
}> = [
  { axis: 'trustDebt',              rising: 'trust-collapsed',                  falling: 'trust-recovered' },
  { axis: 'fatigue',                rising: 'fatigue-worsened',                 falling: 'fatigue-improved' },
  { axis: 'originalityPressure',    rising: 'originality-exhausted',            falling: 'originality-restored' },
  { axis: 'persuasionVariance',     rising: 'persuasion-stabilized',            falling: 'persuasion-collapsed' },
  { axis: 'visualConvergence',      rising: 'convergence-accelerated',          falling: 'convergence-reversed' },
  { axis: 'emotionalFlattening',    rising: 'emotional-flattening-worsened',    falling: 'emotional-realism-improved' },
  { axis: 'overallCreativeHealth',  rising: 'campaign-coherence-recovered',     falling: 'campaign-coherence-degraded' },
];

export function labelOutcome(deltas: OutcomeDeltas): {
  primary: ConsequenceOutcome;
  magnitude: number;
  secondaries: ConsequenceOutcome[];
} {
  const candidates: Array<{ outcome: ConsequenceOutcome; magnitude: number }> = [];
  for (const { axis, rising, falling } of AXIS_LABELS) {
    const d = deltas[axis];
    if (d >= OUTCOME_DELTA_THRESHOLD)        candidates.push({ outcome: rising,  magnitude: Math.abs(d) });
    else if (-d >= OUTCOME_DELTA_THRESHOLD)  candidates.push({ outcome: falling, magnitude: Math.abs(d) });
  }
  // Identity composite — persuasionVariance + creative health move together.
  if (deltas.persuasionVariance >= 1 && deltas.overallCreativeHealth >= 1) {
    candidates.push({ outcome: 'identity-stabilized', magnitude: (deltas.persuasionVariance + deltas.overallCreativeHealth) / 2 });
  } else if (deltas.persuasionVariance <= -1 && deltas.overallCreativeHealth <= -1) {
    candidates.push({ outcome: 'identity-eroded', magnitude: (Math.abs(deltas.persuasionVariance) + Math.abs(deltas.overallCreativeHealth)) / 2 });
  }
  if (candidates.length === 0) {
    return { primary: 'no-significant-change', magnitude: 0, secondaries: [] };
  }
  candidates.sort((a, b) => b.magnitude - a.magnitude || a.outcome.localeCompare(b.outcome));
  return {
    primary: candidates[0].outcome,
    magnitude: Math.round(candidates[0].magnitude * 10) / 10,
    secondaries: candidates.slice(1).map((c) => c.outcome),
  };
}

// ─── episode builder (pure) ───────────────────────────────────

export interface DriftSnapshotForConsequence {
  at: number;
  formula: string | null;
  campaignMode: string | null;
  overallCreativeHealth: number;
  driftSeverity: number;
  entropyLevel: number;
  originalityPressure: number;
  narrativeStability: number;
  emotionalDiversity: number;
  persuasionVariance: number;
  formulaDistinctiveness: number;
  trustErosionDrift: number;
}

export interface BuildEpisodeContext {
  dominantRisk?: string | null;
  adaptationPriority?: string | null;
  cadenceState?: string | null;
  mutationPressure?: number;
  conditionFatigue?: number;
  outcomeFatigue?: number;
  conditionVisualConvergence?: number;
  outcomeVisualConvergence?: number;
  mutationCount?: number;
  stabilizationWindows?: number;
}

function r1(n: number): number { return Math.round(n * 10) / 10; }

export function buildConsequenceEpisode(
  condition: DriftSnapshotForConsequence,
  outcome: DriftSnapshotForConsequence,
  ctx: BuildEpisodeContext,
): ConsequenceEpisode {
  // Derive trust debt at each moment from trust erosion drift.
  const trustDebtAtCondition = Math.max(0, Math.min(10, 5 + condition.trustErosionDrift));
  const trustDebtAtOutcome   = Math.max(0, Math.min(10, 5 + outcome.trustErosionDrift));
  const cFatigue = ctx.conditionFatigue ?? 0;
  const oFatigue = ctx.outcomeFatigue ?? 0;
  const cVisualConv = ctx.conditionVisualConvergence ?? 0;
  const oVisualConv = ctx.outcomeVisualConvergence ?? 0;

  const deltas: OutcomeDeltas = {
    trustDebt:              trustDebtAtOutcome - trustDebtAtCondition,
    fatigue:                oFatigue - cFatigue,
    originalityPressure:    outcome.originalityPressure - condition.originalityPressure,
    persuasionVariance:     outcome.persuasionVariance - condition.persuasionVariance,
    visualConvergence:      oVisualConv - cVisualConv,
    emotionalFlattening:    (10 - outcome.emotionalDiversity) - (10 - condition.emotionalDiversity),
    overallCreativeHealth:  outcome.overallCreativeHealth - condition.overallCreativeHealth,
  };

  const { primary, magnitude, secondaries } = labelOutcome(deltas);

  const conditionSnap: ConditionSnapshot = {
    at: condition.at,
    formula: condition.formula,
    campaignMode: condition.campaignMode,
    dominantRisk: ctx.dominantRisk ?? null,
    adaptationPriority: ctx.adaptationPriority ?? null,
    cadenceState: ctx.cadenceState ?? null,
    mutationPressure:     r1(ctx.mutationPressure ?? 0),
    trustDebt:            r1(trustDebtAtCondition),
    fatigue:              r1(cFatigue),
    originalityPressure:  r1(condition.originalityPressure),
    persuasionIntensity:  r1(Math.max(0, 10 - condition.persuasionVariance)),
    visualConvergence:    r1(cVisualConv),
    emotionalFlattening:  r1(Math.max(0, 10 - condition.emotionalDiversity)),
    mutationCount:        ctx.mutationCount ?? 0,
    stabilizationWindows: ctx.stabilizationWindows ?? 0,
  };

  return {
    conditionAt: condition.at,
    outcomeAt: outcome.at,
    windowSize: CONSEQUENCE_WINDOW,
    condition: conditionSnap,
    downstreamOutcome: primary,
    outcomeMagnitude: magnitude,
    deltas: {
      trustDebt:             r1(deltas.trustDebt),
      fatigue:               r1(deltas.fatigue),
      originalityPressure:   r1(deltas.originalityPressure),
      persuasionVariance:    r1(deltas.persuasionVariance),
      visualConvergence:     r1(deltas.visualConvergence),
      emotionalFlattening:   r1(deltas.emotionalFlattening),
      overallCreativeHealth: r1(deltas.overallCreativeHealth),
    },
    secondaryOutcomes: secondaries,
  };
}

// ─── store ────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodConsequenceIntel?: ConsequenceMemoryState };

export interface ConsequenceMemoryStore {
  read(): Promise<ConsequenceMemoryState>;
  append(episode: ConsequenceEpisode): Promise<ConsequenceMemoryState>;
  save(state: ConsequenceMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createConsequenceMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): ConsequenceMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: ConsequenceMemoryStore = {
    async read() {
      if (g.__moodConsequenceIntel) return g.__moodConsequenceIntel;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<ConsequenceMemoryState>;
        g.__moodConsequenceIntel = { ...createInitialConsequenceMemory(), ...parsed };
      } catch {
        g.__moodConsequenceIntel = createInitialConsequenceMemory();
      }
      return g.__moodConsequenceIntel;
    },
    async append(episode) {
      const cur = await store.read();
      const next: ConsequenceMemoryState = {
        ...cur,
        episodes: [...cur.episodes, episode].slice(-CONSEQUENCE_EPISODE_LIMIT),
        totalEpisodes: cur.totalEpisodes + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? episode.conditionAt,
        updatedAt: nowMs(),
      };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.episodes = state.episodes.slice(-CONSEQUENCE_EPISODE_LIMIT);
      state.updatedAt = nowMs();
      g.__moodConsequenceIntel = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodConsequenceIntel = undefined;
    },
  };
  return store;
}

export async function recordConsequenceEpisode(episode: ConsequenceEpisode): Promise<void> {
  try {
    await createConsequenceMemoryStore().append(episode);
  } catch {
    // non-fatal — never blocks generation
  }
}
