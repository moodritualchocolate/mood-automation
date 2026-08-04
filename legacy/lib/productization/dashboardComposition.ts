/**
 * DASHBOARD COMPOSITION (pure)
 *
 * Read-only aggregator that composes the Executive Dashboard view
 * from existing memory snapshots passed in by the route layer. The
 * engine never reads files itself, never auto-routes the operator,
 * never auto-approves an item, never auto-creates an entity.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the engine never auto-acts
 *   - cards are mobile-first; the route layer reorders for desktop
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { OrganizationMemoryState } from '@lib/tenancy/organizationMemory';
import type { AgentRunMemoryState } from '@lib/agentRunMemory';

// We accept narrow read-only shapes for every memory the dashboard
// summarizes, so the composition is independent of each layer's exact
// implementation.

interface AssetLike { assetId: string; approvalStatus: string; campaign?: string; createdAt: number; }
interface CampaignPlanLike { planId: string; status: string; createdAt: number; label: string; }
interface BriefLike { briefId: string; status: string; createdAt: number; }
interface PublicationLike { publicationId: string; status: string; createdAt: number; }
interface PerformanceLike { performanceId: string; createdAt: number; }
interface TaskLike { taskId: string; status: string; deadlineAt?: number; createdAt: number; title: string; }
interface KnowledgeLike { entryId: string; createdAt: number; }
interface MembershipLike { membershipId: string; revokedAt?: number; }

export interface DashboardInput {
  organizations: OrganizationMemoryState['organizations'];
  workspaces: OrganizationMemoryState['workspaces'];
  memberships: MembershipLike[];
  brands?: Array<{ brandId: string; archivedAt?: number }>;
  products?: Array<{ productId: string; archivedAt?: number }>;
  campaignPlans: CampaignPlanLike[];
  briefs?: BriefLike[];
  assets: AssetLike[];
  publications: PublicationLike[];
  performances: PerformanceLike[];
  tasks: TaskLike[];
  knowledgeEntries: KnowledgeLike[];
  agentRuns: AgentRunMemoryState['runs'];
  /** Now (ms) — used for "recent" cards and overdue task detection. */
  nowMs: number;
}

// ─── card shapes ─────────────────────────────────────────────

export type DashboardCardId =
  | 'organizations' | 'brands' | 'products' | 'active-campaigns'
  | 'pending-approvals' | 'assets-waiting-production'
  | 'assets-waiting-publishing' | 'recent-performance'
  | 'team-activity' | 'upcoming-tasks';

export interface DashboardCard {
  id: DashboardCardId;
  label: string;
  primaryMetric: { value: number; suffix?: string };
  observations: string[];
  /** Operator-facing CTA — allowed phrasing only. */
  primaryAction: { label: string; targetSectionId: string };
  /** Mobile order (1 = top of the screen). */
  mobileOrder: number;
}

export interface DashboardDescriptor {
  cards: DashboardCard[];
  notes: string[];
  advisoryNotice: string;
  generatedAt: number;
}

// ─── pure compositor ─────────────────────────────────────────

function recentlyCreated<T extends { createdAt: number }>(rows: T[], windowMs = 7 * 24 * 60 * 60 * 1000, nowMs: number): T[] {
  return rows.filter((r) => nowMs - r.createdAt <= windowMs);
}

const ADVISORY_NOTICE =
  'Executive dashboard is a read-only composition. The route never auto-acts ' +
  'on a card, never auto-approves an item, never auto-publishes. Every CTA ' +
  'routes the operator to an operator-supervised section. Operator approval ' +
  'required. Human remains final authority.';

