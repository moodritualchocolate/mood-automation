/**
 * POST /api/cognition/prepare — first internal intention.
 *
 * Wave 23 — prepare is the first verb that consumes the permission
 * window opened by 'permit'. On success it records that the organism
 * has prepared internally to act, opening an IntentionState. No
 * creative content is generated, no external target is named, no
 * publishing path is touched.
 *
 * On success:
 *   - directive 'prepare' is logged with a thought naming the
 *     consumed permission and stating no generation occurred
 *   - permissionWindow is cleared (consumed)
 *   - currentIntention is opened: { preparedAt, preparedTick,
 *                                   permittedTick, status: 'open' }
 *   - response carries outcome: 'prepared'
 *
 * On refusal (no permission window):
 *   - directive 'prepare-refused' is logged with a thought naming
 *     the missing precondition
 *   - permissionWindow and currentIntention stay as they were
 *   - response carries outcome: 'refused'
 *
 * Both branches are cognition. uptime advances, organism.age
 * increments, the directive entry persists. The dashboard's
 * DirectiveStream and CognitionTimeline panels read os.directiveLog
 * directly and so wake up on either branch.
 *
 * No archive outside of os-runtime.json + organism.json is touched.
 */

import { runPrepare } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await runPrepare();
  const directive_name = result.directive.directive;
  const outcome: 'prepared' | 'refused' =
    directive_name === 'prepare' ? 'prepared' : 'refused';

  return Response.json({ ok: true, outcome, ...result });
}
