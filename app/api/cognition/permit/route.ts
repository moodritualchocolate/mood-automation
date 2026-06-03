/**
 * POST /api/cognition/permit — the permission gate.
 *
 * Wave 22 — the first verb whose outcome depends on cognitive history.
 * A permit attempt succeeds only when the discipline chain exists in
 * the directive log: at least one observe, one notice, one consider,
 * and one restrain. Ordering is not required; presence is.
 *
 * On success:
 *   - directive 'permit' is logged with a thought summarising the
 *     discipline chain (counts of each verb in the log)
 *   - permissionWindow is opened in os-runtime.json
 *   - the response carries outcome: 'permitted'
 *
 * On refusal:
 *   - directive 'permit-refused' is logged with a thought naming the
 *     missing verbs
 *   - permissionWindow stays as it was (still null on first run)
 *   - the response carries outcome: 'refused' and a 'missing' list
 *
 * Both branches are cognition: uptime advances, seasonAge advances,
 * organism.age increments, the entry persists. The refusal is itself
 * a cognitive act — the organism noticed the gate was closed.
 *
 * No action runs from this endpoint. The window is internal only.
 */

import { type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { runPermit } from '@lib/cognitionEngine';
import { REQUIRED_DISCIPLINE } from '@lib/operatingSystemCore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;

  const result = await runPermit();
  const directive_name = result.directive.directive;
  const outcome: 'permitted' | 'refused' =
    directive_name === 'permit' ? 'permitted' : 'refused';

  // Surface the 'missing' list on refusal so the caller can see at a
  // glance what discipline must precede the next permit attempt. The
  // canonical list is also embedded in the thought string.
  let missing: string[] | undefined;
  if (outcome === 'refused') {
    const m = result.thought.match(/missing \[(.*?)\]/);
    missing = m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : [...REQUIRED_DISCIPLINE];
  }

  return Response.json({ ok: true, outcome, ...(missing ? { missing } : {}), ...result });
}
