/**
 * CAMPAIGN SATURATION (Phase 28 — Campaign Nervous System / Wave 2)
 *
 * Detects when the campaign has SATURATED — when its motifs, its
 * emotional territories, and its truths have been shown often enough
 * that the audience has begun to habituate.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface CampaignSaturationReading {
  /** 0..10 — overall saturation risk. */
  saturation_risk: number;
  /** Motifs / families that have been overused. */
  motif_overuse: string[];
  /** True when the campaign keeps re-opening one emotional territory. */
  repeated_territory: boolean;
  /** The most overexposed territory, if any. */
  overexposed_territory: string | null;
  notes: string[];
}

export interface CampaignSaturationInput {
  trail: EmotionalTraceEntry[];
}

export function readCampaignSaturation(input: CampaignSaturationInput): CampaignSaturationReading {
  const { trail } = input;
  const notes: string[] = [];

  const window = trail.slice(0, 12);
  if (window.length < 4) {
    return {
      saturation_risk: 0, motif_overuse: [], repeated_territory: false,
      overexposed_territory: null,
      notes: ['campaign saturation: history too short to saturate'],
    };
  }

  const familyCounts: Record<string, number> = {};
  const truthWordCounts: Record<string, number> = {};
  for (const t of window) {
    familyCounts[t.family] = (familyCounts[t.family] ?? 0) + 1;
    for (const w of t.truth.toLowerCase().split(/\s+/).filter((x) => x.length >= 6)) {
      truthWordCounts[w] = (truthWordCounts[w] ?? 0) + 1;
    }
  }

  let overexposed_territory: string | null = null;
  let maxFamily = 0;
  for (const [f, c] of Object.entries(familyCounts)) {
    if (c > maxFamily) { maxFamily = c; overexposed_territory = f; }
  }
  const repeated_territory = maxFamily >= Math.max(4, window.length * 0.5);

  const motif_overuse = Object.entries(truthWordCounts)
    .filter(([, c]) => c >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([w]) => w);

  let saturation_risk = 0;
  if (repeated_territory) saturation_risk += 5;
  saturation_risk += Math.min(4, motif_overuse.length * 1.3);
  if (maxFamily >= window.length * 0.7) saturation_risk += 1;
  saturation_risk = Math.min(10, round1(saturation_risk));

  if (repeated_territory) notes.push(`campaign saturation: "${overexposed_territory}" re-opened ${maxFamily}× in the recent window`);
  if (motif_overuse.length) notes.push(`overused motifs: ${motif_overuse.join(', ')}`);
  if (saturation_risk < 3) notes.push('campaign saturation: low — the campaign is still varied');

  return { saturation_risk, motif_overuse, repeated_territory, overexposed_territory, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
