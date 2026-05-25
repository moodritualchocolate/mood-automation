/**
 * GET /api/cross-brain-conflict
 *
 * Read-only longitudinal view over data/memory/conflict-memory.json.
 * Returns a ConflictLongitudinalView shaped for the studio
 * CrossBrainConflictPanel. The "current" reading is computed from
 * memory-only context (no live banner is in scope at GET-time).
 *
 * No generation, no critic, no external execution.
 */

import { createConflictMemoryStore } from '@lib/conflictMemory';
import { createCulturalPerceptionMemoryStore } from '@lib/culturalPerceptionMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import { buildQualityLongitudinalView } from '@lib/qualityLongitudinalView';
import { computeCulturalPerception } from '@lib/culturalPerceptionEngine';
import { computeCrossBrainConflict } from '@lib/crossBrainConflictEngine';
import { buildConflictLongitudinalView } from '@lib/conflictLongitudinalView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [
    conflictMem, culturalMem, strategyMem, copywriterMem, qualityMem, policyAudit,
  ] = await Promise.all([
    createConflictMemoryStore().read().catch(() => null),
    createCulturalPerceptionMemoryStore().read().catch(() => null),
    createAdStrategyMemoryStore().read().catch(() => null),
    createCopywriterMemoryStore().read().catch(() => null),
    createCopyQualityMemoryStore().read().catch(() => null),
    createPolicyAuditStore().read().catch(() => null),
  ]);

  // Build a memory-only cultural perception as input — the conflict
  // engine takes the same perception the studio would render.
  const culturalPerception = computeCulturalPerception({
    memory: culturalMem,
    strategyMemory: strategyMem,
    copywriterMemory: copywriterMem,
    qualityMemory: qualityMem,
    policyAudit,
  });

  const qualityLongitudinal = buildQualityLongitudinalView({
    strategy: strategyMem, copywriter: copywriterMem, quality: qualityMem,
  });

  const current = computeCrossBrainConflict({
    strategy: null,             // no live strategy at GET-time
    copywriter: null,
    copyQuality: null,
    culturalPerception,
    qualityLongitudinal,
    policyAudit,
  });

  const view = buildConflictLongitudinalView({
    memory: conflictMem,
    current,
  });

  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
