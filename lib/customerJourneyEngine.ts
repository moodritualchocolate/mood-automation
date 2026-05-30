/**
 * CUSTOMER JOURNEY ENGINE (pure, observational)
 *
 * Phase 1 — Business Intelligence Layer.
 *
 * Pure analyzer over operator-logged journey events. Produces
 * journey maps, drop-off locations, conversion paths, and
 * historically-observed routes.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never predicts a journey outcome
 *   - never optimizes a journey
 *   - never recommends a path
 *   - allowed phrasing: "historically associated", "observed
 *     alongside", "correlated with", "requires more evidence",
 *     "historically observed route"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply,
 *     auto-optimize, viral, dopamine, outrage, manipulat, exploit
 */

import type { JourneyEvent, JourneyEventType } from './customerJourneyMemory';

// ─── input ────────────────────────────────────────────────────

export interface CustomerJourneyAnalyzerInput {
  events?: JourneyEvent[];
}

// ─── output ───────────────────────────────────────────────────

export interface JourneyMap {
  journeyId: string;
  /** Events ordered by occurredAt. */
  eventSequence: Array<{
    eventType: JourneyEventType;
    occurredAt: number;
    publicationId?: string;
    assetId?: string;
    revenueUSD?: number;
  }>;
  /** Final stage reached. */
  finalStage: JourneyEventType;
  /** True if the journey reached any purchase event. */
  reachedPurchase: boolean;
  /** True if the journey reached repeat-purchase. */
  reachedRepeatPurchase: boolean;
  /** Aggregate revenue (USD) observed for this journey. */
  observedRevenueUSD: number;
}

export interface DropOffLocation {
  /** Edge: from stage → to stage. */
  fromStage: JourneyEventType | 'start';
  toStage: JourneyEventType;
  /** Count of journeys that reached `fromStage` and did NOT progress. */
  dropoffCount: number;
  /** Count of journeys that DID progress to `toStage`. */
  progressedCount: number;
  /** 0..1 — share of journeys that dropped off here. */
  dropoffShare: number;
  observation: string;
}

export interface ConversionPath {
  pathId: string;
  /** Stage sequence as a stable signature. */
  stageSequence: JourneyEventType[];
  /** Number of journeys observed taking this path. */
  observedCount: number;
  /** Aggregate revenue observed across these journeys. */
  observedRevenueUSD: number;
  observation: string;
}

