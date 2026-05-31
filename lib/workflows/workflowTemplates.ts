/**
 * WORKFLOW TEMPLATES (pure specifications)
 *
 * Five static workflow templates that map a business goal through a
 * growth blueprint into a deterministic stack of campaigns · assets ·
 * tasks · approvals · measurements. The templates are pure data —
 * the module never launches anything, never spends money, never
 * generates anything.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the catalog never auto-acts
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { PermissionAction } from '@lib/tenancy/permissionMatrix';
import type {
  AssetTypeRef, BusinessGoalId, CampaignTypeRef, ChannelRef, MeasurementCategory,
} from '@lib/business/businessGoalModel';
import type { BlueprintId } from '@lib/business/growthBlueprints';

// ─── template shape ──────────────────────────────────────────

export type WorkflowTemplateId =
  | 'product-launch' | 'lead-generation' | 'brand-awareness'
  | 'community-growth' | 'retention';

/** A single step inside a workflow template. */
export interface WorkflowStep {
  stepId: string;
  label: string;
  /** Short single-sentence description. */
  description: string;
  /** Operator role expected to act on this step (advisory). */
  expectedRole: 'organization-owner' | 'admin' | 'manager' | 'editor';
  /** Step suggested duration. */
  durationDays: number;
  /** Asset types the step expects the operator to register. */
  requiredAssets: AssetTypeRef[];
  /** Campaign types the step expects the operator to wire. */
  requiredCampaigns: CampaignTypeRef[];
  /** Channels exercised in this step. */
  requiredChannels: ChannelRef[];
  /** Approvals the step expects the operator to complete. */
  requiredApprovals: PermissionAction[];
  /** Tasks the operator typically creates inside this step. */
  taskHints: string[];
  /** Measurement categories the step expects the operator to log. */
  requiredMeasurements: MeasurementCategory[];
}

export interface WorkflowTemplate {
  templateId: WorkflowTemplateId;
  label: string;
  purpose: string;
  /** Goal the template is scaffolded around. */
  goalId: BusinessGoalId;
  /** Growth blueprint the template defers structural phases to. */
  blueprintId: BlueprintId;
  /** Ordered steps the operator works through. */
  steps: WorkflowStep[];
  /** Total suggested duration (sum of step durationDays). */
  suggestedDurationDays: number;
  /** Observational tags. */
  observationalTags: string[];
}

// ─── canonical templates ─────────────────────────────────────

