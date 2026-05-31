/**
 * /api/channel-architecture · static channel architecture catalog.
 *
 * GET — read-only. The route declares NO API integrations and NEVER
 * calls a third-party platform.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  getChannelSpec, listChannelArchitecture,
} from '@lib/business/channelArchitecture';
import type { ChannelRef } from '@lib/business/businessGoalModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = new URL(req.url).searchParams.get('channelId') as ChannelRef | null;
  if (id) {
    try {
      const channel = getChannelSpec(id);
      return NextResponse.json({
        channel,
        advisoryNotice:
          'Channel architecture · read-only. The route NEVER auto-publishes, ' +
          'NEVER calls a third-party platform. Human remains final authority.',
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 404 });
    }
  }
  const catalog = listChannelArchitecture();
  return NextResponse.json({
    catalog,
    advisoryNotice:
      'Channel architecture catalog · read-only. The module declares NO API ' +
      'integrations, NEVER auto-publishes, NEVER calls a third-party platform. ' +
      'Human remains final authority.',
  });
}
