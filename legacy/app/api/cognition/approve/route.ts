/**
 * POST /api/cognition/approve — verdict the current draft as internally coherent.
 *
 * Wave 26 — approval is NOT execution. The verdict is the literal
 * 'internally-coherent'; nothing leaves the runtime. No publish, no
 * generate, no external mutation. What approve actually does:
 *   - logs directive 'approve'
 *   - sets os.currentApproval with the verdict and scoresSnapshot
 *   - advances organism.evolutionaryAge by +1 (the only thing that
 *     does — every other cognitive verb leaves it untouched)
 *   - inscribes an 'approval' entry into cognitive-lineage.json
 *
 * Refusal cases (all log 'approve-refused' with the failing condition
 * named in the thought):
 *   - no currentReview
 *   - no currentDraft
 *   - review.recommendation !== 'approved-for-approval'
 *   - review.contradictionScore > 0
 *   - review.coherenceScore < APPROVE_MIN_COHERENCE (6)
 *   - review.restraintScore < APPROVE_MIN_RESTRAINT (7)
 *
 * The thresholds are re-checked here so approve refuses if the most
 * recent review dropped below them even after being marked approvable.
 */

import { type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { runApprove } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;

  const result = await runApprove();
  const outcome: 'approved' | 'refused' =
    result.directive.directive === 'approve' ? 'approved' : 'refused';
  return Response.json({ ok: true, outcome, ...result });
}
