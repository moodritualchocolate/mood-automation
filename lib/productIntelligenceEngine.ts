/**
 * PRODUCT INTELLIGENCE ENGINE (pure, observational)
 *
 * Phase 3 — Business Intelligence Layer.
 *
 * Cross-formula, cross-audience, cross-angle observation over
 * customer journey + attribution data. Surfaces historically-observed
 * cross-cuts. NEVER recommends, NEVER auto-decides.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never recommends a formula / audience / angle combination
 *   - never makes an automatic decision
 *   - allowed phrasing: "historically associated", "observed
 *     alongside", "correlated with", "requires more evidence"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply,
 *     auto-optimize
 */

import type { Formula } from '@/core/types';
import type { AttributionEngineReading } from './attributionEngine';
import type { CustomerJourneyReading } from './customerJourneyEngine';

// ─── input ────────────────────────────────────────────────────

export interface ProductIntelligenceInput {
  attribution?: AttributionEngineReading | null;
  journey?: CustomerJourneyReading | null;
}

// ─── output ───────────────────────────────────────────────────

export interface CrossCutObservation {
  /** Stable cross-cut id, e.g. "formula:ENERGY × audience:il-women-25-44". */
  observationId: string;
  primary: { dimension: string; value: string };
  secondary: { dimension: string; value: string };
  observedJourneys: number;
  observedRevenueUSD: number;
  observation: string;
}

export interface DimensionRanking {
  dimension: 'formula' | 'audience' | 'creative-angle' | 'asset-type' | 'campaign-mode';
  /** Rows ordered by observedRevenueUSD descending — descriptive only. */
  rows: Array<{
    label: string;
    observedJourneys: number;
    observedRevenueUSD: number;
    journeyCompletionRate: number;
    observation: string;
  }>;
}

