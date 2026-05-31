/**
 * BUSINESS GOAL MODEL (pure, structural)
 *
 * Static structural mapping from business goal → required assets ·
 * campaigns · channels · measurements · workflows. The model never
 * predicts, never optimizes, never names a "best" goal. It answers
 * "what does this goal need?" so the operator can scaffold a
 * workspace deterministically.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the model never auto-selects a goal
 *   - the model never names a winning goal
 *   - allowed phrasing only
 *   - Human remains final authority
 */

// ─── goal catalog ────────────────────────────────────────────

export type BusinessGoalId =
  | 'lead-generation' | 'sales' | 'brand-awareness'
  | 'community-growth' | 'retention'
  | 'product-launch' | 'market-expansion';

export type AssetTypeRef =
  | 'image' | 'video' | 'carousel' | 'landing' | 'email' | 'long-form-post' | 'short-form-clip';

export type CampaignTypeRef =
  | 'always-on' | 'launch' | 'seasonal' | 'response' | 'lifecycle' | 'awareness-burst' | 'community-event';

export type ChannelRef =
  | 'instagram' | 'facebook' | 'tiktok' | 'youtube'
  | 'website' | 'email' | 'blog';

export type MeasurementCategory =
  | 'reach' | 'engagement' | 'click-through' | 'conversion' | 'retention'
  | 'lead-capture' | 'community-signal' | 'attention-time';

export type WorkflowRef =
  | 'creative-production' | 'asset-approval' | 'publication-scheduling'
  | 'performance-logging' | 'audience-segment-review'
  | 'campaign-planning' | 'community-response-handling'
  | 'lifecycle-event-handling' | 'launch-readiness-check';

// ─── goal record ─────────────────────────────────────────────

export interface BusinessGoal {
  goalId: BusinessGoalId;
  label: string;
  purpose: string;
  requiredAssets: AssetTypeRef[];
  requiredCampaigns: CampaignTypeRef[];
  requiredChannels: ChannelRef[];
  requiredMeasurements: MeasurementCategory[];
  requiredWorkflows: WorkflowRef[];
  /** Operator-facing tags surfaced in the goal picker. */
  observationalTags: string[];
}

