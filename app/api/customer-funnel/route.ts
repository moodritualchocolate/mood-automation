/**
 * /api/customer-funnel · static customer funnel descriptor.
 *
 * GET — read-only. The route NEVER auto-classifies a customer,
 * NEVER auto-routes between stages.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  getFunnelStage, listCustomerFunnel, type FunnelStageId,
} from '@lib/business/customerFunnelModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = new URL(req.url).searchParams.get('stageId') as FunnelStageId | null;
  if (id) {
    try {
      const stage = getFunnelStage(id);
      return NextResponse.json({
        stage,
        advisoryNotice:
          'Customer funnel stage · read-only. The route NEVER auto-classifies ' +
          'a customer. Human remains final authority.',
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 404 });
    }
  }
  const catalog = listCustomerFunnel();
  return NextResponse.json({
    catalog,
    advisoryNotice:
      'Customer funnel catalog · read-only. The route NEVER auto-classifies ' +
      'a customer, NEVER auto-routes a customer between stages. ' +
      'Human remains final authority.',
  });
}
