/**
 * GET /api/provider-registry
 *
 * Read-only provider capability registry.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never calls a provider
 *   - the route never executes a generation
 */

import { NextResponse } from 'next/server';
import { getProviderRegistry } from '@lib/providerRegistry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(getProviderRegistry());
}
