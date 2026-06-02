/**
 * /api/workflows · operator-supervised workflow orchestration.
 *
 * GET  — composes the /workflows dashboard descriptor.
 * POST · operator-supervised.
 *        Actions:
 *          orchestrate          · operator orchestrates a workflow plan +
 *                                 creates a draft record
 *          activate             · operator transitions draft → active
 *          advance-step         · operator marks a step completed; the
 *                                 plan advances deterministically
 *          record-bottleneck    · operator records a bottleneck on the
 *                                 current step; status → blocked
 *          resolve-bottleneck   · operator resolves an open bottleneck
 *          record-outcome       · operator records a workflow outcome
 *          record-operator-note · operator pins an operator note
 *          abandon              · operator abandons the workflow
 *        Every write requires operatorId + operatorReason. The route
 *        NEVER auto-advances, NEVER auto-publishes, NEVER spends
 *        money, NEVER calls external APIs.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import {
  advanceWorkflowStep, applyWorkflowStep, appendWorkflow,
  createWorkflowMemoryStore, newWorkflowId,
  recordWorkflowBottleneck, recordWorkflowOperatorNote, recordWorkflowOutcome,
  resolveWorkflowBottleneck,
  type WorkflowRecord, type WorkflowStatus,
} from '@lib/workflows/workflowMemory';
import {
  orchestrateWorkflow, type OrchestratorInput,
} from '@lib/workflows/workflowOrchestrator';
import {
  WORKFLOW_TEMPLATE_IDS, type WorkflowTemplateId,
} from '@lib/workflows/workflowTemplates';
import {
  BUSINESS_GOAL_IDS, type BusinessGoalId,
} from '@lib/business/businessGoalModel';
import { composeWorkflowDashboard } from '@lib/workflows/workflowDashboard';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createTaskMemoryStore } from '@lib/taskMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  const workspaceId = url.searchParams.get('workspaceId');
  const workflowId = url.searchParams.get('workflowId');

  const wfStore = createWorkflowMemoryStore();
  const wfMem = await wfStore.read().catch(() => null);

  if (workflowId) {
    const wf = wfMem?.workflows.find((w) => w.workflowId === workflowId);
    if (!wf) return NextResponse.json({ error: 'workflow not found' }, { status: 404 });
    return NextResponse.json({
      workflow: wf,
      advisoryNotice:
        'Workflow record · read-only. The route NEVER auto-advances. ' +
        'Human remains final authority.',
    });
  }

  const [assetMem, taskMem] = await Promise.all([
    createAssetRegistryMemoryStore().read().catch(() => null),
    createTaskMemoryStore().read().catch(() => null),
  ]);

  const descriptor = composeWorkflowDashboard({
    workflowMemory: wfMem ?? { workflows: [], totalWorkflows: 0, firstUpdatedAt: null, updatedAt: Date.now() },
    assets: (assetMem?.assets ?? []).map((a) => ({
      assetId: a.assetId, approvalStatus: a.approvalStatus, campaign: a.campaign,
    })),
    tasks: (taskMem?.tasks ?? []).map((t) => ({
      taskId: t.taskId, status: t.status, title: t.title,
      deadlineAt: t.deadlineAt, linkedCampaignId: t.linkedCampaignId,
    })),
    organizationId, workspaceId,
    nowMs: Date.now(),
  });

  return NextResponse.json({
    descriptor,
    totalWorkflows: wfMem?.totalWorkflows ?? 0,
    advisoryNotice:
      'Workflow dashboard · read-only. The route NEVER auto-acts on a workflow. ' +
      'Operator approval required. Human remains final authority.',
  });
}

interface BaseBody {
  action: string;
  operatorId: string;
  operatorReason: string;
}
interface OrchestrateBody extends BaseBody {
  action: 'orchestrate';
  goalId: BusinessGoalId;
  templateId?: WorkflowTemplateId;
  organizationId: string;
  workspaceId: string;
  brandLabel: string;
  productLabel: string;
  primaryMarket: string;
  audienceLabel: string;
  secondaryMarkets?: string[];
  operatorNote?: string;
}
interface WorkflowIdBody extends BaseBody {
  workflowId: string;
}
interface ActivateBody extends WorkflowIdBody { action: 'activate'; }
interface AdvanceStepBody extends WorkflowIdBody {
  action: 'advance-step';
  stepId: string;
}
interface RecordBottleneckBody extends WorkflowIdBody {
  action: 'record-bottleneck';
  stepId: string;
  reason: string;
}
interface ResolveBottleneckBody extends WorkflowIdBody {
  action: 'resolve-bottleneck';
  stepId: string;
}
interface RecordOutcomeBody extends WorkflowIdBody {
  action: 'record-outcome';
  note: string;
}
interface RecordOperatorNoteBody extends WorkflowIdBody {
  action: 'record-operator-note';
  note: string;
}
interface AbandonBody extends WorkflowIdBody { action: 'abandon'; }
type Body =
  | OrchestrateBody | ActivateBody | AdvanceStepBody
  | RecordBottleneckBody | ResolveBottleneckBody
  | RecordOutcomeBody | RecordOperatorNoteBody | AbandonBody;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  body.operatorId = auth.ctx.user.userId;

  const store = createWorkflowMemoryStore();
  const state = await store.read();
  const at = Date.now();

  try {
    switch (body.action) {
      case 'orchestrate': {
        if (!BUSINESS_GOAL_IDS.includes(body.goalId)) {
          return NextResponse.json({ error: 'unknown goalId' }, { status: 400 });
        }
        if (body.templateId && !WORKFLOW_TEMPLATE_IDS.includes(body.templateId)) {
          return NextResponse.json({ error: 'unknown templateId' }, { status: 400 });
        }
        const input: OrchestratorInput = {
          goalId: body.goalId, templateId: body.templateId,
          brandLabel: body.brandLabel, productLabel: body.productLabel,
          primaryMarket: body.primaryMarket, audienceLabel: body.audienceLabel,
          secondaryMarkets: body.secondaryMarkets, nowMs: at,
        };
        const plan = orchestrateWorkflow(input);
        const record: WorkflowRecord = {
          workflowId: newWorkflowId(),
          templateId: plan.templateId,
          organizationId: body.organizationId,
          workspaceId: body.workspaceId,
          label: `${plan.templateId} · ${body.brandLabel}`,
          plan, status: 'draft',
          currentStepId: plan.steps[0]?.stepId ?? null,
          completedStepIds: [],
          createdAt: at, operatorId: body.operatorId,
          history: [{ at, status: 'draft', operatorId: body.operatorId, reason: body.operatorReason }],
          bottlenecks: [], outcomes: [], operatorNotes: [],
          operatorNote: body.operatorNote,
        };
        const next = appendWorkflow(state, record);
        await store.save(next);
        return NextResponse.json({
          ok: true, workflow: record, plan,
          advisoryNotice:
            'Operator-supervised — workflow draft created. The route NEVER ' +
            'auto-activates the draft. Human remains final authority.',
        });
      }
      case 'activate': {
        const status: WorkflowStatus = 'active';
        const next = applyWorkflowStep(state, body.workflowId, {
          at, status, operatorId: body.operatorId, reason: body.operatorReason,
        });
        await store.save(next);
        const updated = next.workflows.find((w) => w.workflowId === body.workflowId);
        return NextResponse.json({
          ok: true, workflow: updated,
          advisoryNotice:
            'Operator-supervised — workflow activated. The route NEVER ' +
            'auto-publishes. Human remains final authority.',
        });
      }
      case 'advance-step': {
        const next = advanceWorkflowStep(
          state, body.workflowId, body.stepId, at, body.operatorId, body.operatorReason,
        );
        await store.save(next);
        const updated = next.workflows.find((w) => w.workflowId === body.workflowId);
        return NextResponse.json({
          ok: true, workflow: updated,
          advisoryNotice:
            `Operator-supervised — step ${body.stepId} advanced. ` +
            'Human remains final authority.',
        });
      }
      case 'record-bottleneck': {
        const next = recordWorkflowBottleneck(state, body.workflowId, {
          at, stepId: body.stepId, reason: body.reason,
          operatorId: body.operatorId,
        });
        await store.save(next);
        const updated = next.workflows.find((w) => w.workflowId === body.workflowId);
        return NextResponse.json({
          ok: true, workflow: updated,
          advisoryNotice:
            'Operator-supervised — bottleneck recorded. ' +
            'Human remains final authority.',
        });
      }
      case 'resolve-bottleneck': {
        const next = resolveWorkflowBottleneck(
          state, body.workflowId, body.stepId, at, body.operatorId, body.operatorReason,
        );
        await store.save(next);
        const updated = next.workflows.find((w) => w.workflowId === body.workflowId);
        return NextResponse.json({
          ok: true, workflow: updated,
          advisoryNotice:
            'Operator-supervised — bottleneck resolved. ' +
            'Human remains final authority.',
        });
      }
      case 'record-outcome': {
        if (typeof body.note !== 'string' || body.note.length === 0) {
          return NextResponse.json({ error: 'note is required' }, { status: 400 });
        }
        const next = recordWorkflowOutcome(state, body.workflowId, {
          at, note: body.note, operatorId: body.operatorId,
        });
        await store.save(next);
        const updated = next.workflows.find((w) => w.workflowId === body.workflowId);
        return NextResponse.json({
          ok: true, workflow: updated,
          advisoryNotice:
            'Operator-supervised — outcome recorded. Human remains final authority.',
        });
      }
      case 'record-operator-note': {
        if (typeof body.note !== 'string' || body.note.length === 0) {
          return NextResponse.json({ error: 'note is required' }, { status: 400 });
        }
        const next = recordWorkflowOperatorNote(state, body.workflowId, {
          at, note: body.note, operatorId: body.operatorId,
        });
        await store.save(next);
        const updated = next.workflows.find((w) => w.workflowId === body.workflowId);
        return NextResponse.json({
          ok: true, workflow: updated,
          advisoryNotice:
            'Operator-supervised — operator note pinned. ' +
            'Human remains final authority.',
        });
      }
      case 'abandon': {
        const next = applyWorkflowStep(state, body.workflowId, {
          at, status: 'abandoned', operatorId: body.operatorId, reason: body.operatorReason,
        });
        await store.save(next);
        const updated = next.workflows.find((w) => w.workflowId === body.workflowId);
        return NextResponse.json({
          ok: true, workflow: updated,
          advisoryNotice:
            'Operator-supervised — workflow abandoned. ' +
            'Human remains final authority.',
        });
      }
      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }
  } catch (err) {
    const msg = (err as Error).message;
    const status = /not found/.test(msg) ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
