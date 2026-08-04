/**
 * /api/publication-registry
 *
 * Publication registry · operator-supervised.
 *
 * GET   — returns the registry (read-only).
 * POST  — operator-supervised. Operator MANUALLY registers an
 *         external publication. Every write requires operatorId +
 *         operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route never publishes
 *   - the route never auto-registers
 *   - the route never calls a social platform
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { requireSession } from '@lib/auth/requireSession';
import {
  createPublicationRegistryStore, newPublicationId,
  type PublicationChannel, type PublicationStatus, type PublicationRecord,
} from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import type { Formula } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_FORMULAS: ReadonlySet<Formula> = new Set(['ENERGY', 'FOCUS', 'RELAX', 'SLEEP']);
const VALID_CHANNELS: ReadonlySet<PublicationChannel> = new Set([
  'instagram-feed', 'instagram-story', 'instagram-reels',
  'tiktok', 'facebook-feed', 'facebook-reels',
  'youtube-shorts', 'pinterest',
  'website-hero', 'newsletter', 'other',
]);
const VALID_STATUS_TRANSITIONS: ReadonlySet<PublicationStatus> = new Set([
  'live', 'paused', 'unpublished', 'archived',
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const _url0 = new URL(req.url);
  const _orgId0 = _url0.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const _wspId0 = _url0.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, _orgId0, _wspId0);
  if (!tenantAuth.ok) return tenantAuth.response;

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') as PublicationStatus | null;
  const formulaFilter = url.searchParams.get('formula') as Formula | null;

  const mem = await createPublicationRegistryStore().read().catch(() => null);
  const all = mem?.publications ?? [];
  let publications = all;
  if (statusFilter) publications = publications.filter((p) => p.status === statusFilter);
  if (formulaFilter && VALID_FORMULAS.has(formulaFilter)) {
    publications = publications.filter((p) => p.formula === formulaFilter);
  }
  const counts: Record<PublicationStatus, number> = {
    live: 0, paused: 0, unpublished: 0, archived: 0,
  };
  for (const p of all) counts[p.status] += 1;

  return NextResponse.json({
    totalPublications: mem?.totalPublications ?? 0,
    counts,
    publications: publications.slice(-64),
    advisoryNotice:
      'Publication registry · operator-supervised manual registration. ' +
      'The route never publishes, never calls a platform, never auto-registers. ' +
      'Human remains final authority.',
  });
}

interface RegisterBody {
  action: 'register';
  operatorId: string;
  operatorReason: string;
  assetId: string;
  channel: PublicationChannel;
  publishedAt?: number;
  externalUrl?: string;
  campaign: string;
  formula: Formula;
  audience: string;
  platform: string;
  resultId?: string;
  operatorNote?: string;
}
interface TransitionBody {
  action: 'pause' | 'unpublish' | 'archive' | 'relive';
  operatorId: string;
  operatorReason: string;
  publicationId: string;
}
type Body = RegisterBody | TransitionBody;

function isRegister(b: Body): b is RegisterBody { return b.action === 'register'; }
function isTransition(b: Body): b is TransitionBody {
  return ['pause', 'unpublish', 'archive', 'relive'].includes(b.action);
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

  const store = createPublicationRegistryStore();

  if (isRegister(body)) {
    if (!body.assetId) return NextResponse.json({ error: 'assetId is required' }, { status: 400 });
    if (!VALID_CHANNELS.has(body.channel)) {
      return NextResponse.json({ error: 'invalid channel' }, { status: 400 });
    }
    if (!VALID_FORMULAS.has(body.formula)) {
      return NextResponse.json({ error: 'invalid formula' }, { status: 400 });
    }
    if (typeof body.campaign !== 'string' || body.campaign.length === 0) {
      return NextResponse.json({ error: 'campaign is required' }, { status: 400 });
    }
    // The asset must exist in the asset registry.
    const assets = (await createAssetRegistryMemoryStore().read().catch(() => null))?.assets ?? [];
    const asset = assets.find((a) => a.assetId === body.assetId);
    if (!asset) return NextResponse.json({ error: 'asset not found in asset registry' }, { status: 404 });
    if (asset.approvalStatus !== 'approved') {
      return NextResponse.json({
        error: 'asset is not approved · operator approval gate requires approved status',
        status: asset.approvalStatus,
      }, { status: 409 });
    }
    const at = body.publishedAt ?? Date.now();
    const record: PublicationRecord = {
      publicationId: newPublicationId(),
      assetId: body.assetId,
      resultId: body.resultId,
      channel: body.channel,
      publishedAt: at,
      externalUrl: body.externalUrl,
      operatorId: body.operatorId,
      campaign: body.campaign,
      formula: body.formula,
      audience: body.audience,
      platform: body.platform,
      status: 'live',
      statusHistory: [{ at, status: 'live', operatorId: body.operatorId, reason: body.operatorReason }],
      operatorNote: body.operatorNote,
    };
    const next = await store.append(record);
    return NextResponse.json({
      ok: true,
      publication: record,
      totalPublications: next.totalPublications,
      advisoryNotice:
        'Operator-supervised — publication registered with status `live`. ' +
        'The route never publishes externally. Human remains final authority.',
    });
  }

  if (isTransition(body)) {
    const status: PublicationStatus =
      body.action === 'pause' ? 'paused' :
      body.action === 'unpublish' ? 'unpublished' :
      body.action === 'archive' ? 'archived' :
                                  'live';
    if (!VALID_STATUS_TRANSITIONS.has(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    try {
      const next = await store.updateStatus(body.publicationId, {
        at: Date.now(), status,
        operatorId: body.operatorId, reason: body.operatorReason,
      });
      const updated = next.publications.find((p) => p.publicationId === body.publicationId);
      return NextResponse.json({
        ok: true,
        publication: updated,
        advisoryNotice:
          `Operator-supervised — status set to \`${status}\` for ${body.publicationId}. ` +
          'Human remains final authority.',
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
