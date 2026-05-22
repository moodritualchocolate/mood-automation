/**
 * SAVE / SHARE MEANING (Phase 32 — Audience Reality Feedback / Wave 2)
 *
 * A save and a share are not the same human act. A SAVE means "I want
 * to return to this" — emotional return. A SHARE means "this says
 * something about me / for me" — but a share can be trend-driven.
 * This module reads what the saves and shares actually mean.
 */

import type { BannerEngagement } from './engagementMemory';

export interface SaveShareMeaningReading {
  /** 0..10 — how much the saves indicate genuine emotional return. */
  save_meaning: number;
  /** 0..10 — how much the shares indicate recognition (vs trend). */
  share_meaning: number;
  /** True when shares look trend-driven rather than recognition-driven. */
  shares_are_trend_driven: boolean;
  notes: string[];
}

export interface SaveShareMeaningInput {
  engagements: BannerEngagement[];
}

export function readSaveShareMeaning(input: SaveShareMeaningInput): SaveShareMeaningReading {
  const { engagements } = input;
  const notes: string[] = [];

  let impressions = 0, saves = 0, shares = 0, replays = 0, emotionalComments = 0, comments = 0;
  for (const e of engagements) {
    impressions += e.totals.impressions;
    saves += e.totals.saves;
    shares += e.totals.shares;
    replays += e.totals.replays;
    emotionalComments += e.totals.emotionalComments;
    comments += e.totals.comments;
  }
  impressions = Math.max(1, impressions);

  if (saves + shares === 0) {
    return {
      save_meaning: 0, share_meaning: 0, shares_are_trend_driven: false,
      notes: ['save/share meaning: no saves or shares recorded'],
    };
  }

  // A save means more when it is accompanied by replays (the viewer
  // genuinely returns) — emotional return, not bookmark-and-forget.
  const saveRate = saves / impressions;
  const replayBacking = saves > 0 ? Math.min(1, replays / saves) : 0;
  const save_meaning = round1(Math.min(10, saveRate * 120 + replayBacking * 3));

  // A share means more when emotional comments back it. A share with
  // no emotional comment backing reads trend-driven.
  const shareRate = shares / impressions;
  const emotionalBacking = shares > 0 ? Math.min(1, emotionalComments / shares) : 0;
  const share_meaning = round1(Math.min(10, shareRate * 90 + emotionalBacking * 4));
  const shares_are_trend_driven = shares >= 3 && emotionalBacking < 0.15 && emotionalComments < comments * 0.2;

  notes.push(`save/share meaning: save ${save_meaning}/10 (emotional return), share ${share_meaning}/10`);
  if (shares_are_trend_driven) notes.push('save/share meaning: shares look trend-driven — shared without recognition backing');

  return { save_meaning, share_meaning, shares_are_trend_driven, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
