/**
 * KNOWLEDGE MEMORY (FIFO, operator-supervised)
 *
 * Phase 4 — Operations Layer.
 *
 * Persistent store of KNOWLEDGE ENTRIES — operator-curated rules
 * across multiple categories (brand, product, visual, audience,
 * formula, campaign-history).
 *
 * STRICT CONTRACT:
 *   - the memory never auto-creates entries
 *   - the memory never auto-edits entries
 *
 * Lives at data/memory/knowledge-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'knowledge-memory.json';

export const KNOWLEDGE_LIMIT = 512;

// ─── types ────────────────────────────────────────────────────

export type KnowledgeCategory =
  | 'brand-rule' | 'product-rule' | 'visual-rule'
  | 'audience-rule' | 'formula-rule' | 'campaign-history';

export interface KnowledgeRevision {
  at: number;
  operatorId: string;
  reason?: string;
}

export interface KnowledgeEntry {
  entryId: string;
  category: KnowledgeCategory;
  title: string;
  body: string;
  /** Operator-provided tags (free text). */
  tags: string[];
  createdAt: number;
  operatorId: string;
  /** Revision history — each operator edit appends an entry. */
  revisionHistory: KnowledgeRevision[];
  /** Optional linked formula. */
  linkedFormula?: 'ENERGY' | 'FOCUS' | 'RELAX' | 'SLEEP';
  /** Optional linked product id. */
  linkedProductId?: string;
}

// ─── state ────────────────────────────────────────────────────

export interface KnowledgeMemoryState {
  entries: KnowledgeEntry[];
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialKnowledgeMemory(): KnowledgeMemoryState {
  return { entries: [], firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __knowSeq = 0;
export function newKnowledgeEntryId(): string {
  __knowSeq += 1;
  return `know-${Date.now().toString(36)}-${__knowSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendKnowledgeEntry(state: KnowledgeMemoryState, entry: KnowledgeEntry): KnowledgeMemoryState {
  return {
    ...state,
    entries: [...state.entries, entry].slice(-KNOWLEDGE_LIMIT),
    firstUpdatedAt: state.firstUpdatedAt ?? entry.createdAt,
    updatedAt: entry.createdAt,
  };
}
export function updateKnowledgeEntry(
  state: KnowledgeMemoryState, entryId: string, patch: { title?: string; body?: string; tags?: string[] }, revision: KnowledgeRevision,
): KnowledgeMemoryState {
  const idx = state.entries.findIndex((e) => e.entryId === entryId);
  if (idx === -1) throw new Error(`knowledge entry not found: ${entryId}`);
  const prev = state.entries[idx];
  const next: KnowledgeEntry = {
    ...prev,
    title: patch.title ?? prev.title,
    body: patch.body ?? prev.body,
    tags: patch.tags ?? prev.tags,
    revisionHistory: [...prev.revisionHistory, revision],
  };
  const entries = [...state.entries];
  entries[idx] = next;
  return { ...state, entries, updatedAt: revision.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodKnowledge?: KnowledgeMemoryState };

export interface KnowledgeMemoryStore {
  read(): Promise<KnowledgeMemoryState>;
  save(state: KnowledgeMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createKnowledgeMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): KnowledgeMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: KnowledgeMemoryStore = {
    async read() {
      if (g.__moodKnowledge) return g.__moodKnowledge;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<KnowledgeMemoryState>;
        g.__moodKnowledge = { ...createInitialKnowledgeMemory(), ...parsed };
      } catch {
        g.__moodKnowledge = createInitialKnowledgeMemory();
      }
      return g.__moodKnowledge;
    },
    async save(state) {
      state.entries = state.entries.slice(-KNOWLEDGE_LIMIT);
      state.updatedAt = nowMs();
      g.__moodKnowledge = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodKnowledge = undefined;
    },
  };
  return store;
}
