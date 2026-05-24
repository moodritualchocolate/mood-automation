/**
 * POST /api/cognition/propose — first external-action sandbox.
 *
 * Wave 27 — Phase 8A. propose creates a sandboxed PendingExternalAction
 * derived from currentApproval + currentDraft + currentReview. Nothing
 * executes. The entry sits in os.pendingExternalActions[] until a
 * future phase decides what to do with it.
 *
 * Refusal cases (each logs 'propose-refused' with the failing reason):
 *   - no currentApproval                                    no approved cognition to propose from
 *   - currentDraft missing OR ID mismatches approval         the approved draft is no longer current
 *   - currentReview missing OR ID mismatches approval        the approval's review is no longer current
 *
 * On success: 'propose' directive logged; one entry appended to
 * pendingExternalActions (FIFO eviction at PENDING_ACTIONS_LIMIT).
 * currentApproval is NOT consumed — multiple candidates may derive
 * from one approved cognition; the cap acts as the throttle.
 *
 * Allowed actionType for this phase: 'prepare_external_candidate'.
 * 'publish' and 'post' are explicitly NOT allowed — the union type
 * does not include them, so a future phase introducing them is a
 * deliberate type-level change.
 *
 * NO publish, NO post, NO API call, NO social posting, NO marketing
 * output, NO execution. The sandbox is sealed.
 */

import { runPropose } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await runPropose();
  const outcome: 'proposed' | 'refused' =
    result.directive.directive === 'propose' ? 'proposed' : 'refused';
  return Response.json({ ok: true, outcome, ...result });
}
