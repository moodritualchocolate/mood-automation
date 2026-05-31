/**
 * /api/product · operator-supervised product CRUD.
 *
 * GET  ?organizationId=…&workspaceId=…[&brandId=…][&productId=…]
 *      Returns products, optionally scoped to a brand. With productId,
 *      returns that single record.
 * POST · operator-supervised.
 *        Actions:
 *          create · operator creates a product record
 *        Every write requires operatorId + operatorReason.
 *
 * Wraps existing pure transforms in lib/workspaceMemory.ts. No new
 * architecture introduced — closes the gap surfaced by
 * `wk-product-route-missing` in the Reality Hardening audit.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  appendProduct, createWorkspaceMemoryStore, newProductId,
  type ProductRecord,
} from '@lib/workspaceMemory';
import type { Formula } from '@/core/types';
import { FORMULAS } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const productId = url.searchParams.get('productId');
  const brandId = url.searchParams.get('brandId');
  const store = createWorkspaceMemoryStore();
  const state = await store.read();
  if (productId) {
    const product = state.products.find((p) => p.productId === productId);
    if (!product) return NextResponse.json({ error: 'product not found' }, { status: 404 });
    return NextResponse.json({
      product,
      advisoryNotice:
        'Product record · read-only. The route NEVER auto-creates. ' +
        'Human remains final authority.',
    });
  }
  const products = brandId
    ? state.products.filter((p) => p.brandId === brandId)
    : state.products;
  return NextResponse.json({
    products,
    advisoryNotice:
      'Product list · read-only. The route NEVER auto-creates. ' +
      'Human remains final authority.',
  });
}

interface CreateBody {
  action: 'create';
  operatorId: string;
  operatorReason: string;
  brandId: string;
  name: string;
  formula?: Formula;
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
  if (typeof body.brandId !== 'string' || body.brandId.length === 0) {
    return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
  }
  if (typeof body.name !== 'string' || body.name.length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (body.formula && !FORMULAS.includes(body.formula)) {
    return NextResponse.json({ error: 'unknown formula' }, { status: 400 });
  }

  const store = createWorkspaceMemoryStore();
  let state = await store.read();
  if (!state.brands.some((b) => b.brandId === body.brandId)) {
    return NextResponse.json({ error: 'brand not found' }, { status: 404 });
  }

  // Idempotency: if a product with the same brandId + name already exists,
  // return it without creating a duplicate.
  const existing = state.products.find(
    (p) => p.brandId === body.brandId && p.name === body.name);
  if (existing) {
    return NextResponse.json({
      ok: true, product: existing,
      advisoryNotice:
        'Operator-supervised — product already present, returned existing record. ' +
        'Human remains final authority.',
    });
  }

  const at = Date.now();
  const record: ProductRecord = {
    productId: newProductId(), brandId: body.brandId, name: body.name,
    formula: body.formula, description: body.description,
    createdAt: at, operatorId: body.operatorId, operatorNote: body.operatorNote,
  };
  state = appendProduct(state, record);
  await store.save(state);
  return NextResponse.json({
    ok: true, product: record,
    advisoryNotice:
      'Operator-supervised — product created. The route NEVER auto-acts. ' +
      'Human remains final authority.',
  });
}