const TEMPLATES: WorkflowTemplate[] = [
  {
    templateId: 'product-launch',
    label: 'Product Launch Workflow',
    purpose:
      'Operator wants to release a new product to the brand’s audience and historically observe initial uptake.',
    goalId: 'product-launch',
    blueprintId: 'product-launch',
    suggestedDurationDays: 31,
    observationalTags: ['launch', 'reveal', 'first-72-hours'],
    steps: [
      {
        stepId: 'launch-readiness',
        label: 'Launch Readiness',
        description: 'Operator confirms brand · product · market · audience are configured before scheduling the reveal.',
        expectedRole: 'admin',
        durationDays: 3,
        requiredAssets: [],
        requiredCampaigns: ['launch'],
        requiredChannels: ['instagram', 'website'],
        requiredApprovals: ['workspace.brief.approve', 'workspace.campaign-plan.approve'],
        taskHints: ['confirm product page draft', 'confirm launch date', 'confirm audience tag'],
        requiredMeasurements: [],
      },
      {
        stepId: 'teaser-creative',
        label: 'Teaser Creative',
        description: 'Operator drafts teaser assets across short-form clip · feed image.',
        expectedRole: 'editor',
        durationDays: 7,
        requiredAssets: ['image', 'video', 'short-form-clip'],
        requiredCampaigns: ['launch'],
        requiredChannels: ['instagram', 'tiktok', 'youtube'],
        requiredApprovals: ['workspace.asset.approve'],
        taskHints: ['draft 3 teaser clips', 'draft 2 teaser images'],
        requiredMeasurements: ['reach', 'engagement'],
      },
      {
        stepId: 'reveal',
        label: 'Reveal',
        description: 'Operator publishes the reveal across launch channels in a single cadence window.',
        expectedRole: 'manager',
        durationDays: 3,
        requiredAssets: ['image', 'video', 'carousel', 'landing', 'long-form-post'],
        requiredCampaigns: ['launch'],
        requiredChannels: ['instagram', 'tiktok', 'youtube', 'website', 'email', 'blog'],
        requiredApprovals: ['workspace.asset.approve', 'workspace.publication.register',
                           'workspace.campaign.transition'],
        taskHints: ['publish reveal post', 'send reveal email', 'publish blog post'],
        requiredMeasurements: ['reach', 'engagement', 'click-through', 'conversion'],
      },
      {
        stepId: 'sustain',
        label: 'Sustain',
        description: 'Operator continues publishing supporting assets and logs historically observed uptake.',
        expectedRole: 'manager',
        durationDays: 18,
        requiredAssets: ['image', 'video', 'short-form-clip', 'email'],
        requiredCampaigns: ['always-on'],
        requiredChannels: ['instagram', 'tiktok', 'email', 'website'],
        requiredApprovals: ['workspace.publication.transition', 'workspace.performance.log'],
        taskHints: ['publish weekly sustain post', 'log weekly performance', 'review feedback'],
        requiredMeasurements: ['reach', 'engagement', 'click-through', 'conversion', 'retention'],
      },
    ],
  },
  {
    templateId: 'lead-generation',
    label: 'Lead Generation Workflow',
    purpose:
      'Operator wants the brand to historically capture identified leads through always-on creative and a dedicated landing page.',
    goalId: 'lead-generation',
    blueprintId: 'lead-generation',
    suggestedDurationDays: 35,
    observationalTags: ['always-on', 'lead capture', 'landing page'],
    steps: [
      {
        stepId: 'landing-foundation',
        label: 'Landing Foundation',
        description: 'Operator registers the lead-capture landing page and confirms the opt-in mechanism.',
        expectedRole: 'admin',
        durationDays: 7,
        requiredAssets: ['landing'],
        requiredCampaigns: ['always-on'],
        requiredChannels: ['website'],
        requiredApprovals: ['workspace.asset.approve', 'workspace.publication.register'],
        taskHints: ['draft landing page', 'confirm opt-in flow'],
        requiredMeasurements: ['click-through', 'lead-capture'],
      },
      {
        stepId: 'creative-pool',
        label: 'Creative Pool',
        description: 'Operator registers the always-on creative pool (image · video · short-form).',
        expectedRole: 'editor',
        durationDays: 7,
        requiredAssets: ['image', 'video', 'short-form-clip'],
        requiredCampaigns: ['always-on'],
        requiredChannels: ['instagram', 'facebook', 'email'],
        requiredApprovals: ['workspace.asset.approve'],
        taskHints: ['draft 6 always-on assets', 'review for brand voice'],
        requiredMeasurements: ['reach', 'engagement'],
      },
      {
        stepId: 'publish-and-log',
        label: 'Publish + Log',
        description: 'Operator publishes the creative pool on a steady cadence and logs lead capture.',
        expectedRole: 'manager',
        durationDays: 14,
        requiredAssets: ['image', 'video', 'short-form-clip'],
        requiredCampaigns: ['always-on'],
        requiredChannels: ['instagram', 'facebook', 'email'],
        requiredApprovals: ['workspace.publication.transition', 'workspace.performance.log'],
        taskHints: ['publish weekly cadence', 'log weekly lead capture'],
        requiredMeasurements: ['reach', 'click-through', 'lead-capture', 'conversion'],
      },
      {
        stepId: 'review-and-adjust',
        label: 'Review + Adjust',
        description: 'Operator reviews historically observed performance and adjusts the creative pool.',
        expectedRole: 'manager',
        durationDays: 7,
        requiredAssets: ['image', 'video'],
        requiredCampaigns: ['always-on', 'response'],
        requiredChannels: ['instagram', 'facebook'],
        requiredApprovals: ['workspace.asset.approve', 'workspace.asset.reject'],
        taskHints: ['archive low-engagement assets', 'draft replacement assets'],
        requiredMeasurements: ['reach', 'click-through', 'lead-capture'],
      },
    ],
  },
  {
    templateId: 'brand-awareness',
    label: 'Brand Awareness Workflow',
    purpose:
      'Operator wants the brand to historically widen its reach without a direct conversion ask.',
    goalId: 'brand-awareness',
    blueprintId: 'brand-awareness',
    suggestedDurationDays: 42,
    observationalTags: ['reach', 'recognition', 'brand voice'],
    steps: [
      {
        stepId: 'voice',
        label: 'Voice',
        description: 'Operator registers a recurring creative pool that carries brand voice signals.',
        expectedRole: 'editor',
        durationDays: 14,
        requiredAssets: ['video', 'short-form-clip', 'image'],
        requiredCampaigns: ['awareness-burst', 'always-on'],
        requiredChannels: ['instagram', 'tiktok', 'youtube'],
        requiredApprovals: ['workspace.asset.approve'],
        taskHints: ['draft 6 voice assets', 'review for tone consistency'],
        requiredMeasurements: ['reach', 'engagement'],
      },
      {
        stepId: 'distribution',
        label: 'Distribution',
        description: 'Operator publishes the creative pool on a steady cadence; metrics are operator-logged.',
        expectedRole: 'manager',
        durationDays: 21,
        requiredAssets: ['image', 'video', 'short-form-clip', 'long-form-post'],
        requiredCampaigns: ['always-on'],
        requiredChannels: ['instagram', 'tiktok', 'youtube', 'facebook'],
        requiredApprovals: ['workspace.publication.register', 'workspace.publication.transition'],
        taskHints: ['publish weekly cadence', 'log weekly performance'],
        requiredMeasurements: ['reach', 'engagement', 'attention-time'],
      },
      {
        stepId: 'observe',
        label: 'Observe',
        description: 'Operator reviews historically observed signals and adjusts the voice direction.',
        expectedRole: 'manager',
        durationDays: 7,
        requiredAssets: ['image', 'video'],
        requiredCampaigns: ['always-on'],
        requiredChannels: ['instagram', 'tiktok'],
        requiredApprovals: ['workspace.asset.approve'],
        taskHints: ['summarize voice findings', 'draft next phase'],
        requiredMeasurements: ['reach', 'engagement', 'attention-time'],
      },
    ],
  },
  {
    templateId: 'community-growth',
    label: 'Community Growth Workflow',
    purpose:
      'Operator wants to historically grow an engaged community around the brand identity.',
    goalId: 'community-growth',
    blueprintId: 'community',
    suggestedDurationDays: 42,
    observationalTags: ['community', 'replies', 'attention'],
    steps: [
      {
        stepId: 'seed',
        label: 'Seed',
        description: 'Operator registers community-style assets and a recurring response cadence.',
        expectedRole: 'editor',
        durationDays: 14,
        requiredAssets: ['video', 'short-form-clip', 'long-form-post'],
        requiredCampaigns: ['always-on'],
        requiredChannels: ['instagram', 'tiktok', 'youtube'],
        requiredApprovals: ['workspace.asset.approve'],
        taskHints: ['draft 6 seed posts', 'draft response cadence'],
        requiredMeasurements: ['engagement', 'community-signal'],
      },
      {
        stepId: 'respond',
        label: 'Respond',
        description: 'Operator handles community responses on the recurring cadence.',
        expectedRole: 'manager',
        durationDays: 21,
        requiredAssets: ['short-form-clip', 'image', 'long-form-post'],
        requiredCampaigns: ['always-on', 'community-event'],
        requiredChannels: ['instagram', 'tiktok'],
        requiredApprovals: ['workspace.task.transition', 'workspace.performance.log'],
        taskHints: ['daily reply window', 'weekly community signal log'],
        requiredMeasurements: ['engagement', 'community-signal', 'attention-time'],
      },
      {
        stepId: 'celebrate',
        label: 'Celebrate',
        description: 'Operator publishes a community moment that surfaces top contributors.',
        expectedRole: 'manager',
        durationDays: 7,
        requiredAssets: ['short-form-clip', 'image'],
        requiredCampaigns: ['community-event'],
        requiredChannels: ['instagram', 'tiktok'],
        requiredApprovals: ['workspace.asset.approve', 'workspace.publication.register'],
        taskHints: ['draft community moment', 'confirm contributor consent'],
        requiredMeasurements: ['engagement', 'community-signal'],
      },
    ],
  },
  {
    templateId: 'retention',
    label: 'Retention Workflow',
    purpose:
      'Operator wants the brand to historically keep existing customers engaged across their lifecycle.',
    goalId: 'retention',
    blueprintId: 'brand-awareness',
    suggestedDurationDays: 35,
    observationalTags: ['lifecycle', 'reactivation', 'repeat customer'],
    steps: [
      {
        stepId: 'lifecycle-foundation',
        label: 'Lifecycle Foundation',
        description: 'Operator registers the lifecycle email and landing assets.',
        expectedRole: 'admin',
        durationDays: 7,
        requiredAssets: ['email', 'landing'],
        requiredCampaigns: ['lifecycle'],
        requiredChannels: ['email', 'website'],
        requiredApprovals: ['workspace.asset.approve', 'workspace.publication.register'],
        taskHints: ['draft welcome email', 'draft reactivation landing'],
        requiredMeasurements: ['click-through', 'conversion'],
      },
      {
        stepId: 'lifecycle-broadcast',
        label: 'Lifecycle Broadcast',
        description: 'Operator schedules broadcast emails and logs the historically observed responses.',
        expectedRole: 'manager',
        durationDays: 21,
        requiredAssets: ['email', 'image'],
        requiredCampaigns: ['lifecycle', 'always-on'],
        requiredChannels: ['email', 'instagram'],
        requiredApprovals: ['workspace.publication.register', 'workspace.publication.transition',
                           'workspace.performance.log'],
        taskHints: ['weekly broadcast', 'log weekly retention'],
        requiredMeasurements: ['retention', 'engagement', 'conversion'],
      },
      {
        stepId: 'reactivate',
        label: 'Reactivate',
        description: 'Operator targets historically lapsed customers and logs reactivation outcomes.',
        expectedRole: 'manager',
        durationDays: 7,
        requiredAssets: ['email', 'short-form-clip'],
        requiredCampaigns: ['lifecycle'],
        requiredChannels: ['email', 'instagram'],
        requiredApprovals: ['workspace.publication.register', 'workspace.performance.log'],
        taskHints: ['identify lapsed segment', 'log reactivation outcome'],
        requiredMeasurements: ['retention', 'conversion'],
      },
    ],
  },
];

export const ALL_WORKFLOW_TEMPLATES: WorkflowTemplate[] = TEMPLATES;
export const WORKFLOW_TEMPLATE_IDS: WorkflowTemplateId[] = TEMPLATES.map((t) => t.templateId);

// ─── pure helpers ────────────────────────────────────────────

export function getWorkflowTemplate(id: WorkflowTemplateId): WorkflowTemplate {
  const t = TEMPLATES.find((x) => x.templateId === id);
  if (!t) throw new Error(`unknown workflow template: ${id}`);
  return t;
}

export interface WorkflowTemplateCatalog {
  templates: WorkflowTemplate[];
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Workflow templates are pure specifications. The catalog never auto-launches, ' +
  'never publishes, never spends money, never generates anything. Every step is ' +
  'operator-supervised at the route layer. Operator approval required. ' +
  'Human remains final authority.';

export function listWorkflowTemplates(): WorkflowTemplateCatalog {
  return {
    templates: TEMPLATES,
    notes: [
      `${TEMPLATES.length} workflow templates defined`,
      'each template maps Goal → Blueprint → Campaigns → Assets → Tasks → Approvals → Measurements',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
