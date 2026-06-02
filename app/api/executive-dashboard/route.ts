/**
 * GET /api/executive-dashboard
 *
 * Single-screen executive snapshot composed from operator-supervised
 * registries + pure analyzers. Read-only.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route NEVER publishes
 *   - the route NEVER spends
 *   - the route NEVER calls external APIs
 *   - all metrics are descriptive only
 */

import { NextResponse, type NextRequest } from 'next/server';
import { composeExecutiveDashboard } from '@lib/executiveDashboardEngine';
import { composeWorkspace } from '@lib/workspaceEngine';
import {
  brandsForTenant, campaignsForTenant, productsForTenant, projectsForTenant,
} from '@lib/workspaceMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { buildTeamEngine } from '@lib/teamEngine';
import { analyzeTasks } from '@lib/taskEngine';
import { analyzeCustomerJourneys } from '@lib/customerJourneyEngine';
import { analyzeAttribution } from '@lib/attributionEngine';
import { analyzePerformance } from '@lib/performanceAnalyzer';
import { composeLearningSignalBridge } from '@lib/learningSignalBridge';
import { buildCreativeDNAMap } from '@lib/creativeDNAMap';
import { composeRevenueLearningBridge } from '@lib/revenueLearningBridge';
import { computeSupervisedLearning } from '@lib/supervisedLearningLoop';

import { createWorkspaceMemoryStore } from '@lib/workspaceMemory';
import { createTeamMemoryStore } from '@lib/teamMemory';
import { createTaskMemoryStore } from '@lib/taskMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createCampaignPlanMemoryStore } from '@lib/campaignPlanMemory';
import { createGenerationRequestQueueStore } from '@lib/generationRequestQueue';
import { createCustomerJourneyMemoryStore } from '@lib/customerJourneyMemory';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const tenantScope = { organizationId, workspaceId };
  const [
    wsMem, teamMem, taskMem, assetMem, pubMem, planMem,
    genMem, journeyMem, perfMem, trialMem, outcomeMem, patternMem,
  ] = await Promise.all([
    createWorkspaceMemoryStore().read().catch(() => null),
    createTeamMemoryStore().read().catch(() => null),
    createTaskMemoryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createCampaignPlanMemoryStore().read().catch(() => null),
    createGenerationRequestQueueStore().read().catch(() => null),
    createCustomerJourneyMemoryStore().read().catch(() => null),
    createPerformanceMemoryStore().read().catch(() => null),
    createOperatorTrialMemoryStore().read().catch(() => null),
    createTrialOutcomeMemoryStore().read().catch(() => null),
    createPatternReliabilityMemoryStore().read().catch(() => null),
  ]);
  const workspace = composeWorkspace({
    projects:  wsMem ? projectsForTenant(wsMem,  tenantScope) : [],
    brands:    wsMem ? brandsForTenant(wsMem,    tenantScope) : [],
    products:  wsMem ? productsForTenant(wsMem,  tenantScope) : [],
    campaigns: wsMem ? campaignsForTenant(wsMem, tenantScope) : [],
    assets: assetMem?.assets ?? [], publications: pubMem?.publications ?? [],
    events: journeyMem?.events ?? [],
  });
  const team = buildTeamEngine({ members: teamMem?.members ?? [] });
  const tasks = analyzeTasks({ tasks: taskMem?.tasks ?? [] });
  const journey = analyzeCustomerJourneys({ events: journeyMem?.events ?? [] });
  const attribution = analyzeAttribution({
    events: journeyMem?.events ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
    campaignPlans: planMem?.plans ?? [],
  });
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
    .slice(0, 5).map((m) => m.mutationType);
  const contradictedMutations = supervised.mutationReliability
    .filter((m) => m.contradictedCount > m.alignedCount && m.evidenceCount >= 2)
    .slice(0, 5).map((m) => m.mutationType);
  const learning = composeLearningSignalBridge({
    performance, creativeDNA,
    supervised: { alignedMutations, contradictedMutations },
  });
  const revenueBridge = composeRevenueLearningBridge({
    journey, attribution, performance, learningBridge: learning,
  });
  const reading = composeExecutiveDashboard({
    workspace, team, tasks,
    assets: assetMem?.assets ?? [],
    publications: pubMem?.publications ?? [],
    campaignPlans: planMem?.plans ?? [],
    generationRequests: genMem?.requests ?? [],
    journey, attribution, performance, learning, revenueBridge,
    systemHealth: { overallStatus: 'stable', typeScriptStatus: true, warningCount: 0 },
  });
  return NextResponse.json({
    reading,
    advisoryNotice:
      'Executive dashboard · composed observation only. The system never ' +
      'publishes, never spends, never auto-executes anything. ' +
      'Human remains final authority.',
  });
}
