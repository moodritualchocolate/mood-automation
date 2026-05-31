/**
 * GROWTH COMMAND CENTER (pure composition)
 *
 * Composes the single executive screen at /growth. The composition
 * folds Goals · Funnels · Campaigns · Channels · Assets · Performance
 * · Tasks · Approvals into one mobile-first descriptor — read-only.
 * Never auto-acts. Never auto-launches. Never auto-publishes.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the composition NEVER auto-acts
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { OrganizationMemoryState } from '@lib/tenancy/organizationMemory';
import type { AgentRunMemoryState } from '@lib/agentRunMemory';
import type { WorkspaceActivationMemoryState } from './workspaceActivation';
import type {
  BusinessGoal, BusinessGoalId, ChannelRef, MeasurementCategory,
} from './businessGoalModel';
import { listBusinessGoals } from './businessGoalModel';
import { listGrowthBlueprints } from './growthBlueprints';
import { listChannelArchitecture } from './channelArchitecture';
import { listCustomerFunnel } from './customerFunnelModel';

// ─── input shape ─────────────────────────────────────────────

interface AssetLike { assetId: string; approvalStatus: string; createdAt: number; campaign?: string; }
interface CampaignPlanLike { planId: string; status: string; createdAt: number; label: string; }
interface PublicationLike { publicationId: string; status: string; channel?: ChannelRef; }
interface PerformanceLike { performanceId: string; createdAt: number; }
interface TaskLike { taskId: string; status: string; deadlineAt?: number; title: string; }

export interface GrowthCommandCenterInput {
  organizations: OrganizationMemoryState['organizations'];
  workspaces: OrganizationMemoryState['workspaces'];
  activations: WorkspaceActivationMemoryState['activations'];
  campaignPlans: CampaignPlanLike[];
  assets: AssetLike[];
  publications: PublicationLike[];
  performances: PerformanceLike[];
  tasks: TaskLike[];
  agentRuns: AgentRunMemoryState['runs'];
  nowMs: number;
}

// ─── module shape ────────────────────────────────────────────

export interface GrowthCommandModule {
  moduleId:
    | 'goals' | 'funnels' | 'campaigns' | 'channels'
    | 'assets' | 'performance' | 'tasks' | 'approvals';
  label: string;
  /** Headline metric for the module card. */
  primaryMetric: { value: number; suffix?: string };
  /** Up to 3 observations to render under the metric. */
  observations: string[];
  /** Mobile order (1 = topmost on phone). */
  mobileOrder: number;
  /** Linked navigation section (from the productization layer). */
  targetSectionId: string;
}

export interface GrowthCommandCenterDescriptor {
  modules: GrowthCommandModule[];
  /** Cross-module connections — what depends on what. */
  connections: Array<{ from: string; to: string; note: string }>;
  /** Goal × channel matrix for the operator’s active scaffolding. */
  goalChannelMatrix: Array<{
    goalId: BusinessGoalId; goal: BusinessGoal; channelIds: ChannelRef[];
    measurementCategories: MeasurementCategory[];
  }>;
  notes: string[];
  advisoryNotice: string;
  generatedAt: number;
}

const ADVISORY_NOTICE =
  'Growth command center is a read-only composition. The route NEVER ' +
  'auto-launches a campaign, NEVER auto-publishes an asset, NEVER spends ' +
  'money, NEVER calls external APIs. Every module routes the operator to an ' +
  'operator-supervised section. Operator approval required. ' +
  'Human remains final authority.';

