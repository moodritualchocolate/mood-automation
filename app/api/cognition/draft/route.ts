/**
 * POST /api/cognition/draft — first internal artifact.
 *
 * Wave 24 — draft is the first verb that consumes the currentIntention
 * opened by 'prepare'. On success it creates currentDraft, an
 * internal artifact whose body is composed deterministically from
 * the directiveLog counts at draft time. No external content, no
 * publish path, no banner is invoked.
 *
 * On success:
 *   - directive 'draft' is logged
 *   - currentIntention is consumed (cleared to null — the draft's
 *     derivedFrom* fields carry the trace)
 *   - currentDraft is set with body + restraintTrace
 *   - permissionWindow is NOT touched (prepare consumed it earlier)
 *   - response carries outcome: 'drafted'
 *
 * On refusal (no open currentIntention):
 *   - directive 'draft-refused' is logged with a thought naming the
 *     missing precondition
 *   - currentIntention, currentDraft, permissionWindow all unchanged
 *   - response carries outcome: 'refused'
 *
 * Both branches advance uptime + seasonAge and increment organism.age.
 * No archive outside of os-runtime.json + organism.json is touched.
 */

import { runDraft } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await runDraft();
  const directive_name = result.directive.directive;
  const outcome: 'drafted' | 'refused' =
    directive_name === 'draft' ? 'drafted' : 'refused';

  return Response.json({ ok: true, outcome, ...result });
}
