/**
 * POST /api/banner/:id/export
 * Returns the banner rasterised as PNG.
 */

import { NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { recallBanner } from '@/core/banner-cache';
import { exportBanner } from '@/engines/export';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;
  const banner = recallBanner(params.id);
  if (!banner) {
    return new Response(JSON.stringify({ error: 'banner not found in cache' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }
  const { pngBase64 } = await exportBanner(banner);
  const buffer = Buffer.from(pngBase64, 'base64');
  return new Response(buffer, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'content-disposition': `attachment; filename="mood-${params.id.slice(0, 8)}.png"`,
    },
  });
}
