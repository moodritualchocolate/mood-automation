/**
 * PERFORMANCE PULSE (Phase 28 — Campaign Nervous System / Wave 2)
 *
 * Reads the campaign's real engagement records as a NERVOUS-SYSTEM
 * signal, not as analytics. The pulse answers one question: is the
 * campaign's resonance rising, steady, declining, flat, or cold?
 */

import type { BannerEngagement } from './engagementMemory';

export type CampaignPulse = 'spike' | 'steady' | 'declining' | 'flat' | 'cold';

export interface PerformancePulseReading {
  pulse: CampaignPulse;
  /** 0..10 — recent resonance, weighted toward deep signals. */
  recent_resonance: number;
  /** Count of banners that produced a resonance spike. */
  spike_count: number;
  /** True when resonance has fallen across the recent window. */
  declining: boolean;
  notes: string[];
}

function resonanceOf(e: BannerEngagement): number {
  const t = e.totals;
  if (t.impressions < 1) return 0;
  // Deep signals (saves, emotional comments, replays) weigh far more
  // than shallow ones (clicks, raw comments).
  const deep = t.saves * 3 + t.emotionalComments * 4 + t.replays * 2 + t.shares * 1.5;
  const shallow = t.clicks * 0.3 + t.comments * 0.5;
  const score = (deep + shallow) / Math.max(1, t.impressions) * 100;
  return Math.min(10, score);
}

export interface PerformancePulseInput {
  engagements: BannerEngagement[];
}

export function readPerformancePulse(input: PerformancePulseInput): PerformancePulseReading {
  const { engagements } = input;
  const notes: string[] = [];

  if (engagements.length === 0) {
    return {
      pulse: 'cold', recent_resonance: 0, spike_count: 0, declining: false,
      notes: ['performance pulse: no engagement records — the campaign has not been observed yet'],
    };
  }

  const sorted = [...engagements].sort((a, b) => b.lastSignalAt - a.lastSignalAt);
  const recent = sorted.slice(0, 6);
  const resonances = recent.map(resonanceOf);
  const recent_resonance = round1(resonances.reduce((a, b) => a + b, 0) / resonances.length);
  const spike_count = resonances.filter((r) => r >= 6).length;

  // Declining when the newer half scores below the older half.
  const mid = Math.floor(resonances.length / 2);
  const newer = resonances.slice(0, mid);
  const older = resonances.slice(mid);
  const newerAvg = newer.length ? newer.reduce((a, b) => a + b, 0) / newer.length : 0;
  const olderAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : 0;
  const declining = recent.length >= 4 && newerAvg < olderAvg - 1.5;

  let pulse: CampaignPulse;
  if (spike_count >= 2) pulse = 'spike';
  else if (declining) pulse = 'declining';
  else if (recent_resonance >= 4) pulse = 'steady';
  else if (recent_resonance >= 1.5) pulse = 'flat';
  else pulse = 'cold';

  notes.push(`performance pulse: ${pulse} — recent resonance ${recent_resonance}/10, ${spike_count} spike(s)`);
  return { pulse, recent_resonance, spike_count, declining, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
