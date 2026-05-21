/**
 * BRAND ATMOSPHERE CONSISTENCY
 *
 * The new success metric from the spec:
 *   "Does every generation feel like it came from the same
 *    intelligent organism?"
 *
 * We measure this across a window of recent shipped banners, scoring
 * three sub-axes:
 *
 *  1) DNA spread — the standard deviation of selected DNA axes across
 *     the window. Goal: MODERATE spread. Zero spread = generic /
 *     template energy. High spread = chaotic. Healthy band: ~0.10–0.22.
 *
 *  2) Voice consistency — recurring lexical signatures in the truth
 *     bank (short observed sentences, contradictions present).
 *
 *  3) Job mix — banners alternate jobs; no single job dominates.
 *
 * The composite is reported as 0..10 — and the FINAL critical detail:
 * "too consistent" gets penalised. The system protects ambiguity by
 * scoring perfect uniformity LOW.
 */

import type { ReferenceDNA } from './referenceDNA';

export interface BannerFootprint {
  bannerId: string;
  dna: ReferenceDNA;
  job: string;
  family: string;
  truth: string;
  tension: string;
}

export interface AtmosphereReport {
  windowSize: number;
  consistency: number;        // 0..10
  uniformityPenalty: number;  // 0..10, subtracted from raw consistency
  dnaSpread: Record<string, number>;     // per-axis std-dev
  voiceConsistency: number;   // 0..10
  jobMix: number;             // 0..10
  notes: string[];
}

const TRACKED_DNA_AXES: Array<keyof ReferenceDNA> = [
  'silence_ratio',
  'tension_map',
  'realism_type',
  'documentary_weight',
  'luxury_restraint',
  'anti_commercial_feel',
  'editorial_level',
  'product_aggression_level',
];

export function analyzeAtmosphere(footprints: BannerFootprint[], minWindow = 4): AtmosphereReport {
  const window = footprints.slice(0, 20);
  const notes: string[] = [];

  if (window.length < minWindow) {
    return {
      windowSize: window.length,
      consistency: 0,
      uniformityPenalty: 0,
      dnaSpread: {},
      voiceConsistency: 0,
      jobMix: 0,
      notes: [`not enough shipped banners yet (${window.length}/${minWindow}) to read atmosphere`],
    };
  }

  // ── 1) DNA spread ──────────────────────────────────────────────
  const dnaSpread: Record<string, number> = {};
  for (const axis of TRACKED_DNA_AXES) {
    const values = window.map((f) => f.dna[axis]);
    dnaSpread[axis] = stddev(values);
  }
  const avgSpread = Object.values(dnaSpread).reduce((a, b) => a + b, 0) / TRACKED_DNA_AXES.length;
  // Score the spread on a band — best around 0.15.
  const spreadScore = bandedScore(avgSpread, 0.10, 0.22);
  if (avgSpread < 0.08) notes.push(`DNA spread very tight (${avgSpread.toFixed(2)}) — banners feel templated`);
  else if (avgSpread > 0.28) notes.push(`DNA spread wide (${avgSpread.toFixed(2)}) — banners feel like different brands`);

  // ── 2) Voice consistency ───────────────────────────────────────
  // Are truths short, observed, with tension phrases? Recurring
  // sentence structure earns voice points.
  const truths = window.map((f) => f.truth);
  const tensionsPresent = window.filter((f) => !!f.tension && f.tension.length > 0).length;
  const shortTruths = truths.filter((t) => t.length > 0 && t.length < 90).length;
  const periodTruths = truths.filter((t) => /[.,;:]/.test(t)).length;
  const voiceConsistency =
    (tensionsPresent / window.length) * 4 +
    (shortTruths / window.length) * 3 +
    (periodTruths / window.length) * 3;
  if (tensionsPresent / window.length < 0.6) notes.push('not enough tension phrases — voice drifting toward unobserved language');

  // ── 3) Job mix ─────────────────────────────────────────────────
  // Best score: 4+ unique jobs out of window; same job back-to-back = penalty.
  const jobs = window.map((f) => f.job);
  const uniqueJobs = new Set(jobs).size;
  let backToBack = 0;
  for (let i = 1; i < jobs.length; i++) {
    if (jobs[i] === jobs[i - 1]) backToBack += 1;
  }
  const jobMix = Math.max(0, Math.min(10, uniqueJobs * 1.8 - backToBack * 2));
  if (backToBack > 0) notes.push(`${backToBack} back-to-back same-job pair(s) — rotation breaking down`);

  // ── Composite + uniformity penalty ─────────────────────────────
  // Raw consistency mixes the three axes.
  const raw = (spreadScore * 0.4) + (voiceConsistency * 0.3) + (jobMix * 0.3);

  // Uniformity penalty — if EVERY axis is very low spread AND every banner
  // had the same family/job mix, the system is over-optimised. Penalise.
  let uniformityPenalty = 0;
  if (avgSpread < 0.07) uniformityPenalty += 2.5;
  if (uniqueJobs <= 2 && window.length >= 5) uniformityPenalty += 2.0;
  const familySet = new Set(window.map((f) => f.family));
  if (familySet.size <= 2 && window.length >= 5) uniformityPenalty += 2.0;
  uniformityPenalty = Math.min(uniformityPenalty, 7);
  if (uniformityPenalty > 4) notes.push('uniformity penalty engaged — campaign is collapsing into one mood');

  const consistency = Math.max(0, Math.min(10, raw - uniformityPenalty));

  return {
    windowSize: window.length,
    consistency,
    uniformityPenalty,
    dnaSpread,
    voiceConsistency,
    jobMix,
    notes,
  };
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Score a value 0..10 based on whether it sits inside a target band.
 * Inside the band: 10. Outside: linearly drops to 0 at 2× outside.
 */
function bandedScore(value: number, lo: number, hi: number): number {
  if (value >= lo && value <= hi) return 10;
  const center = (lo + hi) / 2;
  const halfRange = (hi - lo) / 2;
  const distance = Math.abs(value - center);
  if (distance <= halfRange) return 10;
  const ratio = Math.min(1, (distance - halfRange) / (halfRange * 2));
  return Math.max(0, 10 * (1 - ratio));
}
