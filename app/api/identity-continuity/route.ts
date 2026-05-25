/**
 * GET /api/identity-continuity
 *
 * Read-only longitudinal view over data/memory/identity-continuity-memory.json.
 * Returns an IdentityContinuityLongitudinalView shaped for the studio
 * IdentityContinuityPanel. "current" reading is computed from
 * memory-only context (no live banner at GET-time).
 *
 * No generation, no critic, no external execution.
 */

import { createIdentityContinuityMemoryStore, buildIdentityHistoryContext } from '@lib/identityContinuityMemory';
import { createCognitiveWeightMemoryStore, buildHistoryContext } from '@lib/cognitiveWeightMemory';
import { createConflictMemoryStore } from '@lib/conflictMemory';
import { createCulturalPerceptionMemoryStore } from '@lib/culturalPerceptionMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import { buildQualityLongitudinalView } from '@lib/qualityLongitudinalView';
import { buildConflictLongitudinalView } from '@lib/conflictLongitudinalView';
import { buildPolicyAuditView } from '@lib/copyQualityPolicyAuditView';
import { computeCulturalPerception } from '@lib/culturalPerceptionEngine';
import { computeCrossBrainConflict } from '@lib/crossBrainConflictEngine';
import { computeCognitiveWeightEvolution } from '@lib/cognitiveWeightEvolution';
import { computeIdentityContinuity } from '@lib/identityContinuityEngine';
import { buildIdentityContinuityLongitudinalView } from '@lib/identityContinuityLongitudinalView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [
    identityMem, weightMem, conflictMem, culturalMem,
    strategyMem, copywriterMem, qualityMem, policyAudit,
  ] = await Promise.all([
    createIdentityContinuityMemoryStore().read().catch(() => null),
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

  const cognitiveWeight = computeCognitiveWeightEvolution({
    conflict,
    culturalPerception,
    policyAudit,
    qualityLongitudinal,
    conflictLongitudinal,
    history: buildHistoryContext(weightMem),
  });

  const policyAuditView = buildPolicyAuditView(policyAudit);

  const current = computeIdentityContinuity({
    cognitiveWeight,
    conflict,
    culturalPerception,
    qualityLongitudinal,
    policyAuditView,
    history: buildIdentityHistoryContext(identityMem),
  });

  const view = buildIdentityContinuityLongitudinalView({
    memory: identityMem,
    current,
  });

  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
