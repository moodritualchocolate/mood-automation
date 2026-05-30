/**
 * CAMPAIGN MANAGER AGENT (pure orchestrator)
 *
 * Observes campaign plans + calendar + assets and surfaces campaign
 * readiness · missing assets · timeline status · dependencies.
 *
 * The agent NEVER publishes, NEVER auto-advances campaign status,
 * NEVER notifies external systems. The operator decides every
 * transition through the existing /api/campaign-planner routes.
 */

import type { CampaignPlanRecord } from '../campaignPlanMemory';
import type { AssetRecord } from '../assetRegistryMemory';
import type { TaskRecord } from '../taskMemory';
import type { AgentDescriptor } from './types';
import { AGENT_CATALOG, AGENT_ADVISORY_NOTICE } from './types';

// ─── input ────────────────────────────────────────────────────

export interface CampaignManagerAgentInput {
  campaignPlans: CampaignPlanRecord[];
  assets: AssetRecord[];
  /** Optional task list for dependency observation. */
  tasks?: TaskRecord[];
  /** Reference time for timeline status (epoch ms). */
  nowMs?: number;
}

// ─── output ───────────────────────────────────────────────────

export interface CampaignReadinessRow {
  planId: string;
  label: string;
  status: CampaignPlanRecord['status'];
  /** Sum of minimumCount across asset requirements in the plan. */
  requiredAssetCount: number;
  /** Approved assets historically associated with the plan's campaign. */
  approvedAssetCount: number;
  /** Missing count = required − approved (never negative). */
  missingAssetCount: number;
  /** Readiness score 0..10 (descriptive). */
  readinessScore: number;
  /** Timeline status. */
  timelineStatus:
    | 'planning' | 'in-flight-on-time' | 'in-flight-overdue'
    | 'completed' | 'rejected' | 'archived';
  /** Plain-language observation. */
  observation: string;
}

export interface CampaignManagerAgentOutput {
  descriptor: AgentDescriptor;
  rows: CampaignReadinessRow[];
  /** Per-plan missing asset summaries (image / video / carousel / landing). */
  missingAssetSummary: Array<{
    planId: string;
    missingByType: Record<'image' | 'video' | 'carousel' | 'landing', number>;
  }>;
  /** Tasks blocking campaign progress (linked + not done). */
  blockingTasks: Array<{
    taskId: string;
    title: string;
    status: string;
    linkedCampaignId?: string;
  }>;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── helpers ──────────────────────────────────────────────────

function r1(n: number): number { return Math.round(n * 10) / 10; }

// ─── main ─────────────────────────────────────────────────────

export function runCampaignManagerAgent(
  input: CampaignManagerAgentInput,
): CampaignManagerAgentOutput {
  const plans = input.campaignPlans ?? [];
  const assets = input.assets ?? [];
  const tasks = input.tasks ?? [];
  const now = input.nowMs ?? Date.now();

  const approvedAssets = assets.filter((a) => a.approvalStatus === 'approved');
  const approvedByCampaign = new Map<string, AssetRecord[]>();
  for (const a of approvedAssets) {
    const arr = approvedByCampaign.get(a.campaign) ?? [];
    arr.push(a);
    approvedByCampaign.set(a.campaign, arr);
  }

  const rows: CampaignReadinessRow[] = plans.map((plan) => {
    // Required asset count = sum across all asset requirement buckets.
    const requiredAssetCount = plan.plan.assetRequirements.reduce(
      (acc, b) => acc + (b.minimumCount ?? 0), 0,
    );
    const campaignLabel = `production-studio-${plan.input.formula}`;
    const linkedAssets = approvedByCampaign.get(campaignLabel) ?? [];
    const approvedAssetCount = linkedAssets.length;
    const missingAssetCount = Math.max(0, requiredAssetCount - approvedAssetCount);
    const readinessScore = requiredAssetCount === 0
      ? 5
      : r1(Math.max(0, Math.min(10, (approvedAssetCount / requiredAssetCount) * 10)));

    // Timeline status — derived from plan status + plan duration.
    let timelineStatus: CampaignReadinessRow['timelineStatus'];
    if (plan.status === 'completed' || plan.status === 'rejected' || plan.status === 'archived') {
      timelineStatus = plan.status;
    } else if (plan.status === 'in-flight') {
      const ageMs = now - plan.createdAt;
      const expectedDurationMs = plan.plan.durationDays * 24 * 60 * 60 * 1000;
      timelineStatus = ageMs > expectedDurationMs ? 'in-flight-overdue' : 'in-flight-on-time';
    } else {
      timelineStatus = 'planning';
    }

    return {
      planId: plan.planId, label: plan.label, status: plan.status,
      requiredAssetCount, approvedAssetCount, missingAssetCount,
      readinessScore, timelineStatus,
      observation: missingAssetCount > 0
        ? `${plan.label} historically observed · ${missingAssetCount} asset(s) missing · readiness ${readinessScore}/10 · operator review required`
        : `${plan.label} historically observed · readiness ${readinessScore}/10 · operator review required`,
    };
  }).sort((a, b) => b.readinessScore - a.readinessScore || a.label.localeCompare(b.label));

  // Per-plan missing-by-type breakdown.
  const missingAssetSummary = plans.map((plan) => {
    const campaignLabel = `production-studio-${plan.input.formula}`;
    const linked = approvedByCampaign.get(campaignLabel) ?? [];
    const have: Record<'image' | 'video' | 'carousel' | 'landing', number> = {
      image: 0, video: 0, carousel: 0, landing: 0,
    };
    for (const a of linked) {
      if (a.packageType === 'image' || a.packageType === 'video' ||
          a.packageType === 'carousel' || a.packageType === 'landing') {
        have[a.packageType] += 1;
      }
    }
    const missingByType: Record<'image' | 'video' | 'carousel' | 'landing', number> = {
      image: 0, video: 0, carousel: 0, landing: 0,
    };
    for (const b of plan.plan.assetRequirements) {
      const t = b.packageType as 'image' | 'video' | 'carousel' | 'landing';
      missingByType[t] = Math.max(0, (b.minimumCount ?? 0) - have[t]);
    }
    return { planId: plan.planId, missingByType };
  });

  const blockingTasks = tasks
    .filter((t) => (t.linkedCampaignId !== undefined) && t.status !== 'done' && t.status !== 'archived')
    .map((t) => ({
      taskId: t.taskId, title: t.title, status: t.status, linkedCampaignId: t.linkedCampaignId,
    }));

  const notes: string[] = [];
  notes.push('campaign manager agent run · operator-reviewable observations only');
  if (plans.length === 0) {
    notes.push('no campaign plans yet · requires more evidence');
  }
  const overdueCount = rows.filter((r) => r.timelineStatus === 'in-flight-overdue').length;
  if (overdueCount > 0) {
    notes.push(`${overdueCount} campaign(s) historically observed past their expected duration · operator review required`);
  }
  if (blockingTasks.length > 0) {
    notes.push(`${blockingTasks.length} unresolved campaign-linked task(s) historically observed · operator review required`);
  }

  return {
    descriptor: AGENT_CATALOG['campaign-manager'],
    rows,
    missingAssetSummary,
    blockingTasks,
    notes,
    reasonCodes: [
      `plans:${plans.length}`,
      `assets:${assets.length}`,
      `approvedAssets:${approvedAssets.length}`,
      `overdueCampaigns:${overdueCount}`,
      `blockingTasks:${blockingTasks.length}`,
    ],
    advisoryNotice: AGENT_ADVISORY_NOTICE,
  };
}
