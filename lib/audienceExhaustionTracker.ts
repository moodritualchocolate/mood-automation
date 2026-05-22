/**
 * AUDIENCE EXHAUSTION TRACKER (Phase 37 — Cognitive Energy Management / Wave 4)
 *
 * Tracks the audience's exhaustion — numbness, dopamine fatigue, the
 * declining response to repeated emotional pressure. An audience can
 * be over-fed by a brand it still loves.
 */

import type { BannerEngagement } from './engagementMemory';

export interface AudienceExhaustionReading {
  /** 0..10 — how exhausted the audience is by the campaign. */
  audience_fatigue: number;
  /** True when the audience is going numb to the campaign's pressure. */
  audience_numbness: boolean;
  /** True when repeated emotional pressure is producing dopamine fatigue. */
  dopamine_fatigue: boolean;
  notes: string[];
}

export interface AudienceExhaustionInput {
  engagements: BannerEngagement[];
}

function resonance(e: BannerEngagement): number {
  const t = e.totals;
  if (t.impressions < 1) return 0;
  return Math.min(10, ((t.saves * 3 + t.emotionalComments * 4 + t.replays * 2) / t.impressions) * 100);
}

export function readAudienceExhaustion(input: AudienceExhaustionInput): AudienceExhaustionReading {
  const { engagements } = input;
  const notes: string[] = [];

  if (engagements.length < 4) {
    return {
      audience_fatigue: 0, audience_numbness: false, dopamine_fatigue: false,
      notes: ['audience exhaustion: too few observed banners to read fatigue'],
    };
  }

  const sorted = [...engagements].sort((a, b) => b.lastSignalAt - a.lastSignalAt);
  const recent = sorted.slice(0, 8);
  const res = recent.map(resonance);

  // Numbness — resonance trending down across the window.
  const mid = Math.floor(res.length / 2);
  const newer = res.slice(0, mid);
  const older = res.slice(mid);
  const newerAvg = newer.reduce((a, b) => a + b, 0) / Math.max(1, newer.length);
  const olderAvg = older.reduce((a, b) => a + b, 0) / Math.max(1, older.length);
  const audience_numbness = newerAvg < olderAvg - 2;

  // Dopamine fatigue — each banner producing less than the last,
  // consistently, across the recent window.
  let declines = 0;
  for (let i = 1; i < res.length; i++) if (res[i] < res[i - 1]) declines += 1;
  const dopamine_fatigue = res.length >= 4 && declines >= res.length - 2;

  let audience_fatigue = 0;
  if (audience_numbness) audience_fatigue += 5;
  if (dopamine_fatigue) audience_fatigue += 3;
  if (newerAvg < 3) audience_fatigue += 2;
  audience_fatigue = clamp10(round1(audience_fatigue));

  notes.push(`audience exhaustion: fatigue ${audience_fatigue}/10 (resonance ${round1(olderAvg)} → ${round1(newerAvg)})`);
  if (audience_numbness) notes.push('audience exhaustion: the audience is going numb to the campaign');
  if (dopamine_fatigue) notes.push('audience exhaustion: dopamine fatigue — each banner lands softer than the last');

  return { audience_fatigue, audience_numbness, dopamine_fatigue, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
