/**
 * ATTRIBUTION ENGINE (pure, observational)
 *
 * Phase 2 — Business Intelligence Layer.
 *
 * Connects creative artifacts (campaign · asset · creative angle ·
 * story structure · formula · audience) to journey outcomes (lead ·
 * customer · revenue) via OPERATOR-LOGGED journey events.
 *
 * The engine produces HISTORICAL ASSOCIATIONS only:
 *   - "X historically associated with N journeys and $R revenue"
 *   - "X observed alongside Y at rate Z"
 *   - "X correlated with Y — requires more evidence"
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never names a "best performer"
 *   - never selects a winner
 *   - never recommends a campaign / asset / formula
 *   - allowed phrasing: "historically associated", "observed
 *     alongside", "correlated with", "requires more evidence"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply,
 *     auto-optimize, viral, dopamine, outrage, manipulat, exploit
 */

import type { Formula } from '@/core/types';
import type { JourneyEvent } from './customerJourneyMemory';
import type { PublicationRecord } from './publicationRegistryMemory';
import type { AssetRecord } from './assetRegistryMemory';
import type { CampaignPlanRecord } from './campaignPlanMemory';

// ─── input ────────────────────────────────────────────────────

export interface AttributionEngineInput {
  events?: JourneyEvent[];
  publications?: PublicationRecord[];
  assets?: AssetRecord[];
  campaignPlans?: CampaignPlanRecord[];
}

// ─── output ───────────────────────────────────────────────────

export interface AttributionRow {
  /** Stable key for the entity (e.g. "campaign:plan-xyz"). */
  entityKey: string;
  /** Plain-language label for the entity. */
  entityLabel: string;
  /** Number of journeys touched by this entity. */
  observedJourneys: number;
  observedLeads: number;
  observedPurchases: number;
  observedRepeatPurchases: number;
  observedRevenueUSD: number;
  /** Plain-language observation, allowed phrasing only. */
  observation: string;
}

export interface AttributionDimension {
  dimension: 'campaign' | 'asset' | 'creative-angle' | 'story-structure' | 'formula' | 'audience';
  rows: AttributionRow[];
}

