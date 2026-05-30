/**
 * BUSINESS DASHBOARD ENGINE (pure, observational)
 *
 * Phase 4 — Business Intelligence Layer.
 *
 * Pure aggregator that composes a DESCRIPTIVE business dashboard
 * from the prior layers. All metrics are descriptive observations,
 * never predictions.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - all metrics are descriptive only
 *   - never predicts
 *   - never recommends
 *   - allowed phrasing: "historically observed", "observed
 *     alongside", "requires more evidence"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply,
 *     auto-optimize
 */

import type { Formula } from '@/core/types';
import type { CustomerJourneyReading } from './customerJourneyEngine';
import type { AttributionEngineReading } from './attributionEngine';
import type { ProductIntelligenceReading } from './productIntelligenceEngine';
import type { PublicationRecord } from './publicationRegistryMemory';
import type { AssetRecord } from './assetRegistryMemory';
import type { CampaignPlanRecord } from './campaignPlanMemory';
import type { PerformanceRecord } from './performanceMemory';

// ─── input ────────────────────────────────────────────────────

export interface BusinessDashboardInput {
  journey?: CustomerJourneyReading | null;
  attribution?: AttributionEngineReading | null;
  productIntelligence?: ProductIntelligenceReading | null;
  publications?: PublicationRecord[];
  assets?: AssetRecord[];
  campaignPlans?: CampaignPlanRecord[];
  performances?: PerformanceRecord[];
}

// ─── output ───────────────────────────────────────────────────

export interface DashboardMetric {
  label: string;
  value: number;
  unit: string;
  /** Plain-language descriptive note. */
  observation: string;
}

export interface FormulaActivitySummary {
  formula: Formula;
  publicationCount: number;
  assetCount: number;
  observedRevenueUSD: number;
}

export interface AudienceActivitySummary {
  audience: string;
  publicationCount: number;
  observedJourneys: number;
  observedRevenueUSD: number;
}

