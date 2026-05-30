/**
 * /api/task · operator-supervised.
 *
 * GET   — returns task engine reading + raw tasks.
 * POST  — operator-supervised. Actions: create | transition.
 *         Every write requires operatorId + operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route NEVER auto-advances task status
 *   - the route NEVER sends notifications
 *   - the route NEVER auto-assigns
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createTaskMemoryStore, newTaskId, appendTaskRecord, applyTaskStep,
  type TaskRecord, type TaskPriority, type TaskStatus,
} from '@lib/taskMemory';
import { analyzeTasks } from '@lib/taskEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_PRIORITIES: ReadonlySet<TaskPriority> = new Set(['low', 'medium', 'high', 'urgent']);
const VALID_TRANSITIONS: ReadonlySet<TaskStatus> = new Set([
  'backlog', 'in-progress', 'blocked', 'review', 'done', 'archived',
]);

export async function GET(): Promise<NextResponse> {
  const mem = await createTaskMemoryStore().read().catch(() => null);
  const reading = analyzeTasks({ tasks: mem?.tasks ?? [] });
  return NextResponse.json({
    reading,
    tasks: (mem?.tasks ?? []).slice(-128),
    advisoryNotice:
      'Task · operator-supervised. The route never auto-advances status, ' +
      'never sends notifications, never auto-assigns. ' +
      'Human remains final authority.',
  });
}

interface CreateTaskBody {
  action: 'create';
  operatorId: string;
  operatorReason: string;
  title: string;
  priority: TaskPriority;
  description?: string;
  dependencyTaskIds?: string[];
  deadlineAt?: number;
  linkedCampaignId?: string;
  linkedAssetId?: string;
  assignedMemberId?: string;
  operatorNote?: string;
}
interface TransitionTaskBody {
  action: 'transition';
  operatorId: string;
  operatorReason: string;
  taskId: string;
  status: TaskStatus;
}
type Body = CreateTaskBody | TransitionTaskBody;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const store = createTaskMemoryStore();
  const state = await store.read();

  if (body.action === 'create') {
    if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!VALID_PRIORITIES.has(body.priority)) {
      return NextResponse.json({ error: 'invalid priority' }, { status: 400 });
    }
    const at = Date.now();
    const record: TaskRecord = {
      taskId: newTaskId(), title: body.title, description: body.description,
      priority: body.priority, status: 'backlog',
      dependencyTaskIds: body.dependencyTaskIds ?? [],
      deadlineAt: body.deadlineAt, linkedCampaignId: body.linkedCampaignId,
      linkedAssetId: body.linkedAssetId, assignedMemberId: body.assignedMemberId,
      createdAt: at, operatorId: body.operatorId,
      statusHistory: [{ at, status: 'backlog', operatorId: body.operatorId, reason: body.operatorReason }],
      operatorNote: body.operatorNote,
    };
    await store.save(appendTaskRecord(state, record));
    return NextResponse.json({ ok: true, task: record });
  }
  if (body.action === 'transition') {
    if (!body.taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    if (!VALID_TRANSITIONS.has(body.status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    try {
      const next = applyTaskStep(state, body.taskId, {
        at: Date.now(), status: body.status,
        operatorId: body.operatorId, reason: body.operatorReason,
      });
      await store.save(next);
      const updated = next.tasks.find((t) => t.taskId === body.taskId);
      return NextResponse.json({ ok: true, task: updated });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