export function composeExecutiveDashboard(input: DashboardInput): DashboardDescriptor {
  const liveOrgs = input.organizations.filter((o) => !o.archivedAt);
  const liveBrands = (input.brands ?? []).filter((b) => !b.archivedAt);
  const liveProducts = (input.products ?? []).filter((p) => !p.archivedAt);
  const activeCampaigns = input.campaignPlans.filter(
    (p) => p.status === 'in-flight' || p.status === 'approved' || p.status === 'draft');

  const pendingAssetApprovals = input.assets.filter((a) => a.approvalStatus === 'pending');
  const pendingBriefApprovals = (input.briefs ?? []).filter((b) => b.status === 'draft');
  const pendingAgentRunApprovals = input.agentRuns.filter((r) => r.status === 'pending');
  const pendingCampaignPlanApprovals = input.campaignPlans.filter((p) => p.status === 'draft');
  const totalPendingApprovals =
    pendingAssetApprovals.length + pendingBriefApprovals.length +
    pendingAgentRunApprovals.length + pendingCampaignPlanApprovals.length;

  const assetsWaitingForProduction = input.assets.filter(
    (a) => a.approvalStatus === 'pending' || a.approvalStatus === 'draft');
  const assetsWaitingForPublishing = input.assets.filter(
    (a) => a.approvalStatus === 'approved' &&
      !input.publications.some((p) => p.publicationId.includes(a.assetId)));

  const recentPerformanceWindow = recentlyCreated(input.performances, 7 * 24 * 60 * 60 * 1000, input.nowMs);

  // "Team activity" = recent memberships granted + recent agent runs
  // executed + recent knowledge entries created. Counted in last 7 days.
  const recentMemberships = (input.memberships ?? [])
    .filter((m) => !m.revokedAt).length;
  const recentAgentRuns = recentlyCreated(input.agentRuns, 7 * 24 * 60 * 60 * 1000, input.nowMs);
  const recentKnowledge = recentlyCreated(input.knowledgeEntries, 7 * 24 * 60 * 60 * 1000, input.nowMs);
  const teamActivityCount = recentAgentRuns.length + recentKnowledge.length;

  // Upcoming tasks = open + in-progress, sorted by deadlineAt asc (overdue first)
  const upcomingTasks = input.tasks
    .filter((t) => t.status === 'open' || t.status === 'in-progress')
    .sort((a, b) => (a.deadlineAt ?? Infinity) - (b.deadlineAt ?? Infinity));
  const overdueTasks = upcomingTasks.filter((t) => t.deadlineAt !== undefined && t.deadlineAt < input.nowMs);

  const cards: DashboardCard[] = [
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      primaryMetric: { value: totalPendingApprovals },
      observations: [
        `assets pending: ${pendingAssetApprovals.length}`,
        `briefs pending: ${pendingBriefApprovals.length}`,
        `agent runs pending: ${pendingAgentRunApprovals.length}`,
        `campaign plans pending: ${pendingCampaignPlanApprovals.length}`,
      ],
      primaryAction: { label: 'Open approvals queue', targetSectionId: 'approvals' },
      mobileOrder: 1,
    },
    {
      id: 'assets-waiting-production',
      label: 'Assets Waiting For Production',
      primaryMetric: { value: assetsWaitingForProduction.length },
      observations: [
        `pending or draft assets: ${assetsWaitingForProduction.length}`,
        'Editor+ MAY register · Manager+ MAY approve',
      ],
      primaryAction: { label: 'Open production studio', targetSectionId: 'production-studio' },
      mobileOrder: 2,
    },
    {
      id: 'assets-waiting-publishing',
      label: 'Assets Waiting For Publishing',
      primaryMetric: { value: assetsWaitingForPublishing.length },
      observations: [
        'approved assets not yet on a publication record',
        'operator manually registers each publication',
      ],
      primaryAction: { label: 'Open assets', targetSectionId: 'assets' },
      mobileOrder: 3,
    },
    {
      id: 'active-campaigns',
      label: 'Active Campaigns',
      primaryMetric: { value: activeCampaigns.length },
      observations: activeCampaigns.slice(0, 3).map((p) => `${p.label} · ${p.status}`),
      primaryAction: { label: 'Open campaigns', targetSectionId: 'campaigns' },
      mobileOrder: 4,
    },
    {
      id: 'upcoming-tasks',
      label: 'Upcoming Tasks',
      primaryMetric: { value: upcomingTasks.length, suffix: overdueTasks.length > 0 ? `· ${overdueTasks.length} overdue` : undefined },
      observations: upcomingTasks.slice(0, 3).map((t) => t.title),
      primaryAction: { label: 'Open tasks', targetSectionId: 'campaigns' },
      mobileOrder: 5,
    },
    {
      id: 'recent-performance',
      label: 'Recent Performance',
      primaryMetric: { value: recentPerformanceWindow.length, suffix: 'rows · last 7 days' },
      observations: [
        'historically observed metrics, operator-logged',
        'no auto-fetched performance — manual entry only',
      ],
      primaryAction: { label: 'Open performance', targetSectionId: 'performance' },
      mobileOrder: 6,
    },
    {
      id: 'team-activity',
      label: 'Team Activity',
      primaryMetric: { value: teamActivityCount, suffix: 'events · last 7 days' },
      observations: [
        `active memberships: ${recentMemberships}`,
        `agent runs executed: ${recentAgentRuns.length}`,
        `knowledge entries created: ${recentKnowledge.length}`,
      ],
      primaryAction: { label: 'Open teams', targetSectionId: 'teams' },
      mobileOrder: 7,
    },
    {
      id: 'organizations',
      label: 'Organizations',
      primaryMetric: { value: liveOrgs.length, suffix: 'active' },
      observations: liveOrgs.slice(0, 3).map((o) => `${o.name} · ${o.billingTier}`),
      primaryAction: { label: 'Open organizations', targetSectionId: 'organizations' },
      mobileOrder: 8,
    },
    {
      id: 'brands',
      label: 'Brands',
      primaryMetric: { value: liveBrands.length, suffix: 'active' },
      observations: [`${liveBrands.length} brands · ${liveProducts.length} products`],
      primaryAction: { label: 'Open brands', targetSectionId: 'brands' },
      mobileOrder: 9,
    },
    {
      id: 'products',
      label: 'Products',
      primaryMetric: { value: liveProducts.length, suffix: 'active' },
      observations: [`${liveProducts.length} products`],
      primaryAction: { label: 'Open products', targetSectionId: 'products' },
      mobileOrder: 10,
    },
  ];

  return {
    cards,
    notes: [
      `${cards.length} dashboard cards composed (mobile-first order)`,
      'every CTA routes to an operator-supervised section',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
    generatedAt: input.nowMs,
  };
}
