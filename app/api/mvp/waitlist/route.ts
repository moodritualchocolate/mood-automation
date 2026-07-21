/**
 * POST /api/mvp/waitlist — join the vertical waitlist (roadmap #6)
 *
 * The refusal path: brands outside the supported verticals leave an
 * email instead of receiving generic output. Operator-supervised.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { createMvpWaitlistMemoryStore, newWaitlistId } from '@lib/mvpWaitlistMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  email: string;
  businessDescription: string;
  organizationId?: string;
  workspaceId?: string;
  operatorReason: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email.trim())) {
    return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
  }
  if (typeof body.businessDescription !== 'string' || body.businessDescription.trim().length < 2) {
    return NextResponse.json({ error: 'businessDescription is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;

  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  await createMvpWaitlistMemoryStore().append({
    waitlistId: newWaitlistId(),
    organizationId,
    workspaceId,
    operatorId: tenantAuth.ctx.user.userId,
    email: body.email.trim(),
    businessDescription: body.businessDescription.trim().slice(0, 500),
    createdAt: Date.now(),
  });

  return NextResponse.json({
    ok: true,
    advisoryNotice:
      'Added to the vertical waitlist. New industries ship within 90 days. ' +
      'Human remains final authority.',
  });
}
