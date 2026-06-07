/**
 * MVP BRAND INPUT MEMORY (FIFO · operator-supervised)
 *
 * Stores the 4 onboarding answers a customer provides at the start
 * of the MVP flow: artifact · audience · emotional · locale.
 *
 * Lives at data/memory/mvp-brand-input-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'mvp-brand-input-memory.json';

export const MVP_BRAND_INPUT_LIMIT = 256;

export interface BrandInputRecord {
  brandInputId: string;
  organizationId: string;
  workspaceId: string;
  operatorId: string;
  artifact: string;
  audience: string;
  emotional: string;
  locale: string;
  createdAt: number;
  operatorReason: string;
}

export interface MvpBrandInputMemoryState {
  records: BrandInputRecord[];
  totalRecords: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialMvpBrandInputMemory(): MvpBrandInputMemoryState {
  return { records: [], totalRecords: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __mvpInputSeq = 0;
export function newBrandInputId(): string {
  __mvpInputSeq += 1;
  return `mvp-input-${Date.now().toString(36)}-${__mvpInputSeq.toString(36)}`;
}

export function appendBrandInputRecord(
  state: MvpBrandInputMemoryState,
  record: BrandInputRecord,
): MvpBrandInputMemoryState {
  const records = [...state.records, record].slice(-MVP_BRAND_INPUT_LIMIT);
  return {
    ...state,
    records,
    totalRecords: state.totalRecords + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

const g = globalThis as unknown as { __moodMvpBrandInputMemory?: MvpBrandInputMemoryState };

export interface MvpBrandInputMemoryStore {
  read(): Promise<MvpBrandInputMemoryState>;
  append(record: BrandInputRecord): Promise<MvpBrandInputMemoryState>;
  findById(brandInputId: string): Promise<BrandInputRecord | null>;
  save(state: MvpBrandInputMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createMvpBrandInputMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): MvpBrandInputMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: MvpBrandInputMemoryStore = {
    async read() {
      if (g.__moodMvpBrandInputMemory) return g.__moodMvpBrandInputMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<MvpBrandInputMemoryState>;
        g.__moodMvpBrandInputMemory = { ...createInitialMvpBrandInputMemory(), ...parsed };
      } catch {
        g.__moodMvpBrandInputMemory = createInitialMvpBrandInputMemory();
      }
      return g.__moodMvpBrandInputMemory;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendBrandInputRecord(cur, record);
      await store.save(next);
      return next;
    },
    async findById(brandInputId) {
      const cur = await store.read();
      return cur.records.find((r) => r.brandInputId === brandInputId) ?? null;
    },
    async save(state) {
      state.records = state.records.slice(-MVP_BRAND_INPUT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodMvpBrandInputMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodMvpBrandInputMemory = undefined;
    },
  };
  return store;
}
