/**
 * PATTERN RELIABILITY MEMORY (FIFO, append + evidence-update)
 *
 * Persistent store of OBSERVED LEARNING PATTERNS. Each entry is a
 * (mutationType, formula, campaignMode, expectedSignal) tuple along
 * with how many times the supervised learning loop has seen this
 * pattern aligned, contradicted, or unresolved.
 *
 * STRICT CONTRACT:
 *   - the memory stores OBSERVATIONS — never recommendations
 *   - never auto-applies a pattern
 *   - never names a "best" pattern
 *   - FIFO-capped
 *
 * Lives at data/memory/pattern-reliability-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'pattern-reliability-memory.json';

export const PATTERN_RELIABILITY_LIMIT = 256;

// ─── types ────────────────────────────────────────────────────

export type PatternAlignment = 'aligned' | 'contradicted' | 'unresolved';

export interface PatternReliabilityRecord {
  patternId: string;
  mutationType: string;
  formula: string;
  campaignMode: string | null;
  /** What the sandbox expectation was for this pattern. */
  expectedSignal: string;
  /** Most recent observed outcome label. */
  observedOutcome: string;
  alignment: PatternAlignment;
  /** Total evidence observations for this pattern over time. */
  evidenceCount: number;
  /** Per-alignment counts (so a pattern can show "5 aligned, 1 contradicted"). */
  alignmentCounts: {
    aligned: number;
    contradicted: number;
    unresolved: number;
  };
  lastSeenAt: number;
  firstSeenAt: number;
}

// ─── state ────────────────────────────────────────────────────

export interface PatternReliabilityMemoryState {
  patterns: PatternReliabilityRecord[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialPatternReliabilityMemory(): PatternReliabilityMemoryState {
  return { patterns: [], totalObservations: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── pattern id helper ───────────────────────────────────────

/** Deterministic id over the join keys of a pattern. */
export function patternIdFor(
  mutationType: string,
  formula: string,
  campaignMode: string | null,
  expectedSignal: string,
): string {
  return `${mutationType}|${formula}|${campaignMode ?? 'AUTO'}|${expectedSignal}`;
}

// ─── pure transform ──────────────────────────────────────────

/** Applies a new observation: either inserts a new pattern record or
 *  increments the matching record's counts. Pure function. */
export function applyPatternObservation(
  state: PatternReliabilityMemoryState,
  obs: {
    mutationType: string;
    formula: string;
    campaignMode: string | null;
    expectedSignal: string;
    observedOutcome: string;
    alignment: PatternAlignment;
    at: number;
  },
): PatternReliabilityMemoryState {
  const id = patternIdFor(obs.mutationType, obs.formula, obs.campaignMode, obs.expectedSignal);
  const idx = state.patterns.findIndex((p) => p.patternId === id);
  let nextPatterns: PatternReliabilityRecord[];
  if (idx === -1) {
    const record: PatternReliabilityRecord = {
      patternId: id,
      mutationType: obs.mutationType,
      formula: obs.formula,
      campaignMode: obs.campaignMode,
      expectedSignal: obs.expectedSignal,
      observedOutcome: obs.observedOutcome,
      alignment: obs.alignment,
      evidenceCount: 1,
      alignmentCounts: {
        aligned: obs.alignment === 'aligned' ? 1 : 0,
        contradicted: obs.alignment === 'contradicted' ? 1 : 0,
        unresolved: obs.alignment === 'unresolved' ? 1 : 0,
      },
      lastSeenAt: obs.at,
      firstSeenAt: obs.at,
    };
    nextPatterns = [...state.patterns, record].slice(-PATTERN_RELIABILITY_LIMIT);
  } else {
    const prev = state.patterns[idx];
    const updated: PatternReliabilityRecord = {
      ...prev,
      observedOutcome: obs.observedOutcome,
      alignment: obs.alignment,
      evidenceCount: prev.evidenceCount + 1,
      alignmentCounts: {
        aligned: prev.alignmentCounts.aligned + (obs.alignment === 'aligned' ? 1 : 0),
        contradicted: prev.alignmentCounts.contradicted + (obs.alignment === 'contradicted' ? 1 : 0),
        unresolved: prev.alignmentCounts.unresolved + (obs.alignment === 'unresolved' ? 1 : 0),
      },
      lastSeenAt: obs.at,
    };
    nextPatterns = [...state.patterns];
    nextPatterns[idx] = updated;
  }
  return {
    ...state,
    patterns: nextPatterns,
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── store ────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodPatternReliability?: PatternReliabilityMemoryState };

export interface PatternReliabilityMemoryStore {
  read(): Promise<PatternReliabilityMemoryState>;
  applyObservation(obs: {
    mutationType: string;
    formula: string;
    campaignMode: string | null;
    expectedSignal: string;
    observedOutcome: string;
    alignment: PatternAlignment;
    at: number;
  }): Promise<PatternReliabilityMemoryState>;
  save(state: PatternReliabilityMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createPatternReliabilityMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): PatternReliabilityMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: PatternReliabilityMemoryStore = {
    async read() {
      if (g.__moodPatternReliability) return g.__moodPatternReliability;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<PatternReliabilityMemoryState>;
        g.__moodPatternReliability = { ...createInitialPatternReliabilityMemory(), ...parsed };
      } catch {
        g.__moodPatternReliability = createInitialPatternReliabilityMemory();
      }
      return g.__moodPatternReliability;
    },
    async applyObservation(obs) {
      const cur = await store.read();
      const next = applyPatternObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.patterns = state.patterns.slice(-PATTERN_RELIABILITY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodPatternReliability = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodPatternReliability = undefined;
    },
  };
  return store;
}
