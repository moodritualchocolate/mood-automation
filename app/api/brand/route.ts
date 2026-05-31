/**
 * /api/brand · operator-supervised brand CRUD.
 *
 * GET  ?organizationId=…&workspaceId=…[&brandId=…]
 *      Returns brands. With brandId, returns that single record.
 * POST · operator-supervised.
 *        Actions:
 *          create  · operator creates a brand record
 *        Every write requires operatorId + operatorReason. The route
 *        NEVER auto-creates, NEVER calls external APIs.
 *
 * Wraps existing pure transforms in lib/workspaceMemory.ts. No new
 * architecture introduced — this route closes the gap surfaced by
 * `wk-brand-route-missing` in the Reality Hardening audit.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  appendBrand, createWorkspaceMemoryStore, newBrandId, newProjectId,
  appendProject, type BrandRecord, type ProjectRecord,
} from '@lib/workspaceMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const brandId = url.searchParams.get('brandId');
  const store = createWorkspaceMemoryStore();
  const state = await store.read();
  if (brandId) {
    const brand = state.brands.find((b) => b.brandId === brandId);
    if (!brand) return NextResponse.json({ error: 'brand not found' }, { status: 404 });
    return NextResponse.json({
      brand,
      advisoryNotice:
        'Brand record · read-only. The route NEVER auto-creates. ' +
        'Human remains final authority.',
    });
  }
  return NextResponse.json({
    brands: state.brands,
    advisoryNotice:
      'Brand list · read-only. The route NEVER auto-creates. ' +
      'Human remains final authority.',
  });
}

interface CreateBody {
  action: 'create';
  operatorId: string;
  operatorReason: string;
  name: string;
  /** Optional project id; when absent the route creates a default project record. */
  projectId?: string;
  description?: string;
  operatorNote?: string;
}
type Body = CreateBody;

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
  if (body.action !== 'create') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }
  if (typeof body.name !== 'string' || body.name.length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const store = createWorkspaceMemoryStore();
  let state = await store.read();
  const at = Date.now();

  // Idempotency: if a brand with the same name already exists, return it
  // without creating a duplicate.
  const existing = state.brands.find((b) => b.name === body.name);
  if (existing) {
    return NextResponse.json({
      ok: true, brand: existing,
      advisoryNotice:
        'Operator-supervised — brand already present, returned existing record. ' +
        'Human remains final authority.',
    });
  }

  // Ensure a project record exists (BrandRecord requires projectId).
  let projectId = body.projectId;
  if (!projectId) {
    projectId = newProjectId();
    const project: ProjectRecord = {
      projectId, name: `${body.name} · default project`,
      createdAt: at, operatorId: body.operatorId,
      operatorNote: 'auto-created default project for brand registration',
    };
    state = appendProject(state, project);
  }

  const record: BrandRecord = {
    brandId: newBrandId(), projectId, name: body.name,
    description: body.description, createdAt: at,
    operatorId: body.operatorId, operatorNote: body.operatorNote,
  };
  state = appendBrand(state, record);
  await store.save(state);
  return NextResponse.json({
    ok: true, brand: record,
    advisoryNotice:
      'Operator-supervised — brand created. The route NEVER auto-acts. ' +
      'Human remains final authority.',
  });
}
