/**
 * COLLECTIVE REALITY TRACKING (Phase 25)
 *
 * The system's continuous read on whether the campaign is still
 * SYNCHRONISED with reality. It cross-checks the campaign's recent
 * emotional output against the ingested reality signals — if the
 * campaign is saying things reality is no longer saying, the
 * campaign has drifted into self-reference.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { IngestedSignal } from './realityIngestion';

export interface CollectiveRealityTrackingReading {
  /** 0..10 — how well the campaign is synchronised with ingested reality. */
  reality_sync: number;
  /** True when the campaign has drifted into self-reference. */
  campaign_self_referential: boolean;
  /** Count of campaign truths echoed by at least one ingested signal. */
  echoed_count: number;
  notes: string[];
}

export interface CollectiveRealityTrackingInput {
  recentTrail: EmotionalTraceEntry[];
  ingestedSignals: IngestedSignal[];
}

function tokens(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z֐-׿]+/).filter((w) => w.length >= 4));
}

export function readCollectiveRealityTracking(input: CollectiveRealityTrackingInput): CollectiveRealityTrackingReading {
  const { recentTrail, ingestedSignals } = input;
  const notes: string[] = [];

  if (recentTrail.length < 3 || ingestedSignals.length < 5) {
    notes.push('collective reality tracking: insufficient data to assess sync');
    return { reality_sync: 5, campaign_self_referential: false, echoed_count: 0, notes };
  }

  const signalTokenSets = ingestedSignals.map((s) => tokens(s.text));
  let echoed_count = 0;
  for (const t of recentTrail.slice(0, 15)) {
    const truthTokens = tokens(`${t.truth} ${t.tension}`);
    const echoed = signalTokenSets.some((sig) => {
      let overlap = 0;
      for (const w of truthTokens) if (sig.has(w)) overlap += 1;
      return overlap >= 2;
    });
    if (echoed) echoed_count += 1;
  }

  const sampleSize = Math.min(15, recentTrail.length);
  const reality_sync = Math.round((echoed_count / sampleSize) * 10);
  const campaign_self_referential = reality_sync < 3;

  notes.push(`collective reality tracking: sync ${reality_sync}/10 (${echoed_count}/${sampleSize} truths echoed by reality)`);
  if (campaign_self_referential) notes.push('WARNING: campaign has drifted into self-reference — saying things reality is no longer saying');

  return { reality_sync, campaign_self_referential, echoed_count, notes };
}
