/**
 * OPERATOR CREATIVE TRIAL MEMORY (FIFO, operator-supervised)
 *
 * Persistent store of OPERATOR-APPROVED trial decisions over sandbox
 * candidates. Every entry is the explicit result of an operator
 * choice — the memory never auto-creates trials, never auto-selects
 * candidates, never executes a mutation.
 *
 * STRICT CONTRACT:
 *   - append + status-update are the only mutating operations
 *   - both require operator credentials at the route layer
 *   - the store NEVER triggers generation or publishing
 *   - FIFO-capped
 *
 * Lives at data/memory/operator-creative-trial-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'operator-creative-trial-memory.json';

export const TRIAL_LIMIT = 128;

// ─── types ────────────────────────────────────────────────────

export type TrialStatus =
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'tested'
  | 'outcome-attached';

export interface OperatorCreativeTrial {
  trialId: string;
  /** Time the trial was created. */
  createdAt: number;
  /** Time the status was last changed. */
  updatedAt: number;
  operatorId: string;
  sourceCandidateId: string;
  formula: string;
  campaignMode: string | null;
  mutationType: string;
  fingerprintDelta: string;
  operatorReason: string;
  status: TrialStatus;
  /** Optional outcome id linking back to outcome-memory once recorded. */
  outcomeId?: string;
  /** Audit trail of status transitions (append-only inside this record). */
  statusHistory: Array<{
    at: number;
    status: TrialStatus;
    operatorId: string;
    note?: string;
  }>;
}

// ─── state ────────────────────────────────────────────────────

export interface OperatorTrialMemoryState {
  trials: OperatorCreativeTrial[];
  totalTrials: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialOperatorTrialMemory(): OperatorTrialMemoryState {
  return { trials: [], totalTrials: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── store ────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodOperatorTrial?: OperatorTrialMemoryState };

export interface OperatorTrialMemoryStore {
  read(): Promise<OperatorTrialMemoryState>;
  append(trial: OperatorCreativeTrial): Promise<OperatorTrialMemoryState>;
  /** Update a trial's status. Append-only on the status history.
   *  Throws if the trial id is unknown. */
  updateStatus(args: {
    trialId: string;
    status: TrialStatus;
    operatorId: string;
    note?: string;
    outcomeId?: string;
  }): Promise<OperatorTrialMemoryState>;
  save(state: OperatorTrialMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createOperatorTrialMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): OperatorTrialMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: OperatorTrialMemoryStore = {
    async read() {
      if (g.__moodOperatorTrial) return g.__moodOperatorTrial;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<OperatorTrialMemoryState>;
        g.__moodOperatorTrial = { ...createInitialOperatorTrialMemory(), ...parsed };
      } catch {
        g.__moodOperatorTrial = createInitialOperatorTrialMemory();
      }
      return g.__moodOperatorTrial;
    },
    async append(trial) {
      const cur = await store.read();
      const next: OperatorTrialMemoryState = {
        ...cur,
        trials: [...cur.trials, trial].slice(-TRIAL_LIMIT),
        totalTrials: cur.totalTrials + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? trial.createdAt,
        updatedAt: nowMs(),
      };
      await store.save(next);
      return next;
    },
    async updateStatus({ trialId, status, operatorId, note, outcomeId }) {
      const cur = await store.read();
      const idx = cur.trials.findIndex((t) => t.trialId === trialId);
      if (idx === -1) {
        throw new Error(`trial id ${trialId} not found`);
      }
      const prev = cur.trials[idx];
      const updated: OperatorCreativeTrial = {
        ...prev,
        status,
        updatedAt: nowMs(),
        outcomeId: outcomeId ?? prev.outcomeId,
        statusHistory: [
          ...prev.statusHistory,
          { at: nowMs(), status, operatorId, note },
        ],
      };
      const trials = [...cur.trials];
      trials[idx] = updated;
      const next: OperatorTrialMemoryState = { ...cur, trials, updatedAt: nowMs() };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.trials = state.trials.slice(-TRIAL_LIMIT);
      state.updatedAt = nowMs();
      g.__moodOperatorTrial = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodOperatorTrial = undefined;
    },
  };
  return store;
}

// ─── id helper ────────────────────────────────────────────────

/** Deterministic-ish trial id. Includes a millisecond timestamp and
 *  a short random suffix. The id is only used as a join key — the
 *  memory store does not derive any semantics from its value. */
export function newTrialId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36).padStart(4, '0');
  return `trial-${ts}-${rand}`;
}