export interface CustomerJourneyReading {
  totalEvents: number;
  totalJourneys: number;
  journeyMaps: JourneyMap[];
  dropOffLocations: DropOffLocation[];
  conversionPaths: ConversionPath[];
  /** Per-stage counts. */
  stageCounts: Record<JourneyEventType, number>;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Customer journey analyzer is observational only. It never predicts, ' +
  'never optimizes, never recommends. Operator approval required. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

const STAGE_ORDER: JourneyEventType[] = [
  'impression', 'view', 'click', 'landing-visit', 'lead', 'call',
  'purchase', 'repeat-purchase',
];

function stageRank(stage: JourneyEventType): number {
  return STAGE_ORDER.indexOf(stage);
}

function r1(n: number): number { return Math.round(n * 10) / 10; }
function r3(n: number): number { return Math.round(n * 1000) / 1000; }

// ─── main ─────────────────────────────────────────────────────

export function analyzeCustomerJourneys(
  input: CustomerJourneyAnalyzerInput,
): CustomerJourneyReading {
  const events = (input.events ?? []).slice().sort((a, b) => a.occurredAt - b.occurredAt);

  // Group by journeyId.
  const byJourney = new Map<string, JourneyEvent[]>();
  for (const evt of events) {
    const arr = byJourney.get(evt.journeyId) ?? [];
    arr.push(evt);
    byJourney.set(evt.journeyId, arr);
  }

  // Build journey maps.
  const journeyMaps: JourneyMap[] = Array.from(byJourney.entries())
    .map(([journeyId, evts]) => {
      const sequence = evts.map((e) => ({
        eventType: e.eventType,
        occurredAt: e.occurredAt,
        publicationId: e.publicationId,
        assetId: e.assetId,
        revenueUSD: e.revenueUSD,
      }));
      // Final stage = highest-ranked event observed.
      let finalStage: JourneyEventType = sequence[0].eventType;
      for (const s of sequence) {
        if (stageRank(s.eventType) > stageRank(finalStage)) finalStage = s.eventType;
      }
      const reachedPurchase = evts.some((e) => e.eventType === 'purchase' || e.eventType === 'repeat-purchase');
      const reachedRepeatPurchase = evts.some((e) => e.eventType === 'repeat-purchase');
      const observedRevenueUSD = r3(evts.reduce((a, e) => a + (e.revenueUSD ?? 0), 0));
      return {
        journeyId,
        eventSequence: sequence,
        finalStage,
        reachedPurchase,
        reachedRepeatPurchase,
        observedRevenueUSD,
      };
    })
    .sort((a, b) => b.observedRevenueUSD - a.observedRevenueUSD || a.journeyId.localeCompare(b.journeyId));

  // Stage counts across journeys (deduped per-journey).
  const stageCounts: Record<JourneyEventType, number> = {
    impression: 0, view: 0, click: 0, 'landing-visit': 0,
    lead: 0, call: 0, purchase: 0, 'repeat-purchase': 0,
  };
  for (const j of journeyMaps) {
    const stagesSeen = new Set(j.eventSequence.map((e) => e.eventType));
    for (const s of stagesSeen) stageCounts[s] += 1;
  }

  // Drop-off locations — for each adjacent stage pair in STAGE_ORDER.
  const dropOffLocations: DropOffLocation[] = [];
  // We treat "start → impression" as the very first edge.
  const cumulativeReached: Record<JourneyEventType | 'start', number> = {
    start: journeyMaps.length,
    impression: stageCounts.impression,
    view: stageCounts.view,
    click: stageCounts.click,
    'landing-visit': stageCounts['landing-visit'],
    lead: stageCounts.lead,
    call: stageCounts.call,
    purchase: stageCounts.purchase,
    'repeat-purchase': stageCounts['repeat-purchase'],
  };
  // For each stage pair (from prev to next in STAGE_ORDER), compute the
  // dropoff. We use journey-presence semantics (journey reached `from`
  // and did not reach `to`).
  const edges: Array<{ from: JourneyEventType | 'start'; to: JourneyEventType }> = [
    { from: 'start', to: 'impression' },
  ];
  for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
    edges.push({ from: STAGE_ORDER[i], to: STAGE_ORDER[i + 1] });
  }
  for (const edge of edges) {
    const fromCount = cumulativeReached[edge.from];
    const toCount = cumulativeReached[edge.to];
    const dropoffCount = Math.max(0, fromCount - toCount);
    const dropoffShare = fromCount === 0 ? 0 : dropoffCount / fromCount;
    dropOffLocations.push({
      fromStage: edge.from,
      toStage: edge.to,
      dropoffCount,
      progressedCount: toCount,
      dropoffShare: r3(dropoffShare),
      observation: dropoffShare >= 0.5
        ? `drop-off ${edge.from} → ${edge.to} historically associated with ${Math.round(dropoffShare * 100)}% of journeys reaching ${edge.from} — operator review required`
        : `drop-off ${edge.from} → ${edge.to} observed alongside ${Math.round(dropoffShare * 100)}% of journeys — requires more evidence`,
    });
  }

  // Conversion paths — unique stage sequence signatures across journeys.
  const pathCounter = new Map<string, { count: number; revenue: number }>();
  for (const j of journeyMaps) {
    // Compress sequence so the path signature dedupes repeated impressions/views.
    const compressed: JourneyEventType[] = [];
    for (const s of j.eventSequence) {
      if (compressed[compressed.length - 1] !== s.eventType) compressed.push(s.eventType);
    }
    const key = compressed.join(' → ');
    const cur = pathCounter.get(key) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += j.observedRevenueUSD;
    pathCounter.set(key, cur);
  }
  const conversionPaths: ConversionPath[] = Array.from(pathCounter.entries())
    .map(([key, data], i) => ({
      pathId: `path-${i + 1}`,
      stageSequence: key.split(' → ') as JourneyEventType[],
      observedCount: data.count,
      observedRevenueUSD: r3(data.revenue),
      observation: data.revenue > 0
        ? `path ${key} historically associated with ${data.count} journey(s) and $${r3(data.revenue).toLocaleString()} observed revenue`
        : `path ${key} observed alongside ${data.count} journey(s) — requires more evidence`,
    }))
    .sort((a, b) => b.observedRevenueUSD - a.observedRevenueUSD || b.observedCount - a.observedCount || a.pathId.localeCompare(b.pathId));

  const notes: string[] = [];
  if (events.length === 0) {
    notes.push('no journey events logged yet — requires more evidence');
  } else {
    notes.push(`${events.length} journey event(s) observed across ${journeyMaps.length} journey(s) — historically associated with ${stageCounts.purchase} purchase event(s)`);
    if (stageCounts.lead > 0) {
      const leadToPurchase = stageCounts.purchase / Math.max(1, stageCounts.lead);
      notes.push(`lead → purchase share historically observed at ${r1(leadToPurchase * 100)}% · requires more evidence`);
    }
  }

  return {
    totalEvents: events.length,
    totalJourneys: journeyMaps.length,
    journeyMaps,
    dropOffLocations,
    conversionPaths,
    stageCounts,
    notes,
    reasonCodes: [
      `events:${events.length}`,
      `journeys:${journeyMaps.length}`,
      `paths:${conversionPaths.length}`,
      ...STAGE_ORDER.map((s) => `${s}:${stageCounts[s]}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
