/**
 * POST /api/cognition/revise — revise currentDraft based on currentReview.
 *
 * Wave 26 — replaces currentDraft with a revised version whose body
 * is regenerated from CURRENT state (which fixes any stale coherence
 * claims) and whose revisedFrom field links back to the original.
 * The original draft is preserved in the cognitive-lineage archive.
 *
 * Refusal cases (all log 'revise-refused'):
 *   - no currentDraft
 *   - no currentReview
 *   - currentReview.recommendation !== 'revise-required'
 *   - revisionCountInChain >= MAX_REVISIONS_PER_DRAFT (loop guard, 3)
 *
 * On success: 'revise' logged; currentDraft replaced (lineage
 * preserves original); currentReview cleared (revised draft needs
 * new review); currentRevision populated with backlinks; lineage
 * gains both a 'revision' entry and a 'draft' entry for the
 * revised body.
 */

import { type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { runRevise } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;

  const result = await runRevise();
  const outcome: 'revised' | 'refused' =
    result.directive.directive === 'revise' ? 'revised' : 'refused';
  return Response.json({ ok: true, outcome, ...result });
}
