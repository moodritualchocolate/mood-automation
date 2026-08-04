/**
 * CUSTOMER FUNNEL MODEL (pure, descriptive)
 *
 * Static descriptive map of customer funnel stages → asset types ·
 * campaign types · measurements · customer signals. The model is
 * purely descriptive. It never predicts movement, never scores a
 * customer, never names a "best" stage to focus on.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the model never auto-classifies a customer
 *   - the model never auto-routes between stages
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type {
  AssetTypeRef, CampaignTypeRef, MeasurementCategory,
} from './businessGoalModel';

export type FunnelStageId =
  | 'awareness' | 'interest' | 'consideration'
  | 'intent' | 'purchase' | 'retention' | 'advocacy';

export interface FunnelStage {
  stageId: FunnelStageId;
  /** Operator-facing label. */
  label: string;
  /** Index in the funnel (1 = top). */
  index: number;
  /** Short single-sentence description. */
  description: string;
  /** Asset types typically registered for this stage. */
  assetTypes: AssetTypeRef[];
  /** Campaign types typically wired to this stage. */
  campaignTypes: CampaignTypeRef[];
  /** Measurement categories typically logged at this stage. */
  measurements: MeasurementCategory[];
  /** Operator-observable customer signals at this stage. */
  customerSignals: string[];
}

const STAGES: FunnelStage[] = [
  {
    stageId: 'awareness',
    label: 'Awareness',
    index: 1,
    description: 'Customer historically encountered the brand for the first time.',
    assetTypes: ['video', 'short-form-clip', 'image'],
    campaignTypes: ['awareness-burst', 'always-on'],
    measurements: ['reach', 'engagement', 'attention-time'],
    customerSignals: ['first impression', 'unprompted recognition', 'first follow'],
  },
  {
    stageId: 'interest',
    label: 'Interest',
    index: 2,
    description: 'Customer historically returned to engage with brand content a second or third time.',
    assetTypes: ['video', 'short-form-clip', 'long-form-post', 'image'],
    campaignTypes: ['always-on', 'community-event'],
    measurements: ['engagement', 'attention-time', 'click-through'],
    customerSignals: ['profile visit', 'comment thread', 'save'],
  },
  {
    stageId: 'consideration',
    label: 'Consideration',
    index: 3,
    description: 'Customer historically reviewed the product page or signed up for more information.',
    assetTypes: ['landing', 'long-form-post', 'video', 'email'],
    campaignTypes: ['always-on', 'lifecycle'],
    measurements: ['click-through', 'lead-capture'],
    customerSignals: ['product page view', 'email opt-in', 'WhatsApp inquiry'],
  },
  {
    stageId: 'intent',
    label: 'Intent',
    index: 4,
    description: 'Customer historically signaled an intent to purchase (cart, checkout, hold).',
    assetTypes: ['landing', 'email', 'image', 'short-form-clip'],
    campaignTypes: ['response', 'lifecycle', 'always-on'],
    measurements: ['click-through', 'conversion'],
    customerSignals: ['cart add', 'checkout begin', 'hold'],
  },
  {
    stageId: 'purchase',
    label: 'Purchase',
    index: 5,
    description: 'Customer historically completed a transaction with the brand.',
    assetTypes: ['email', 'landing'],
    campaignTypes: ['lifecycle', 'always-on'],
    measurements: ['conversion'],
    customerSignals: ['order placed', 'first purchase', 'repeat purchase'],
  },
  {
    stageId: 'retention',
    label: 'Retention',
    index: 6,
    description: 'Customer historically returned to the brand after a prior purchase.',
    assetTypes: ['email', 'image', 'video', 'short-form-clip'],
    campaignTypes: ['lifecycle', 'always-on'],
    measurements: ['retention', 'engagement', 'conversion'],
    customerSignals: ['repeat order', 'lifecycle engagement', 'reactivation'],
  },
  {
    stageId: 'advocacy',
    label: 'Advocacy',
    index: 7,
    description: 'Customer historically advocated for the brand to other potential customers.',
    assetTypes: ['short-form-clip', 'image', 'long-form-post'],
    campaignTypes: ['community-event', 'always-on'],
    measurements: ['community-signal', 'engagement', 'reach'],
    customerSignals: ['referral', 'user-generated content', 'public mention'],
  },
];

export const ALL_FUNNEL_STAGES: FunnelStage[] = STAGES;
export const FUNNEL_STAGE_IDS: FunnelStageId[] = STAGES.map((s) => s.stageId);

// ─── pure helpers ────────────────────────────────────────────

export function getFunnelStage(id: FunnelStageId): FunnelStage {
  const s = STAGES.find((x) => x.stageId === id);
  if (!s) throw new Error(`unknown funnel stage: ${id}`);
  return s;
}

export interface CustomerFunnelCatalog {
  stages: FunnelStage[];
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Customer funnel model is a static descriptive map. The model never ' +
  'auto-classifies a customer, never auto-routes a customer between stages, ' +
  'never scores a customer’s value. Movement between stages is operator-logged. ' +
  'Operator approval required. Human remains final authority.';

export function listCustomerFunnel(): CustomerFunnelCatalog {
  return {
    stages: STAGES,
    notes: [
      `${STAGES.length} funnel stages: Awareness → Advocacy`,
      'each stage lists asset types · campaign types · measurements · customer signals',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
