/**
 * POST /api/cognition/restrain — name what was held back.
 *
 * Wave 21 — cognitive vocabulary. Restrain is the explicit not-acting.
 * The organism could have shipped a banner, published, ingested an
 * external signal — and chose not to. The thought records this
 * explicitly so the directive log carries a permanent trace of the
 * discipline.
 *
 * Persists to data/runtime/os-runtime.json (directive 'restrain' with
 * a composed thought) and data/runtime/organism.json (age += 1).
 * No generation, no publishing — by definition.
 */

import { runRestrain } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await runRestrain();
  return Response.json({ ok: true, ...result });
}
