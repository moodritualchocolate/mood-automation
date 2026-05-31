/**
 * /api/workspace-context · resolved workspace context.
 *
 * GET ?organizationId=…&workspaceId=…
 *     Returns the resolved context the operator no longer needs to
 *     retype: active brand · default product · primary goal · market ·
 *     audience. Read-only.
 *
 * Closes the friction surfaced by `wk-workflow-duplicate-context` +
 * `ttv-workflow-rewrite` in the Reality Hardening audit. No new
 * architecture introduced; the resolver only reads from existing
 * memory stores (workspace · workspace-activation · knowledge) and
 * picks deterministic defaults.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createWorkspaceMemoryStore } from '@lib/workspaceMemory';
import { createWorkspaceActivationStore } from '@lib/business/workspaceActivation';
import { createKnowledgeMemoryStore } from '@lib/knowledgeMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { getBusinessGoal } from '@lib/business/businessGoalModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResolvedContext {
  organizationId: string;
  workspaceId: string;
  /** Active (most-recently-created) brand label, or null when no brands. */
  brandLabel: string | null;
  /** Default product label for the active brand, or null. */
  productLabel: string | null;
  /** Primary market resolved from knowledge entries, or null. */
  primaryMarket: string | null;
  /** Primary audience resolved from knowledge entries, or null. */
  audienceLabel: string | null;
  /** Primary goal resolved from the latest activated workspace activation, or null. */
  primaryGoalId: string | null;
}

function extractMarketFromKnowledge(
  entries: Array<{ category: string; title: string; tags: string[]; body: string }>,
): string | null {
  // Prefer a knowledge entry tagged 'market' with a market name in its body
  // (e.g. 'israel'). Falls back to the first market-tagged entry's title.
  const marketEntries = entries.filter((e) => e.tags?.includes('market'));
  if (marketEntries.length === 0) return null;
  for (const e of marketEntries) {
    for (const candidate of ['israel', 'global', 'eu', 'usa', 'uk']) {
      if (new RegExp(`\\b${candidate}\\b`, 'i').test(e.body) ||
          new RegExp(`\\b${candidate}\\b`, 'i').test(e.title)) {
        return candidate;
      }
    }
  }
  return null;
}

function extractAudienceFromKnowledge(
  entries: Array<{ category: string; tags: string[]; title: string; body: string }>,
): string | null {
  const audienceEntries = entries.filter((e) => e.category === 'audience-rule');
  if (audienceEntries.length === 0) return null;
  for (const e of audienceEntries) {
    const hyphenated = e.tags.find((t) => /-/.test(t) && t.length <= 24);
    if (hyphenated) return hyphenated;
  }
  return audienceEntries[0].title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId = url.searchParams.get('workspaceId') ?? PLATFORM_WORKSPACE_ID_MOOD;

  const [ws, act, kn] = await Promise.all([
    createWorkspaceMemoryStore().read().catch(() => null),
    createWorkspaceActivationStore().read().catch(() => null),
    createKnowledgeMemoryStore().read().catch(() => null),
  ]);

  // Most recently created brand wins. The brand is workspace-scoped only
  // by convention today (workspaceMemory is global; the operator tags
  // brand intent via the projectId).
  const brands = (ws?.brands ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
  const brand = brands[0] ?? null;
  // First product on the active brand wins.
  const product = brand
    ? (ws?.products ?? []).find((p) => p.brandId === brand.brandId) ?? null
    : null;
  // Latest activated activation for this (org, workspace, brand) wins.
  const activation = (act?.activations ?? [])
    .filter((a) =>
      a.organizationId === organizationId &&
      a.workspaceId === workspaceId &&
      a.status === 'activated' &&
      (!brand || a.brandLabel === brand.name))
    .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

  const knowledgeEntries = kn?.entries ?? [];
  const primaryMarket = extractMarketFromKnowledge(knowledgeEntries);
  const audienceLabel = extractAudienceFromKnowledge(knowledgeEntries);
  const primaryGoalId = activation?.primaryGoalId ?? null;
  const goalLabel = primaryGoalId
    ? (() => { try { return getBusinessGoal(primaryGoalId).label; } catch { return null; } })()
    : null;

  const context: ResolvedContext = {
    organizationId, workspaceId,
    brandLabel: brand?.name ?? null,
    productLabel: product?.name ?? null,
    primaryMarket, audienceLabel,
    primaryGoalId,
  };

  return NextResponse.json({
    context,
    /** Reconstructed labels so the UI can render them without an extra lookup. */
    labels: { goalLabel },
    /** Counts the operator may inspect when context is incomplete. */
    counts: {
      brands: (ws?.brands ?? []).length,
      products: (ws?.products ?? []).length,
      activations: (act?.activations ?? []).length,
      knowledgeEntries: knowledgeEntries.length,
    },
    advisoryNotice:
      'Workspace context · read-only resolver. The route NEVER auto-creates ' +
      'anything; it returns what the operator already declared. Operator ' +
      'approval required at every downstream action. Human remains final authority.',
  });
}
