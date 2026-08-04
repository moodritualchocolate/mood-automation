/**
 * TESTING MATRIX ENGINE (pure, observational)
 *
 * Builds a structured A/B testing matrix for a campaign plan.
 * Variants are EXPLORATIONS — not "best" guesses, not winner
 * candidates, not optimization targets. The operator decides
 * which cells to run.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never names a winning cell
 *   - never auto-selects a variant
 *   - never recommends a "best" channel
 *   - allowed phrasing: "exploratory cell", "operator may explore",
 *     "historically associated", "observed alongside", "requires
 *     more evidence"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize
 */

import type { Formula } from '@/core/types';
import type { CampaignGoal, CampaignMarket, CampaignPhaseId, CreativeAngle } from './campaignPlannerEngine';

// ─── input ────────────────────────────────────────────────────

export interface TestingMatrixInput {
  goal: CampaignGoal;
  formula: Formula;
  market: CampaignMarket;
  audience: string;
  /** Creative angles surfaced by the campaign planner. */
  creativeAngles: CreativeAngle[];
  /** Optional per-cell budget — operator-only. */
  perCellBudgetUSD?: number;
}

// ─── output ───────────────────────────────────────────────────

export type VariantAxis =
  | 'angle' | 'emotionalArc' | 'visualStyle' | 'silenceRatio'
  | 'copyDirection' | 'channel' | 'audienceSegment';

export interface VariantOption {
  axis: VariantAxis;
  /** Variant id stable within the axis. */
  variantId: string;
  /** Plain-language description. */
  description: string;
}

export type TestingChannel =
  | 'instagram-feed' | 'instagram-reels' | 'instagram-story'
  | 'tiktok' | 'facebook-reels' | 'youtube-shorts'
  | 'pinterest' | 'website-hero' | 'newsletter';

export interface TestingCell {
  cellId: string;
  phaseId: CampaignPhaseId | 'cross-phase';
  variants: Record<VariantAxis, string>;
  channel: TestingChannel;
  audienceSegment: string;
  /** USD allocated per the operator's choice. */
  perCellBudgetUSD: number;
  /** Plain-language observation, allowed phrasing only. */
  exploration: string;
  operatorReviewRequired: true;
}

export interface TestingMatrixReading {
  axes: Array<{ axis: VariantAxis; options: VariantOption[] }>;
  cells: TestingCell[];
  totalCells: number;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Testing matrix is a structure of exploratory cells only. ' +
  'The system never names a winning cell, never auto-selects a variant. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function channelsForMarket(market: CampaignMarket): TestingChannel[] {
  if (market === 'israel') {
    return ['instagram-feed', 'instagram-reels', 'instagram-story', 'tiktok', 'facebook-reels'];
  }
  return ['instagram-feed', 'instagram-reels', 'tiktok', 'youtube-shorts', 'pinterest'];
}

function audienceSegmentsFor(input: TestingMatrixInput): string[] {
  // Coarse: split the operator's audience into 2-3 exploration segments.
  // The operator validates segmentation against their platform tools.
  const base = input.audience;
  return [
    `${base} · primary`,
    `${base} · lookalike-mid`,
    input.market === 'israel' ? `${base} · israel-broad` : `${base} · global-broad`,
  ];
}

function emotionalArcOptions(angles: CreativeAngle[]): VariantOption[] {
  const arcs = Array.from(new Set(angles.map((a) => a.emotionalArc))).slice(0, 4);
  return arcs.map((arc, i) => ({
    axis: 'emotionalArc',
    variantId: `arc-${i + 1}`,
    description: arc,
  }));
}

function visualStyleOptions(): VariantOption[] {
  return [
    { axis: 'visualStyle', variantId: 'vis-doc-handheld',
      description: 'documentary handheld · 50mm · natural light' },
    { axis: 'visualStyle', variantId: 'vis-ambient-still',
      description: 'ambient still · 35mm fixed · low practical light' },
    { axis: 'visualStyle', variantId: 'vis-warm-kitchen',
      description: 'home warm-kitchen · 35mm handheld · single warm light' },
  ];
}

function silenceRatioOptions(): VariantOption[] {
  return [
    { axis: 'silenceRatio', variantId: 'sil-majority', description: 'majority silence (~70%)' },
    { axis: 'silenceRatio', variantId: 'sil-sustained', description: 'sustained silence (full second half)' },
    { axis: 'silenceRatio', variantId: 'sil-sparse', description: 'sparse silence (~25%) for invitation phase only' },
  ];
}

