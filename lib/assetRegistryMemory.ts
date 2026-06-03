/**
 * ASSET REGISTRY MEMORY (FIFO, operator-supervised)
 *
 * Phase 5 — Execution Layer.
 *
 * Persistent FIFO of EXECUTION ASSET RECORDS. Each record represents
 * one execution package (image / video / carousel / landing) along
 * with its operator-driven approval status.
 *
 * STRICT CONTRACT:
 *   - append + status-update are the only mutating operations
 *   - both require operator credentials at the route layer
 *   - the store NEVER triggers generation
 *   - the store NEVER publishes
 *   - the store NEVER auto-approves
 *   - FIFO-capped
 *
 * Lives at data/memory/asset-registry-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Formula } from '@/core/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'asset-registry-memory.json';

export const ASSET_REGISTRY_LIMIT = 256;

// ─── types ────────────────────────────────────────────────────

export type AssetExecutionType = 'image' | 'video' | 'carousel' | 'landing';

export type AssetApprovalStatus =
  | 'pending'      // newly added by operator, awaiting their own approval
  | 'approved'     // operator approved — eligible for operator-driven execution
  | 'rejected'     // operator rejected
  | 'archived';    // historical record, no longer in active queue

export interface AssetApprovalStep {
  at: number;
  status: AssetApprovalStatus;
  operatorId: string;
  reason?: string;
}

export interface AssetRecord {
  assetId: string;
  formula: Formula;
  /** Campaign label the operator attached to this asset. */
  campaign: string;
  /** Asset execution package type. */
  packageType: AssetExecutionType;
  /** Source story name (for traceability). */
  sourceStoryName: string;
  /** Source brief id (for traceability). */
  sourceBriefId: string;
  /** Source prompt id (for traceability). */
  sourcePromptId: string;
  /** Full prompt text — frozen at registration. */
  prompt: string;
  /** Coarse summary line for the registry view. */
  summary: string;
  createdAt: number;
  operatorId: string;
  /** Current approval status. */
  approvalStatus: AssetApprovalStatus;
  /** Approval history — every status transition with operator + reason. */
  approvalHistory: AssetApprovalStep[];
  /** Optional operator note attached at registration. */
  operatorNote?: string;
  /** Optional tenancy stamp — newer records carry it; legacy ones don't. */
  organizationId?: string;
  workspaceId?: string;
  /** Optional brand attachment so the library can group by brand. */
  brandId?: string;
  /** Optional rendered preview (post / banner — first slide for carousel).
   *  Stored as a data URL so the library can show thumbnails without
   *  re-rendering. Truncated FIFO can drop these without losing the
   *  prompt / spec — they're regenerable. */
  previewDataUrl?: string;
  /** Optional Hebrew copy snapshot for the library card. */
  copy?: {
    headline?: string;
    body?: string;
    cta?: string;
    paletteKey?: string;
    subline?: string;
    audience?: string;
    emotion?: string;
    visualMode?: string;
    productPresence?: string;
    platformSize?: string;
    negativePrompt?: string;
  };
}

// ─── state ────────────────────────────────────────────────────

export interface AssetRegistryMemoryState {
  assets: AssetRecord[];
  totalAssets: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialAssetRegistryMemory(): AssetRegistryMemoryState {
  return { assets: [], totalAssets: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helpers ──────────────────────────────────────────────

let __assetSeq = 0;
export function newAssetId(): string {
  __assetSeq += 1;
  return `asset-${Date.now().toString(36)}-${__assetSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

/** Append a new asset record, FIFO-capped. Pure. */
export function appendAssetRecord(
  state: AssetRegistryMemoryState,
  record: AssetRecord,
): AssetRegistryMemoryState {
  const assets = [...state.assets, record].slice(-ASSET_REGISTRY_LIMIT);
  return {
    ...state,
    assets,
    totalAssets: state.totalAssets + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

/** Apply an approval-status step to a known asset. Pure. Throws on
 *  unknown assetId so callers / verifiers can rely on the failure. */
export function applyAssetApprovalStep(
  state: AssetRegistryMemoryState,
  assetId: string,
  step: AssetApprovalStep,
): AssetRegistryMemoryState {
  const idx = state.assets.findIndex((a) => a.assetId === assetId);
  if (idx === -1) {
    throw new Error(`asset not found: ${assetId}`);
  }
  const prev = state.assets[idx];
  const next: AssetRecord = {
    ...prev,
    approvalStatus: step.status,
    approvalHistory: [...prev.approvalHistory, step],
  };
  const assets = [...state.assets];
  assets[idx] = next;
  return { ...state, assets, updatedAt: step.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodAssetRegistry?: AssetRegistryMemoryState };

export interface AssetRegistryMemoryStore {
  read(): Promise<AssetRegistryMemoryState>;
  append(record: AssetRecord): Promise<AssetRegistryMemoryState>;
  updateApproval(assetId: string, step: AssetApprovalStep): Promise<AssetRegistryMemoryState>;
  save(state: AssetRegistryMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createAssetRegistryMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): AssetRegistryMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: AssetRegistryMemoryStore = {
    async read() {
      if (g.__moodAssetRegistry) return g.__moodAssetRegistry;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<AssetRegistryMemoryState>;
        g.__moodAssetRegistry = { ...createInitialAssetRegistryMemory(), ...parsed };
      } catch {
        g.__moodAssetRegistry = createInitialAssetRegistryMemory();
      }
      return g.__moodAssetRegistry;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendAssetRecord(cur, record);
      await store.save(next);
      return next;
    },
    async updateApproval(assetId, step) {
      const cur = await store.read();
      const next = applyAssetApprovalStep(cur, assetId, step);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.assets = state.assets.slice(-ASSET_REGISTRY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodAssetRegistry = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodAssetRegistry = undefined;
    },
  };
  return store;
}