export interface ProductIntelligenceReading {
  crossFormula: DimensionRanking;
  crossAudience: DimensionRanking;
  crossCreativeAngle: DimensionRanking;
  crossAssetType: DimensionRanking;
  crossCampaignMode: DimensionRanking;
  /** Cross-cut signatures (formula × audience etc.). */
  crossCuts: CrossCutObservation[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Product intelligence is observational only. It never recommends, ' +
  'never makes an automatic decision. Historical associations only. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function r3(n: number): number { return Math.round(n * 1000) / 1000; }

function dimensionRanking(
  dim: DimensionRanking['dimension'],
  attribution: AttributionEngineReading | null,
  attributionKey: string,
): DimensionRanking {
  const rawDim = attribution?.dimensions.find((d) => d.dimension === attributionKey as never);
  if (!rawDim) return { dimension: dim, rows: [] };
  const rows = rawDim.rows.map((r) => {
    const completion = r.observedJourneys === 0 ? 0 : r.observedPurchases / r.observedJourneys;
    return {
      label: r.entityLabel,
      observedJourneys: r.observedJourneys,
      observedRevenueUSD: r.observedRevenueUSD,
      journeyCompletionRate: r3(completion),
      observation: r.observedRevenueUSD > 0
        ? `${r.entityLabel} historically associated with ${r.observedJourneys} journey(s) · journey-completion rate ${r3(completion * 100)}% · $${r.observedRevenueUSD.toLocaleString()} observed revenue — requires more evidence`
        : `${r.entityLabel} observed alongside ${r.observedJourneys} journey(s) — requires more evidence`,
    };
  });
  return { dimension: dim, rows };
}

// ─── main ─────────────────────────────────────────────────────

export function analyzeProductIntelligence(
  input: ProductIntelligenceInput,
): ProductIntelligenceReading {
  const attribution = input.attribution ?? null;
  const journey = input.journey ?? null;

  // Dimension rankings — reuse attribution buckets.
  const crossFormula = dimensionRanking('formula', attribution, 'formula');
  const crossAudience = dimensionRanking('audience', attribution, 'audience');
  const crossCreativeAngle = dimensionRanking('creative-angle', attribution, 'creative-angle');

  // Asset-type ranking — derive from the asset dimension by extracting
  // the packageType from the entityLabel ("storyName · type · MOOD F").
  const assetDim = attribution?.dimensions.find((d) => d.dimension === 'asset');
  const assetTypeAggregator = new Map<string, { journeys: number; revenue: number; completion: number; rows: number }>();
  for (const row of assetDim?.rows ?? []) {
    const match = /· (image|video|carousel|landing) ·/.exec(row.entityLabel);
    if (!match) continue;
    const type = match[1];
    const cur = assetTypeAggregator.get(type) ?? { journeys: 0, revenue: 0, completion: 0, rows: 0 };
    cur.journeys += row.observedJourneys;
    cur.revenue += row.observedRevenueUSD;
    cur.completion += row.observedJourneys === 0 ? 0 : row.observedPurchases / row.observedJourneys;
    cur.rows += 1;
    assetTypeAggregator.set(type, cur);
  }
  const crossAssetType: DimensionRanking = {
    dimension: 'asset-type',
    rows: Array.from(assetTypeAggregator.entries()).map(([type, data]) => ({
      label: type,
      observedJourneys: data.journeys,
      observedRevenueUSD: r3(data.revenue),
      journeyCompletionRate: r3(data.rows === 0 ? 0 : data.completion / data.rows),
      observation: data.revenue > 0
        ? `${type} historically associated with ${data.journeys} journey(s) and $${r3(data.revenue).toLocaleString()} observed revenue — requires more evidence`
        : `${type} observed alongside ${data.journeys} journey(s) — requires more evidence`,
    })).sort((a, b) => b.observedRevenueUSD - a.observedRevenueUSD || a.label.localeCompare(b.label)),
  };

  // Campaign-mode ranking — derive from the campaign dimension by
  // extracting the goal from the entityLabel ("plan · goal · MOOD F").
  const campaignDim = attribution?.dimensions.find((d) => d.dimension === 'campaign');
  const campaignModeAggregator = new Map<string, { journeys: number; revenue: number; completion: number; rows: number }>();
  for (const row of campaignDim?.rows ?? []) {
    const match = /· (brand-awareness|product-trial|audience-retention|reactivation|community-build) ·/.exec(row.entityLabel);
    if (!match) continue;
    const mode = match[1];
    const cur = campaignModeAggregator.get(mode) ?? { journeys: 0, revenue: 0, completion: 0, rows: 0 };
    cur.journeys += row.observedJourneys;
    cur.revenue += row.observedRevenueUSD;
    cur.completion += row.observedJourneys === 0 ? 0 : row.observedPurchases / row.observedJourneys;
    cur.rows += 1;
    campaignModeAggregator.set(mode, cur);
  }
  const crossCampaignMode: DimensionRanking = {
    dimension: 'campaign-mode',
    rows: Array.from(campaignModeAggregator.entries()).map(([mode, data]) => ({
      label: mode,
      observedJourneys: data.journeys,
      observedRevenueUSD: r3(data.revenue),
      journeyCompletionRate: r3(data.rows === 0 ? 0 : data.completion / data.rows),
      observation: data.revenue > 0
        ? `${mode} historically associated with ${data.journeys} journey(s) and $${r3(data.revenue).toLocaleString()} observed revenue — requires more evidence`
        : `${mode} observed alongside ${data.journeys} journey(s) — requires more evidence`,
    })).sort((a, b) => b.observedRevenueUSD - a.observedRevenueUSD || a.label.localeCompare(b.label)),
  };

  // Cross-cuts — formula × audience, formula × angle.
  const crossCuts: CrossCutObservation[] = [];
  const formulaSet = new Set(crossFormula.rows.map((r) => r.label.replace('MOOD ', '')));
  const audienceSet = new Set(crossAudience.rows.map((r) => r.label));
  // For each formula × audience pair, count journeys where attribution
  // touched both — approximated by intersecting their journey counts via
  // re-walking journey events would require the raw input. Since we
  // operate on aggregated rows, we surface the multiplicative coarse
  // observation only — clearly labeled as historically associated.
  for (const f of formulaSet) {
    for (const a of audienceSet) {
      const fRow = crossFormula.rows.find((r) => r.label === `MOOD ${f}`);
      const aRow = crossAudience.rows.find((r) => r.label === a);
      if (!fRow || !aRow) continue;
      // Conservative cross-cut estimate: take the minimum of the two row
      // journey counts as the upper-bound co-observation.
      const observedJourneys = Math.min(fRow.observedJourneys, aRow.observedJourneys);
      if (observedJourneys === 0) continue;
      const observedRevenueUSD = r3(Math.min(fRow.observedRevenueUSD, aRow.observedRevenueUSD));
      crossCuts.push({
        observationId: `formula:${f}×audience:${a}`,
        primary: { dimension: 'formula', value: f },
        secondary: { dimension: 'audience', value: a },
        observedJourneys,
        observedRevenueUSD,
        observation: `MOOD ${f} × ${a} historically associated with up to ${observedJourneys} co-observed journey(s) — requires more evidence`,
      });
    }
  }
  crossCuts.sort((a, b) =>
    b.observedRevenueUSD - a.observedRevenueUSD ||
    b.observedJourneys - a.observedJourneys ||
    a.observationId.localeCompare(b.observationId),
  );

  const notes: string[] = [];
  if (!attribution || attribution.totalJourneys === 0) {
    notes.push('no attribution data yet — requires more evidence');
  } else {
    notes.push(`${attribution.totalJourneys} journey(s) historically associated with ${crossFormula.rows.length} formula(s), ${crossAudience.rows.length} audience(s), ${crossCreativeAngle.rows.length} angle(s)`);
  }
  if (journey && journey.totalEvents > 0) {
    notes.push(`${journey.totalEvents} journey event(s) feed this analysis — requires more evidence`);
  }

  return {
    crossFormula,
    crossAudience,
    crossCreativeAngle,
    crossAssetType,
    crossCampaignMode,
    crossCuts: crossCuts.slice(0, 32),
    notes,
    reasonCodes: [
      `formula:${crossFormula.rows.length}`,
      `audience:${crossAudience.rows.length}`,
      `angle:${crossCreativeAngle.rows.length}`,
      `assetType:${crossAssetType.rows.length}`,
      `campaignMode:${crossCampaignMode.rows.length}`,
      `crossCuts:${crossCuts.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
