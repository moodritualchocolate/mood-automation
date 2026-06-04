/**
 * CREATIVE STRATEGY MEMORY (FIFO · operator-supervised)
 *
 * Persistent FIFO of saved creative strategies — one per
 * (organizationId, workspaceId, productCode) combination plus
 * arbitrary operator-named variants. The store NEVER triggers
 * generation. The store NEVER publishes. The store NEVER
 * auto-approves. FIFO-capped.
 *
 * Lives at data/memory/creative-strategy-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CreativeStrategy, ProductCode } from './creativeStrategyEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'creative-strategy-memory.json';

export const STRATEGY_LIMIT = 128;

export interface StoredStrategyRecord {
  strategyId: string;
  productCode: ProductCode;
  brandId?: string;
  organizationId: string;
  workspaceId: string;
  operatorId: string;
  operatorReason: string;
  strategy: CreativeStrategy;
  createdAt: number;
  approvalStatus: 'pending' | 'approved' | 'archived';
}

export interface CreativeStrategyMemoryState {
  strategies: StoredStrategyRecord[];
  totalGenerated: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialCreativeStrategyMemory(): CreativeStrategyMemoryState {
  return { strategies: [], totalGenerated: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __strategySeq = 0;
export function newStrategyId(): string {
  __strategySeq += 1;
  return `strategy-${Date.now().toString(36)}-${__strategySeq.toString(36)}`;
}

export function appendStrategyRecord(
  state: CreativeStrategyMemoryState,
  record: StoredStrategyRecord,
): CreativeStrategyMemoryState {
  const strategies = [...state.strategies, record].slice(-STRATEGY_LIMIT);
  return {
    ...state,
    strategies,
    totalGenerated: state.totalGenerated + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

const g = globalThis as unknown as { __moodCreativeStrategyMemory?: CreativeStrategyMemoryState };

export interface CreativeStrategyMemoryStore {
  read(): Promise<CreativeStrategyMemoryState>;
  append(record: StoredStrategyRecord): Promise<CreativeStrategyMemoryState>;
  save(state: CreativeStrategyMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCreativeStrategyMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CreativeStrategyMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CreativeStrategyMemoryStore = {
    async read() {
      if (g.__moodCreativeStrategyMemory) return g.__moodCreativeStrategyMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<CreativeStrategyMemoryState>;
        g.__moodCreativeStrategyMemory = { ...createInitialCreativeStrategyMemory(), ...parsed };
      } catch {
        g.__moodCreativeStrategyMemory = createInitialCreativeStrategyMemory();
      }
      return g.__moodCreativeStrategyMemory;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendStrategyRecord(cur, record);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.strategies = state.strategies.slice(-STRATEGY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCreativeStrategyMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCreativeStrategyMemory = undefined;
    },
  };
  return store;
}
