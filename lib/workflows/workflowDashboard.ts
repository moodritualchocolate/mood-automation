/**
 * WORKFLOW DASHBOARD (pure composition)
 *
 * Read-only composition that folds the workflow memory into the
 * /workflows screen: active workflows · status · missing assets ·
 * pending approvals · blocked tasks · upcoming milestones. The
 * composition NEVER auto-acts.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the composition never auto-acts
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type {
  WorkflowMemoryState, WorkflowRecord, WorkflowStatus,
} from './workflowMemory';

// ─── input shape ─────────────────────────────────────────────

interface AssetLike { assetId: string; approvalStatus: string; campaign?: string; }
interface TaskLike  { taskId: string; status: string; title: string; deadlineAt?: number; linkedCampaignId?: string; }

export interface WorkflowDashboardInput {
  workflowMemory: WorkflowMemoryState;
  assets: AssetLike[];
  tasks: TaskLike[];
  /** Optional org · workspace scoping; when present, only workflows on
   *  the matching tenancy stamp are surfaced. */
  organizationId?: string | null;
  workspaceId?: string | null;
  nowMs: number;
}

// ─── card shapes ─────────────────────────────────────────────

export interface WorkflowDashboardCard {
  cardId: string;
  label: string;
  primaryMetric: { value: number; suffix?: string };
  observations: string[];
  mobileOrder: number;
  targetSectionId: string;
}

export interface WorkflowStatusSummary {
  status: WorkflowStatus;
  count: number;
}

export interface MissingAssetGap {
  workflowId: string;
  workflowLabel: string;
  stepId: string;
  stepLabel: string;
  missingAssetType: string;
}

export interface PendingApprovalRow {
  workflowId: string;
  workflowLabel: string;
  approvalAction: string;
  stepId: string;
}

export interface BlockedTaskRow {
  workflowId: string;
  workflowLabel: string;
  taskId: string;
  taskTitle: string;
  reason: string;
}

export interface UpcomingMilestone {
  workflowId: string;
  workflowLabel: string;
  atDayIndex: number;
  label: string;
  note: string;
}

export interface WorkflowDashboardDescriptor {
  activeWorkflows: WorkflowRecord[];
  statusSummary: WorkflowStatusSummary[];
  missingAssets: MissingAssetGap[];
  pendingApprovals: PendingApprovalRow[];
  blockedTasks: BlockedTaskRow[];
  upcomingMilestones: UpcomingMilestone[];
  cards: WorkflowDashboardCard[];
  notes: string[];
  advisoryNotice: string;
  generatedAt: number;
}

const ADVISORY_NOTICE =
  'Workflow dashboard is a read-only composition. The route NEVER auto-acts on a ' +
  'workflow, NEVER auto-advances a step, NEVER auto-publishes. Every action is ' +
  'operator-supervised. Human remains final authority.';

const STATUSES: WorkflowStatus[] = ['draft', 'active', 'blocked', 'completed', 'abandoned'];

// ─── pure compositor ─────────────────────────────────────────

