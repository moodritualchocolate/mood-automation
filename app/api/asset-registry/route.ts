/**
 * /api/asset-registry
 *
 * Phase 5 — Asset Registry.
 *
 * GET   — returns the registry (read-only).
 * POST  — operator-supervised. Every write requires operatorId +
 *         operatorReason. The route NEVER calls a generator,
 *         NEVER publishes, NEVER auto-approves an asset.
 *
 * STRICT CONTRACT:
 *   - operator approval gate is the only mutating path
 *   - POST actions: register | approve | reject | archive
 *   - all transitions are explicit operator decisions
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { requireSession } from '@lib/auth/requireSession';
import {
  createAssetRegistryMemoryStore, newAssetId,
  type AssetExecutionType, type AssetApprovalStatus, type AssetRecord,
} from '@lib/assetRegistryMemory';
import type { Formula } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_FORMULAS: ReadonlySet<Formula> = new Set(['ENERGY', 'FOCUS', 'RELAX', 'SLEEP']);
const VALID_PACKAGE_TYPES: ReadonlySet<AssetExecutionType> = new Set(['image', 'video', 'carousel', 'landing']);
const VALID_TRANSITIONS: ReadonlySet<AssetApprovalStatus> = new Set(['approved', 'rejected', 'archived']);

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const _url0 = new URL(req.url);
  const _orgId0 = _url0.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const _wspId0 = _url0.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, _orgId0, _wspId0);
  if (!tenantAuth.ok) return tenantAuth.response;

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') as AssetApprovalStatus | null;
  const formulaFilter = url.searchParams.get('formula') as Formula | null;

  const mem = await createAssetRegistryMemoryStore().read().catch(() => null);
  const all = mem?.assets ?? [];
  let assets = all;
  if (statusFilter) assets = assets.filter((a) => a.approvalStatus === statusFilter);
  if (formulaFilter && VALID_FORMULAS.has(formulaFilter)) {
    assets = assets.filter((a) => a.formula === formulaFilter);
  }

  // Counts per status.
  const counts: Record<AssetApprovalStatus, number> = {
    pending: 0, approved: 0, rejected: 0, archived: 0,
  };
  for (const a of all) counts[a.approvalStatus] += 1;

  return NextResponse.json({
    totalAssets: mem?.totalAssets ?? 0,
    counts,
    assets: assets.slice(-64),
    advisoryNotice:
      'Asset registry · operator-supervised. ' +
      'No publishing. No autonomous posting. No auto-approval. ' +
      'Human remains final authority.',
  });
}

// ─── POST — register | approve | reject | archive ────────────

interface RegisterBody {
  action: 'register';
  operatorId: string;
  operatorReason: string;
  formula: Formula;
  campaign: string;
  packageType: AssetExecutionType;
  sourceStoryName: string;
  sourceBriefId: string;
  sourcePromptId: string;
  prompt: string;
  summary?: string;
  operatorNote?: string;
  organizationId?: string;
  workspaceId?: string;
  brandId?: string;
  previewDataUrl?: string;
  copy?: { headline?: string; body?: string; cta?: string; paletteKey?: string };
}
interface ApprovalBody {
  action: 'approve' | 'reject' | 'archive';
  operatorId: string;
  operatorReason: string;
  assetId: string;
}
type Body = RegisterBody | ApprovalBody;

function isRegister(b: Body): b is RegisterBody { return b.action === 'register'; }
function isApproval(b: Body): b is ApprovalBody {
  return b.action === 'approve' || b.action === 'reject' || b.action === 'archive';
}

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

  const store = createAssetRegistryMemoryStore();

  if (isRegister(body)) {
    if (!VALID_FORMULAS.has(body.formula)) {
      return NextResponse.json({ error: 'invalid formula' }, { status: 400 });
    }
    if (!VALID_PACKAGE_TYPES.has(body.packageType)) {
      return NextResponse.json({ error: 'invalid packageType' }, { status: 400 });
    }
    if (typeof body.campaign !== 'string' || body.campaign.length === 0) {
      return NextResponse.json({ error: 'campaign is required' }, { status: 400 });
    }
    if (typeof body.prompt !== 'string' || body.prompt.length === 0) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    const at = Date.now();
    const record: AssetRecord = {
      assetId: newAssetId(),
      formula: body.formula,
      campaign: body.campaign,
      packageType: body.packageType,
      sourceStoryName: body.sourceStoryName,
      sourceBriefId: body.sourceBriefId,
      sourcePromptId: body.sourcePromptId,
      prompt: body.prompt,
      summary: body.summary ?? `${body.packageType} · ${body.sourceStoryName}`,
      createdAt: at,
      operatorId: body.operatorId,
      approvalStatus: 'pending',
      approvalHistory: [{
        at, status: 'pending', operatorId: body.operatorId, reason: body.operatorReason,
      }],
      operatorNote: body.operatorNote,
      organizationId: body.organizationId,
      workspaceId: body.workspaceId,
      brandId: body.brandId,
      previewDataUrl: body.previewDataUrl,
      copy: body.copy,
    };
    const next = await store.append(record);
    return NextResponse.json({
      ok: true,
      asset: record,
      totalAssets: next.totalAssets,
      advisoryNotice:
        'Operator-supervised — registered with status `pending`. ' +
        'No generation, no publishing, no auto-approval. ' +
        'Human remains final authority.',
    });
  }

  if (isApproval(body)) {
    const status: AssetApprovalStatus =
      body.action === 'approve' ? 'approved' :
      body.action === 'reject' ? 'rejected' :
                                  'archived';
    if (!VALID_TRANSITIONS.has(status)) {
      return NextResponse.json({ error: 'invalid transition' }, { status: 400 });
    }
    try {
      const next = await store.updateApproval(body.assetId, {
        at: Date.now(), status,
        operatorId: body.operatorId, reason: body.operatorReason,
      });
      const updated = next.assets.find((a) => a.assetId === body.assetId);
      return NextResponse.json({
        ok: true,
        asset: updated,
        advisoryNotice:
          `Operator-supervised — status set to \`${status}\` for ${body.assetId}. ` +
          'No generation, no publishing. Human remains final authority.',
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
