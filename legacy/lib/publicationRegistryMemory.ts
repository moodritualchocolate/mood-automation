/**
 * PUBLICATION REGISTRY (FIFO, operator-supervised)
 *
 * Phase 1 — Creative Performance Layer.
 *
 * Persistent FIFO of PUBLICATION RECORDS. Each entry represents an
 * external publication the OPERATOR manually registered after they
 * published the asset elsewhere (Instagram, TikTok, web, etc.).
 *
 * STRICT CONTRACT:
 *   - the registry NEVER auto-publishes
 *   - the registry NEVER calls a social platform
 *   - every write requires operatorId + operatorReason at the route
 *     layer
 *   - registration is a MANUAL operator action after the operator
 *     published externally
 *   - FIFO-capped
 *
 * Lives at data/memory/publication-registry-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Formula } from '@/core/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'publication-registry-memory.json';

export const PUBLICATION_REGISTRY_LIMIT = 256;

// ─── types ────────────────────────────────────────────────────

export type PublicationChannel =
  | 'instagram-feed' | 'instagram-story' | 'instagram-reels'
  | 'tiktok' | 'facebook-feed' | 'facebook-reels'
  | 'youtube-shorts' | 'pinterest'
  | 'website-hero' | 'newsletter' | 'other';

export type PublicationStatus = 'live' | 'paused' | 'unpublished' | 'archived';

export interface PublicationStep {
  at: number;
  status: PublicationStatus;
  operatorId: string;
  reason?: string;
}

export interface PublicationRecord {
  publicationId: string;
  /** The asset-registry record that was published. */
  assetId: string;
  /** The generation result record (if any) that produced the asset. */
  resultId?: string;
  channel: PublicationChannel;
  /** When the OPERATOR published externally. */
  publishedAt: number;
  /** Optional URL operator entered (live link). */
  externalUrl?: string;
  operatorId: string;
  campaign: string;
  formula: Formula;
  /** Free-text audience descriptor (e.g. "il-women-25-44", "global"). */
  audience: string;
  /** The platform-specific id (post id / video id) — operator-provided. */
  platform: string;
  status: PublicationStatus;
  /** Status history with operator + reason. */
  statusHistory: PublicationStep[];
  operatorNote?: string;
}

// ─── state ────────────────────────────────────────────────────

export interface PublicationRegistryState {
  publications: PublicationRecord[];
  totalPublications: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialPublicationRegistry(): PublicationRegistryState {
  return { publications: [], totalPublications: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __pubSeq = 0;
export function newPublicationId(): string {
  __pubSeq += 1;
  return `pub-${Date.now().toString(36)}-${__pubSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendPublicationRecord(
  state: PublicationRegistryState,
  record: PublicationRecord,
): PublicationRegistryState {
  const publications = [...state.publications, record].slice(-PUBLICATION_REGISTRY_LIMIT);
  return {
    ...state,
    publications,
    totalPublications: state.totalPublications + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.publishedAt,
    updatedAt: record.publishedAt,
  };
}

/** Transition a publication's status. Throws on unknown publicationId. */
export function applyPublicationStep(
  state: PublicationRegistryState,
  publicationId: string,
  step: PublicationStep,
): PublicationRegistryState {
  const idx = state.publications.findIndex((p) => p.publicationId === publicationId);
  if (idx === -1) throw new Error(`publication not found: ${publicationId}`);
  const prev = state.publications[idx];
  const next: PublicationRecord = {
    ...prev,
    status: step.status,
    statusHistory: [...prev.statusHistory, step],
  };
  const publications = [...state.publications];
  publications[idx] = next;
  return { ...state, publications, updatedAt: step.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodPublicationRegistry?: PublicationRegistryState };

export interface PublicationRegistryStore {
  read(): Promise<PublicationRegistryState>;
  append(record: PublicationRecord): Promise<PublicationRegistryState>;
  updateStatus(publicationId: string, step: PublicationStep): Promise<PublicationRegistryState>;
  save(state: PublicationRegistryState): Promise<void>;
  reset(): Promise<void>;
}

export function createPublicationRegistryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): PublicationRegistryStore {
  const filePath = path.join(dir, FILE);
  const store: PublicationRegistryStore = {
    async read() {
      if (g.__moodPublicationRegistry) return g.__moodPublicationRegistry;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<PublicationRegistryState>;
        g.__moodPublicationRegistry = { ...createInitialPublicationRegistry(), ...parsed };
      } catch {
        g.__moodPublicationRegistry = createInitialPublicationRegistry();
      }
      return g.__moodPublicationRegistry;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendPublicationRecord(cur, record);
      await store.save(next);
      return next;
    },
    async updateStatus(publicationId, step) {
      const cur = await store.read();
      const next = applyPublicationStep(cur, publicationId, step);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.publications = state.publications.slice(-PUBLICATION_REGISTRY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodPublicationRegistry = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodPublicationRegistry = undefined;
    },
  };
  return store;
}
