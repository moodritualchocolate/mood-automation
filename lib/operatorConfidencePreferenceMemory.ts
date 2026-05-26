/**
 * OPERATOR CONFIDENCE PREFERENCE MEMORY
 *
 * Persistent store of operator-set confidence-weight sliders.
 *
 * Keeps two parallel structures:
 *   - `current` — the latest preference per (operatorId, projectionType)
 *   - `history` — FIFO log of every update so the longitudinal view
 *                 can surface preference drift over time
 *
 * STRICTLY visual / annotation memory — never consumed by any other
 * engine, never applied to projections / scores / rankings /
 * critic / generation.
 *
 * Lives at data/memory/operator-confidence-preference-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  KNOWN_PROJECTION_TYPES, type KnownProjectionType,
  type OperatorPreference, preferenceKey,
} from './operatorConfidencePreference';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'operator-confidence-preference-memory.json';

export const HISTORY_LIMIT = 128;
/** Cap on distinct operators tracked in the current map. */
export const OPERATOR_LIMIT = 32;

// ─── state ─────────────────────────────────────────────────────

export interface OperatorConfidencePreferenceMemoryState {
  /** Current preference per (operatorId|projectionType). */
  current: Record<string, OperatorPreference>;
  /** FIFO log of every update. */
  history: OperatorPreference[];
  /** Per-operator update counts. */
  operatorUpdateCounts: Record<string, number>;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialOperatorConfidencePreferenceMemory(): OperatorConfidencePreferenceMemoryState {
  return {
    current: {},
    history: [],
    operatorUpdateCounts: {},
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

function capCurrent(
  table: Record<string, OperatorPreference>,
): Record<string, OperatorPreference> {
  if (Object.keys(table).length <= OPERATOR_LIMIT * KNOWN_PROJECTION_TYPES.length) return table;
  // Drop least-recently-updated entries first.
  const entries = Object.entries(table).sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, OPERATOR_LIMIT * KNOWN_PROJECTION_TYPES.length);
  return Object.fromEntries(entries);
}

export function applyPreferenceUpdate(
  state: OperatorConfidencePreferenceMemoryState,
  pref: OperatorPreference,
): OperatorConfidencePreferenceMemoryState {
  const key = preferenceKey(pref.operatorId, pref.projectionType);
  return {
    current: capCurrent({ ...state.current, [key]: pref }),
    history: [...state.history, pref].slice(-HISTORY_LIMIT),
    operatorUpdateCounts: {
      ...state.operatorUpdateCounts,
      [pref.operatorId]: (state.operatorUpdateCounts[pref.operatorId] ?? 0) + 1,
    },
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? pref.updatedAt,
    updatedAt: pref.updatedAt,
  };
}

// ─── lookup helpers ───────────────────────────────────────────

export function getCurrentPreference(
  state: OperatorConfidencePreferenceMemoryState,
  operatorId: string,
  projectionType: KnownProjectionType,
): OperatorPreference | null {
  return state.current[preferenceKey(operatorId, projectionType)] ?? null;
}

export function getAllPreferencesForOperator(
  state: OperatorConfidencePreferenceMemoryState,
  operatorId: string,
): OperatorPreference[] {
  const out: OperatorPreference[] = [];
  for (const t of KNOWN_PROJECTION_TYPES) {
    const p = getCurrentPreference(state, operatorId, t);
    if (p) out.push(p);
  }
  return out;
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as {
  __moodOperatorConfidencePreference?: OperatorConfidencePreferenceMemoryState;
};

export interface OperatorConfidencePreferenceMemoryStore {
  read(): Promise<OperatorConfidencePreferenceMemoryState>;
  update(pref: OperatorPreference): Promise<OperatorConfidencePreferenceMemoryState>;
  save(state: OperatorConfidencePreferenceMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createOperatorConfidencePreferenceMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): OperatorConfidencePreferenceMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: OperatorConfidencePreferenceMemoryStore = {
    async read() {
      if (g.__moodOperatorConfidencePreference) return g.__moodOperatorConfidencePreference;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<OperatorConfidencePreferenceMemoryState>;
        g.__moodOperatorConfidencePreference = {
          ...createInitialOperatorConfidencePreferenceMemory(),
          ...parsed,
          current: { ...(parsed.current ?? {}) },
          operatorUpdateCounts: { ...(parsed.operatorUpdateCounts ?? {}) },
        };
      } catch {
        g.__moodOperatorConfidencePreference = createInitialOperatorConfidencePreferenceMemory();
      }
      return g.__moodOperatorConfidencePreference;
    },
    async update(pref) {
      const cur = await store.read();
      const next = applyPreferenceUpdate(cur, pref);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.history = state.history.slice(-HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodOperatorConfidencePreference = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodOperatorConfidencePreference = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordPreferenceUpdate(
  pref: OperatorPreference,
): Promise<OperatorConfidencePreferenceMemoryState | null> {
  try {
    return await createOperatorConfidencePreferenceMemoryStore().update(pref);
  } catch {
    return null;
  }
}
