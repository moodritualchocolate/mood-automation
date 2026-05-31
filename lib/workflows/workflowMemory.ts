/**
 * WORKFLOW MEMORY (FIFO, operator-supervised)
 *
 * Persistent FIFO of workflow records. Each record is created by the
 * operator (POST /api/workflows). State transitions are exclusively
 * operator-driven. The memory NEVER auto-creates a workflow, NEVER
 * auto-transitions a status, NEVER triggers any outbound action.
 *
 * Lives at data/memory/workflow-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { WorkflowPlan } from './workflowOrchestrator';
import type { WorkflowTemplateId } from './workflowTemplates';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'workflow-memory.json';

export const WORKFLOW_LIMIT = 256;
export const WORKFLOW_BOTTLENECK_LIMIT = 32;
export const WORKFLOW_OUTCOME_LIMIT = 32;
export const WORKFLOW_OPERATOR_NOTE_LIMIT = 64;

// ─── types ───────────────────────────────────────────────────

export type WorkflowStatus =
  | 'draft' | 'active' | 'blocked' | 'completed' | 'abandoned';

export interface WorkflowStep {
  at: number;
  status: WorkflowStatus;
  operatorId: string;
  reason: string;
}

export interface WorkflowBottleneck {
  at: number;
  stepId: string;
  /** Operator-facing reason for the bottleneck. */
  reason: string;
  operatorId: string;
  /** Optional resolution timestamp. */
  resolvedAt?: number;
}

export interface WorkflowOutcome {
  at: number;
  /** Operator-facing outcome note. */
  note: string;
  operatorId: string;
}

export interface WorkflowOperatorNote {
  at: number;
  note: string;
  operatorId: string;
}

export interface WorkflowRecord {
  workflowId: string;
  templateId: WorkflowTemplateId;
  /** Tenancy stamp. */
  organizationId: string;
  workspaceId: string;
  /** Operator-facing label. */
  label: string;
  /** Frozen plan emitted by the orchestrator at creation time. */
  plan: WorkflowPlan;
  status: WorkflowStatus;
  /** Current step pointer (matches plan.steps[*].stepId). */
  currentStepId: string | null;
  /** Step ids the operator marked completed. */
  completedStepIds: string[];
  createdAt: number;
  operatorId: string;
  history: WorkflowStep[];
  bottlenecks: WorkflowBottleneck[];
  outcomes: WorkflowOutcome[];
  operatorNotes: WorkflowOperatorNote[];
  operatorNote?: string;
}

// ─── state ───────────────────────────────────────────────────

