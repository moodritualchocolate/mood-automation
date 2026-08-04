/**
 * RUNTIME MEMORY STORE (Phase 27 — Persistent Cognitive Runtime)
 *
 * The centralized long-term memory persistence for the runtime. Until
 * Phase 27 persistence was scattered across per-engine stores; this
 * store is the single place the runtime's continuity lives.
 *
 * File-based for now, structured for a future DB migration:
 *
 *   data/runtime/
 *     global-runtime.json          — cross-campaign counters
 *     campaigns/{campaignId}/
 *       runtime.json               — the campaign's RuntimeBook
 *
 * The RuntimeBook holds the campaign's runtime history, the standing
 * next-run directive, rejection + approval memory, and runtime traces.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { NextRunDirective } from './nextRunDirective';
import { emptyNextRunDirective } from './nextRunDirective';
import type { RejectionRecord } from './rejectionMemory';
import type { ApprovalRecord } from './approvalMemory';
import type { RuntimeTrace } from './runtimeTrace';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const HISTORY_LIMIT = 60;
const MEMORY_LIMIT = 80;

export interface RuntimeHistoryEntry {
  generationIndex: number;
  ts: number;
  verdict: string;
  dominantTruth: string;
  emotionalTerritory: string;          // state family
  symbolicObjects: string[];
  worldStateGen: number;
  emergence: number;
  fieldCoherence: number;
  continuityScore: number;
  silenceLevel: number;                // restraint, 0..10
}

export interface PriorStateSummary {
  generationIndex: number;
  ts: number;
  verdict: string;
  dominantTruth: string;
  emotionalTerritory: string;
  campaignAtmosphere: string;
  worldStateGen: number;
  continuityScore: number;
  directorMemo: string;
}

export interface RuntimeBook {
  campaignId: string;
  generationIndex: number;             // total runs attempted for this campaign
  approvedCount: number;
  rejectedCount: number;
  history: RuntimeHistoryEntry[];
  nextRunDirective: NextRunDirective;
  rejectionMemory: RejectionRecord[];
  approvalMemory: ApprovalRecord[];
  traces: RuntimeTrace[];
  lastState: PriorStateSummary | null;
}

export interface GlobalRuntime {
  totalRuns: number;
  totalApproved: number;
  totalRejected: number;
  campaigns: string[];
  updatedAt: number;
}

function emptyBook(campaignId: string): RuntimeBook {
  return {
    campaignId,
    generationIndex: 0,
    approvedCount: 0,
    rejectedCount: 0,
    history: [],
    nextRunDirective: emptyNextRunDirective(),
    rejectionMemory: [],
    approvalMemory: [],
    traces: [],
    lastState: null,
  };
}

const g = globalThis as unknown as { __moodRuntime?: Record<string, RuntimeBook> };

export interface RuntimeMemoryStore {
  campaignId: string;
  read(): Promise<RuntimeBook>;
  save(book: RuntimeBook): Promise<void>;
  readGlobal(): Promise<GlobalRuntime>;
  bumpGlobal(approved: boolean): Promise<void>;
  reset(): Promise<void>;
}

export function createRuntimeMemoryStore(
  campaignId: string,
  dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR,
): RuntimeMemoryStore {
  const campaignDir = path.join(dir, 'campaigns', campaignId);
  const bookPath = path.join(campaignDir, 'runtime.json');
  const globalPath = path.join(dir, 'global-runtime.json');

  async function read(): Promise<RuntimeBook> {
    if (!g.__moodRuntime) g.__moodRuntime = {};
    if (g.__moodRuntime[campaignId]) return g.__moodRuntime[campaignId];
    try {
      const txt = await fs.readFile(bookPath, 'utf8');
      const parsed = JSON.parse(txt) as RuntimeBook;
      // Defensive normalisation — the schema may have evolved.
      g.__moodRuntime[campaignId] = {
        ...emptyBook(campaignId),
        ...parsed,
        nextRunDirective: parsed.nextRunDirective ?? emptyNextRunDirective(),
        history: parsed.history ?? [],
        rejectionMemory: parsed.rejectionMemory ?? [],
        approvalMemory: parsed.approvalMemory ?? [],
        traces: parsed.traces ?? [],
      };
    } catch {
      g.__moodRuntime[campaignId] = emptyBook(campaignId);
    }
    return g.__moodRuntime[campaignId];
  }

  async function save(book: RuntimeBook): Promise<void> {
    book.history = book.history.slice(0, HISTORY_LIMIT);
    book.rejectionMemory = book.rejectionMemory.slice(0, MEMORY_LIMIT);
    book.approvalMemory = book.approvalMemory.slice(0, MEMORY_LIMIT);
    book.traces = book.traces.slice(0, HISTORY_LIMIT);
    if (!g.__moodRuntime) g.__moodRuntime = {};
    g.__moodRuntime[campaignId] = book;
    await fs.mkdir(campaignDir, { recursive: true });
    await fs.writeFile(bookPath, JSON.stringify(book, null, 2));
  }

  async function readGlobal(): Promise<GlobalRuntime> {
    try {
      const txt = await fs.readFile(globalPath, 'utf8');
      return JSON.parse(txt) as GlobalRuntime;
    } catch {
      return { totalRuns: 0, totalApproved: 0, totalRejected: 0, campaigns: [], updatedAt: Date.now() };
    }
  }

  async function bumpGlobal(approved: boolean): Promise<void> {
    const glob = await readGlobal();
    glob.totalRuns += 1;
    if (approved) glob.totalApproved += 1;
    else glob.totalRejected += 1;
    if (!glob.campaigns.includes(campaignId)) glob.campaigns.push(campaignId);
    glob.updatedAt = Date.now();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(globalPath, JSON.stringify(glob, null, 2));
  }

  async function reset(): Promise<void> {
    try { await fs.rm(campaignDir, { recursive: true, force: true }); } catch { /* idempotent */ }
    if (g.__moodRuntime) delete g.__moodRuntime[campaignId];
  }

  return { campaignId, read, save, readGlobal, bumpGlobal, reset };
}
