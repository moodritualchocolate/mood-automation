/**
 * STORY BLUEPRINT MEMORY (FIFO, append-only)
 *
 * Persistent FIFO of STORY BLUEPRINT SNAPSHOTS — passive observations
 * of exploratory story structures at a moment in time.
 *
 * STRICT CONTRACT:
 *   - the memory stores OBSERVATIONS only
 *   - no execution history
 *   - no generation history
 *   - no publishing history
 *   - FIFO-capped at 128
 *
 * Lives at data/memory/story-blueprint-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { RiskLevel } from './storyRiskEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'story-blueprint-memory.json';

export const STORY_BLUEPRINT_SNAPSHOT_LIMIT = 128;

// ─── snapshot ────────────────────────────────────────────────

export interface BlueprintObservation {
  blueprintId: string;
  storyName: string;
  alignment: number;
  riskLevel: RiskLevel;
  dignityProtection: number;
  manipulationRisk: number;
}

export interface StoryBlueprintSnapshot {
  at: number;
  blueprintObservations: BlueprintObservation[];
  dominantHumanTensions: string[];
  dominantArcs: string[];
  dominantMemoryAnchors: string[];
  dominantPresenceAnchors: string[];
  riskWarningCount: number;
  unresolvedQuestionCount: number;
  observationCount: number;
}

export interface StoryBlueprintMemoryState {
  snapshots: StoryBlueprintSnapshot[];
  totalSnapshots: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialStoryBlueprintMemory(): StoryBlueprintMemoryState {
  return { snapshots: [], totalSnapshots: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── pure transform ──────────────────────────────────────────

export function appendStoryBlueprintSnapshot(
  state: StoryBlueprintMemoryState,
  snapshot: StoryBlueprintSnapshot,
): StoryBlueprintMemoryState {
  const snapshots = [...state.snapshots, snapshot].slice(-STORY_BLUEPRINT_SNAPSHOT_LIMIT);
  return {
    ...state,
    snapshots,
    totalSnapshots: state.totalSnapshots + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? snapshot.at,
    updatedAt: snapshot.at,
  };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodStoryBlueprint?: StoryBlueprintMemoryState };

export interface StoryBlueprintMemoryStore {
  read(): Promise<StoryBlueprintMemoryState>;
  append(snapshot: StoryBlueprintSnapshot): Promise<StoryBlueprintMemoryState>;
  save(state: StoryBlueprintMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createStoryBlueprintMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): StoryBlueprintMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: StoryBlueprintMemoryStore = {
    async read() {
      if (g.__moodStoryBlueprint) return g.__moodStoryBlueprint;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<StoryBlueprintMemoryState>;
        g.__moodStoryBlueprint = { ...createInitialStoryBlueprintMemory(), ...parsed };
      } catch {
        g.__moodStoryBlueprint = createInitialStoryBlueprintMemory();
      }
      return g.__moodStoryBlueprint;
    },
    async append(snapshot) {
      const cur = await store.read();
      const next = appendStoryBlueprintSnapshot(cur, snapshot);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.snapshots = state.snapshots.slice(-STORY_BLUEPRINT_SNAPSHOT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodStoryBlueprint = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodStoryBlueprint = undefined;
    },
  };
  return store;
}
