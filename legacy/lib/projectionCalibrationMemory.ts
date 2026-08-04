/**
 * PROJECTION CALIBRATION MEMORY
 *
 * Persistent FIFO memory of calibration snapshots. The engine itself
 * is pure — it reads branch-activation memory directly to produce
 * calibration annotations. This memory layer captures snapshots of
 * those annotations over time so the longitudinal view can surface
 * CALIBRATION DRIFT (e.g. accuracy 4.5/10 → 6.8/10 across snapshots).
 *
 * STRICTLY:
 *   - never modifies projections / scores
 *   - never auto-adjusts outcomes
 *   - append-only snapshots
 *   - same observation stream → same memory state
 *
 * Lives at data/memory/projection-calibration-memory.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'projection-calibration-memory.json';

export const CALIBRATION_SNAPSHOT_LIMIT = 64;
export const PER_TYPE_TRAJECTORY_LIMIT = 24;
export const PER_TYPE_DICTIONARY_LIMIT = 16;

// ─── snapshot ─────────────────────────────────────────────────

export interface CalibrationSnapshot {
  at: number;
  bannerId: string;
  overallConfidence: number;
  overallAccuracy: number;
  perTypeAccuracy: Record<string, number>;
}

// ─── state ─────────────────────────────────────────────────────

export interface ProjectionCalibrationMemoryState {
  snapshots: CalibrationSnapshot[];
  /** Per-projection-type accuracy trajectory (FIFO, last N samples). */
  perTypeAccuracyTrajectory: Record<string, number[]>;
  /** Cumulative observation counts per projection type. */
  perTypeSampleCounts: Record<string, number>;
  totalSnapshots: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialProjectionCalibrationMemory(): ProjectionCalibrationMemoryState {
  return {
    snapshots: [],
    perTypeAccuracyTrajectory: {},
    perTypeSampleCounts: {},
    totalSnapshots: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

function capRecord<T>(table: Record<string, T>, sortKey: (v: T) => number): Record<string, T> {
  if (Object.keys(table).length <= PER_TYPE_DICTIONARY_LIMIT) return table;
  const entries = Object.entries(table).sort((a, b) => sortKey(b[1]) - sortKey(a[1])).slice(0, PER_TYPE_DICTIONARY_LIMIT);
  return Object.fromEntries(entries);
}

export function applyCalibrationSnapshot(
  state: ProjectionCalibrationMemoryState,
  snapshot: CalibrationSnapshot,
): ProjectionCalibrationMemoryState {
  // Update per-type accuracy trajectory FIFO.
  const nextTrajectory = { ...state.perTypeAccuracyTrajectory };
  for (const [type, accuracy] of Object.entries(snapshot.perTypeAccuracy)) {
    const cur = nextTrajectory[type] ?? [];
    nextTrajectory[type] = [...cur, accuracy].slice(-PER_TYPE_TRAJECTORY_LIMIT);
  }
  // Update per-type sample counts.
  const nextCounts = { ...state.perTypeSampleCounts };
  for (const type of Object.keys(snapshot.perTypeAccuracy)) {
    nextCounts[type] = (nextCounts[type] ?? 0) + 1;
  }
  return {
    snapshots: [...state.snapshots, snapshot].slice(-CALIBRATION_SNAPSHOT_LIMIT),
    perTypeAccuracyTrajectory: capRecord(nextTrajectory, (v) => v.length),
    perTypeSampleCounts: capRecord(nextCounts, (v) => v),
    totalSnapshots: state.totalSnapshots + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? snapshot.at,
    updatedAt: snapshot.at,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as {
  __moodProjectionCalibration?: ProjectionCalibrationMemoryState;
};

export interface ProjectionCalibrationMemoryStore {
  read(): Promise<ProjectionCalibrationMemoryState>;
  append(snapshot: CalibrationSnapshot): Promise<ProjectionCalibrationMemoryState>;
  save(state: ProjectionCalibrationMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createProjectionCalibrationMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): ProjectionCalibrationMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: ProjectionCalibrationMemoryStore = {
    async read() {
      if (g.__moodProjectionCalibration) return g.__moodProjectionCalibration;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<ProjectionCalibrationMemoryState>;
        g.__moodProjectionCalibration = {
          ...createInitialProjectionCalibrationMemory(),
          ...parsed,
          perTypeAccuracyTrajectory: { ...(parsed.perTypeAccuracyTrajectory ?? {}) },
          perTypeSampleCounts:       { ...(parsed.perTypeSampleCounts ?? {}) },
        };
      } catch {
        g.__moodProjectionCalibration = createInitialProjectionCalibrationMemory();
      }
      return g.__moodProjectionCalibration;
    },
    async append(snapshot) {
      const cur = await store.read();
      const next = applyCalibrationSnapshot(cur, snapshot);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.snapshots = state.snapshots.slice(-CALIBRATION_SNAPSHOT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodProjectionCalibration = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodProjectionCalibration = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordCalibrationSnapshot(
  snapshot: CalibrationSnapshot,
): Promise<void> {
  try {
    await createProjectionCalibrationMemoryStore().append(snapshot);
  } catch {
    // non-fatal — never blocks generation
  }
}
