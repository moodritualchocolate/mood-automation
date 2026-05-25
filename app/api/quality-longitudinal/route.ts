/**
 * GET /api/quality-longitudinal
 *
 * Read-only longitudinal brand-health view. Joins:
 *   - ad-strategy-memory.json
 *   - copywriter-memory.json
 *   - copy-quality-memory.json
 *
 * No generation, no critic, no external execution. Returns a
 * QualityLongitudinalView shaped for the studio dashboard panel.
 */

import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { buildQualityLongitudinalView } from '@lib/qualityLongitudinalView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [strategy, copywriter, quality] = await Promise.all([
    createAdStrategyMemoryStore().read().catch(() => null),
    createCopywriterMemoryStore().read().catch(() => null),
    createCopyQualityMemoryStore().read().catch(() => null),
  ]);
  const view = buildQualityLongitudinalView({ strategy, copywriter, quality });
  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
