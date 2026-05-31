/**
 * GROWTH BLUEPRINTS (pure specifications)
 *
 * Static blueprints — campaign phases · required assets · required
 * approvals · required measurements · required team roles · required
 * timeline structure. The module is a specification catalog only.
 * It never auto-launches a campaign, never auto-allocates budget,
 * never auto-selects a blueprint.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the catalog never auto-acts
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { OrganizationRole } from '@lib/tenancy/types';
import type { PermissionAction } from '@lib/tenancy/permissionMatrix';
import type {
  AssetTypeRef, BusinessGoalId, ChannelRef, MeasurementCategory,
} from './businessGoalModel';

// ─── shape ───────────────────────────────────────────────────

export type BlueprintId =
  | 'lead-generation' | 'product-launch' | 'brand-awareness' | 'community';

export interface BlueprintPhase {
  /** Operator-facing phase id (kebab). */
  phaseId: string;
  label: string;
  /** Short description — single sentence. */
  description: string;
  /** Phase duration suggested by the blueprint, in days. */
  durationDays: number;
  /** Asset types the operator is expected to register during this phase. */
  requiredAssets: AssetTypeRef[];
  /** Channels exercised in this phase. */
  channels: ChannelRef[];
  /** Approvals expected to occur during this phase. */
  requiredApprovals: PermissionAction[];
  /** Measurements expected to be logged during this phase. */
  requiredMeasurements: MeasurementCategory[];
}

export interface GrowthBlueprint {
  blueprintId: BlueprintId;
  label: string;
  /** Single-sentence statement of what the blueprint is for. */
  purpose: string;
  /** Business goal this blueprint is scaffolded around. */
  goalId: BusinessGoalId;
  /** Campaign phases in deterministic order. */
  phases: BlueprintPhase[];
  /** Cumulative timeline structure (the sum of phase durations). */
  timeline: { totalDays: number; suggestedStartCadence: 'weekly' | 'biweekly' | 'monthly' };
  /** Roles the blueprint expects on the operator team. */
  requiredTeamRoles: OrganizationRole[];
  /** Observational tags for the catalog filter. */
  observationalTags: string[];
}

// ─── blueprints ──────────────────────────────────────────────

