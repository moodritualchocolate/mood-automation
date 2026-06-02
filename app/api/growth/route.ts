/**
 * /api/growth · Growth Command Center composition.
 *
 * GET — read-only. Composes Goals · Funnels · Campaigns · Channels ·
 * Assets · Performance · Tasks · Approvals into a single executive
 * descriptor. The route NEVER auto-launches a campaign, NEVER
 * auto-publishes, NEVER spends money, NEVER calls external APIs.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createOrganizationMemoryStore } from '@lib/tenancy/organizationMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createCampaignPlanMemoryStore } from '@lib/campaignPlanMemory';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createTaskMemoryStore } from '@lib/taskMemory';
import { createAgentRunMemoryStore } from '@lib/agentRunMemory';
import { createWorkspaceActivationStore } from '@lib/business/workspaceActivation';
import { composeGrowthCommandCenter } from '@lib/business/growthCommandCenter';
import { PLATFORM_TENANT_ID_MOOD } from '@lib/tenancy/types';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { resolveTenantContext } from '@lib/tenancy/tenantContext';

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
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId = url.searchParams.get('workspaceId') ?? 'wsp-mood-default';
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const operatorId = tenantAuth.ctx.user.userId;

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

  const [assetMem, pubMem, planMem, perfMem, taskMem, runMem, actMem] = await Promise.all([
    createAssetRegistryMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createCampaignPlanMemoryStore().read().catch(() => null),
    createPerformanceMemoryStore().read().catch(() => null),
    createTaskMemoryStore().read().catch(() => null),
    createAgentRunMemoryStore().read().catch(() => null),
    createWorkspaceActivationStore().read().catch(() => null),
  ]);

  const descriptor = composeGrowthCommandCenter({
    organizations: orgMem?.organizations ?? [],
    workspaces: orgMem?.workspaces ?? [],
    activations: actMem?.activations ?? [],
    campaignPlans: (planMem?.plans ?? []).map((p) => ({
      planId: p.planId, status: p.status, createdAt: p.createdAt, label: p.label,
    })),
    assets: (assetMem?.assets ?? []).map((a) => ({
      assetId: a.assetId, approvalStatus: a.approvalStatus,
      createdAt: a.createdAt, campaign: a.campaign,
    })),
    publications: (pubMem?.publications ?? []).map((p) => ({
      publicationId: p.publicationId, status: p.status,
    })),
    performances: (perfMem?.performances ?? []).map((p) => ({
      performanceId: p.performanceId, createdAt: p.measuredAt,
    })),
    tasks: (taskMem?.tasks ?? []).map((t) => ({
      taskId: t.taskId, status: t.status, deadlineAt: t.deadlineAt, title: t.title,
    })),
    agentRuns: runMem?.runs ?? [],
    nowMs: Date.now(),
  });

  return NextResponse.json({
    context,
    descriptor,
    advisoryNotice:
      'Growth command center · read-only. The route NEVER auto-launches a ' +
      'campaign, NEVER auto-publishes an asset, NEVER spends money, NEVER ' +
      'calls external APIs. Human remains final authority.',
  });
}
