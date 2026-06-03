/**
 * /api/workspace-activation · operator-supervised workspace scaffolding.
 *
 * GET  — returns operator-visible activations + current scaffolding
 * POST · operator-supervised.
 *        Actions:
 *          activate · operator scaffolds defaults for a brand·workspace
 *          revoke   · operator revokes a prior activation
 *        Every write requires operatorId + operatorReason. The route
 *        NEVER auto-publishes, NEVER launches a campaign, NEVER
 *        spends money, NEVER calls external APIs.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { requireSession } from '@lib/auth/requireSession';
import {
  applyWorkspaceActivationStep, appendWorkspaceActivation,
  buildWorkspaceScaffolding, createWorkspaceActivationStore,
  newWorkspaceActivationId,
  type WorkspaceActivationRecord,
} from '@lib/business/workspaceActivation';
import { BUSINESS_GOAL_IDS, type BusinessGoalId } from '@lib/business/businessGoalModel';
import { GROWTH_BLUEPRINT_IDS, type BlueprintId } from '@lib/business/growthBlueprints';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const _url0 = new URL(req.url);
  const _orgId0 = _url0.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const _wspId0 = _url0.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, _orgId0, _wspId0);
  if (!tenantAuth.ok) return tenantAuth.response;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  const workspaceId = url.searchParams.get('workspaceId');
  const mem = await createWorkspaceActivationStore().read().catch(() => null);
  let activations = mem?.activations ?? [];
  if (organizationId) activations = activations.filter((a) => a.organizationId === organizationId);
  if (workspaceId)    activations = activations.filter((a) => a.workspaceId === workspaceId);
  return NextResponse.json({
    activations,
    totalActivations: mem?.totalActivations ?? 0,
    advisoryNotice:
      'Workspace activation · read-only listing. The route NEVER auto-publishes, ' +
      'NEVER launches a campaign, NEVER spends money, NEVER calls external APIs. ' +
      'Human remains final authority.',
  });
}

interface BaseBody {
  action: 'activate' | 'revoke';
  operatorId: string;
  operatorReason: string;
}
interface ActivateBody extends BaseBody {
  action: 'activate';
  organizationId: string;
  workspaceId: string;
  brandLabel: string;
  primaryGoalId: BusinessGoalId;
  blueprintId?: BlueprintId;
  operatorNote?: string;
}
interface RevokeBody extends BaseBody {
  action: 'revoke';
  activationId: string;
  operatorNote?: string;
}
type Body = ActivateBody | RevokeBody;

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

  const store = createWorkspaceActivationStore();
  const state = await store.read();
  const at = Date.now();

  try {
    if (body.action === 'activate') {
      if (!body.organizationId || !body.workspaceId || !body.brandLabel) {
        return NextResponse.json({ error: 'organizationId · workspaceId · brandLabel are required' }, { status: 400 });
      }
      if (!BUSINESS_GOAL_IDS.includes(body.primaryGoalId)) {
        return NextResponse.json({ error: 'unknown primaryGoalId' }, { status: 400 });
      }
      if (body.blueprintId && !GROWTH_BLUEPRINT_IDS.includes(body.blueprintId)) {
        return NextResponse.json({ error: 'unknown blueprintId' }, { status: 400 });
      }
      const scaffolding = buildWorkspaceScaffolding(body.primaryGoalId, body.blueprintId);
      const record: WorkspaceActivationRecord = {
        activationId: newWorkspaceActivationId(),
        organizationId: body.organizationId,
        workspaceId: body.workspaceId,
        brandLabel: body.brandLabel,
        primaryGoalId: body.primaryGoalId,
        scaffolding,
        status: 'activated',
        createdAt: at,
        operatorId: body.operatorId,
        history: [{ at, status: 'activated', operatorId: body.operatorId, reason: body.operatorReason }],
        operatorNote: body.operatorNote,
      };
      const next = appendWorkspaceActivation(state, record);
      await store.save(next);
      return NextResponse.json({
        ok: true,
        activation: record,
        advisoryNotice:
          'Operator-supervised — workspace scaffolded. The route NEVER ' +
          'auto-publishes, NEVER launches a campaign, NEVER spends money. ' +
          'Human remains final authority.',
      });
    }
    if (body.action === 'revoke') {
      const next = applyWorkspaceActivationStep(state, body.activationId, {
        at, status: 'revoked', operatorId: body.operatorId, reason: body.operatorReason,
      });
      await store.save(next);
      const updated = next.activations.find((a) => a.activationId === body.activationId);
      return NextResponse.json({
        ok: true,
        activation: updated,
        advisoryNotice:
          'Operator-supervised — workspace activation revoked. ' +
          'Human remains final authority.',
      });
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    const msg = (err as Error).message;
    const status = /not found/.test(msg) ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
