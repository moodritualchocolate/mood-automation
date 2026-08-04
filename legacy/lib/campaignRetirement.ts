/**
 * CAMPAIGN RETIREMENT (Phase 40 — Strategic Campaign Lifecycles / Wave 4)
 *
 * Decides when an exhausted creative direction should be RETIRED — let
 * to go dormant rather than run into the ground. Retirement is not
 * failure; it is the executive maturity to stop.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface CampaignRetirementReading {
  /** True when the current direction should be retired into dormancy. */
  should_retire: boolean;
  /** 0..10 — how exhausted the current direction is. */
  exhaustion: number;
  /** The direction (family) recommended for retirement, if any. */
  direction_to_retire: string | null;
  reason: string;
  notes: string[];
}

export interface CampaignRetirementInput {
  trail: EmotionalTraceEntry[];
  /** 0..10 — truth decay (Phase 40). */
  truthDecay: number;
}

export function readCampaignRetirement(input: CampaignRetirementInput): CampaignRetirementReading {
  const { trail, truthDecay } = input;
  const notes: string[] = [];

  const window = trail.slice(0, 12);
  if (window.length < 6) {
    return {
      should_retire: false, exhaustion: 0, direction_to_retire: null,
      reason: 'the campaign is too young for any direction to be retired',
      notes: ['campaign retirement: nothing to retire yet'],
    };
  }

  // Find the most-run family and how exhausted it is.
  const familyCounts: Record<string, number> = {};
  for (const t of window) familyCounts[t.family] = (familyCounts[t.family] ?? 0) + 1;
  let topFamily: string | null = null;
  let topCount = 0;
  for (const [f, c] of Object.entries(familyCounts)) {
    if (c > topCount) { topFamily = f; topCount = c; }
  }

  // Resonance of that family's banners — exhausted = run a lot AND
  // resonance fading.
  const familyBanners = window.filter((t) => t.family === topFamily);
  const avgEngagement = familyBanners.reduce((s, t) => s + (t.engagement ?? 0), 0) / Math.max(1, familyBanners.length);

  let exhaustion = 0;
  if (topCount >= 7) exhaustion += 5;
  else if (topCount >= 5) exhaustion += 3;
  if (avgEngagement < 4) exhaustion += 3;
  if (truthDecay >= 6) exhaustion += 2;
  exhaustion = Math.min(10, round1(exhaustion));

  const should_retire = exhaustion >= 7;
  const direction_to_retire = should_retire ? topFamily : null;
  const reason = should_retire
    ? `the "${topFamily}" direction is exhausted (run ${topCount}× with fading resonance) — retire it into dormancy`
    : 'no direction is exhausted enough to retire';

  notes.push(`campaign retirement: ${reason}`);
  return { should_retire, exhaustion, direction_to_retire, reason, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
