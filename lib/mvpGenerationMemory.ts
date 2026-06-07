/**
 * MVP GENERATION MEMORY (FIFO · operator-supervised)
 *
 * Stores the LLM-generated outputs for a brand input: 2 one-liner
 * candidates · 10 hooks · 5 UGC scripts · 10 image concepts.
 *
 * Lives at data/memory/mvp-generation-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'mvp-generation-memory.json';

export const MVP_GENERATION_LIMIT = 128;

export interface OneLinerCandidate {
  id: string;
  text: string;
}

export interface HookItem {
  id: string;
  text: string;
  audience: string;
  situation: string;
  visualDirection: string;
  /** 0-100 internal commercial ranking · NOT shown to the user. */
  commercialScore: number;
}

export interface UgcScriptItem {
  id: string;
  title: string;
  durationSec: number;
  scriptHebrew: string;
  shotList: string[];
  callToActionHebrew: string;
}

export interface ImageConceptItem {
  id: string;
  title: string;
  visualDescription: string;
  forUseWith: string;
  renderingNote: string;
}

export type GenerationStatus = 'generating' | 'ready' | 'failed';

export interface GenerationRecord {
  generationId: string;
  brandInputId: string;
  operatorId: string;
  organizationId: string;
  workspaceId: string;
  oneLinerCandidates: OneLinerCandidate[];
  hooks: HookItem[];
  ugcScripts: UgcScriptItem[];
  imageConcepts: ImageConceptItem[];
  status: GenerationStatus;
  providerId: 'stub' | 'openai' | 'anthropic';
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface MvpGenerationMemoryState {
  records: GenerationRecord[];
  totalGenerations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialMvpGenerationMemory(): MvpGenerationMemoryState {
  return { records: [], totalGenerations: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __mvpGenSeq = 0;
export function newGenerationId(): string {
  __mvpGenSeq += 1;
  return `mvp-gen-${Date.now().toString(36)}-${__mvpGenSeq.toString(36)}`;
}

export function appendGenerationRecord(
  state: MvpGenerationMemoryState,
  record: GenerationRecord,
): MvpGenerationMemoryState {
  const records = [...state.records, record].slice(-MVP_GENERATION_LIMIT);
  return {
    ...state,
    records,
    totalGenerations: state.totalGenerations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function updateGenerationRecord(
  state: MvpGenerationMemoryState,
  generationId: string,
  patch: Partial<GenerationRecord>,
): MvpGenerationMemoryState {
  const idx = state.records.findIndex((r) => r.generationId === generationId);
  if (idx === -1) throw new Error(`generation not found: ${generationId}`);
  const next: GenerationRecord = { ...state.records[idx], ...patch };
  const records = [...state.records];
  records[idx] = next;
  return { ...state, records, updatedAt: nowMs() };
}

const g = globalThis as unknown as { __moodMvpGenerationMemory?: MvpGenerationMemoryState };

export interface MvpGenerationMemoryStore {
  read(): Promise<MvpGenerationMemoryState>;
  append(record: GenerationRecord): Promise<MvpGenerationMemoryState>;
  update(generationId: string, patch: Partial<GenerationRecord>): Promise<MvpGenerationMemoryState>;
  findById(generationId: string): Promise<GenerationRecord | null>;
  save(state: MvpGenerationMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createMvpGenerationMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): MvpGenerationMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: MvpGenerationMemoryStore = {
    async read() {
      if (g.__moodMvpGenerationMemory) return g.__moodMvpGenerationMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<MvpGenerationMemoryState>;
        g.__moodMvpGenerationMemory = { ...createInitialMvpGenerationMemory(), ...parsed };
      } catch {
        g.__moodMvpGenerationMemory = createInitialMvpGenerationMemory();
      }
      return g.__moodMvpGenerationMemory;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendGenerationRecord(cur, record);
      await store.save(next);
      return next;
    },
    async update(generationId, patch) {
      const cur = await store.read();
      const next = updateGenerationRecord(cur, generationId, patch);
      await store.save(next);
      return next;
    },
    async findById(generationId) {
      const cur = await store.read();
      return cur.records.find((r) => r.generationId === generationId) ?? null;
    },
    async save(state) {
      state.records = state.records.slice(-MVP_GENERATION_LIMIT);
      state.updatedAt = nowMs();
      g.__moodMvpGenerationMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodMvpGenerationMemory = undefined;
    },
  };
  return store;
}