export interface AttributionEngineReading {
  totalJourneys: number;
  totalRevenueUSD: number;
  dimensions: AttributionDimension[];
  /** Coverage = share of journey events that could be attributed to at
   *  least one entity. */
  attributionCoverage: number;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Attribution analyzer is observational only. It never selects a winner, ' +
  'never recommends, never auto-applies. Historical associations only. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function r3(n: number): number { return Math.round(n * 1000) / 1000; }

interface EntityBucket {
  observedJourneys: Set<string>;
  observedLeads: Set<string>;
  observedPurchases: Set<string>;
  observedRepeatPurchases: Set<string>;
  observedRevenueUSD: number;
}

function newBucket(): EntityBucket {
  return {
    observedJourneys: new Set(),
    observedLeads: new Set(),
    observedPurchases: new Set(),
    observedRepeatPurchases: new Set(),
    observedRevenueUSD: 0,
  };
}

function describe(row: AttributionRow): string {
  if (row.observedJourneys === 0) {
    return `${row.entityLabel} observed alongside no journey events — requires more evidence`;
  }
  if (row.observedRevenueUSD > 0) {
    return `${row.entityLabel} historically associated with ${row.observedJourneys} journey(s), ` +
      `${row.observedPurchases} purchase(s) and $${row.observedRevenueUSD.toLocaleString()} observed revenue · ` +
      'correlated with downstream outcomes — requires more evidence';
  }
  return `${row.entityLabel} observed alongside ${row.observedJourneys} journey(s) but no purchase yet — requires more evidence`;
}

function bucketToRow(entityKey: string, entityLabel: string, b: EntityBucket): AttributionRow {
  const row: AttributionRow = {
    entityKey,
    entityLabel,
    observedJourneys: b.observedJourneys.size,
    observedLeads: b.observedLeads.size,
    observedPurchases: b.observedPurchases.size,
    observedRepeatPurchases: b.observedRepeatPurchases.size,
    observedRevenueUSD: r3(b.observedRevenueUSD),
    observation: '',
  };
  row.observation = describe(row);
  return row;
}

// Heuristic: coarse story-structure inference from asset prompt.
function inferStoryStructureFromAsset(asset: AssetRecord): string {
  const hay = `${asset.prompt} ${asset.summary}`.toLowerCase();
  if (/pressure.{0,15}breath.{0,15}return/.test(hay)) return 'pressure-breath-return';
  if (/noise.{0,15}silence.{0,15}clarity/.test(hay)) return 'noise-silence-clarity';
  if (/fatigue.{0,15}tenderness.{0,15}continuation/.test(hay)) return 'fatigue-tenderness-continuation';
  if (/disconnection.{0,15}ritual.{0,15}reconnection/.test(hay)) return 'disconnection-ritual-reconnection';
  if (/self.loss.{0,15}pause.{0,15}self.return/.test(hay)) return 'self-loss-pause-self-return';
  if (/overwhelm.{0,15}presence.{0,15}grounded/.test(hay)) return 'overwhelm-presence-groundedness';
  return 'observed-arc';
}

// Heuristic: coarse creative-angle inference from asset metadata.
function inferCreativeAngleFromAsset(asset: AssetRecord): string {
  const hay = `${asset.prompt} ${asset.summary}`.toLowerCase();
  if (/quiet return|return home/.test(hay)) return 'quiet-return-home';
  if (/parent after|after exhaustion/.test(hay)) return 'parent-after-exhaustion';
  if (/morning|first sip|coffee/.test(hay)) return 'morning-restart';
  if (/night|decompress|warm lamp/.test(hay)) return 'night-decompression';
  if (/kitchen light/.test(hay)) return 'kitchen-light';
  if (/empty chair/.test(hay)) return 'empty-chair';
  if (/hand on shoulder/.test(hay)) return 'hand-on-shoulder';
  if (/breath before|exhale|pause-frame/.test(hay)) return 'breath-before-continuing';
  if (/becoming yourself|self-return/.test(hay)) return 'becoming-yourself-again';
  if (/silent relief|silence release|phone face down/.test(hay)) return 'silent-relief';
  if (/small victory|unwitnessed/.test(hay)) return 'small-victory';
  if (/ritual|repetition/.test(hay)) return 'ordinary-ritual';
  return 'unclassified-angle';
}

// ─── main ─────────────────────────────────────────────────────

export function analyzeAttribution(input: AttributionEngineInput): AttributionEngineReading {
  const events = (input.events ?? []).slice().sort((a, b) => a.occurredAt - b.occurredAt);
  const publications = input.publications ?? [];
  const assets = input.assets ?? [];
  const campaignPlans = input.campaignPlans ?? [];

  const publicationById = new Map(publications.map((p) => [p.publicationId, p] as const));
  const assetById = new Map(assets.map((a) => [a.assetId, a] as const));
  const campaignById = new Map(campaignPlans.map((c) => [c.planId, c] as const));

  const campaignBuckets = new Map<string, EntityBucket>();
  const assetBuckets = new Map<string, EntityBucket>();
  const angleBuckets = new Map<string, EntityBucket>();
  const structureBuckets = new Map<string, EntityBucket>();
  const formulaBuckets = new Map<Formula, EntityBucket>();
  const audienceBuckets = new Map<string, EntityBucket>();

  function bucket<K>(map: Map<K, EntityBucket>, key: K): EntityBucket {
    const b = map.get(key) ?? newBucket();
    map.set(key, b);
    return b;
  }

  let attributedEventCount = 0;
  const journeyTotals = new Map<string, { revenue: number; reachedPurchase: boolean; reachedRepeat: boolean; reachedLead: boolean }>();

  for (const evt of events) {
    // Resolve the chain.
    const pub = evt.publicationId ? publicationById.get(evt.publicationId) : undefined;
    const asset = evt.assetId ? assetById.get(evt.assetId) : (pub ? assetById.get(pub.assetId) : undefined);
    const campaign = evt.campaignPlanId ? campaignById.get(evt.campaignPlanId) :
      (pub ? campaignPlans.find((c) => c.input?.formula === pub.formula) : undefined);
    const formula: Formula | undefined = asset?.formula ?? pub?.formula ?? campaign?.input?.formula;
    const audience = pub?.audience ?? evt.audience ?? (campaign?.input?.audience ?? undefined);

    if (pub || asset || campaign || formula || audience) attributedEventCount += 1;

    // Aggregate per-journey totals — for revenue we credit once per
    // journey to avoid double counting purchase events.
    const jt = journeyTotals.get(evt.journeyId) ?? { revenue: 0, reachedPurchase: false, reachedRepeat: false, reachedLead: false };
    if (evt.revenueUSD) jt.revenue += evt.revenueUSD;
    if (evt.eventType === 'purchase') jt.reachedPurchase = true;
    if (evt.eventType === 'repeat-purchase') jt.reachedRepeat = true;
    if (evt.eventType === 'lead' || evt.eventType === 'call') jt.reachedLead = true;
    journeyTotals.set(evt.journeyId, jt);

    function attach(b: EntityBucket) {
      b.observedJourneys.add(evt.journeyId);
      if (evt.eventType === 'lead' || evt.eventType === 'call') b.observedLeads.add(evt.journeyId);
      if (evt.eventType === 'purchase') {
        b.observedPurchases.add(evt.journeyId);
        b.observedRevenueUSD += evt.revenueUSD ?? 0;
      }
      if (evt.eventType === 'repeat-purchase') {
        b.observedRepeatPurchases.add(evt.journeyId);
        b.observedRevenueUSD += evt.revenueUSD ?? 0;
      }
    }

    if (campaign) attach(bucket(campaignBuckets, campaign.planId));
    if (asset) attach(bucket(assetBuckets, asset.assetId));
    if (asset) {
      const angle = inferCreativeAngleFromAsset(asset);
      attach(bucket(angleBuckets, angle));
      const structure = inferStoryStructureFromAsset(asset);
      attach(bucket(structureBuckets, structure));
    }
    if (formula) attach(bucket(formulaBuckets, formula));
    if (audience) attach(bucket(audienceBuckets, audience));
  }

  const totalJourneys = journeyTotals.size;
  const totalRevenueUSD = r3(Array.from(journeyTotals.values()).reduce((a, t) => a + t.revenue, 0));
  const attributionCoverage = events.length === 0 ? 0 : r3(attributedEventCount / events.length);

  const rawDims: AttributionDimension[] = [
    {
      dimension: 'campaign' as const,
      rows: Array.from(campaignBuckets.entries()).map(([k, b]) => {
        const c = campaignById.get(k);
        const label = c ? `${c.label} · ${c.input.goal} · MOOD ${c.input.formula}` : k;
        return bucketToRow(`campaign:${k}`, label, b);
      }),
    },
    {
      dimension: 'asset' as const,
      rows: Array.from(assetBuckets.entries()).map(([k, b]) => {
        const a = assetById.get(k);
        const label = a ? `${a.sourceStoryName} · ${a.packageType} · MOOD ${a.formula}` : k;
        return bucketToRow(`asset:${k}`, label, b);
      }),
    },
    {
      dimension: 'creative-angle' as const,
      rows: Array.from(angleBuckets.entries()).map(([k, b]) =>
        bucketToRow(`angle:${k}`, k, b),
      ),
    },
    {
      dimension: 'story-structure' as const,
      rows: Array.from(structureBuckets.entries()).map(([k, b]) =>
        bucketToRow(`structure:${k}`, k, b),
      ),
    },
    {
      dimension: 'formula' as const,
      rows: Array.from(formulaBuckets.entries()).map(([k, b]) =>
        bucketToRow(`formula:${k}`, `MOOD ${k}`, b),
      ),
    },
    {
      dimension: 'audience' as const,
      rows: Array.from(audienceBuckets.entries()).map(([k, b]) =>
        bucketToRow(`audience:${k}`, k, b),
      ),
    },
  ];
  const dimensions: AttributionDimension[] = rawDims.map((d) => ({
    dimension: d.dimension,
    rows: d.rows.sort((a, b) =>
      b.observedRevenueUSD - a.observedRevenueUSD ||
      b.observedJourneys - a.observedJourneys ||
      a.entityKey.localeCompare(b.entityKey),
    ),
  }));

  const notes: string[] = [];
  if (events.length === 0) {
    notes.push('no journey events logged yet — requires more evidence');
  } else {
    notes.push(`${events.length} journey event(s) historically associated with ${dimensions.reduce((a, d) => a + d.rows.length, 0)} attribution row(s)`);
    notes.push(`attribution coverage ${Math.round(attributionCoverage * 100)}% — events with at least one entity link · requires more evidence`);
  }

  return {
    totalJourneys,
    totalRevenueUSD,
    dimensions,
    attributionCoverage,
    notes,
    reasonCodes: [
      `events:${events.length}`,
      `journeys:${totalJourneys}`,
      `revenue:${totalRevenueUSD}`,
      `coverage:${attributionCoverage}`,
      ...dimensions.map((d) => `${d.dimension}:${d.rows.length}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
