/**
 * /api/dashboard · Executive Dashboard.
 *
 * GET ?operatorId=…&organizationId=…[&workspaceId=…]
 *     Composes the operator's home dashboard from existing memory
 *     snapshots. Read-only. The route never auto-acts on a card,
 *     never auto-approves an item.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createOrganizationMemoryStore } from '@lib/tenancy/organizationMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createCampaignPlanMemoryStore } from '@lib/campaignPlanMemory';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createTaskMemoryStore } from '@lib/taskMemory';
import { createKnowledgeMemoryStore } from '@lib/knowledgeMemory';
import { createAgentRunMemoryStore } from '@lib/agentRunMemory';
import { PLATFORM_TENANT_ID_MOOD } from '@lib/tenancy/types';
import { resolveTenantContext } from '@lib/tenancy/tenantContext';
import { composeExecutiveDashboard } from '@lib/productization/dashboardComposition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const g = globalThis as unknown as { __moodPlatformOwners?: Set<string> };
function platformOwners(): string[] {
  if (!g.__moodPlatformOwners) {
    const seed = (process.env.MOOD_PLATFORM_OWNERS ?? '')
      .split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    g.__moodPlatformOwners = new Set(seed);
  }
  return [...g.__moodPlatformOwners];
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const operatorId = url.searchParams.get('operatorId') ?? '';
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId = url.searchParams.get('workspaceId');
  if (!operatorId) return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });

  const orgMem = await createOrganizationMemoryStore().read().catch(() => null);
  const context = resolveTenantContext({
    operatorId, targetOrganizationId: organizationId,
    targetWorkspaceId: workspaceId ?? null,
    platformOwnerOperatorIds: platformOwners(),
    organizations: orgMem?.organizations ?? [],
    workspaces: orgMem?.workspaces ?? [],
    memberships: orgMem?.memberships ?? [],
    nowMs: Date.now(),
  });

  const assetMem = await createAssetRegistryMemoryStore().read().catch(() => null);
  const pubMem   = await createPublicationRegistryStore().read().catch(() => null);
  const planMem  = await createCampaignPlanMemoryStore().read().catch(() => null);
  const perfMem  = await createPerformanceMemoryStore().read().catch(() => null);
  const taskMem  = await createTaskMemoryStore().read().catch(() => null);
  const knMem    = await createKnowledgeMemoryStore().read().catch(() => null);
  const runMem   = await createAgentRunMemoryStore().read().catch(() => null);

  const dashboard = composeExecutiveDashboard({
    organizations: orgMem?.organizations ?? [],
    workspaces: orgMem?.workspaces ?? [],
    memberships: orgMem?.memberships ?? [],
    campaignPlans: (planMem?.plans ?? []).map((p) => ({
      planId: p.planId, status: p.status, createdAt: p.createdAt, label: p.label,
    })),
    assets: (assetMem?.assets ?? []).map((a) => ({
      assetId: a.assetId, approvalStatus: a.approvalStatus,
      campaign: a.campaign, createdAt: a.createdAt,
    })),
    publications: (pubMem?.publications ?? []).map((p) => ({
      publicationId: p.publicationId, status: p.status, createdAt: p.publishedAt,
    })),
    performances: (perfMem?.performances ?? []).map((p) => ({
      performanceId: p.performanceId, createdAt: p.measuredAt,
    })),
    tasks: (taskMem?.tasks ?? []).map((t) => ({
      taskId: t.taskId, status: t.status, deadlineAt: t.deadlineAt,
      createdAt: t.createdAt, title: t.title,
    })),
    knowledgeEntries: (knMem?.entries ?? []).map((k) => ({
      entryId: k.entryId, createdAt: k.createdAt,
    })),
    agentRuns: runMem?.runs ?? [],
    nowMs: Date.now(),
  });

  return NextResponse.json({
    context,
    dashboard,
    advisoryNotice:
      'Executive dashboard · read-only. The route never auto-acts on a card, ' +
      'never auto-approves an item. Operator approval required. Human remains ' +
      'final authority.',
  });
}
