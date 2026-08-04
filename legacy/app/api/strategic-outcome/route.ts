/**
 * GET /api/strategic-outcome
 *
 * Read-only longitudinal view over data/memory/strategic-outcome-memory.json.
 * Returns a StrategicOutcomeLongitudinalView shaped for the studio
 * StrategicOutcomeIntelligencePanel. "current" reading is computed
 * from memory-only context (no live banner at GET-time).
 *
 * No generation, no critic, no external execution.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { createStrategicOutcomeMemoryStore, buildOutcomeHistoryContext } from '@lib/strategicOutcomeMemory';
import { createExecutiveGovernanceMemoryStore, buildGovernanceHistoryContext } from '@lib/executiveGovernanceMemory';
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
import { computeExecutiveGovernance } from '@lib/executiveGovernanceEngine';
import { computeStrategicOutcomeIntelligence } from '@lib/strategicOutcomeIntelligence';
import { buildStrategicOutcomeLongitudinalView } from '@lib/strategicOutcomeLongitudinalView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [
    outcomeMem, governanceMem, identityMem, weightMem, conflictMem, culturalMem,
    strategyMem, copywriterMem, qualityMem, policyAudit,
  ] = await Promise.all([
    createStrategicOutcomeMemoryStore().read().catch(() => null),
    createExecutiveGovernanceMemoryStore().read().catch(() => null),
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

  const identity = computeIdentityContinuity({
    cognitiveWeight,
    conflict,
    culturalPerception,
    qualityLongitudinal,
    history: buildIdentityHistoryContext(identityMem),
  });

  const governance = computeExecutiveGovernance({
    cognitiveWeight,
    conflict,
    culturalPerception,
    identityContinuity: identity,
    qualityLongitudinal,
    history: buildGovernanceHistoryContext(governanceMem),
  });

  const policyAuditView = buildPolicyAuditView(policyAudit);

  const current = computeStrategicOutcomeIntelligence({
    conflict,
    culturalPerception,
    identityContinuity: identity,
    executiveGovernance: governance,
    qualityLongitudinal,
    policyAuditView,
    history: buildOutcomeHistoryContext(outcomeMem),
  });

  const view = buildStrategicOutcomeLongitudinalView({
    memory: outcomeMem,
    current,
  });

  return NextResponse.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
