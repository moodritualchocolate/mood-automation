/**
 * GET /api/cultural-perception
 *
 * Read-only view over the Cultural Perception memory + cross-memory
 * joiners. Returns a CulturalPerceptionLongitudinalView shaped for
 * the studio Cultural Intelligence panel.
 *
 * No generation, no critic, no external execution.
 */

import { createCulturalPerceptionMemoryStore } from '@lib/culturalPerceptionMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import { buildCulturalPerceptionView } from '@lib/culturalPerceptionView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [cultural, strategy, copywriter, quality, policyAudit] = await Promise.all([
    createCulturalPerceptionMemoryStore().read().catch(() => null),
    createAdStrategyMemoryStore().read().catch(() => null),
    createCopywriterMemoryStore().read().catch(() => null),
    createCopyQualityMemoryStore().read().catch(() => null),
    createPolicyAuditStore().read().catch(() => null),
  ]);
  const view = buildCulturalPerceptionView({
    cultural, strategy, copywriter, quality, policyAudit,
  });
  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