const GOALS: BusinessGoal[] = [
  {
    goalId: 'lead-generation',
    label: 'Lead Generation',
    purpose:
      'Operator wants the brand to historically capture more identified leads (email · phone · profile).',
    requiredAssets:       ['image', 'video', 'landing', 'short-form-clip'],
    requiredCampaigns:    ['always-on', 'response'],
    requiredChannels:     ['instagram', 'facebook', 'website', 'email'],
    requiredMeasurements: ['reach', 'click-through', 'conversion', 'lead-capture'],
    requiredWorkflows:    ['creative-production', 'asset-approval', 'publication-scheduling', 'performance-logging'],
    observationalTags:    ['lead capture', 'identified contact', 'opt-in'],
  },
  {
    goalId: 'sales',
    label: 'Sales',
    purpose:
      'Operator wants the brand to historically convert more transactions for an existing product line.',
    requiredAssets:       ['image', 'video', 'carousel', 'landing'],
    requiredCampaigns:    ['always-on', 'seasonal', 'response'],
    requiredChannels:     ['instagram', 'facebook', 'website', 'email'],
    requiredMeasurements: ['reach', 'click-through', 'conversion', 'retention'],
    requiredWorkflows:    ['creative-production', 'asset-approval', 'publication-scheduling',
                          'performance-logging', 'campaign-planning'],
    observationalTags:    ['transaction', 'order', 'cart'],
  },
  {
    goalId: 'brand-awareness',
    label: 'Brand Awareness',
    purpose:
      'Operator wants the brand to historically widen its reach without an explicit conversion ask.',
    requiredAssets:       ['video', 'short-form-clip', 'image', 'long-form-post'],
    requiredCampaigns:    ['awareness-burst', 'always-on'],
    requiredChannels:     ['instagram', 'tiktok', 'youtube', 'facebook'],
    requiredMeasurements: ['reach', 'engagement', 'attention-time'],
    requiredWorkflows:    ['creative-production', 'asset-approval', 'publication-scheduling', 'performance-logging'],
    observationalTags:    ['reach', 'first impression', 'recognition'],
  },
  {
    goalId: 'community-growth',
    label: 'Community Growth',
    purpose:
      'Operator wants the brand to historically grow an engaged community around the brand identity.',
    requiredAssets:       ['video', 'short-form-clip', 'long-form-post', 'image'],
    requiredCampaigns:    ['always-on', 'community-event'],
    requiredChannels:     ['instagram', 'tiktok', 'youtube'],
    requiredMeasurements: ['engagement', 'community-signal', 'attention-time'],
    requiredWorkflows:    ['creative-production', 'asset-approval', 'community-response-handling',
                          'performance-logging', 'audience-segment-review'],
    observationalTags:    ['conversation', 'shares', 'replies'],
  },
  {
    goalId: 'retention',
    label: 'Retention',
    purpose:
      'Operator wants the brand to historically keep existing customers engaged across their lifecycle.',
    requiredAssets:       ['email', 'image', 'video', 'landing'],
    requiredCampaigns:    ['lifecycle', 'always-on'],
    requiredChannels:     ['email', 'website', 'instagram'],
    requiredMeasurements: ['retention', 'engagement', 'conversion'],
    requiredWorkflows:    ['creative-production', 'asset-approval', 'lifecycle-event-handling',
                          'performance-logging'],
    observationalTags:    ['repeat customer', 'lifecycle', 'reactivation'],
  },
  {
    goalId: 'product-launch',
    label: 'Product Launch',
    purpose:
      'Operator wants to release a new product to the brand’s audience and historically observe initial uptake.',
    requiredAssets:       ['image', 'video', 'carousel', 'landing', 'long-form-post'],
    requiredCampaigns:    ['launch', 'always-on'],
    requiredChannels:     ['instagram', 'tiktok', 'youtube', 'website', 'email', 'blog'],
    requiredMeasurements: ['reach', 'engagement', 'click-through', 'conversion'],
    requiredWorkflows:    ['creative-production', 'asset-approval', 'publication-scheduling',
                          'performance-logging', 'campaign-planning', 'launch-readiness-check'],
    observationalTags:    ['announce', 'reveal', 'first-72-hours'],
  },
  {
    goalId: 'market-expansion',
    label: 'Market Expansion',
    purpose:
      'Operator wants to extend the brand into a new market (geographic · language · audience segment).',
    requiredAssets:       ['image', 'video', 'carousel', 'landing', 'long-form-post'],
    requiredCampaigns:    ['launch', 'awareness-burst', 'always-on'],
    requiredChannels:     ['instagram', 'tiktok', 'youtube', 'website', 'email'],
    requiredMeasurements: ['reach', 'engagement', 'conversion', 'community-signal'],
    requiredWorkflows:    ['creative-production', 'asset-approval', 'publication-scheduling',
                          'performance-logging', 'audience-segment-review', 'campaign-planning'],
    observationalTags:    ['new geography', 'new language', 'new audience'],
  },
];

export const ALL_BUSINESS_GOALS: BusinessGoal[] = GOALS;
export const BUSINESS_GOAL_IDS: BusinessGoalId[] = GOALS.map((g) => g.goalId);

// ─── pure helpers ────────────────────────────────────────────

export function getBusinessGoal(goalId: BusinessGoalId): BusinessGoal {
  const g = GOALS.find((x) => x.goalId === goalId);
  if (!g) throw new Error(`unknown business goal: ${goalId}`);
  return g;
}

export interface BusinessGoalCatalog {
  goals: BusinessGoal[];
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Business goal model is a static structural map. The model never predicts, ' +
  'never optimizes, never names a winning goal, never auto-selects a goal on ' +
  'the operator’s behalf. Operator approval required at every selection. ' +
  'Human remains final authority.';

export function listBusinessGoals(): BusinessGoalCatalog {
  return {
    goals: GOALS,
    notes: [
      `${GOALS.length} business goals defined`,
      'each goal lists required assets · campaigns · channels · measurements · workflows',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