export function composeWorkflowDashboard(
  input: WorkflowDashboardInput,
): WorkflowDashboardDescriptor {
  const all = input.workflowMemory.workflows.filter((w) => {
    if (input.organizationId && w.organizationId !== input.organizationId) return false;
    if (input.workspaceId && w.workspaceId !== input.workspaceId) return false;
    return true;
  });
  const activeWorkflows = all.filter((w) => w.status === 'active' || w.status === 'blocked' || w.status === 'draft');

  // ── status summary ────
  const statusSummary: WorkflowStatusSummary[] = STATUSES.map((status) => ({
    status,
    count: all.filter((w) => w.status === status).length,
  }));

  // ── missing assets per active workflow ────
  const missingAssets: MissingAssetGap[] = [];
  for (const w of activeWorkflows) {
    const currentStep = w.plan.steps.find((s) => s.stepId === w.currentStepId);
    if (!currentStep) continue;
    // Approved assets on this workflow's brand → product → market scope are
    // counted by tag match against workflowId in the campaign label. Since
    // there is no direct stamp on legacy assets, this is a conservative gap
    // surface: an asset type is "missing" when the step expects it but the
    // registry contains zero approved assets that name the workflowId.
    const workflowStamp = w.workflowId;
    for (const at of currentStep.requiredAssets) {
      const haveCount = input.assets.filter(
        (a) =>
          a.approvalStatus === 'approved' &&
          (a.campaign?.includes(workflowStamp) || a.campaign?.includes(w.label)) &&
          a.assetId.length > 0 &&
          true,
      ).length;
      const expectedAtLeast = 1;
      if (haveCount < expectedAtLeast) {
        missingAssets.push({
          workflowId: w.workflowId,
          workflowLabel: w.label,
          stepId: currentStep.stepId,
          stepLabel: currentStep.label,
          missingAssetType: at,
        });
      }
    }
  }

  // ── pending approvals derived from each workflow's current step ────
  const pendingApprovals: PendingApprovalRow[] = [];
  for (const w of activeWorkflows) {
    const cur = w.plan.steps.find((s) => s.stepId === w.currentStepId);
    if (!cur) continue;
    for (const action of cur.requiredApprovals) {
      pendingApprovals.push({
        workflowId: w.workflowId, workflowLabel: w.label,
        approvalAction: action, stepId: cur.stepId,
      });
    }
  }

  // ── blocked tasks: workflows with open bottlenecks AND/OR
  //    operator-blocked / open-with-passed-deadline tasks ────
  const blockedTasks: BlockedTaskRow[] = [];
  for (const w of activeWorkflows) {
    for (const b of w.bottlenecks.filter((x) => !x.resolvedAt)) {
      blockedTasks.push({
        workflowId: w.workflowId, workflowLabel: w.label,
        taskId: `bottleneck:${b.stepId}`, taskTitle: `Bottleneck at ${b.stepId}`,
        reason: b.reason,
      });
    }
  }
  for (const t of input.tasks) {
    if (t.status === 'blocked') {
      blockedTasks.push({
        workflowId: t.linkedCampaignId ?? '—', workflowLabel: t.linkedCampaignId ?? '—',
        taskId: t.taskId, taskTitle: t.title, reason: 'operator marked task blocked',
      });
    } else if ((t.status === 'open' || t.status === 'in-progress') && t.deadlineAt && t.deadlineAt < input.nowMs) {
      blockedTasks.push({
        workflowId: t.linkedCampaignId ?? '—', workflowLabel: t.linkedCampaignId ?? '—',
        taskId: t.taskId, taskTitle: t.title, reason: 'deadline passed',
      });
    }
  }

  // ── upcoming milestones in the next 14 days (suggested) ────
  const horizonDays = 14;
  const upcomingMilestones: UpcomingMilestone[] = [];
  for (const w of activeWorkflows) {
    // Day 0 anchor = workflow.createdAt; surface milestones from
    // "today" through "today + 14 days".
    const elapsedDays = Math.floor((input.nowMs - w.createdAt) / (24 * 60 * 60 * 1000));
    for (const m of w.plan.milestones) {
      if (m.atDayIndex >= elapsedDays && m.atDayIndex <= elapsedDays + horizonDays) {
        upcomingMilestones.push({
          workflowId: w.workflowId, workflowLabel: w.label,
          atDayIndex: m.atDayIndex, label: m.label, note: m.note,
        });
      }
    }
  }
  upcomingMilestones.sort((a, b) => a.atDayIndex - b.atDayIndex);

  // ── cards (mobile-first) ────
  const cards: WorkflowDashboardCard[] = [
    {
      cardId: 'active-workflows', label: 'Active Workflows',
      primaryMetric: { value: activeWorkflows.length, suffix: 'in progress' },
      observations: activeWorkflows.slice(0, 3).map((w) => `${w.label} · ${w.status}`),
      mobileOrder: 1, targetSectionId: 'campaigns',
    },
    {
      cardId: 'pending-approvals', label: 'Pending Approvals',
      primaryMetric: { value: pendingApprovals.length, suffix: 'expected' },
      observations: pendingApprovals.slice(0, 3).map((p) => `${p.workflowLabel} · ${p.approvalAction}`),
      mobileOrder: 2, targetSectionId: 'approvals',
    },
    {
      cardId: 'blocked-tasks', label: 'Blocked Tasks',
      primaryMetric: { value: blockedTasks.length, suffix: 'open' },
      observations: blockedTasks.slice(0, 3).map((b) => `${b.taskTitle} · ${b.reason}`),
      mobileOrder: 3, targetSectionId: 'approvals',
    },
    {
      cardId: 'missing-assets', label: 'Missing Assets',
      primaryMetric: { value: missingAssets.length, suffix: 'gaps' },
      observations: missingAssets.slice(0, 3).map((m) => `${m.workflowLabel} · ${m.missingAssetType}`),
      mobileOrder: 4, targetSectionId: 'production-studio',
    },
    {
      cardId: 'upcoming-milestones', label: 'Upcoming Milestones',
      primaryMetric: { value: upcomingMilestones.length, suffix: `next ${horizonDays} days` },
      observations: upcomingMilestones.slice(0, 3).map((m) => `day ${m.atDayIndex} · ${m.label}`),
      mobileOrder: 5, targetSectionId: 'campaigns',
    },
    {
      cardId: 'workflow-status', label: 'Workflow Status',
      primaryMetric: { value: all.length, suffix: 'total' },
      observations: statusSummary.filter((s) => s.count > 0).slice(0, 4).map((s) => `${s.status}: ${s.count}`),
      mobileOrder: 6, targetSectionId: 'campaigns',
    },
  ];

  return {
    activeWorkflows,
    statusSummary,
    missingAssets,
    pendingApprovals,
    blockedTasks,
    upcomingMilestones,
    cards,
    notes: [
      `${all.length} workflows in scope · ${activeWorkflows.length} active`,
      `${pendingApprovals.length} pending approvals · ${blockedTasks.length} blocked tasks`,
      `${missingAssets.length} asset gaps · ${upcomingMilestones.length} upcoming milestones`,
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
    generatedAt: input.nowMs,
  };
}
