/**
 * TRIAL OUTCOME MEMORY (FIFO, operator-supervised)
 *
 * Persistent store of operator-supplied REAL-WORLD outcomes attached
 * to operator creative trials. Every entry is the explicit result of
 * an operator's POST — the memory NEVER auto-scrapes platforms,
 * NEVER auto-publishes, NEVER auto-selects winners.
 *
 * STRICT CONTRACT:
 *   - append is the only mutating operation
 *   - the route validates operator credentials + required fields
 *   - the store NEVER triggers generation or publishing
 *   - FIFO-capped
 *
 * Lives at data/memory/trial-outcome-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'trial-outcome-memory.json';

export const TRIAL_OUTCOME_LIMIT = 256;

// ─── types ────────────────────────────────────────────────────

export interface TrialOutcomeMetrics {
  impressions?: number;
  watchTime?: number;          // seconds
  retention?: number;          // 0..1
  rewatches?: number;
  saves?: number;
  shares?: number;
  comments?: number;
  likes?: number;
  profileVisits?: number;
  follows?: number;
  ctr?: number;
  addToCart?: number;
  checkoutRate?: number;
  purchases?: number;
  bounceRate?: number;
  scrollDepth?: number;
}

export interface TrialOutcomeRecord {
  outcomeId: string;
  trialId: string;
  /** When the operator recorded the outcome (ms epoch). */
  timestamp: number;
  operatorId: string;
  platform: string;
  audienceSegment: string;
  /** Free-text exposure window, e.g. "24h", "7d", "campaign-week-3". */
  exposureWindow?: string;
  metrics: TrialOutcomeMetrics;
  /** Free-text qualitative signals the operator noticed. */
  qualitativeSignals: string[];
  /** Free-text journal entry from the operator. */
  operatorNotes?: string;
  /** Labels the operator chose (or supplied via derivation). */
  outcomeLabels: string[];
}

// ─── state ────────────────────────────────────────────────────

export interface TrialOutcomeMemoryState {
  outcomes: TrialOutcomeRecord[];
  totalOutcomes: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialTrialOutcomeMemory(): TrialOutcomeMemoryState {
  return { outcomes: [], totalOutcomes: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── store ────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodTrialOutcome?: TrialOutcomeMemoryState };

export interface TrialOutcomeMemoryStore {
  read(): Promise<TrialOutcomeMemoryState>;
  append(record: TrialOutcomeRecord): Promise<TrialOutcomeMemoryState>;
  save(state: TrialOutcomeMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createTrialOutcomeMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): TrialOutcomeMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: TrialOutcomeMemoryStore = {
    async read() {
      if (g.__moodTrialOutcome) return g.__moodTrialOutcome;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<TrialOutcomeMemoryState>;
        g.__moodTrialOutcome = { ...createInitialTrialOutcomeMemory(), ...parsed };
      } catch {
        g.__moodTrialOutcome = createInitialTrialOutcomeMemory();
      }
      return g.__moodTrialOutcome;
    },
    async append(record) {
      const cur = await store.read();
      const next: TrialOutcomeMemoryState = {
        ...cur,
        outcomes: [...cur.outcomes, record].slice(-TRIAL_OUTCOME_LIMIT),
        totalOutcomes: cur.totalOutcomes + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? record.timestamp,
        updatedAt: nowMs(),
      };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.outcomes = state.outcomes.slice(-TRIAL_OUTCOME_LIMIT);
      state.updatedAt = nowMs();
      g.__moodTrialOutcome = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodTrialOutcome = undefined;
    },
  };
  return store;
}

/** Deterministic-ish outcome id. Operator-supplied trialId is the
 *  primary join key; outcomeId is only a per-record unique handle. */
export function newOutcomeId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36).padStart(4, '0');
  return `outcome-${ts}-${rand}`;
}
