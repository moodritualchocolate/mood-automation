/**
 * SILENT ENGAGEMENT SIGNALS (Phase 32 — Audience Reality Feedback / Wave 2)
 *
 * The most meaningful audience response is often SILENT — a high
 * save rate with almost no comments, a quiet rewatch, a screenshot.
 * The viewer recognised something and kept it without performing a
 * reaction. This module reads that silence.
 */

import type { BannerEngagement } from './engagementMemory';

export interface SilentEngagementReading {
  /** 0..10 — strength of silent (non-performative) engagement. */
  silent_engagement: number;
  /** 0..10 — strength of loud (performative) engagement. */
  loud_engagement: number;
  /** True when the banner shows the high-save / low-comment pattern. */
  quiet_recognition_pattern: boolean;
  notes: string[];
}

export interface SilentEngagementInput {
  engagements: BannerEngagement[];
}

export function readSilentEngagementSignals(input: SilentEngagementInput): SilentEngagementReading {
  const { engagements } = input;
  const notes: string[] = [];

  if (engagements.length === 0) {
    return {
      silent_engagement: 0, loud_engagement: 0, quiet_recognition_pattern: false,
      notes: ['silent engagement: no engagement records yet'],
    };
  }

  let impressions = 0, saves = 0, replays = 0, comments = 0, shares = 0, clicks = 0;
  for (const e of engagements) {
    impressions += e.totals.impressions;
    saves += e.totals.saves;
    replays += e.totals.replays;
    comments += e.totals.comments;
    shares += e.totals.shares;
    clicks += e.totals.clicks;
  }
  impressions = Math.max(1, impressions);

  // Silent = saves + replays (kept, returned to). Loud = comments +
  // shares + clicks (performed outward).
  const silent_engagement = round1(Math.min(10, ((saves + replays) / impressions) * 160));
  const loud_engagement = round1(Math.min(10, ((comments + shares + clicks) / impressions) * 120));

  // The quiet-recognition pattern: saves clearly outpace comments.
  const quiet_recognition_pattern = saves >= 3 && saves > comments * 2;

  notes.push(`silent engagement: silent ${silent_engagement}/10 vs loud ${loud_engagement}/10`);
  if (quiet_recognition_pattern) notes.push('silent engagement: the high-save / low-comment pattern — quiet recognition, the audience kept it');

  return { silent_engagement, loud_engagement, quiet_recognition_pattern, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
