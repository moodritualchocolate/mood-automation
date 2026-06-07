/**
 * POST /api/mvp/onboard
 *
 * Saves the 4 onboarding answers (artifact · audience · emotional ·
 * locale). Operator-supervised. Tenant-scoped.
 *
 * Response:
 *   { brandInputId: string }
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import {
  createMvpBrandInputMemoryStore, newBrandInputId,
  type BrandInputRecord,
} from '@lib/mvpBrandInputMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  artifact: string;
  audience: string;
  emotional: string;
  locale: string;
  organizationId?: string;
  workspaceId?: string;
  operatorReason: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  // Required string fields
  for (const k of ['artifact', 'audience', 'emotional', 'locale', 'operatorReason'] as const) {
    const v = body[k];
    if (typeof v !== 'string' || v.trim().length === 0) {
      return NextResponse.json({ error: `${k} is required` }, { status: 400 });
    }
  }

  const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;

  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const operatorId = tenantAuth.ctx.user.userId;

  const record: BrandInputRecord = {
    brandInputId: newBrandInputId(),
    organizationId,
    workspaceId,
    operatorId,
    artifact: body.artifact.trim(),
    audience: body.audience.trim(),
    emotional: body.emotional.trim(),
    locale: body.locale.trim(),
    createdAt: Date.now(),
    operatorReason: body.operatorReason,
  };

  try {
    await createMvpBrandInputMemoryStore().append(record);
  } catch (e) {
    return NextResponse.json({ error: `failed to save: ${(e as Error).message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    brandInputId: record.brandInputId,
    advisoryNotice:
      'Operator-supervised — brand inputs saved. ' +
      'No generation yet. Human remains final authority.',
  });
}
