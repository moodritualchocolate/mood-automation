/**
 * POST /api/cognition/defer — earned patience.
 *
 * Wave 30 — defer is the verb that lets the organism choose to wait.
 * It always succeeds. The thought is composed at evolve time from
 * the current temporal assessment (so the directive log names a real
 * reason — fragmentation risk, cadence unhealthiness, low recovery
 * effectiveness, etc.). If everything is healthy, the thought says
 * "chosen patience — preserving longitudinal coherence."
 *
 * defer is NOT refusal. It's strategic waiting that makes the organism
 * more trustworthy. organism.age increments (cognition still happened);
 * the temporal memory records why waiting was wise.
 *
 * Strictly internal:
 *   - no publish
 *   - no post
 *   - no external action
 *   - no sandbox mutation
 */

import { runDefer } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await runDefer();
  return Response.json({ ok: true, outcome: 'deferred', ...result });
}