function copyDirectionOptions(market: CampaignMarket): VariantOption[] {
  const langLabel = market === 'israel' ? 'Hebrew RTL' : 'English';
  return [
    { axis: 'copyDirection', variantId: 'copy-headline',
      description: `${langLabel} · single line headline · 4-10 words · no claim` },
    { axis: 'copyDirection', variantId: 'copy-observation',
      description: `${langLabel} · observational note · 6-12 words · no urgency` },
    { axis: 'copyDirection', variantId: 'copy-quiet-question',
      description: `${langLabel} · quiet open question · 4-8 words · no aspirational claim` },
  ];
}

// ─── main ─────────────────────────────────────────────────────

export function buildTestingMatrix(input: TestingMatrixInput): TestingMatrixReading {
  const channels = channelsForMarket(input.market);
  const audienceSegments = audienceSegmentsFor(input);
  const angles = input.creativeAngles.slice(0, 4); // 4 axes for matrix tractability
  const angleOptions: VariantOption[] = angles.map((a) => ({
    axis: 'angle', variantId: a.angleId, description: a.description,
  }));
  const arcOptions = emotionalArcOptions(angles);
  const visOptions = visualStyleOptions();
  const silOptions = silenceRatioOptions();
  const copyOptions = copyDirectionOptions(input.market);
  const channelOptions: VariantOption[] = channels.map((c, i) => ({
    axis: 'channel', variantId: `chan-${i + 1}-${c}`, description: c,
  }));
  const audienceOptions: VariantOption[] = audienceSegments.map((s, i) => ({
    axis: 'audienceSegment', variantId: `aud-${i + 1}`, description: s,
  }));

  const axes: Array<{ axis: VariantAxis; options: VariantOption[] }> = [
    { axis: 'angle', options: angleOptions },
    { axis: 'emotionalArc', options: arcOptions },
    { axis: 'visualStyle', options: visOptions },
    { axis: 'silenceRatio', options: silOptions },
    { axis: 'copyDirection', options: copyOptions },
    { axis: 'channel', options: channelOptions },
    { axis: 'audienceSegment', options: audienceOptions },
  ];

  // We DELIBERATELY do not produce the full cartesian product (it would
  // be huge and the operator never explores everything). Instead we
  // surface ANGLE × CHANNEL × AUDIENCE as the primary matrix, with the
  // remaining axes carried as "exploration knobs" the operator may
  // toggle per cell.
  const cells: TestingCell[] = [];
  const perCellBudget = input.perCellBudgetUSD ?? 0;
  let counter = 0;
  for (const angle of angleOptions) {
    for (const channel of channelOptions) {
      for (const audience of audienceOptions) {
        counter += 1;
        const angleSrc = angles.find((a) => a.angleId === angle.variantId)!;
        const arc = arcOptions.find((o) => o.description === angleSrc.emotionalArc) ?? arcOptions[0];
        cells.push({
          cellId: `cell-${counter}`,
          phaseId: 'cross-phase',
          variants: {
            angle: angle.variantId,
            emotionalArc: arc?.variantId ?? 'arc-1',
            visualStyle: visOptions[counter % visOptions.length].variantId,
            silenceRatio: silOptions[counter % silOptions.length].variantId,
            copyDirection: copyOptions[counter % copyOptions.length].variantId,
            channel: channel.variantId,
            audienceSegment: audience.variantId,
          },
          channel: channel.description as TestingChannel,
          audienceSegment: audience.description,
          perCellBudgetUSD: perCellBudget,
          exploration:
            `exploratory cell · operator may explore ${angle.description} on ${channel.description} ` +
            `for ${audience.description} — historically associated with observed-strength ${angleSrc.observedStrength}/10 · ` +
            'operator approval required',
          operatorReviewRequired: true,
        });
      }
    }
  }

  const notes: string[] = [];
  notes.push(`testing matrix structure · ${cells.length} exploratory cells across ${angleOptions.length} angle(s) × ${channelOptions.length} channel(s) × ${audienceOptions.length} audience segment(s)`);
  notes.push('operator may explore any subset of cells · the system never auto-selects · Human remains final authority');
  if (perCellBudget === 0) {
    notes.push('per-cell budget is 0 — operator allocates from the campaign testingReserve manually');
  }

  return {
    axes,
    cells,
    totalCells: cells.length,
    notes,
    reasonCodes: [
      `axes:${axes.length}`, `cells:${cells.length}`,
      `angles:${angleOptions.length}`, `channels:${channelOptions.length}`,
      `audiences:${audienceOptions.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
