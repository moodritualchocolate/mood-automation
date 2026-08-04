/**
 * WORKFLOW ORCHESTRATOR (pure)
 *
 * Pure function that turns a (goal, brand, product, market) input
 * into a deterministic workflow plan: required assets · approvals ·
 * campaigns · tasks · measurements. The orchestrator NEVER executes
 * anything. It NEVER publishes. It NEVER generates anything. It
 * NEVER calls external APIs. It just composes a plan.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the orchestrator never auto-acts
 *   - the orchestrator never auto-selects a template (operator picks)
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { PermissionAction } from '@lib/tenancy/permissionMatrix';
import type {
  AssetTypeRef, BusinessGoalId, CampaignTypeRef, ChannelRef, MeasurementCategory,
} from '@lib/business/businessGoalModel';
import { getBusinessGoal } from '@lib/business/businessGoalModel';
import { getGrowthBlueprint, type BlueprintId } from '@lib/business/growthBlueprints';
import {
  getWorkflowTemplate, type WorkflowTemplate, type WorkflowTemplateId,
} from './workflowTemplates';

// ─── input ───────────────────────────────────────────────────

export interface OrchestratorInput {
  /** The business goal the operator selected. */
  goalId: BusinessGoalId;
  /** Optional explicit template override (operator may pick a non-default). */
  templateId?: WorkflowTemplateId;
  /** Optional explicit blueprint override (operator may pick a non-default). */
  blueprintId?: BlueprintId;
  /** Operator-facing brand label. */
  brandLabel: string;
  /** Operator-facing product label. */
  productLabel: string;
  /** Operator-facing primary market (e.g. israel, global, eu). */
  primaryMarket: string;
  /** Optional secondary markets (advisory only). */
  secondaryMarkets?: string[];
  /** Operator-facing audience descriptor. */
  audienceLabel: string;
  /** Resolution timestamp (ms). */
  nowMs: number;
}

// ─── plan shape ──────────────────────────────────────────────

export interface PlannedStep {
  stepId: string;
  label: string;
  description: string;
  expectedRole: 'organization-owner' | 'admin' | 'manager' | 'editor';
  /** Day index (0-based) when this step starts in the suggested plan. */
  startDayIndex: number;
  durationDays: number;
  requiredAssets: AssetTypeRef[];
  requiredCampaigns: CampaignTypeRef[];
  requiredChannels: ChannelRef[];
  requiredApprovals: PermissionAction[];
  taskHints: string[];
  requiredMeasurements: MeasurementCategory[];
}

export interface WorkflowPlan {
  planId: string;
  templateId: WorkflowTemplateId;
  goalId: BusinessGoalId;
  blueprintId: BlueprintId;
  brandLabel: string;
  productLabel: string;
  primaryMarket: string;
  secondaryMarkets: string[];
  audienceLabel: string;
  /** Concatenated unique asset types the plan expects. */
  requiredAssets: AssetTypeRef[];
  /** Concatenated unique campaign types the plan expects. */
  requiredCampaigns: CampaignTypeRef[];
  /** Concatenated unique channels the plan exercises. */
  requiredChannels: ChannelRef[];
  /** Concatenated unique approvals the plan expects. */
  requiredApprovals: PermissionAction[];
  /** Concatenated unique measurement categories the plan expects. */
  requiredMeasurements: MeasurementCategory[];
  /** Concatenated unique task hints the plan suggests. */
  requiredTasks: string[];
  /** Ordered planned steps. */
  steps: PlannedStep[];
  /** Suggested total duration in days (sum of steps). */
  suggestedDurationDays: number;
  /** Suggested milestone offsets (days from start). */
  milestones: Array<{ atDayIndex: number; label: string; note: string }>;
  /** Single-sentence summary of the plan. */
  summary: string;
  notes: string[];
  advisoryNotice: string;
  generatedAt: number;
}

// ─── helpers ─────────────────────────────────────────────────

function unique<T>(rows: T[]): T[] {
  return Array.from(new Set(rows));
}

function defaultTemplateForGoal(goalId: BusinessGoalId): WorkflowTemplateId {
  switch (goalId) {
    case 'product-launch':     return 'product-launch';
    case 'lead-generation':    return 'lead-generation';
    case 'brand-awareness':    return 'brand-awareness';
    case 'community-growth':   return 'community-growth';
    case 'retention':          return 'retention';
    case 'sales':              return 'lead-generation';
    case 'market-expansion':   return 'brand-awareness';
  }
}

function newPlanId(at: number, templateId: WorkflowTemplateId): string {
  return `workflow-plan-${at.toString(36)}-${templateId}`;
}

