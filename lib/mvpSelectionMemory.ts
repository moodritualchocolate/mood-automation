/**
 * MVP SELECTION MEMORY (FIFO · operator-supervised)
 *
 * Stores the operator's review choices: which one-liner was chosen,
 * which hooks / UGC scripts / image concepts were kept.
 *
 * Lives at data/memory/mvp-selection-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'mvp-selection-memory.json';

export const MVP_SELECTION_LIMIT = 256;

export interface SelectionRecord {
  selectionId: string;
  generationId: string;
  operatorId: string;
  chosenOneLinerId: string;
  keptHookIds: string[];
  keptUgcScriptIds: string[];
  keptImageConceptIds: string[];
  finalizedAt: number;
  operatorReason: string;
}

export interface MvpSelectionMemoryState {
  records: SelectionRecord[];
  totalSelections: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialMvpSelectionMemory(): MvpSelectionMemoryState {
  return { records: [], totalSelections: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __mvpSelSeq = 0;
export function newSelectionId(): string {
  __mvpSelSeq += 1;
  return `mvp-sel-${Date.now().toString(36)}-${__mvpSelSeq.toString(36)}`;
}

export function appendSelectionRecord(
  state: MvpSelectionMemoryState,
  record: SelectionRecord,
): MvpSelectionMemoryState {
  const records = [...state.records, record].slice(-MVP_SELECTION_LIMIT);
  return {
    ...state,
    records,
    totalSelections: state.totalSelections + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.finalizedAt,
    updatedAt: record.finalizedAt,
  };
}

const g = globalThis as unknown as { __moodMvpSelectionMemory?: MvpSelectionMemoryState };

export interface MvpSelectionMemoryStore {
  read(): Promise<MvpSelectionMemoryState>;
  append(record: SelectionRecord): Promise<MvpSelectionMemoryState>;
  findById(selectionId: string): Promise<SelectionRecord | null>;
  findLatestForOperator(operatorId: string): Promise<SelectionRecord | null>;
  save(state: MvpSelectionMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createMvpSelectionMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): MvpSelectionMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: MvpSelectionMemoryStore = {
    async read() {
      if (g.__moodMvpSelectionMemory) return g.__moodMvpSelectionMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<MvpSelectionMemoryState>;
        g.__moodMvpSelectionMemory = { ...createInitialMvpSelectionMemory(), ...parsed };
      } catch {
        g.__moodMvpSelectionMemory = createInitialMvpSelectionMemory();
      }
      return g.__moodMvpSelectionMemory;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendSelectionRecord(cur, record);
      await store.save(next);
      return next;
    },
    async findById(selectionId) {
      const cur = await store.read();
      return cur.records.find((r) => r.selectionId === selectionId) ?? null;
    },
    async findLatestForOperator(operatorId) {
      const cur = await store.read();
      const ofOperator = cur.records.filter((r) => r.operatorId === operatorId);
      if (ofOperator.length === 0) return null;
      return ofOperator[ofOperator.length - 1];
    },
    async save(state) {
      state.records = state.records.slice(-MVP_SELECTION_LIMIT);
      state.updatedAt = nowMs();
      g.__moodMvpSelectionMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodMvpSelectionMemory = undefined;
    },
  };
  return store;
}