export function composeGrowthCommandCenter(
  input: GrowthCommandCenterInput,
): GrowthCommandCenterDescriptor {
  const goals = listBusinessGoals().goals;
  const blueprints = listGrowthBlueprints().blueprints;
  const channels = listChannelArchitecture().channels;
  const funnel = listCustomerFunnel().stages;

  // Goal × channel matrix from the active scaffolding (or, when no
  // activations exist yet, from the static goal catalog).
  const activeGoalIds = new Set<BusinessGoalId>();
  for (const a of input.activations) {
    if (a.status === 'activated') for (const gid of a.scaffolding.defaultGoalIds) activeGoalIds.add(gid);
  }
  const goalSet = activeGoalIds.size > 0
    ? goals.filter((g) => activeGoalIds.has(g.goalId))
    : goals;
  const goalChannelMatrix = goalSet.map((g) => ({
    goalId: g.goalId,
    goal: g,
    channelIds: g.requiredChannels,
    measurementCategories: g.requiredMeasurements,
  }));

  // Module composition.
  const activeCampaigns = input.campaignPlans.filter(
    (p) => p.status === 'draft' || p.status === 'approved' || p.status === 'in-flight');
  const pendingApprovals =
    input.assets.filter((a) => a.approvalStatus === 'pending').length +
    input.agentRuns.filter((r) => r.status === 'pending').length +
    input.campaignPlans.filter((p) => p.status === 'draft').length;
  const upcomingTasks = input.tasks.filter((t) => t.status === 'open' || t.status === 'in-progress');
  const recentPerformanceRows = input.performances.filter(
    (p) => input.nowMs - p.createdAt <= 7 * 24 * 60 * 60 * 1000).length;
  const livePublicationCount = input.publications.filter((p) => p.status === 'live').length;
  const channelUsageCount = new Set(input.publications
    .filter((p) => p.channel)
    .map((p) => p.channel)).size;

  const modules: GrowthCommandModule[] = [
    {
      moduleId: 'goals', label: 'Goals',
      primaryMetric: { value: goalSet.length, suffix: 'active' },
      observations: goalSet.slice(0, 3).map((g) => g.label),
      mobileOrder: 1, targetSectionId: 'campaigns',
    },
    {
      moduleId: 'funnels', label: 'Funnels',
      primaryMetric: { value: funnel.length, suffix: 'stages' },
      observations: ['Awareness → Advocacy', `${funnel.length} stages tracked · operator-logged`],
      mobileOrder: 2, targetSectionId: 'performance',
    },
    {
      moduleId: 'campaigns', label: 'Campaigns',
      primaryMetric: { value: activeCampaigns.length, suffix: 'active' },
      observations: activeCampaigns.slice(0, 3).map((p) => `${p.label} · ${p.status}`),
      mobileOrder: 3, targetSectionId: 'campaigns',
    },
    {
      moduleId: 'approvals', label: 'Approvals',
      primaryMetric: { value: pendingApprovals, suffix: 'pending' },
      observations: ['operator review required', 'Human remains final authority'],
      mobileOrder: 4, targetSectionId: 'approvals',
    },
    {
      moduleId: 'assets', label: 'Assets',
      primaryMetric: { value: input.assets.length, suffix: 'registered' },
      observations: [
        `pending: ${input.assets.filter((a) => a.approvalStatus === 'pending').length}`,
        `approved: ${input.assets.filter((a) => a.approvalStatus === 'approved').length}`,
      ],
      mobileOrder: 5, targetSectionId: 'assets',
    },
    {
      moduleId: 'channels', label: 'Channels',
      primaryMetric: { value: channels.length, suffix: 'supported' },
      observations: [
        `live publications: ${livePublicationCount}`,
        `channels in use: ${channelUsageCount}/${channels.length}`,
      ],
      mobileOrder: 6, targetSectionId: 'performance',
    },
    {
      moduleId: 'performance', label: 'Performance',
      primaryMetric: { value: recentPerformanceRows, suffix: 'rows · last 7 days' },
      observations: ['historically observed metrics, operator-logged'],
      mobileOrder: 7, targetSectionId: 'performance',
    },
    {
      moduleId: 'tasks', label: 'Tasks',
      primaryMetric: { value: upcomingTasks.length, suffix: 'open' },
      observations: upcomingTasks.slice(0, 3).map((t) => t.title),
      mobileOrder: 8, targetSectionId: 'campaigns',
    },
  ];

  // Connections — declarative dependencies between modules.
  const connections = [
    { from: 'goals',       to: 'campaigns',   note: 'each goal requires one or more campaigns' },
    { from: 'goals',       to: 'channels',    note: 'each goal lists required channels' },
    { from: 'goals',       to: 'performance', note: 'each goal lists required measurements' },
    { from: 'campaigns',   to: 'assets',      note: 'each campaign produces assets' },
    { from: 'assets',      to: 'approvals',   note: 'assets pass through operator approval' },
    { from: 'assets',      to: 'channels',    note: 'approved assets are published per channel' },
    { from: 'channels',    to: 'performance', note: 'each publication has measurements logged' },
    { from: 'campaigns',   to: 'tasks',       note: 'each campaign decomposes into operator tasks' },
    { from: 'funnels',     to: 'performance', note: 'each funnel stage carries operator-logged signals' },
  ];

  return {
    modules,
    connections,
    goalChannelMatrix,
    notes: [
      `${modules.length} modules composed · 1 executive screen`,
      `${blueprints.length} blueprints available · ${channels.length} channels · ${funnel.length} funnel stages`,
      'mobile-first composition · every module routes to an operator-supervised section',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
    generatedAt: input.nowMs,
  };
}
