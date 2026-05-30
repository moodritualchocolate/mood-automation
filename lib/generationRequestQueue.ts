/**
 * GENERATION REQUEST QUEUE (FIFO, operator-supervised)
 *
 * Phase 4 — Generation Connector Layer.
 *
 * Persistent FIFO of GENERATION REQUEST RECORDS. Each record
 * represents a (provider, payload) pair derived from an APPROVED
 * asset registry record. The queue tracks status:
 *   draft | approved | submitted | completed | failed | archived
 *
 * STRICT CONTRACT:
 *   - the queue never calls a provider
 *   - the queue never publishes
 *   - the queue never auto-approves
 *   - every status transition is an operator decision recorded
 *     with operatorId + reason at the route layer
 *   - FIFO-capped
 *
 * Lives at data/memory/generation-request-queue.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Formula } from '@/core/types';
import type { ProviderId } from './providers/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'generation-request-queue.json';

export const GENERATION_REQUEST_LIMIT = 256;

// ─── types ────────────────────────────────────────────────────

export type GenerationRequestStatus =
  | 'draft'       // newly created from approved asset, awaiting operator approval
  | 'approved'    // operator approved — payload is ready to submit
  | 'submitted'   // operator submitted to provider (recorded but unobserved)
  | 'completed'   // operator marked completed (result attached separately)
  | 'failed'      // operator marked failed
  | 'archived';   // historical record

export interface GenerationRequestStep {
  at: number;
  status: GenerationRequestStatus;
  operatorId: string;
  reason?: string;
}

export interface GenerationRequestRecord {
  requestId: string;
  /** The asset-registry record this request was derived from. */
  sourceAssetId: string;
  formula: Formula;
  campaign: string;
  providerId: ProviderId;
  providerName: string;
  packageType: 'image' | 'video';
  /** Coarse summary line. */
  summary: string;
  /** Frozen provider payload at draft time. */
  providerPayload: Record<string, unknown>;
  /** Frozen endpoint hint at draft time. */
  endpointHint: { method: string; pathHint: string };
  /** Frozen cost estimate at draft time. */
  estimatedCostUSD: number;
  createdAt: number;
  operatorId: string;
  status: GenerationRequestStatus;
  history: GenerationRequestStep[];
  operatorNote?: string;
}

export interface GenerationRequestQueueState {
  requests: GenerationRequestRecord[];
  totalRequests: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialGenerationRequestQueue(): GenerationRequestQueueState {
  return { requests: [], totalRequests: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __reqSeq = 0;
export function newGenerationRequestId(): string {
  __reqSeq += 1;
  return `gen-req-${Date.now().toString(36)}-${__reqSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendGenerationRequest(
  state: GenerationRequestQueueState,
  record: GenerationRequestRecord,
): GenerationRequestQueueState {
  const requests = [...state.requests, record].slice(-GENERATION_REQUEST_LIMIT);
  return {
    ...state,
    requests,
    totalRequests: state.totalRequests + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

/** Transition a request's status. Throws on unknown requestId. */
export function applyGenerationRequestStep(
  state: GenerationRequestQueueState,
  requestId: string,
  step: GenerationRequestStep,
): GenerationRequestQueueState {
  const idx = state.requests.findIndex((r) => r.requestId === requestId);
  if (idx === -1) throw new Error(`generation request not found: ${requestId}`);
  const prev = state.requests[idx];
  const next: GenerationRequestRecord = {
    ...prev,
    status: step.status,
    history: [...prev.history, step],
  };
  const requests = [...state.requests];
  requests[idx] = next;
  return { ...state, requests, updatedAt: step.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodGenerationQueue?: GenerationRequestQueueState };

export interface GenerationRequestQueueStore {
  read(): Promise<GenerationRequestQueueState>;
  append(record: GenerationRequestRecord): Promise<GenerationRequestQueueState>;
  updateStatus(requestId: string, step: GenerationRequestStep): Promise<GenerationRequestQueueState>;
  save(state: GenerationRequestQueueState): Promise<void>;
  reset(): Promise<void>;
}

export function createGenerationRequestQueueStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): GenerationRequestQueueStore {
  const filePath = path.join(dir, FILE);
  const store: GenerationRequestQueueStore = {
    async read() {
      if (g.__moodGenerationQueue) return g.__moodGenerationQueue;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<GenerationRequestQueueState>;
        g.__moodGenerationQueue = { ...createInitialGenerationRequestQueue(), ...parsed };
      } catch {
        g.__moodGenerationQueue = createInitialGenerationRequestQueue();
      }
      return g.__moodGenerationQueue;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendGenerationRequest(cur, record);
      await store.save(next);
      return next;
    },
    async updateStatus(requestId, step) {
      const cur = await store.read();
      const next = applyGenerationRequestStep(cur, requestId, step);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.requests = state.requests.slice(-GENERATION_REQUEST_LIMIT);
      state.updatedAt = nowMs();
      g.__moodGenerationQueue = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodGenerationQueue = undefined;
    },
  };
  return store;
}
