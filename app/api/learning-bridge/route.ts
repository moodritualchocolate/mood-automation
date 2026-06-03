/**
 * GET /api/learning-bridge
 *
 * Pure bridge that composes performance + creative DNA + supervised
 * learning + story architect + asset composer into learning signals.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never auto-modifies upstream systems
 *   - the route never auto-applies any signal
 *   - learning only · operator review required
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { composeLearningSignalBridge } from '@lib/learningSignalBridge';
import { analyzePerformance } from '@lib/performanceAnalyzer';
import { buildCreativeDNAMap } from '@lib/creativeDNAMap';

import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';
import { computeSupervisedLearning } from '@lib/supervisedLearningLoop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [perfMem, pubMem, assetMem, trialMem, outcomeMem, patternMem] = await Promise.all([
    createPerformanceMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
    createOperatorTrialMemoryStore().read().catch(() => null),
    createTrialOutcomeMemoryStore().read().catch(() => null),
    createPatternReliabilityMemoryStore().read().catch(() => null),
  ]);

  const performance = analyzePerformance({
    performances: perfMem?.performances ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
  });
  const creativeDNA = buildCreativeDNAMap({
    performances: perfMem?.performances ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
  });
  const supervised = computeSupervisedLearning({
    trials: trialMem?.trials ?? [],
    outcomes: outcomeMem?.outcomes ?? [],
    priorPatterns: patternMem?.patterns ?? [],
  });

  const alignedMutations = supervised.mutationReliability
    .filter((m) => m.alignedCount > m.contradictedCount && m.evidenceCount >= 2)
    .slice(0, 5)
    .map((m) => m.mutationType);
  const contradictedMutations = supervised.mutationReliability
    .filter((m) => m.contradictedCount > m.alignedCount && m.evidenceCount >= 2)
    .slice(0, 5)
    .map((m) => m.mutationType);

  const reading = composeLearningSignalBridge({
    performance,
    creativeDNA,
    supervised: { alignedMutations, contradictedMutations },
  });

  return NextResponse.json({
    bridge: reading,
    performance,
    creativeDNA,
    advisoryNotice:
      'Learning signal bridge composed performance + creative DNA + supervised learning. ' +
      'The route never auto-modifies any upstream system. ' +
      'Operator review required. Human remains final authority.',
  });
}
