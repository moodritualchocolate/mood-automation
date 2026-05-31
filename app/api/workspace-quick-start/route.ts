/**
 * /api/workspace-quick-start · operator-supervised quick-start catalog
 * + draft creation.
 *
 * GET  — read-only catalog of 5 quick-start options.
 * POST · operator-supervised.
 *        Action:
 *          select · operator picks an option; the route creates a
 *                   WORKFLOW DRAFT (status='draft') ONLY. Nothing
 *                   launches automatically. Nothing publishes.
 *        Every write requires operatorId + operatorReason.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  appendWorkflow, createWorkflowMemoryStore, newWorkflowId,
  type WorkflowRecord,
} from '@lib/workflows/workflowMemory';
import { orchestrateWorkflow } from '@lib/workflows/workflowOrchestrator';
import {
  getQuickStartOption, listQuickStartOptions, QUICK_START_OPTION_IDS,
  type QuickStartOptionId,
} from '@lib/workflows/workspaceQuickStart';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const catalog = listQuickStartOptions();
  return NextResponse.json({
    catalog,
    advisoryNotice:
      'Workspace quick-start catalog · read-only. No option launches ' +
      'automatically. Human remains final authority.',
  });
}

interface SelectBody {
  action: 'select';
  operatorId: string;
  operatorReason: string;
  optionId: QuickStartOptionId;
  organizationId: string;
  workspaceId: string;
  brandLabel: string;
  productLabel: string;
  primaryMarket: string;
  audienceLabel: string;
  secondaryMarkets?: string[];
  operatorNote?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: SelectBody;
  try { body = await req.json() as SelectBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }
  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  if (body.action !== 'select') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }
  if (!QUICK_START_OPTION_IDS.includes(body.optionId)) {
    return NextResponse.json({ error: 'unknown optionId' }, { status: 400 });
  }
  if (!body.organizationId || !body.workspaceId || !body.brandLabel ||
      !body.productLabel || !body.primaryMarket || !body.audienceLabel) {
    return NextResponse.json({
      error: 'organizationId · workspaceId · brandLabel · productLabel · primaryMarket · audienceLabel are required',
    }, { status: 400 });
  }

  const option = getQuickStartOption(body.optionId);
  const at = Date.now();
  const plan = orchestrateWorkflow({
    goalId: option.goalId, templateId: option.templateId,
    brandLabel: body.brandLabel, productLabel: body.productLabel,
    primaryMarket: body.primaryMarket, audienceLabel: body.audienceLabel,
    secondaryMarkets: body.secondaryMarkets, nowMs: at,
  });
  const record: WorkflowRecord = {
    workflowId: newWorkflowId(),
    templateId: option.templateId,
    organizationId: body.organizationId,
    workspaceId: body.workspaceId,
    label: `${option.label} · ${body.brandLabel}`,
    plan,
    status: 'draft',
    currentStepId: plan.steps[0]?.stepId ?? null,
    completedStepIds: [],
    createdAt: at,
    operatorId: body.operatorId,
    history: [{ at, status: 'draft', operatorId: body.operatorId, reason: body.operatorReason }],
    bottlenecks: [],
    outcomes: [],
    operatorNotes: [],
    operatorNote: body.operatorNote,
  };

  const store = createWorkflowMemoryStore();
  const state = await store.read();
  const next = appendWorkflow(state, record);
  await store.save(next);

  return NextResponse.json({
    ok: true,
    option,
    workflow: record,
    advisoryNotice:
      'Operator-supervised — workflow draft created. The route NEVER ' +
      'auto-activates the draft, NEVER publishes, NEVER spends money, ' +
      'NEVER calls external APIs. Human remains final authority.',
  });
}