// ─── orchestrator ────────────────────────────────────────────

const ADVISORY_NOTICE =
  'Workflow orchestrator is a pure compositor. The orchestrator NEVER executes, ' +
  'NEVER publishes, NEVER generates anything, NEVER spends money, NEVER calls ' +
  'external APIs. Operator approval required at every step of the plan. ' +
  'Human remains final authority.';

export function orchestrateWorkflow(input: OrchestratorInput): WorkflowPlan {
  if (!input.brandLabel || input.brandLabel.length === 0) {
    throw new Error('brandLabel is required');
  }
  if (!input.productLabel || input.productLabel.length === 0) {
    throw new Error('productLabel is required');
  }
  if (!input.primaryMarket || input.primaryMarket.length === 0) {
    throw new Error('primaryMarket is required');
  }
  if (!input.audienceLabel || input.audienceLabel.length === 0) {
    throw new Error('audienceLabel is required');
  }

  const goal = getBusinessGoal(input.goalId);
  const templateId: WorkflowTemplateId = input.templateId ?? defaultTemplateForGoal(input.goalId);
  const template: WorkflowTemplate = getWorkflowTemplate(templateId);
  const blueprint = getGrowthBlueprint(input.blueprintId ?? template.blueprintId);

  // Plan steps — assign deterministic startDayIndex by accumulating durations.
  let startDay = 0;
  const steps: PlannedStep[] = template.steps.map((s) => {
    const planned: PlannedStep = {
      stepId: s.stepId,
      label: s.label,
      description: s.description,
      expectedRole: s.expectedRole,
      startDayIndex: startDay,
      durationDays: s.durationDays,
      requiredAssets: s.requiredAssets,
      requiredCampaigns: s.requiredCampaigns,
      requiredChannels: s.requiredChannels,
      requiredApprovals: s.requiredApprovals,
      taskHints: s.taskHints,
      requiredMeasurements: s.requiredMeasurements,
    };
    startDay += s.durationDays;
    return planned;
  });

  // Aggregate per-axis.
  const requiredAssets       = unique(steps.flatMap((s) => s.requiredAssets));
  const requiredCampaigns    = unique(steps.flatMap((s) => s.requiredCampaigns));
  const requiredChannels     = unique(steps.flatMap((s) => s.requiredChannels));
  const requiredApprovals    = unique(steps.flatMap((s) => s.requiredApprovals));
  const requiredMeasurements = unique(steps.flatMap((s) => s.requiredMeasurements));
  const requiredTasks        = unique(steps.flatMap((s) => s.taskHints));

  // Milestones are step transitions (start of each step), plus the end.
  const milestones = steps.map((s) => ({
    atDayIndex: s.startDayIndex,
    label: `Step start · ${s.label}`,
    note: `operator advances to ${s.label}`,
  }));
  if (steps.length > 0) {
    const last = steps[steps.length - 1];
    milestones.push({
      atDayIndex: last.startDayIndex + last.durationDays,
      label: 'Plan end',
      note: 'operator reviews historically observed outcomes',
    });
  }

  const summary =
    `${template.label} · goal ${goal.label} · blueprint ${blueprint.label} · ` +
    `${steps.length} steps · ${startDay} days suggested · brand ${input.brandLabel} · ` +
    `product ${input.productLabel} · market ${input.primaryMarket} · audience ${input.audienceLabel}`;

  return {
    planId: newPlanId(input.nowMs, templateId),
    templateId,
    goalId: input.goalId,
    blueprintId: blueprint.blueprintId,
    brandLabel: input.brandLabel,
    productLabel: input.productLabel,
    primaryMarket: input.primaryMarket,
    secondaryMarkets: input.secondaryMarkets ?? [],
    audienceLabel: input.audienceLabel,
    requiredAssets,
    requiredCampaigns,
    requiredChannels,
    requiredApprovals,
    requiredMeasurements,
    requiredTasks,
    steps,
    suggestedDurationDays: startDay,
    milestones,
    summary,
    notes: [
      `template: ${template.label}`,
      `${steps.length} steps · ${startDay} days suggested`,
      `${requiredAssets.length} required asset types · ${requiredCampaigns.length} required campaigns`,
      `${requiredChannels.length} required channels · ${requiredApprovals.length} required approvals`,
      `${requiredMeasurements.length} required measurements · ${requiredTasks.length} task hints`,
      'NEVER executes · NEVER publishes · NEVER generates · NEVER spends money',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
    generatedAt: input.nowMs,
  };
}
