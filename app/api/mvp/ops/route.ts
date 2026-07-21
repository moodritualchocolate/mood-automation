/**
 * GET /api/mvp/ops — operator telemetry surface (roadmap #17 + #20)
 *
 * One JSON answer to "how is the product doing":
 *   · generation counts + provider split + fallback rate
 *   · LLM cost-shape (avg tokens/latency where telemetry exists)
 *   · quota usage for the requesting operator
 *   · learning-model coverage (selections observed · promote/demote)
 *   · recent errors · waitlist size
 *
 * Read-only. Tenant-scoped. No PII beyond the operator's own ids.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { createMvpGenerationMemoryStore } from '@lib/mvpGenerationMemory';
import { buildLearningModel, corpusSignals } from '@lib/mvpLearning';
import { readMvpErrors } from '@lib/mvpErrorLogMemory';
import { createMvpWaitlistMemoryStore } from '@lib/mvpWaitlistMemory';
import { monthlyGenerationLimit, isThisMonth, PLANS } from '@lib/mvpPlans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;

  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const operatorId = tenantAuth.ctx.user.userId;

  const genState = await createMvpGenerationMemoryStore().read();
  const tenantGens = genState.records.filter(
    (r) => r.organizationId === organizationId && r.workspaceId === workspaceId,
  );

  const providerSplit: Record<string, number> = {};
  let telemetryRuns = 0, tokensIn = 0, tokensOut = 0, latency = 0, fallbacks = 0;
  const verticalSplit: Record<string, number> = {};
  for (const r of tenantGens) {
    providerSplit[r.providerId] = (providerSplit[r.providerId] ?? 0) + 1;
    if (r.verticalId) verticalSplit[r.verticalId] = (verticalSplit[r.verticalId] ?? 0) + 1;
    if (r.telemetry) {
      telemetryRuns += 1;
      tokensIn += r.telemetry.tokensIn ?? 0;
      tokensOut += r.telemetry.tokensOut ?? 0;
      latency += r.telemetry.latencyMs;
      if (r.telemetry.fellBack) fallbacks += 1;
    }
  }

  const usedThisMonth = tenantGens.filter(
    (r) => r.operatorId === operatorId && isThisMonth(r.createdAt),
  ).length;

  const learning = await buildLearningModel();
  const signals = corpusSignals(learning);
  const errors = await readMvpErrors();
  const waitlist = await createMvpWaitlistMemoryStore().read();

  return NextResponse.json({
    generations: {
      total: tenantGens.length,
      providerSplit,
      verticalSplit,
      failed: tenantGens.filter((r) => r.status === 'failed').length,
    },
    llm: telemetryRuns > 0 ? {
      runs: telemetryRuns,
      avgTokensIn: Math.round(tokensIn / telemetryRuns),
      avgTokensOut: Math.round(tokensOut / telemetryRuns),
      avgLatencyMs: Math.round(latency / telemetryRuns),
      fallbackRate: Number((fallbacks / telemetryRuns).toFixed(2)),
      // gpt-4.1-mini list pricing
      estCostPerGenUsd: Number((((tokensIn / telemetryRuns) * 0.4 + (tokensOut / telemetryRuns) * 1.6) / 1_000_000).toFixed(4)),
    } : null,
    quota: { used: usedThisMonth, limit: monthlyGenerationLimit() },
    plans: PLANS,
    learning: {
      selectionsObserved: learning.selections,
      familiesTracked: Object.keys(learning.byFamily).length,
      promoteCandidates: signals.promote.length,
      demoteCandidates: signals.demote.length,
    },
    errors: {
      recent: errors.slice(-10).reverse(),
      total: errors.length,
    },
    waitlist: { total: waitlist.totalRecords },
    advisoryNotice: 'Read-only operations surface. Human remains final authority.',
  });
}