export interface BusinessDashboardReading {
  /** Top-level descriptive metrics. */
  leads: DashboardMetric;
  customers: DashboardMetric;
  revenue: DashboardMetric;
  repeatPurchases: DashboardMetric;
  contentVolume: DashboardMetric;
  assetVolume: DashboardMetric;
  campaignVolume: DashboardMetric;
  attributionCoverage: DashboardMetric;
  /** Activity breakdowns. */
  formulaActivity: FormulaActivitySummary[];
  audienceActivity: AudienceActivitySummary[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Business dashboard is descriptive only. All metrics are historically observed. ' +
  'The engine never predicts, never recommends. Operator approval required. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function r3(n: number): number { return Math.round(n * 1000) / 1000; }

function metric(label: string, value: number, unit: string, observation: string): DashboardMetric {
  return { label, value, unit, observation };
}

// ─── main ─────────────────────────────────────────────────────

export function buildBusinessDashboard(input: BusinessDashboardInput): BusinessDashboardReading {
  const journey = input.journey;
  const attribution = input.attribution;
  const publications = input.publications ?? [];
  const assets = input.assets ?? [];
  const campaignPlans = input.campaignPlans ?? [];
  const performances = input.performances ?? [];

  const leadsValue = journey?.stageCounts?.lead ?? 0;
  const customersValue = journey?.stageCounts?.purchase ?? 0;
  const repeatValue = journey?.stageCounts?.['repeat-purchase'] ?? 0;
  const revenueValue = attribution?.totalRevenueUSD ?? 0;
  const attributionCoverageValue = attribution?.attributionCoverage ?? 0;

  const formulaSet = new Set<Formula>();
  const formulaPubCount = new Map<Formula, number>();
  for (const p of publications) {
    formulaSet.add(p.formula);
    formulaPubCount.set(p.formula, (formulaPubCount.get(p.formula) ?? 0) + 1);
  }
  const formulaAssetCount = new Map<Formula, number>();
  for (const a of assets) {
    formulaSet.add(a.formula);
    formulaAssetCount.set(a.formula, (formulaAssetCount.get(a.formula) ?? 0) + 1);
  }
  const formulaRevenue = new Map<Formula, number>();
  for (const row of attribution?.dimensions.find((d) => d.dimension === 'formula')?.rows ?? []) {
    const key = row.entityKey.replace('formula:', '') as Formula;
    formulaRevenue.set(key, (formulaRevenue.get(key) ?? 0) + row.observedRevenueUSD);
  }
  const formulaActivity: FormulaActivitySummary[] = Array.from(formulaSet).map((f) => ({
    formula: f,
    publicationCount: formulaPubCount.get(f) ?? 0,
    assetCount: formulaAssetCount.get(f) ?? 0,
    observedRevenueUSD: r3(formulaRevenue.get(f) ?? 0),
  })).sort((a, b) => b.observedRevenueUSD - a.observedRevenueUSD || a.formula.localeCompare(b.formula));

  const audiencePubCount = new Map<string, number>();
  for (const p of publications) {
    audiencePubCount.set(p.audience, (audiencePubCount.get(p.audience) ?? 0) + 1);
  }
  const audienceJourneys = new Map<string, number>();
  const audienceRevenue = new Map<string, number>();
  for (const row of attribution?.dimensions.find((d) => d.dimension === 'audience')?.rows ?? []) {
    const k = row.entityKey.replace('audience:', '');
    audienceJourneys.set(k, (audienceJourneys.get(k) ?? 0) + row.observedJourneys);
    audienceRevenue.set(k, (audienceRevenue.get(k) ?? 0) + row.observedRevenueUSD);
  }
  const audienceSet = new Set([...audiencePubCount.keys(), ...audienceJourneys.keys()]);
  const audienceActivity: AudienceActivitySummary[] = Array.from(audienceSet).map((a) => ({
    audience: a,
    publicationCount: audiencePubCount.get(a) ?? 0,
    observedJourneys: audienceJourneys.get(a) ?? 0,
    observedRevenueUSD: r3(audienceRevenue.get(a) ?? 0),
  })).sort((a, b) => b.observedRevenueUSD - a.observedRevenueUSD || a.audience.localeCompare(b.audience));

  // Defensive use of input.productIntelligence and input.performances so
  // they remain part of the API surface even when not directly aggregated
  // (the panel may want to enrich descriptions later).
  void input.productIntelligence;
  void performances;

  const notes: string[] = [];
  if ((journey?.totalEvents ?? 0) === 0) {
    notes.push('no journey events yet — descriptive metrics are zero · requires more evidence');
  }
  if ((attribution?.totalJourneys ?? 0) === 0) {
    notes.push('no attribution data yet — requires more evidence');
  }

  return {
    leads: metric('leads', leadsValue, 'journey-count',
      leadsValue === 0
        ? 'no lead events historically observed · requires more evidence'
        : `${leadsValue} lead-stage journey(s) historically observed`),
    customers: metric('customers', customersValue, 'journey-count',
      customersValue === 0
        ? 'no purchase events historically observed · requires more evidence'
        : `${customersValue} purchase-stage journey(s) historically observed`),
    revenue: metric('revenue', r3(revenueValue), 'USD',
      revenueValue === 0
        ? 'no revenue events historically observed · requires more evidence'
        : `$${r3(revenueValue).toLocaleString()} revenue historically observed`),
    repeatPurchases: metric('repeatPurchases', repeatValue, 'journey-count',
      repeatValue === 0
        ? 'no repeat-purchase events historically observed · requires more evidence'
        : `${repeatValue} repeat-purchase journey(s) historically observed`),
    contentVolume: metric('contentVolume', publications.length, 'publications',
      `${publications.length} publication(s) historically observed`),
    assetVolume: metric('assetVolume', assets.length, 'assets',
      `${assets.length} asset(s) historically observed`),
    campaignVolume: metric('campaignVolume', campaignPlans.length, 'campaign-plans',
      `${campaignPlans.length} campaign plan(s) historically observed`),
    attributionCoverage: metric('attributionCoverage', r3(attributionCoverageValue), 'rate (0..1)',
      attributionCoverageValue === 0
        ? 'no attribution coverage yet · requires more evidence'
        : `${Math.round(attributionCoverageValue * 100)}% of journey events linked to at least one entity`),
    formulaActivity,
    audienceActivity,
    notes,
    reasonCodes: [
      `leads:${leadsValue}`, `customers:${customersValue}`, `revenue:${revenueValue}`,
      `repeats:${repeatValue}`, `publications:${publications.length}`,
      `assets:${assets.length}`, `campaigns:${campaignPlans.length}`,
      `attributionCoverage:${attributionCoverageValue}`,
      `formulas:${formulaActivity.length}`, `audiences:${audienceActivity.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