export interface WorkflowMemoryState {
  workflows: WorkflowRecord[];
  totalWorkflows: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialWorkflowMemory(): WorkflowMemoryState {
  return { workflows: [], totalWorkflows: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __wfSeq = 0;
export function newWorkflowId(): string {
  __wfSeq += 1;
  return `workflow-${Date.now().toString(36)}-${__wfSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendWorkflow(
  state: WorkflowMemoryState, record: WorkflowRecord,
): WorkflowMemoryState {
  if (state.workflows.some((w) => w.workflowId === record.workflowId)) {
    throw new Error(`workflow already exists: ${record.workflowId}`);
  }
  return {
    ...state,
    workflows: [...state.workflows, record].slice(-WORKFLOW_LIMIT),
    totalWorkflows: state.totalWorkflows + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function applyWorkflowStep(
  state: WorkflowMemoryState, workflowId: string, step: WorkflowStep,
): WorkflowMemoryState {
  const idx = state.workflows.findIndex((w) => w.workflowId === workflowId);
  if (idx === -1) throw new Error(`workflow not found: ${workflowId}`);
  const prev = state.workflows[idx];
  if (prev.status === 'completed' && step.status !== 'completed') {
    throw new Error(`workflow already completed: ${workflowId}`);
  }
  if (prev.status === 'abandoned') {
    throw new Error(`workflow abandoned: ${workflowId}`);
  }
  const next: WorkflowRecord = {
    ...prev, status: step.status, history: [...prev.history, step],
  };
  const workflows = [...state.workflows];
  workflows[idx] = next;
  return { ...state, workflows, updatedAt: step.at };
}

export function advanceWorkflowStep(
  state: WorkflowMemoryState, workflowId: string, stepId: string, at: number, operatorId: string, reason: string,
): WorkflowMemoryState {
  const idx = state.workflows.findIndex((w) => w.workflowId === workflowId);
  if (idx === -1) throw new Error(`workflow not found: ${workflowId}`);
  const prev = state.workflows[idx];
  if (prev.status === 'completed') throw new Error(`workflow already completed: ${workflowId}`);
  if (prev.status === 'abandoned') throw new Error(`workflow abandoned: ${workflowId}`);
  const planSteps = prev.plan.steps;
  if (!planSteps.some((s) => s.stepId === stepId)) {
    throw new Error(`unknown stepId for workflow: ${stepId}`);
  }
  if (prev.completedStepIds.includes(stepId)) {
    throw new Error(`step already completed: ${stepId}`);
  }
  if (prev.currentStepId !== stepId) {
    throw new Error(`step out of order: expected ${prev.currentStepId}, got ${stepId}`);
  }
  const completedStepIds = [...prev.completedStepIds, stepId];
  const remaining = planSteps.filter((s) => !completedStepIds.includes(s.stepId));
  const nextStepId = remaining.length > 0 ? remaining[0].stepId : null;
  const isFinal = nextStepId === null;
  const next: WorkflowRecord = {
    ...prev,
    currentStepId: nextStepId,
    completedStepIds,
    status: isFinal ? 'completed' : (prev.status === 'draft' ? 'active' : prev.status),
    history: [...prev.history, {
      at, status: isFinal ? 'completed' : 'active', operatorId,
      reason: `step ${stepId} advanced · ${reason}`,
    }],
  };
  const workflows = [...state.workflows];
  workflows[idx] = next;
  return { ...state, workflows, updatedAt: at };
}

export function recordWorkflowBottleneck(
  state: WorkflowMemoryState, workflowId: string, b: WorkflowBottleneck,
): WorkflowMemoryState {
  const idx = state.workflows.findIndex((w) => w.workflowId === workflowId);
  if (idx === -1) throw new Error(`workflow not found: ${workflowId}`);
  const prev = state.workflows[idx];
  if (prev.status === 'completed' || prev.status === 'abandoned') {
    throw new Error(`workflow not in an active state: ${workflowId}`);
  }
  if (!prev.plan.steps.some((s) => s.stepId === b.stepId)) {
    throw new Error(`unknown stepId for workflow: ${b.stepId}`);
  }
  const next: WorkflowRecord = {
    ...prev,
    bottlenecks: [...prev.bottlenecks, b].slice(-WORKFLOW_BOTTLENECK_LIMIT),
    status: 'blocked',
    history: [...prev.history, {
      at: b.at, status: 'blocked', operatorId: b.operatorId,
      reason: `bottleneck at ${b.stepId} · ${b.reason}`,
    }],
  };
  const workflows = [...state.workflows];
  workflows[idx] = next;
  return { ...state, workflows, updatedAt: b.at };
}

export function resolveWorkflowBottleneck(
  state: WorkflowMemoryState, workflowId: string, stepId: string, at: number, operatorId: string, reason: string,
): WorkflowMemoryState {
  const idx = state.workflows.findIndex((w) => w.workflowId === workflowId);
  if (idx === -1) throw new Error(`workflow not found: ${workflowId}`);
  const prev = state.workflows[idx];
  const bIdx = prev.bottlenecks.findIndex((b) => b.stepId === stepId && !b.resolvedAt);
  if (bIdx === -1) throw new Error(`no open bottleneck for step: ${stepId}`);
  const bottlenecks = [...prev.bottlenecks];
  bottlenecks[bIdx] = { ...bottlenecks[bIdx], resolvedAt: at };
  const next: WorkflowRecord = {
    ...prev,
    bottlenecks,
    status: 'active',
    history: [...prev.history, {
      at, status: 'active', operatorId, reason: `bottleneck at ${stepId} resolved · ${reason}`,
    }],
  };
  const workflows = [...state.workflows];
  workflows[idx] = next;
  return { ...state, workflows, updatedAt: at };
}

export function recordWorkflowOutcome(
  state: WorkflowMemoryState, workflowId: string, o: WorkflowOutcome,
): WorkflowMemoryState {
  const idx = state.workflows.findIndex((w) => w.workflowId === workflowId);
  if (idx === -1) throw new Error(`workflow not found: ${workflowId}`);
  const prev = state.workflows[idx];
  const next: WorkflowRecord = {
    ...prev,
    outcomes: [...prev.outcomes, o].slice(-WORKFLOW_OUTCOME_LIMIT),
  };
  const workflows = [...state.workflows];
  workflows[idx] = next;
  return { ...state, workflows, updatedAt: o.at };
}

export function recordWorkflowOperatorNote(
  state: WorkflowMemoryState, workflowId: string, n: WorkflowOperatorNote,
): WorkflowMemoryState {
  const idx = state.workflows.findIndex((w) => w.workflowId === workflowId);
  if (idx === -1) throw new Error(`workflow not found: ${workflowId}`);
  const prev = state.workflows[idx];
  const next: WorkflowRecord = {
    ...prev,
    operatorNotes: [...prev.operatorNotes, n].slice(-WORKFLOW_OPERATOR_NOTE_LIMIT),
  };
  const workflows = [...state.workflows];
  workflows[idx] = next;
  return { ...state, workflows, updatedAt: n.at };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodWorkflowMemory?: WorkflowMemoryState };

export interface WorkflowMemoryStore {
  read(): Promise<WorkflowMemoryState>;
  save(state: WorkflowMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createWorkflowMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): WorkflowMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: WorkflowMemoryStore = {
    async read() {
      if (g.__moodWorkflowMemory) return g.__moodWorkflowMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<WorkflowMemoryState>;
        g.__moodWorkflowMemory = { ...createInitialWorkflowMemory(), ...parsed };
      } catch {
        g.__moodWorkflowMemory = createInitialWorkflowMemory();
      }
      return g.__moodWorkflowMemory;
    },
    async save(state) {
      state.workflows = state.workflows.slice(-WORKFLOW_LIMIT);
      state.updatedAt = nowMs();
      g.__moodWorkflowMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodWorkflowMemory = undefined;
    },
  };
  return store;
}
