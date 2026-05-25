/**
 * GET /api/counterfactual-cognition
 *
 * Read-only longitudinal view over the multi-path strategic
 * simulation memory. Returns a CounterfactualCognitionLongitudinalView
 * shaped for the studio panel. The "current" reading is computed
 * from memory-only context.
 *
 * No generation, no critic, no external execution.
 */

import {
  createCounterfactualCognitionMemoryStore,
} from '@lib/counterfactualCognitionMemory';
import { createExecutiveGovernanceMemoryStore, buildGovernanceHistoryContext } from '@lib/executiveGovernanceMemory';
import { createIdentityContinuityMemoryStore, buildIdentityHistoryContext } from '@lib/identityContinuityMemory';
import { createCognitiveWeightMemoryStore, buildHistoryContext } from '@lib/cognitiveWeightMemory';
import { createStrategicOutcomeMemoryStore, buildOutcomeHistoryContext } from '@lib/strategicOutcomeMemory';
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
import { computeIdentityContinuity } from '@lib/identityContinuityEngine';
import { computeExecutiveGovernance } from '@lib/executiveGovernanceEngine';
import { computeStrategicOutcomeIntelligence } from '@lib/strategicOutcomeIntelligence';
import { computeCounterfactualCognition } from '@lib/counterfactualCognitionEngine';
import { buildCounterfactualCognitionLongitudinalView } from '@lib/counterfactualCognitionLongitudinalView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [
    counterfactualMem, outcomeMem, governanceMem, identityMem, weightMem,
    conflictMem, culturalMem, strategyMem, copywriterMem, qualityMem, policyAudit,
  ] = await Promise.all([
    createCounterfactualCognitionMemoryStore().read().catch(() => null),
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

  const outcome = computeStrategicOutcomeIntelligence({
    conflict,
    culturalPerception,
    identityContinuity: identity,
    executiveGovernance: governance,
    qualityLongitudinal,
    history: buildOutcomeHistoryContext(outcomeMem),
  });

  const current = computeCounterfactualCognition({
    conflict,
    culturalPerception,
    cognitiveWeight,
    identityContinuity: identity,
    executiveGovernance: governance,
    strategicOutcome: outcome,
  });

  const view = buildCounterfactualCognitionLongitudinalView({
    memory: counterfactualMem,
    current,
  });

  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
