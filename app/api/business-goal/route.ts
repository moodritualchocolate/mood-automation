/**
 * /api/business-goal · static business goal catalog.
 *
 * GET — read-only. The route NEVER predicts, NEVER optimizes,
 * NEVER selects a goal on the operator’s behalf.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  getBusinessGoal, listBusinessGoals, type BusinessGoalId,
} from '@lib/business/businessGoalModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const goalId = new URL(req.url).searchParams.get('goalId') as BusinessGoalId | null;
  if (goalId) {
    try {
      const goal = getBusinessGoal(goalId);
      return NextResponse.json({
        goal,
        advisoryNotice:
          'Business goal · read-only. The route NEVER auto-selects a goal. ' +
          'Human remains final authority.',
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 404 });
    }
  }
  const catalog = listBusinessGoals();
  return NextResponse.json({
    catalog,
    advisoryNotice:
      'Business goal catalog · read-only. The route NEVER predicts, NEVER ' +
      'optimizes, NEVER selects a goal on the operator’s behalf. ' +
      'Human remains final authority.',
  });
}
