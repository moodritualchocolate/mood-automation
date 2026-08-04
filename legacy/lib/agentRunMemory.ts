/**
 * AGENT RUN MEMORY (FIFO, operator-supervised)
 *
 * Persistent FIFO of AGENT RUN RECORDS. Each record is created by
 * the operator (POST action=execute on /api/agent), transitions
 * through `pending → approved | rejected | archived` exclusively by
 * operator action. The agent NEVER approves its own runs.
 *
 * STRICT CONTRACT:
 *   - the memory NEVER auto-creates runs
 *   - the memory NEVER auto-transitions status
 *   - the memory NEVER triggers any outbound action
 *   - FIFO-capped
 *
 * Lives at data/memory/agent-run-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { AgentId } from './agents/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'agent-run-memory.json';

export const AGENT_RUN_LIMIT = 256;

// ─── types ────────────────────────────────────────────────────

export type AgentRunStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface AgentRunStep {
  at: number;
  status: AgentRunStatus;
  operatorId: string;
  reason?: string;
}

export interface AgentRunRecord {
  runId: string;
  agentId: AgentId;
  /** Operator label for the run. */
  label: string;
  /** Frozen input the agent consumed. */
  input: unknown;
  /** Frozen output the agent produced. */
  output: unknown;
  createdAt: number;
  operatorId: string;
  status: AgentRunStatus;
  history: AgentRunStep[];
  operatorNote?: string;
}

// ─── state ────────────────────────────────────────────────────

export interface AgentRunMemoryState {
  runs: AgentRunRecord[];
  totalRuns: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialAgentRunMemory(): AgentRunMemoryState {
  return { runs: [], totalRuns: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __runSeq = 0;
export function newAgentRunId(): string {
  __runSeq += 1;
  return `agent-run-${Date.now().toString(36)}-${__runSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendAgentRun(state: AgentRunMemoryState, record: AgentRunRecord): AgentRunMemoryState {
  return {
    ...state,
    runs: [...state.runs, record].slice(-AGENT_RUN_LIMIT),
    totalRuns: state.totalRuns + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}
export function applyAgentRunStep(
  state: AgentRunMemoryState, runId: string, step: AgentRunStep,
): AgentRunMemoryState {
  const idx = state.runs.findIndex((r) => r.runId === runId);
  if (idx === -1) throw new Error(`agent run not found: ${runId}`);
  const prev = state.runs[idx];
  const next: AgentRunRecord = {
    ...prev, status: step.status, history: [...prev.history, step],
  };
  const runs = [...state.runs];
  runs[idx] = next;
  return { ...state, runs, updatedAt: step.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodAgentRuns?: AgentRunMemoryState };

export interface AgentRunMemoryStore {
  read(): Promise<AgentRunMemoryState>;
  append(record: AgentRunRecord): Promise<AgentRunMemoryState>;
  updateStatus(runId: string, step: AgentRunStep): Promise<AgentRunMemoryState>;
  save(state: AgentRunMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createAgentRunMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): AgentRunMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: AgentRunMemoryStore = {
    async read() {
      if (g.__moodAgentRuns) return g.__moodAgentRuns;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<AgentRunMemoryState>;
        g.__moodAgentRuns = { ...createInitialAgentRunMemory(), ...parsed };
      } catch {
        g.__moodAgentRuns = createInitialAgentRunMemory();
      }
      return g.__moodAgentRuns;
    },
    async append(record) {
      const cur = await store.read();
      const next = appendAgentRun(cur, record);
      await store.save(next);
      return next;
    },
    async updateStatus(runId, step) {
      const cur = await store.read();
      const next = applyAgentRunStep(cur, runId, step);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.runs = state.runs.slice(-AGENT_RUN_LIMIT);
      state.updatedAt = nowMs();
      g.__moodAgentRuns = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodAgentRuns = undefined;
    },
  };
  return store;
}
