/**
 * TASK MEMORY (FIFO, operator-supervised)
 *
 * Phase 3 — Operations Layer.
 *
 * Persistent store of TASKS — operator-created work items with
 * priority, status, dependencies, deadlines, and optional campaign
 * + asset linkage.
 *
 * STRICT CONTRACT:
 *   - the memory never auto-creates tasks
 *   - the memory never auto-progresses status
 *   - the memory never sends notifications
 *
 * Lives at data/memory/task-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'task-memory.json';

export const TASK_LIMIT = 512;

// ─── types ────────────────────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus =
  | 'backlog' | 'in-progress' | 'blocked' | 'review' | 'done' | 'archived';

export interface TaskStep {
  at: number;
  status: TaskStatus;
  operatorId: string;
  reason?: string;
}

export interface TaskRecord {
  taskId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** Other task ids this task depends on. */
  dependencyTaskIds: string[];
  /** Optional deadline (epoch ms). */
  deadlineAt?: number;
  /** Optional linked campaign id. */
  linkedCampaignId?: string;
  /** Optional linked asset id. */
  linkedAssetId?: string;
  /** Assigned team member id (optional). */
  assignedMemberId?: string;
  createdAt: number;
  operatorId: string;
  statusHistory: TaskStep[];
  operatorNote?: string;
}

// ─── state ────────────────────────────────────────────────────

export interface TaskMemoryState {
  tasks: TaskRecord[];
  totalTasks: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialTaskMemory(): TaskMemoryState {
  return { tasks: [], totalTasks: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __taskSeq = 0;
export function newTaskId(): string {
  __taskSeq += 1;
  return `task-${Date.now().toString(36)}-${__taskSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendTaskRecord(state: TaskMemoryState, record: TaskRecord): TaskMemoryState {
  return {
    ...state,
    tasks: [...state.tasks, record].slice(-TASK_LIMIT),
    totalTasks: state.totalTasks + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}
export function applyTaskStep(state: TaskMemoryState, taskId: string, step: TaskStep): TaskMemoryState {
  const idx = state.tasks.findIndex((t) => t.taskId === taskId);
  if (idx === -1) throw new Error(`task not found: ${taskId}`);
  const prev = state.tasks[idx];
  const next: TaskRecord = {
    ...prev,
    status: step.status,
    statusHistory: [...prev.statusHistory, step],
  };
  const tasks = [...state.tasks];
  tasks[idx] = next;
  return { ...state, tasks, updatedAt: step.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodTask?: TaskMemoryState };

export interface TaskMemoryStore {
  read(): Promise<TaskMemoryState>;
  save(state: TaskMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createTaskMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): TaskMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: TaskMemoryStore = {
    async read() {
      if (g.__moodTask) return g.__moodTask;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<TaskMemoryState>;
        g.__moodTask = { ...createInitialTaskMemory(), ...parsed };
      } catch {
        g.__moodTask = createInitialTaskMemory();
      }
      return g.__moodTask;
    },
    async save(state) {
      state.tasks = state.tasks.slice(-TASK_LIMIT);
      state.updatedAt = nowMs();
      g.__moodTask = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodTask = undefined;
    },
  };
  return store;
}
