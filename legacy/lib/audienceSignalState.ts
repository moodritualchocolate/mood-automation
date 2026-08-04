/**
 * AUDIENCE SIGNAL STATE (Phase 28 — Campaign Nervous System / Wave 2)
 *
 * Senses the STATE of the audience signal — its strength, and whether
 * the audience is quietly drifting away from the campaign's emotional
 * territory. A nervous-system reading: "something in the audience is
 * changing."
 */

import type { BannerEngagement } from './engagementMemory';

export interface AudienceSignalStateReading {
  /** 0..10 — how strong the overall audience signal is. */
  signal_strength: number;
  /** 0..10 — how much the audience is drifting from the campaign. */
  audience_drift: number;
  /** True when the signal is too thin to act on. */
  signal_weak: boolean;
  /** 0..10 — how much of the signal is deep (recognition) vs shallow. */
  signal_depth: number;
  notes: string[];
}

export interface AudienceSignalStateInput {
  engagements: BannerEngagement[];
}

export function readAudienceSignalState(input: AudienceSignalStateInput): AudienceSignalStateReading {
  const { engagements } = input;
  const notes: string[] = [];

  if (engagements.length < 2) {
    return {
      signal_strength: 0, audience_drift: 0, signal_weak: true, signal_depth: 0,
      notes: ['audience signal: too thin to read — fewer than two observed banners'],
    };
  }

  let impressions = 0, deep = 0, shallow = 0, negative = 0;
  for (const e of engagements) {
    const t = e.totals;
    impressions += t.impressions;
    deep += t.saves + t.emotionalComments + t.replays;
    shallow += t.clicks + t.comments;
    negative += t.negative;
  }
  impressions = Math.max(1, impressions);

  const signal_strength = round1(Math.min(10, ((deep + shallow) / impressions) * 120));
  const totalActions = deep + shallow;
  const signal_depth = totalActions > 0 ? round1(Math.min(10, (deep / totalActions) * 10)) : 0;
  // Drift rises with negative reactions and with a shallow-dominated signal.
  const audience_drift = round1(Math.min(10, (negative / impressions) * 200 + (signal_depth < 4 ? 3 : 0)));
  const signal_weak = signal_strength < 2;

  notes.push(`audience signal: strength ${signal_strength}/10, depth ${signal_depth}/10, drift ${audience_drift}/10`);
  if (audience_drift >= 6) notes.push('WARNING: the audience is drifting from the campaign');
  return { signal_strength, audience_drift, signal_weak, signal_depth, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
