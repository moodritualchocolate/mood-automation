/**
 * /api/agent · operator-supervised execution agents.
 *
 * GET  — returns the agent catalog + run history with per-status
 *        counts (read-only).
 * POST — operator-supervised.
 *        Actions:
 *          execute  · operator triggers a named agent with input
 *                     payload · run record created with status
 *                     `pending`
 *          approve  · operator approves the run
 *          reject   · operator rejects the run
 *          archive  · operator archives the run
 *        Every write requires operatorId + operatorReason. The
 *        route NEVER auto-approves a run, NEVER publishes, NEVER
 *        spends money, NEVER calls external APIs.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { requireSession } from '@lib/auth/requireSession';
import {
  createAgentRunMemoryStore, newAgentRunId, type AgentRunRecord, type AgentRunStatus,
} from '@lib/agentRunMemory';
import {
  AGENT_CATALOG, AGENT_IDS,
  runCreativeDirectorAgent, runContentProducerAgent, runQualityReviewerAgent,
  runCampaignManagerAgent, runPerformanceAnalystAgent,
  type AgentId, type CreativeDirectorAgentInput, type ContentProducerAgentInput,
  type QualityReviewerAgentInput, type CampaignManagerAgentInput,
  type PerformanceAnalystAgentInput,
} from '@lib/agents';
import { analyzePerformance } from '@lib/performanceAnalyzer';
import { analyzeAttribution } from '@lib/attributionEngine';
import { analyzeCustomerJourneys } from '@lib/customerJourneyEngine';
import { composeLearningSignalBridge } from '@lib/learningSignalBridge';
import { composeRevenueLearningBridge } from '@lib/revenueLearningBridge';
import { buildCreativeDNAMap } from '@lib/creativeDNAMap';
import { computeSupervisedLearning } from '@lib/supervisedLearningLoop';

import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createCampaignPlanMemoryStore } from '@lib/campaignPlanMemory';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createCustomerJourneyMemoryStore } from '@lib/customerJourneyMemory';
import { createTaskMemoryStore } from '@lib/taskMemory';
import { createKnowledgeMemoryStore } from '@lib/knowledgeMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_AGENTS: ReadonlySet<AgentId> = new Set(AGENT_IDS);
const VALID_TRANSITIONS: ReadonlySet<AgentRunStatus> = new Set(['approved', 'rejected', 'archived']);

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const _url0 = new URL(req.url);
  const _orgId0 = _url0.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const _wspId0 = _url0.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, _orgId0, _wspId0);
  if (!tenantAuth.ok) return tenantAuth.response;

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') as AgentRunStatus | null;
  const agentFilter = url.searchParams.get('agent') as AgentId | null;

  const mem = await createAgentRunMemoryStore().read().catch(() => null);
  const all = mem?.runs ?? [];
  let runs = all;
  if (statusFilter) runs = runs.filter((r) => r.status === statusFilter);
  if (agentFilter && VALID_AGENTS.has(agentFilter)) runs = runs.filter((r) => r.agentId === agentFilter);

  const counts: Record<AgentRunStatus, number> = {
    pending: 0, approved: 0, rejected: 0, archived: 0,
  };
  for (const r of all) counts[r.status] += 1;

  return NextResponse.json({
    catalog: AGENT_CATALOG,
    totalRuns: mem?.totalRuns ?? 0,
    counts,
    runs: runs.slice(-64),
    advisoryNotice:
      'Agent · operator-supervised. The route NEVER auto-approves a run, ' +
      'NEVER publishes, NEVER spends money, NEVER calls external APIs. ' +
      'Human remains final authority.',
  });
}

// ─── POST ────────────────────────────────────────────────────

interface ExecuteBody {
  action: 'execute';
  operatorId: string;
  operatorReason: string;
  agentId: AgentId;
  label?: string;
  input: unknown;
  operatorNote?: string;
}
interface TransitionBody {
  action: 'approve' | 'reject' | 'archive';
  operatorId: string;
  operatorReason: string;
  runId: string;
}
type Body = ExecuteBody | TransitionBody;

function isExecute(b: Body): b is ExecuteBody { return b.action === 'execute'; }
function isTransition(b: Body): b is TransitionBody {
  return b.action === 'approve' || b.action === 'reject' || b.action === 'archive';
}

async function runAgent(agentId: AgentId, input: unknown): Promise<unknown> {
  switch (agentId) {
    case 'creative-director': {
      const a = input as CreativeDirectorAgentInput;
      // Anchor performance if available.
      const perfMem = await createPerformanceMemoryStore().read().catch(() => null);
      const pubMem = await createPublicationRegistryStore().read().catch(() => null);
      const assetMem = await createAssetRegistryMemoryStore().read().catch(() => null);
      const performance = analyzePerformance({
        performances: perfMem?.performances ?? [],
        publications: pubMem?.publications ?? [],
        assets: assetMem?.assets ?? [],
      });
      return runCreativeDirectorAgent({ ...a, performance });
    }
    case 'content-producer': {
      const a = input as ContentProducerAgentInput;
      return runContentProducerAgent(a);
    }
    case 'quality-reviewer': {
      const a = input as QualityReviewerAgentInput;
      const assetMem = await createAssetRegistryMemoryStore().read().catch(() => null);
      const knowledgeMem = await createKnowledgeMemoryStore().read().catch(() => null);
      // If the operator passed assetIds (string array), resolve them from
      // the asset registry. Otherwise the operator passed full asset
      // records directly.
      const explicitAssetIds = (input as { assetIds?: string[] }).assetIds;
      const resolvedAssets = explicitAssetIds && Array.isArray(explicitAssetIds)
        ? (assetMem?.assets ?? []).filter((rec) => explicitAssetIds.includes(rec.assetId))
        : a.assets;
      return runQualityReviewerAgent({
        assets: resolvedAssets ?? [],
        knowledgeEntries: knowledgeMem?.entries ?? [],
        audienceMarket: a.audienceMarket,
      });
    }
    case 'campaign-manager': {
      const a = input as CampaignManagerAgentInput;
      const planMem = await createCampaignPlanMemoryStore().read().catch(() => null);
      const assetMem = await createAssetRegistryMemoryStore().read().catch(() => null);
      const taskMem = await createTaskMemoryStore().read().catch(() => null);
      return runCampaignManagerAgent({
        campaignPlans: a.campaignPlans ?? planMem?.plans ?? [],
        assets: a.assets ?? assetMem?.assets ?? [],
        tasks: a.tasks ?? taskMem?.tasks ?? [],
        nowMs: a.nowMs,
      });
    }
    case 'performance-analyst': {
      const a = input as PerformanceAnalystAgentInput;
      const journeyMem = await createCustomerJourneyMemoryStore().read().catch(() => null);
      const pubMem = await createPublicationRegistryStore().read().catch(() => null);
      const assetMem = await createAssetRegistryMemoryStore().read().catch(() => null);
      const planMem = await createCampaignPlanMemoryStore().read().catch(() => null);
      const perfMem = await createPerformanceMemoryStore().read().catch(() => null);
      const trialMem = await createOperatorTrialMemoryStore().read().catch(() => null);
      const outcomeMem = await createTrialOutcomeMemoryStore().read().catch(() => null);
      const patternMem = await createPatternReliabilityMemoryStore().read().catch(() => null);
      const events = journeyMem?.events ?? [];
      const journey = a.journey ?? analyzeCustomerJourneys({ events });
      const attribution = a.attribution ?? analyzeAttribution({
        events,
        publications: pubMem?.publications ?? [],
        assets: assetMem?.assets ?? [],
        campaignPlans: planMem?.plans ?? [],
      });
      const performance = a.performance ?? analyzePerformance({
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
      const learningBridge = a.learningBridge ?? composeLearningSignalBridge({
        performance, creativeDNA,
        supervised: { alignedMutations, contradictedMutations },
      });
      const revenueBridge = a.revenueBridge ?? composeRevenueLearningBridge({
        journey, attribution, performance, learningBridge,
      });
      return runPerformanceAnalystAgent({
        performance, attribution, journey, learningBridge, revenueBridge,
      });
    }
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  body.operatorId = auth.ctx.user.userId;

  const store = createAgentRunMemoryStore();

  if (isExecute(body)) {
    if (!VALID_AGENTS.has(body.agentId)) {
      return NextResponse.json({ error: 'unknown agentId' }, { status: 400 });
    }
    let output: unknown;
    try {
      output = await runAgent(body.agentId, body.input);
    } catch (err) {
      return NextResponse.json({ error: `agent threw: ${(err as Error).message}` }, { status: 500 });
    }
    const at = Date.now();
    const record: AgentRunRecord = {
      runId: newAgentRunId(),
      agentId: body.agentId,
      label: body.label ?? `${AGENT_CATALOG[body.agentId].name} · ${new Date(at).toISOString().slice(0, 19)}`,
      input: body.input,
      output,
      createdAt: at,
      operatorId: body.operatorId,
      status: 'pending',
      history: [{ at, status: 'pending', operatorId: body.operatorId, reason: body.operatorReason }],
      operatorNote: body.operatorNote,
    };
    const next = await store.append(record);
    return NextResponse.json({
      ok: true,
      run: record,
      totalRuns: next.totalRuns,
      advisoryNotice:
        'Operator-supervised — agent run created with status `pending`. ' +
        'The agent NEVER auto-approves. Human remains final authority.',
    });
  }

  if (isTransition(body)) {
    const status: AgentRunStatus =
      body.action === 'approve' ? 'approved' :
      body.action === 'reject' ? 'rejected' :
                                  'archived';
    if (!VALID_TRANSITIONS.has(status)) {
      return NextResponse.json({ error: 'invalid transition' }, { status: 400 });
    }
    try {
      const next = await store.updateStatus(body.runId, {
        at: Date.now(), status,
        operatorId: body.operatorId, reason: body.operatorReason,
      });
      const updated = next.runs.find((r) => r.runId === body.runId);
      return NextResponse.json({
        ok: true,
        run: updated,
        advisoryNotice:
          `Operator-supervised — status set to \`${status}\` for ${body.runId}. ` +
          'Human remains final authority.',
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
