/**
 * GET /api/cognitive-weight
 *
 * Read-only longitudinal view over data/memory/cognitive-weight-memory.json.
 * Returns a CognitiveWeightLongitudinalView shaped for the studio
 * CognitiveWeightEvolutionPanel. The "current" reading is computed
 * from memory-only context (no live banner is in scope at GET-time).
 *
 * No generation, no critic, no external execution.
 */

import { createCognitiveWeightMemoryStore, buildHistoryContext } from '@lib/cognitiveWeightMemory';
import { createConflictMemoryStore } from '@lib/conflictMemory';
import { createCulturalPerceptionMemoryStore } from '@lib/culturalPerceptionMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import { buildQualityLongitudinalView } from '@lib/qualityLongitudinalView';
import { buildConflictLongitudinalView } from '@lib/conflictLongitudinalView';
import { computeCulturalPerception } from '@lib/culturalPerceptionEngine';
import { computeCrossBrainConflict } from '@lib/crossBrainConflictEngine';
import { computeCognitiveWeightEvolution } from '@lib/cognitiveWeightEvolution';
import { buildCognitiveWeightLongitudinalView } from '@lib/cognitiveWeightLongitudinalView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [
    weightMem, conflictMem, culturalMem, strategyMem, copywriterMem, qualityMem, policyAudit,
  ] = await Promise.all([
    createCognitiveWeightMemoryStore().read().catch(() => null),
    createConflictMemoryStore().read().catch(() => null),
    createCulturalPerceptionMemoryStore().read().catch(() => null),
    createAdStrategyMemoryStore().read().catch(() => null),
    createCopywriterMemoryStore().read().catch(() => null),
    createCopyQualityMemoryStore().read().catch(() => null),
    createPolicyAuditStore().read().catch(() => null),
  ]);

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

  const conflict = computeCrossBrainConflict({
    culturalPerception,
    qualityLongitudinal,
    policyAudit,
  });

  const conflictLongitudinal = buildConflictLongitudinalView({
    memory: conflictMem,
    current: conflict,
  });

  const current = computeCognitiveWeightEvolution({
    conflict,
    culturalPerception,
    policyAudit,
    qualityLongitudinal,
    conflictLongitudinal,
    history: buildHistoryContext(weightMem),
  });

  const view = buildCognitiveWeightLongitudinalView({
    memory: weightMem,
    current,
  });

  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