const BLUEPRINTS: GrowthBlueprint[] = [
  {
    blueprintId: 'lead-generation',
    label: 'Lead Generation Blueprint',
    purpose:
      'Operator wants the brand to historically capture identified leads through always-on creative and a dedicated landing page.',
    goalId: 'lead-generation',
    phases: [
      {
        phaseId: 'foundation',
        label: 'Foundation',
        description: 'Operator registers the lead-capture landing page and the always-on creative pool.',
        durationDays: 7,
        requiredAssets: ['landing', 'image', 'video', 'short-form-clip'],
        channels: ['website', 'instagram', 'facebook'],
        requiredApprovals: ['workspace.asset.approve', 'workspace.publication.register'],
        requiredMeasurements: ['reach', 'click-through', 'lead-capture'],
      },
      {
        phaseId: 'always-on',
        label: 'Always-on',
        description: 'Operator publishes the creative pool on a steady cadence and logs lead capture.',
        durationDays: 21,
        requiredAssets: ['image', 'video', 'short-form-clip'],
        channels: ['instagram', 'facebook', 'email'],
        requiredApprovals: ['workspace.publication.transition', 'workspace.performance.log'],
        requiredMeasurements: ['reach', 'click-through', 'lead-capture', 'conversion'],
      },
      {
        phaseId: 'review',
        label: 'Review',
        description: 'Operator reviews historically observed performance and adjusts the creative pool.',
        durationDays: 7,
        requiredAssets: ['image', 'video'],
        channels: ['instagram', 'facebook'],
        requiredApprovals: ['workspace.asset.approve', 'workspace.asset.reject'],
        requiredMeasurements: ['reach', 'click-through', 'lead-capture'],
      },
    ],
    timeline: { totalDays: 35, suggestedStartCadence: 'weekly' },
    requiredTeamRoles: ['organization-owner', 'manager', 'editor'],
    observationalTags: ['always-on', 'lead capture', 'landing page'],
  },
  {
    blueprintId: 'product-launch',
    label: 'Product Launch Blueprint',
    purpose:
      'Operator wants to release a new product and historically observe initial uptake over a defined launch window.',
    goalId: 'product-launch',
    phases: [
      {
        phaseId: 'teaser',
        label: 'Teaser',
        description: 'Operator seeds early signal and registers teaser assets without revealing the product.',
        durationDays: 7,
        requiredAssets: ['image', 'video', 'short-form-clip'],
        channels: ['instagram', 'tiktok', 'youtube'],
        requiredApprovals: ['workspace.asset.approve'],
        requiredMeasurements: ['reach', 'engagement'],
      },
      {
        phaseId: 'reveal',
        label: 'Reveal',
        description: 'Operator publishes the reveal assets across launch channels in a single cadence window.',
        durationDays: 3,
        requiredAssets: ['image', 'video', 'carousel', 'landing', 'long-form-post'],
        channels: ['instagram', 'tiktok', 'youtube', 'website', 'email', 'blog'],
        requiredApprovals: ['workspace.asset.approve', 'workspace.publication.register',
                           'workspace.campaign.transition'],
        requiredMeasurements: ['reach', 'engagement', 'click-through', 'conversion'],
      },
      {
        phaseId: 'sustain',
        label: 'Sustain',
        description: 'Operator continues publishing supporting assets and logs the historically observed uptake.',
        durationDays: 21,
        requiredAssets: ['image', 'video', 'short-form-clip', 'email'],
        channels: ['instagram', 'tiktok', 'email', 'website'],
        requiredApprovals: ['workspace.publication.transition', 'workspace.performance.log'],
        requiredMeasurements: ['reach', 'engagement', 'click-through', 'conversion', 'retention'],
      },
    ],
    timeline: { totalDays: 31, suggestedStartCadence: 'biweekly' },
    requiredTeamRoles: ['organization-owner', 'admin', 'manager', 'editor'],
    observationalTags: ['launch', 'reveal', 'first-72-hours'],
  },
  {
    blueprintId: 'brand-awareness',
    label: 'Brand Awareness Blueprint',
    purpose:
      'Operator wants the brand to historically widen its reach without a direct conversion ask.',
    goalId: 'brand-awareness',
    phases: [
      {
        phaseId: 'voice',
        label: 'Voice',
        description: 'Operator registers a recurring creative pool that historically observes brand voice signals.',
        durationDays: 14,
        requiredAssets: ['video', 'short-form-clip', 'image'],
        channels: ['instagram', 'tiktok', 'youtube'],
        requiredApprovals: ['workspace.asset.approve'],
        requiredMeasurements: ['reach', 'engagement'],
      },
      {
        phaseId: 'distribution',
        label: 'Distribution',
        description: 'Operator publishes the creative pool on a steady cadence; metrics are operator-logged.',
        durationDays: 28,
        requiredAssets: ['image', 'video', 'short-form-clip', 'long-form-post'],
        channels: ['instagram', 'tiktok', 'youtube', 'facebook'],
        requiredApprovals: ['workspace.publication.register', 'workspace.publication.transition'],
        requiredMeasurements: ['reach', 'engagement', 'attention-time'],
      },
    ],
    timeline: { totalDays: 42, suggestedStartCadence: 'weekly' },
    requiredTeamRoles: ['organization-owner', 'manager', 'editor'],
    observationalTags: ['reach', 'recognition', 'brand voice'],
  },
  {
    blueprintId: 'community',
    label: 'Community Blueprint',
    purpose:
      'Operator wants to historically grow an engaged community around the brand identity.',
    goalId: 'community-growth',
    phases: [
      {
        phaseId: 'seed',
        label: 'Seed',
        description: 'Operator registers community-style assets and a recurring response cadence.',
        durationDays: 14,
        requiredAssets: ['video', 'short-form-clip', 'long-form-post'],
        channels: ['instagram', 'tiktok', 'youtube'],
        requiredApprovals: ['workspace.asset.approve'],
        requiredMeasurements: ['engagement', 'community-signal'],
      },
      {
        phaseId: 'respond',
        label: 'Respond',
        description: 'Operator handles community responses on the recurring cadence; metrics operator-logged.',
        durationDays: 28,
        requiredAssets: ['short-form-clip', 'image', 'long-form-post'],
        channels: ['instagram', 'tiktok'],
        requiredApprovals: ['workspace.task.transition', 'workspace.performance.log'],
        requiredMeasurements: ['engagement', 'community-signal', 'attention-time'],
      },
    ],
    timeline: { totalDays: 42, suggestedStartCadence: 'weekly' },
    requiredTeamRoles: ['organization-owner', 'manager', 'editor'],
    observationalTags: ['community', 'replies', 'attention'],
  },
];

export const ALL_GROWTH_BLUEPRINTS: GrowthBlueprint[] = BLUEPRINTS;
export const GROWTH_BLUEPRINT_IDS: BlueprintId[] = BLUEPRINTS.map((b) => b.blueprintId);

// ─── pure helpers ────────────────────────────────────────────

export function getGrowthBlueprint(id: BlueprintId): GrowthBlueprint {
  const b = BLUEPRINTS.find((x) => x.blueprintId === id);
  if (!b) throw new Error(`unknown growth blueprint: ${id}`);
  return b;
}

export interface GrowthBlueprintCatalog {
  blueprints: GrowthBlueprint[];
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Growth blueprints are pure specifications. The catalog never auto-launches ' +
  'a campaign, never auto-allocates budget, never auto-selects a blueprint on ' +
  'the operator’s behalf. Operator approval required at every blueprint phase. ' +
  'Human remains final authority.';

export function listGrowthBlueprints(): GrowthBlueprintCatalog {
  return {
    blueprints: BLUEPRINTS,
    notes: [
      `${BLUEPRINTS.length} growth blueprints defined`,
      'each blueprint lists phases · assets · approvals · measurements · team roles · timeline',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
