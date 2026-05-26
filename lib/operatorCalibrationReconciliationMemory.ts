/**
 * OPERATOR CALIBRATION RECONCILIATION MEMORY
 *
 * Persistent FIFO memory of reconciliation snapshots. The engine
 * itself reads system calibration + operator preferences directly to
 * produce annotations. This memory layer tracks DIVERGENCE TRAJECTORIES
 * per (operatorId, projectionType) so the longitudinal view can
 * surface convergence / chronic-disagreement / unstable-intuition
 * patterns over time.
 *
 * STRICTLY:
 *   - never modifies operator sliders or system calibration
 *   - never auto-adjusts anything
 *   - append-only on snapshot events
 *   - same observation stream → same memory state
 *
 * Lives at data/memory/operator-calibration-reconciliation-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'operator-calibration-reconciliation-memory.json';

export const RECONCILIATION_SNAPSHOT_LIMIT = 64;
export const PER_TYPE_TRAJECTORY_LIMIT = 24;
export const PER_TYPE_DICTIONARY_LIMIT = 48;

// ─── trace point ──────────────────────────────────────────────

export interface DivergenceTracePoint {
  timestamp: number;
  system: number;
  operator: number;
  delta: number;            // operator - system
}

// ─── snapshot ─────────────────────────────────────────────────

export interface ReconciliationSnapshot {
  at: number;
  bannerId: string;
  operatorId: string;
  /** Per-projection-type reconciliation summary captured this run. */
  perTypeSummary: Record<string, {
    system: number;
    operator: number;
    agreement: number;
    relationship: string;
  }>;
}

// ─── state ─────────────────────────────────────────────────────

export interface OperatorCalibrationReconciliationMemoryState {
  snapshots: ReconciliationSnapshot[];
  /** Per-(operatorId|projectionType) divergence trajectory FIFO. */
  perTypeTrajectory: Record<string, DivergenceTracePoint[]>;
  /** Per-(operatorId|projectionType) count of recurring relationships. */
  relationshipCounts: Record<string, Record<string, number>>;
  /** Per-operator update counts. */
  operatorUpdateCounts: Record<string, number>;
  totalSnapshots: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialOperatorCalibrationReconciliationMemory(): OperatorCalibrationReconciliationMemoryState {
  return {
    snapshots: [],
    perTypeTrajectory: {},
    relationshipCounts: {},
    operatorUpdateCounts: {},
    totalSnapshots: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

function trajectoryKey(operatorId: string, projectionType: string): string {
  return `${operatorId}|${projectionType}`;
}

function capRecord<T>(table: Record<string, T>, sortKey: (v: T) => number): Record<string, T> {
  if (Object.keys(table).length <= PER_TYPE_DICTIONARY_LIMIT) return table;
  const entries = Object.entries(table).sort((a, b) => sortKey(b[1]) - sortKey(a[1])).slice(0, PER_TYPE_DICTIONARY_LIMIT);
  return Object.fromEntries(entries);
}

export function applyReconciliationSnapshot(
  state: OperatorCalibrationReconciliationMemoryState,
  snapshot: ReconciliationSnapshot,
): OperatorCalibrationReconciliationMemoryState {
  const nextTrajectory = { ...state.perTypeTrajectory };
  const nextRelationshipCounts = { ...state.relationshipCounts };
  for (const [type, summary] of Object.entries(snapshot.perTypeSummary)) {
    const k = trajectoryKey(snapshot.operatorId, type);
    const cur = nextTrajectory[k] ?? [];
    nextTrajectory[k] = [...cur, {
      timestamp: snapshot.at,
      system: summary.system,
      operator: summary.operator,
      delta: summary.operator - summary.system,
    }].slice(-PER_TYPE_TRAJECTORY_LIMIT);

    const curRel = nextRelationshipCounts[k] ?? {};
    nextRelationshipCounts[k] = {
      ...curRel,
      [summary.relationship]: (curRel[summary.relationship] ?? 0) + 1,
    };
  }

  return {
    snapshots: [...state.snapshots, snapshot].slice(-RECONCILIATION_SNAPSHOT_LIMIT),
    perTypeTrajectory: capRecord(nextTrajectory, (v) => v.length),
    relationshipCounts: capRecord(nextRelationshipCounts, (v) => Object.values(v).reduce((a, b) => a + b, 0)),
    operatorUpdateCounts: {
      ...state.operatorUpdateCounts,
      [snapshot.operatorId]: (state.operatorUpdateCounts[snapshot.operatorId] ?? 0) + 1,
    },
    totalSnapshots: state.totalSnapshots + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? snapshot.at,
    updatedAt: snapshot.at,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as {
  __moodOperatorCalibrationReconciliation?: OperatorCalibrationReconciliationMemoryState;
};

export interface OperatorCalibrationReconciliationMemoryStore {
  read(): Promise<OperatorCalibrationReconciliationMemoryState>;
  append(snapshot: ReconciliationSnapshot): Promise<OperatorCalibrationReconciliationMemoryState>;
  save(state: OperatorCalibrationReconciliationMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createOperatorCalibrationReconciliationMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): OperatorCalibrationReconciliationMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: OperatorCalibrationReconciliationMemoryStore = {
    async read() {
      if (g.__moodOperatorCalibrationReconciliation) return g.__moodOperatorCalibrationReconciliation;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<OperatorCalibrationReconciliationMemoryState>;
        g.__moodOperatorCalibrationReconciliation = {
          ...createInitialOperatorCalibrationReconciliationMemory(),
          ...parsed,
          perTypeTrajectory:   { ...(parsed.perTypeTrajectory ?? {}) },
          relationshipCounts:  { ...(parsed.relationshipCounts ?? {}) },
          operatorUpdateCounts:{ ...(parsed.operatorUpdateCounts ?? {}) },
        };
      } catch {
        g.__moodOperatorCalibrationReconciliation = createInitialOperatorCalibrationReconciliationMemory();
      }
      return g.__moodOperatorCalibrationReconciliation;
    },
    async append(snapshot) {
      const cur = await store.read();
      const next = applyReconciliationSnapshot(cur, snapshot);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.snapshots = state.snapshots.slice(-RECONCILIATION_SNAPSHOT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodOperatorCalibrationReconciliation = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodOperatorCalibrationReconciliation = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordReconciliationSnapshot(
  snapshot: ReconciliationSnapshot,
): Promise<void> {
  try {
    await createOperatorCalibrationReconciliationMemoryStore().append(snapshot);
  } catch {
    // non-fatal — never blocks generation
  }
}
