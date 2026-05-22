/**
 * WORLD STATE PERSISTENCE (Phase 26 — Unified Cognitive Field)
 *
 * The single persistence layer for the Phase 26 nervous system. It
 * persists, to data/memory/world-state.json:
 *
 *   - the evolving WorldState
 *   - the causal memory graph
 *   - cognition-trace snapshots (the system explaining itself)
 *   - cognitive-field snapshots
 *
 * Persistence supports LONG-TERM learning — not only the current
 * session. The world-state the system loads at the start of a run is
 * the world-state the last run left behind.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { WorldState } from './worldStateSimulation';
import { createInitialWorldState } from './worldStateSimulation';
import type { CausalMemoryGraph } from './causalMemoryGraph';
import { createEmptyCausalGraph } from './causalMemoryGraph';
import type { CognitionTrace } from './cognitionTrace';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'world-state.json';
const TRACE_LIMIT = 60;

export interface FieldSnapshot {
  bannerId: string;
  ts: number;
  worldStateConfidence: number;
  field_coherence: number;
  emergence_score: number;
  campaignAtmosphere: string;
}

export interface WorldStateBook {
  worldState: WorldState;
  causalGraph: CausalMemoryGraph;
  cognitionTraces: CognitionTrace[];
  fieldSnapshots: FieldSnapshot[];
}

const g = globalThis as unknown as { __moodWorldState?: WorldStateBook };

export interface WorldStatePersistenceStore {
  read(): Promise<WorldStateBook>;
  saveWorldState(state: WorldState): Promise<void>;
  saveCausalGraph(graph: CausalMemoryGraph): Promise<void>;
  recordCognitionTrace(trace: CognitionTrace): Promise<void>;
  recordFieldSnapshot(snapshot: FieldSnapshot): Promise<void>;
  reset(): Promise<void>;
}

export function createWorldStatePersistenceStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): WorldStatePersistenceStore {
  const filePath = path.join(dir, FILE);

  async function load(): Promise<WorldStateBook> {
    if (g.__moodWorldState) return g.__moodWorldState;
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(txt) as Partial<WorldStateBook>;
      g.__moodWorldState = {
        worldState: parsed.worldState ?? createInitialWorldState(),
        causalGraph: normaliseGraph(parsed.causalGraph),
        cognitionTraces: parsed.cognitionTraces ?? [],
        fieldSnapshots: parsed.fieldSnapshots ?? [],
      };
    } catch {
      g.__moodWorldState = {
        worldState: createInitialWorldState(),
        causalGraph: createEmptyCausalGraph(),
        cognitionTraces: [],
        fieldSnapshots: [],
      };
    }
    return g.__moodWorldState;
  }

  async function save(book: WorldStateBook) {
    await fs.mkdir(dir, { recursive: true });
    g.__moodWorldState = book;
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  }

  return {
    read: load,
    async saveWorldState(state) {
      const book = await load();
      book.worldState = state;
      await save(book);
    },
    async saveCausalGraph(graph) {
      const book = await load();
      book.causalGraph = graph;
      await save(book);
    },
    async recordCognitionTrace(trace) {
      const book = await load();
      book.cognitionTraces = [trace, ...book.cognitionTraces].slice(0, TRACE_LIMIT);
      await save(book);
    },
    async recordFieldSnapshot(snapshot) {
      const book = await load();
      book.fieldSnapshots = [snapshot, ...book.fieldSnapshots].slice(0, TRACE_LIMIT);
      await save(book);
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodWorldState = undefined;
    },
  };
}

function normaliseGraph(graph: CausalMemoryGraph | undefined): CausalMemoryGraph {
  if (!graph || typeof graph !== 'object') return createEmptyCausalGraph();
  return {
    nodes: graph.nodes ?? {},
    edges: Array.isArray(graph.edges) ? graph.edges : [],
  };
}
