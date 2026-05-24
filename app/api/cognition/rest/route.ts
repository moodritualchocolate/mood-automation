/**
 * POST /api/cognition/rest — internal recovery.
 *
 * Wave 28 — Rest + Recovery Physiology. The organism's first
 * restorative cognitive verb. Strictly internal:
 *   - no publish
 *   - no post
 *   - no external API call
 *   - no sandbox mutation (pendingExternalActions untouched)
 *   - no trust economy
 *   - no civilization layer
 *
 * Two gates:
 *   1. Depletion — at least one of energy ≤ 4, stress ≥ 5,
 *      complexity ≥ 6, fragmentation ≥ 3, or pending actions with
 *      energy ≤ 6. Refuses with "not depleted enough" otherwise.
 *
 *   2. Cadence — at least 10 uptime ticks OR 3 non-rest cognitive
 *      acts since the last successful rest. Refuses with "recovery
 *      cadence not yet elapsed" otherwise.
 *
 * Cadence OR semantic (not AND) so either working-cycle (3 acts) or
 * wall-time (10 ticks at ~4s polling ≈ 40s) is sufficient. Refusals
 * don't game the gate because rest-refused directives are excluded
 * from the act count.
 *
 * On success:
 *   energyReserves     +1.2 (cap 10)
 *   stressAccumulation -0.8 (floor 0)
 *   complexityLoad     -0.6 (floor 0)
 *   coordinationEMA    +0.3 (cap 10, additive — overrides EMA blend)
 *   fragmentationStreak max(0, prev - 1) (overrides applyCognitiveAct's
 *                                          reset-to-zero on success)
 *   restCount          += 1
 *   consecutiveActions  = 0 (rest clears the action-count)
 *   organism.age       += 1
 *   lastRestAt / lastRestTick / lastRestSnapshot   recorded on organism
 *   directive 'rest'    appended to directiveLog
 */

import { runRest } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await runRest();
  const outcome: 'rested' | 'refused' =
    result.directive.directive === 'rest' ? 'rested' : 'refused';
  return Response.json({ ok: true, outcome, ...result });
}
