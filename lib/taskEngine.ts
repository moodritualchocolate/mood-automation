/**
 * TASK ENGINE (pure, observational)
 *
 * Phase 3 — Operations Layer.
 *
 * Pure analyzer over task records. Surfaces:
 *   - tasks ready to start (no blocking dependencies)
 *   - tasks blocked (unresolved dependencies or explicit blocked
 *     status)
 *   - tasks overdue (deadline passed and not done)
 *   - tasks at risk (deadline near and not done)
 *   - priority distribution
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the engine never auto-advances task status
 *   - the engine never auto-assigns
 *   - allowed phrasing: "historically observed", "ready to start",
 *     "operator review required"
 *   - forbidden: predict, will-perform, best, winner, recommended,
 *     selected, chosen, optimal, auto-apply
 */

import type { TaskRecord, TaskPriority, TaskStatus } from './taskMemory';

// ─── input ────────────────────────────────────────────────────

export interface TaskEngineInput {
  tasks?: TaskRecord[];
  /** Reference time for overdue / at-risk calculation (epoch ms). */
  nowMs?: number;
  /** Window for "at risk" detection (ms before deadline). Default 24h. */
  atRiskWindowMs?: number;
}

// ─── output ───────────────────────────────────────────────────

export interface TaskSummary {
  taskId: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadlineAt?: number;
  linkedCampaignId?: string;
  linkedAssetId?: string;
  assignedMemberId?: string;
  /** Plain-language observation. */
  observation: string;
}

export interface TaskEngineReading {
  totalTasks: number;
  /** Tasks ready to start — no unresolved dependencies and not done. */
  readyToStart: TaskSummary[];
  /** Tasks blocked — dependencies unresolved or status `blocked`. */
  blockedTasks: TaskSummary[];
  /** Tasks past their deadline and not done. */
  overdueTasks: TaskSummary[];
  /** Tasks within `atRiskWindowMs` of their deadline and not done. */
  atRiskTasks: TaskSummary[];
  priorityDistribution: Record<TaskPriority, number>;
  statusDistribution: Record<TaskStatus, number>;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Task engine is observational only. The engine never auto-advances ' +
  'task status, never auto-assigns. Operator review required. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function isComplete(status: TaskStatus): boolean {
  return status === 'done' || status === 'archived';
}

function summary(task: TaskRecord, note: string): TaskSummary {
  return {
    taskId: task.taskId, title: task.title, priority: task.priority,
    status: task.status, deadlineAt: task.deadlineAt,
    linkedCampaignId: task.linkedCampaignId, linkedAssetId: task.linkedAssetId,
    assignedMemberId: task.assignedMemberId, observation: note,
  };
}

function priorityRank(p: TaskPriority): number {
  switch (p) {
    case 'urgent': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
  }
}

// ─── main ─────────────────────────────────────────────────────

export function analyzeTasks(input: TaskEngineInput): TaskEngineReading {
  const tasks = input.tasks ?? [];
  const now = input.nowMs ?? Date.now();
  const atRiskWindowMs = input.atRiskWindowMs ?? 24 * 60 * 60 * 1000;
  const taskById = new Map(tasks.map((t) => [t.taskId, t] as const));

  const priorityDistribution: Record<TaskPriority, number> = {
    low: 0, medium: 0, high: 0, urgent: 0,
  };
  const statusDistribution: Record<TaskStatus, number> = {
    backlog: 0, 'in-progress': 0, blocked: 0, review: 0, done: 0, archived: 0,
  };

  const readyToStart: TaskSummary[] = [];
  const blockedTasks: TaskSummary[] = [];
  const overdueTasks: TaskSummary[] = [];
  const atRiskTasks: TaskSummary[] = [];

  for (const task of tasks) {
    priorityDistribution[task.priority] += 1;
    statusDistribution[task.status] += 1;

    if (isComplete(task.status)) continue;

    // Resolve dependency status.
    let unresolvedDependencyIds: string[] = [];
    for (const depId of task.dependencyTaskIds) {
      const dep = taskById.get(depId);
      if (!dep || !isComplete(dep.status)) unresolvedDependencyIds.push(depId);
    }

    if (task.status === 'blocked' || unresolvedDependencyIds.length > 0) {
      blockedTasks.push(summary(task,
        unresolvedDependencyIds.length > 0
          ? `blocked by ${unresolvedDependencyIds.length} unresolved dependency(ies) historically observed — operator review required`
          : 'task status is `blocked` — operator review required',
      ));
    } else if (task.status === 'backlog') {
      readyToStart.push(summary(task,
        'ready to start · operator review required to advance status',
      ));
    }

    if (task.deadlineAt) {
      if (task.deadlineAt < now) {
        overdueTasks.push(summary(task,
          `deadline historically observed at ${new Date(task.deadlineAt).toISOString()} — operator review required`,
        ));
      } else if (task.deadlineAt - now <= atRiskWindowMs) {
        atRiskTasks.push(summary(task,
          `deadline within ${Math.round(atRiskWindowMs / 60000)} minute(s) — operator review required`,
        ));
      }
    }
  }

  // Order each bucket by priority (urgent first) then deadline.
  function sortBucket(list: TaskSummary[]): TaskSummary[] {
    return list.sort((a, b) =>
      priorityRank(b.priority) - priorityRank(a.priority) ||
      (a.deadlineAt ?? Number.MAX_SAFE_INTEGER) - (b.deadlineAt ?? Number.MAX_SAFE_INTEGER) ||
      a.taskId.localeCompare(b.taskId),
    );
  }

  const notes: string[] = [];
  if (tasks.length === 0) {
    notes.push('no tasks yet — operator may create tasks · operator approval required');
  } else {
    notes.push(`${tasks.length} task(s) historically observed · ${readyToStart.length} ready · ${blockedTasks.length} blocked · ${overdueTasks.length} overdue · ${atRiskTasks.length} at-risk`);
  }

  return {
    totalTasks: tasks.length,
    readyToStart: sortBucket(readyToStart),
    blockedTasks: sortBucket(blockedTasks),
    overdueTasks: sortBucket(overdueTasks),
    atRiskTasks: sortBucket(atRiskTasks),
    priorityDistribution,
    statusDistribution,
    notes,
    reasonCodes: [
      `tasks:${tasks.length}`,
      `ready:${readyToStart.length}`,
      `blocked:${blockedTasks.length}`,
      `overdue:${overdueTasks.length}`,
      `atRisk:${atRiskTasks.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
