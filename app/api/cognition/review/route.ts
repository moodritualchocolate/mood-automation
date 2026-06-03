/**
 * POST /api/cognition/review — internal review of currentDraft.
 *
 * Wave 26 — evaluates currentDraft against persistent state using
 * deterministic scoring (lib/reviewScoring.ts). Produces a CurrentReview
 * with six scores, derived strengths/weaknesses, and a recommendation:
 *   'approved-for-approval' | 'revise-required' | 'refused'
 *
 * On success: directive 'review' is logged; os.currentReview is set;
 * the lineage archive gains a 'review' entry.
 *
 * On refusal (no currentDraft): directive 'review-refused' is logged;
 * currentReview unchanged.
 *
 * Both branches advance uptime, season, organism.age, and apply
 * Wave 25 DSA deltas (review = -0.20 energy, contradictionScore
 * raises stress).
 */

import { type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { runReview } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;

  const result = await runReview();
  const outcome: 'reviewed' | 'refused' =
    result.directive.directive === 'review' ? 'reviewed' : 'refused';
  return Response.json({ ok: true, outcome, ...result });
}
