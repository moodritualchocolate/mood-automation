/**
 * POST /api/cognition/observe — the first cognitive action endpoint.
 *
 * Wave 20 — the runtime trigger that produces real cognition. A POST
 * to this endpoint runs one cognitive observation pass: the organism
 * reads its own state, emits the directive 'observe' with a thought
 * describing what was perceived, increments uptime + organism age,
 * and (on the very first call) transitions posture from 'booting' to
 * 'observing'.
 *
 * The response carries a before/after summary for verification. The
 * actual persistence lives on disk:
 *   - data/runtime/os-runtime.json   (directiveLog, posture, uptime)
 *   - data/runtime/organism.json     (age)
 *
 * Every visible dashboard change after this call traces back to those
 * two files. No new persistence machinery, no fabricated values.
 */

import { runObservation } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await runObservation();
  return Response.json({ ok: true, ...result });
}
