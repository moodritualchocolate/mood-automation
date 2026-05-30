/**
 * GENERATION RESULT REGISTRY (FIFO, operator-supervised)
 *
 * Phase 5 — Generation Connector Layer.
 *
 * Persistent FIFO of GENERATION RESULT RECORDS. Each record
 * represents the OPERATOR-LOGGED outcome of an external provider
 * generation. The system NEVER calls a provider, so all results
 * are recorded by the operator after they've reviewed the output.
 *
 * STRICT CONTRACT:
 *   - the registry never calls a provider
 *   - the registry never auto-publishes
 *   - every write requires operatorId + reason at the route layer
 *   - FIFO-capped
 *
 * Lives at data/memory/generation-result-registry.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { ProviderId } from './providers/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'generation-result-registry.json';

export const GENERATION_RESULT_LIMIT = 256;

// ─── types ────────────────────────────────────────────────────

export interface GenerationResultRecord {
  resultId: string;
  /** Asset record this result is linked to (asset-registry). */
  assetId: string;
  /** Generation request record this result was produced for. */
  requestId: string;
  provider: ProviderId;
  /** Operator who logged the result. */
  operator: string;
  /** Timestamp the operator generated the asset externally. */
  generatedAt: number;
  /** Optional preview — operator-provided URL or short reference. */
  preview?: string;
  /** Provider-reported metadata (size, duration, seed, etc.). */
  metadata: Record<string, unknown>;
  /** Operator note attached at logging. */
  operatorNote?: string;
}

export interface GenerationResultRegistryState {
  results: GenerationResultRecord[];
  totalResults: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialGenerationResultRegistry(): GenerationResultRegistryState {
  return { results: [], totalResults: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __resSeq = 0;
export function newGenerationResultId(): string {
  __resSeq += 1;
  return `gen-res-${Date.now().toString(36)}-${__resSeq.toString(36)}`;
}

// ─── pure transform ──────────────────────────────────────────

export function appendGenerationResult(
  state: GenerationResultRegistryState,
  record: GenerationResultRecord,
): GenerationResultRegistryState {
  const results = [...state.results, record].slice(-GENERATION_RESULT_LIMIT);
  return {
    ...state,
    results,
    totalResults: state.totalResults + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.generatedAt,
    updatedAt: record.generatedAt,
  };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodGenerationResults?: GenerationResultRegistryState };

export interface GenerationResultRegistryStore {
  read(): Promise<GenerationResultRegistryState>;
  append(record: GenerationResultRecord): Promise<GenerationResultRegistryState>;
  save(state: GenerationResultRegistryState): Promise<void>;
  reset(): Promise<void>;
}

export function createGenerationResultRegistryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): GenerationResultRegistryStore {
  const filePath = path.join(dir, FILE);
  const store: GenerationResultRegistryStore = {
    async read() {
      if (g.__moodGenerationResults) return g.__moodGenerationResults;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<GenerationResultRegistryState>;
        g.__moodGenerationResults = { ...createInitialGenerationResultRegistry(), ...parsed };
      } catch {
        g.__moodGenerationResults = createInitialGenerationResultRegistry();
      }
      return g.__moodGenerationResults;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendGenerationResult(cur, record);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.results = state.results.slice(-GENERATION_RESULT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodGenerationResults = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodGenerationResults = undefined;
    },
  };
  return store;
}
