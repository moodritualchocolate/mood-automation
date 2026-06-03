/**
 * /api/knowledge · operator-supervised.
 *
 * GET   — returns knowledge engine search results (optional `q`
 *         and `category` filters).
 * POST  — operator-supervised. Actions: create | update. Every
 *         write requires operatorId + operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route NEVER auto-creates entries
 *   - the route NEVER auto-edits entries
 *   - the route NEVER auto-derives "best practice" claims
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { requireSession } from '@lib/auth/requireSession';
import {
  createKnowledgeMemoryStore, newKnowledgeEntryId,
  appendKnowledgeEntry, updateKnowledgeEntry,
  type KnowledgeEntry, type KnowledgeCategory,
} from '@lib/knowledgeMemory';
import { searchKnowledge } from '@lib/knowledgeEngine';
import type { Formula } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: ReadonlySet<KnowledgeCategory> = new Set([
  'brand-rule', 'product-rule', 'visual-rule',
  'audience-rule', 'formula-rule', 'campaign-history',
]);
const VALID_FORMULAS: ReadonlySet<Formula> = new Set(['ENERGY', 'FOCUS', 'RELAX', 'SLEEP']);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const _url0 = new URL(req.url);
  const _orgId0 = _url0.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const _wspId0 = _url0.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, _orgId0, _wspId0);
  if (!tenantAuth.ok) return tenantAuth.response;

  const url = new URL(req.url);
  const query = url.searchParams.get('q') ?? undefined;
  const categoryRaw = url.searchParams.get('category') as KnowledgeCategory | null;
  const categoryFilter = categoryRaw && VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : null;
  const mem = await createKnowledgeMemoryStore().read().catch(() => null);
  const reading = searchKnowledge({
    entries: mem?.entries ?? [], query, categoryFilter,
  });
  return NextResponse.json({
    reading,
    entries: mem?.entries ?? [],
    advisoryNotice:
      'Knowledge · operator-supervised. The route never auto-creates entries, ' +
      'never auto-edits entries, never auto-derives best-practice claims. ' +
      'Human remains final authority.',
  });
}

interface CreateBody {
  action: 'create';
  operatorId: string;
  operatorReason: string;
  category: KnowledgeCategory;
  title: string;
  body: string;
  tags?: string[];
  linkedFormula?: Formula;
  linkedProductId?: string;
}
interface UpdateBody {
  action: 'update';
  operatorId: string;
  operatorReason: string;
  entryId: string;
  title?: string;
  body?: string;
  tags?: string[];
}
type Body = CreateBody | UpdateBody;

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

  const store = createKnowledgeMemoryStore();
  const state = await store.read();

  if (body.action === 'create') {
    if (!body.title || !body.body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }
    if (!VALID_CATEGORIES.has(body.category)) {
      return NextResponse.json({ error: 'invalid category' }, { status: 400 });
    }
    if (body.linkedFormula && !VALID_FORMULAS.has(body.linkedFormula)) {
      return NextResponse.json({ error: 'invalid linkedFormula' }, { status: 400 });
    }
    const at = Date.now();
    const entry: KnowledgeEntry = {
      entryId: newKnowledgeEntryId(), category: body.category,
      title: body.title, body: body.body,
      tags: body.tags ?? [], createdAt: at, operatorId: body.operatorId,
      revisionHistory: [{ at, operatorId: body.operatorId, reason: body.operatorReason }],
      linkedFormula: body.linkedFormula, linkedProductId: body.linkedProductId,
    };
    await store.save(appendKnowledgeEntry(state, entry));
    return NextResponse.json({ ok: true, entry });
  }
  if (body.action === 'update') {
    if (!body.entryId) return NextResponse.json({ error: 'entryId is required' }, { status: 400 });
    try {
      const at = Date.now();
      const next = updateKnowledgeEntry(state, body.entryId, {
        title: body.title, body: body.body, tags: body.tags,
      }, { at, operatorId: body.operatorId, reason: body.operatorReason });
      await store.save(next);
      const updated = next.entries.find((e) => e.entryId === body.entryId);
      return NextResponse.json({ ok: true, entry: updated });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
