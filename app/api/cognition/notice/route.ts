/**
 * POST /api/cognition/notice — name one salient fact.
 *
 * Wave 21 — cognitive vocabulary. Notice is the second cognitive
 * verb after observe: where observe describes the current state in
 * full, notice surfaces one specific fact (the most recent directive
 * in the log, or its absence) and names it.
 *
 * Persists to data/runtime/os-runtime.json (directive 'notice' with
 * a composed thought) and data/runtime/organism.json (age += 1).
 * No other archive is touched. Posture transitions from 'booting'
 * to 'observing' on the very first cognitive act; otherwise it stays
 * where it is — cognition discipline before action.
 */

import { type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { runNotice } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;

  const result = await runNotice();
  return Response.json({ ok: true, ...result });
}
