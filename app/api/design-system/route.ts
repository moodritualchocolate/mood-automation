/**
 * /api/design-system · static design tokens descriptor.
 *
 * GET — read-only. The route never mutates anything.
 */

import { NextResponse } from 'next/server';
import { describeDesignSystem } from '@lib/productization/designSystem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const ds = describeDesignSystem();
  return NextResponse.json({
    designSystem: ds,
    advisoryNotice:
      'Design system descriptor · read-only. The route never auto-applies a ' +
      'theme. Human remains final authority.',
  });
}
