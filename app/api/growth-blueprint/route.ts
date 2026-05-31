/**
 * /api/growth-blueprint · static growth blueprint catalog.
 *
 * GET — read-only. The route NEVER auto-launches a campaign,
 * NEVER auto-selects a blueprint.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  getGrowthBlueprint, listGrowthBlueprints, type BlueprintId,
} from '@lib/business/growthBlueprints';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = new URL(req.url).searchParams.get('blueprintId') as BlueprintId | null;
  if (id) {
    try {
      const blueprint = getGrowthBlueprint(id);
      return NextResponse.json({
        blueprint,
        advisoryNotice:
          'Growth blueprint · read-only. The route NEVER auto-launches a campaign. ' +
          'Human remains final authority.',
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 404 });
    }
  }
  const catalog = listGrowthBlueprints();
  return NextResponse.json({
    catalog,
    advisoryNotice:
      'Growth blueprint catalog · read-only. The route NEVER auto-launches ' +
      'a campaign, NEVER auto-selects a blueprint. Human remains final authority.',
  });
}
