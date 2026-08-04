/**
 * /api/channel-unified · single operator-facing channel taxonomy.
 *
 * GET — read-only. Returns the unified channel catalog (ChannelRef
 * parent + PublicationChannel formats). The existing
 * /api/channel-architecture and PublicationChannel enum remain.
 */

import { NextResponse } from 'next/server';
import { listUnifiedChannels } from '@lib/business/channelUnified';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const catalog = listUnifiedChannels();
  return NextResponse.json({
    catalog,
    advisoryNotice:
      'Unified channel taxonomy · read-only. The route NEVER auto-publishes. ' +
      'Human remains final authority.',
  });
}
