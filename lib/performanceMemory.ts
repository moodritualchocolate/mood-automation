/**
 * PERFORMANCE MEMORY (FIFO, operator-supervised)
 *
 * Phase 2 — Creative Performance Layer.
 *
 * Persistent FIFO of PERFORMANCE RECORDS. Each entry is an
 * OPERATOR-LOGGED measurement of how an external publication
 * performed (views, reach, watch time, ctr, shares, saves,
 * comments, engagement, completion rate). The system NEVER
 * fetches metrics from a platform — the operator pulls metrics
 * from their analytics dashboard and logs them here.
 *
 * STRICT CONTRACT:
 *   - the memory NEVER fetches from platforms
 *   - the memory NEVER auto-derives metrics
 *   - every write requires operatorId + operatorReason at the route
 *     layer
 *   - FIFO-capped
 *
 * Lives at data/memory/performance-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'performance-memory.json';

export const PERFORMANCE_MEMORY_LIMIT = 512;

// ─── metrics shape ───────────────────────────────────────────

export interface PerformanceMetrics {
  views?: number;
  reach?: number;
  /** Average watch time in seconds. */
  watchTimeSeconds?: number;
  /** Completion rate 0..1. */
  completionRate?: number;
  /** CTR 0..1. */
  ctr?: number;
  shares?: number;
  saves?: number;
  comments?: number;
  likes?: number;
  /** Aggregate engagement rate 0..1 (likes+comments+shares+saves / reach). */
  engagementRate?: number;
  /** Operator-provided follow-on numbers. */
  follows?: number;
  profileVisits?: number;
}

export interface PerformanceRecord {
  performanceId: string;
  /** The asset-registry record performed by. */
  assetId: string;
  /** The publication record this performance is measured against. */
  publicationId: string;
  /** Platform-side post id (operator-provided). */
  platform: string;
  /** Measurement window — operator-provided. */
  measuredAt: number;
  measurementWindow: {
    startedAt: number;
    endedAt: number;
    durationHours: number;
  };
  metrics: PerformanceMetrics;
  /** Operator notes attached at logging. */
  operatorNote?: string;
  /** Operator id who logged this measurement. */
  operatorId: string;
}

// ─── state ────────────────────────────────────────────────────

export interface PerformanceMemoryState {
  performances: PerformanceRecord[];
  totalPerformances: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialPerformanceMemory(): PerformanceMemoryState {
  return { performances: [], totalPerformances: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __perfSeq = 0;
export function newPerformanceId(): string {
  __perfSeq += 1;
  return `perf-${Date.now().toString(36)}-${__perfSeq.toString(36)}`;
}

// ─── pure transform ──────────────────────────────────────────

export function appendPerformanceRecord(
  state: PerformanceMemoryState,
  record: PerformanceRecord,
): PerformanceMemoryState {
  const performances = [...state.performances, record].slice(-PERFORMANCE_MEMORY_LIMIT);
  return {
    ...state,
    performances,
    totalPerformances: state.totalPerformances + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.measuredAt,
    updatedAt: record.measuredAt,
  };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodPerformance?: PerformanceMemoryState };

export interface PerformanceMemoryStore {
  read(): Promise<PerformanceMemoryState>;
  append(record: PerformanceRecord): Promise<PerformanceMemoryState>;
  save(state: PerformanceMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createPerformanceMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): PerformanceMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: PerformanceMemoryStore = {
    async read() {
      if (g.__moodPerformance) return g.__moodPerformance;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<PerformanceMemoryState>;
        g.__moodPerformance = { ...createInitialPerformanceMemory(), ...parsed };
      } catch {
        g.__moodPerformance = createInitialPerformanceMemory();
      }
      return g.__moodPerformance;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendPerformanceRecord(cur, record);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.performances = state.performances.slice(-PERFORMANCE_MEMORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodPerformance = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodPerformance = undefined;
    },
  };
  return store;
}
