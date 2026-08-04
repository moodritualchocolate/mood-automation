/**
 * CULTURAL PERCEPTION ENGINE (Cultural Intelligence Layer — Foundation)
 *
 * Deterministic, memory-backed, read-only perception. Given the
 * accumulated cultural observation stream (+ optional just-shipped
 * banner + cross-memory context), emits a CulturalPerception
 * describing the current creative climate:
 *
 *   - aesthetic fatigue
 *   - emotional saturation
 *   - trust climate
 *   - novelty score
 *   - cultural tension
 *   - audience numbness
 *   - perceived authenticity
 *   - human resonance
 *   - …
 *
 * STRICTLY:
 *   - read-only — does NOT alter verdicts, critic logic, brutality,
 *     refusal, generation, or any persisted state outside its own
 *     memory store
 *   - no external APIs, no model calls
 *   - same memory → same perception
 *
 * Imports: only data types (no critic / pipeline imports).
 */

import type { CampaignMode, Formula } from '@/core/types';
import type {
  CulturalObservation, CulturalPerceptionMemoryState,
} from './culturalPerceptionMemory';
import {
  visualPatternKey, emotionalPatternKey,
} from './culturalPerceptionMemory';
import type { AdStrategyMemoryState } from './adStrategyMemory';
import type { CopywriterMemoryState } from './copywriterMemory';
import type { CopyQualityMemoryState } from './copyQualityMemory';
import type { PolicyAuditState } from './copyQualityPolicyAudit';

// ─── signal taxonomy ───────────────────────────────────────────

export type CulturalSignal =
  | 'trend-rising'
  | 'trend-peaking'
  | 'trend-decaying'
  | 'emotionally-numb'
  | 'over-performed'
  | 'trust-fragile'
  | 'visually-exhausted'
  | 'algorithmically-obvious'
  | 'human-resonant'
  | 'emotionally-fresh'
  | 'aesthetic-burnout'
  | 'high-pattern-density'
  | 'novel-but-unsafe'
  | 'emotionally-understimulated';

// ─── output shape ──────────────────────────────────────────────

export interface CulturalPerception {
  culturalState: string;
  dominantSignals: CulturalSignal[];

  // 0..10 scores — higher = stronger expression of the axis
  noveltyScore: number;
  emotionalFreshness: number;
  trustClimate: number;
  aestheticFatigue: number;
  visualNoiseLevel: number;
  pacingFatigue: number;
  hookSaturation: number;
  conformityRisk: number;
  audienceNumbness: number;
  perceivedAuthenticity: number;
  humanResonance: number;

  culturalWarnings: string[];
  strategicOpportunities: string[];
  forbiddenDirections: string[];

  emotionalDrift: {
    movingToward: string[];
    movingAwayFrom: string[];
  };

  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

/** Optional per-run banner inputs. When all are null/undefined the
 *  engine produces a memory-only perception (no current-frame
 *  novelty boost). */
export interface CurrentFrame {
  formula?: Formula;
  campaignMode?: CampaignMode | null;
  // The just-shipped observation, if present. If supplied the engine
  // measures novelty against memory PRIOR to applying this obs.
  observation?: CulturalObservation;
  // Soft additional inputs — used only to enrich reason codes.
  copyIntegrity?: number | null;
  trustSafety?: number | null;
  dignitySafety?: number | null;
  repetitionConcern?: number | null;
  hebrewNaturalness?: number | null;
  emotionalFrame?: string | null;
  persuasionTone?: string | null;
  ctaRestraint?: number | null;
}

export interface CulturalPerceptionInput {
  memory: CulturalPerceptionMemoryState | null;
  current?: CurrentFrame | null;
  // Optional cross-memory joiners. All optional — the engine never
  // breaks when one is absent.
  strategyMemory?: AdStrategyMemoryState | null;
  copywriterMemory?: CopywriterMemoryState | null;
  qualityMemory?: CopyQualityMemoryState | null;
  policyAudit?: PolicyAuditState | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** Herfindahl-Hirschman concentration: sum of (freq_i / total)^2.
 *  0 ⇔ infinitely diverse · 1 ⇔ one dominant pattern. */
function concentration(freq: Record<string, number>): number {
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const v of Object.values(freq)) {
    const s = v / total;
    h += s * s;
  }
  return h;
}

/** Share of the single most-frequent pattern. 0..1. */
function maxShare(freq: Record<string, number>): number {
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const maxVal = Math.max(...Object.values(freq));
  return maxVal / total;
}

function avgOrNull(nums: Array<number | null | undefined>): number | null {
  const real = nums.filter((n): n is number => typeof n === 'number');
  if (real.length === 0) return null;
  return real.reduce((a, b) => a + b, 0) / real.length;
}

// ─── core derivations ─────────────────────────────────────────

/** Aesthetic fatigue rises with high visual pattern concentration and
 *  large total observation count. Range 0..10. */
function deriveAestheticFatigue(mem: CulturalPerceptionMemoryState): number {
  const total = Object.values(mem.visualPatternFrequency).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const h = concentration(mem.visualPatternFrequency);
  const top = maxShare(mem.visualPatternFrequency);
  // h alone is 0..1, but feels under-scaled. Combine with top share.
  const base = (h * 0.6 + top * 0.4) * 10;
  // Confidence: a couple observations isn't fatigue. Below 4 obs, halve.
  const confidence = total < 4 ? 0.5 : 1;
  return clamp10(base * confidence);
}

function derivePacingFatigue(mem: CulturalPerceptionMemoryState): number {
  return clamp10(concentration(mem.pacingFrequency) * 10);
}

function deriveHookSaturation(mem: CulturalPerceptionMemoryState): number {
  return clamp10(maxShare(mem.hookFrequency) * 10);
}

function deriveAudienceNumbness(mem: CulturalPerceptionMemoryState): number {
  // Same emotional pattern shipping repeatedly → numbness.
  return clamp10(concentration(mem.emotionalPatternFrequency) * 10);
}

function deriveConformityRisk(mem: CulturalPerceptionMemoryState): number {
  // Max share across all visual + emotional + pacing pattern tables.
  const m = Math.max(
    maxShare(mem.visualPatternFrequency),
    maxShare(mem.emotionalPatternFrequency),
    maxShare(mem.pacingFrequency),
  );
  return clamp10(m * 10);
}

function deriveVisualNoiseLevel(mem: CulturalPerceptionMemoryState): number {
  // Distinct visual patterns relative to total — more distinct patterns
  // recently = more visual noise.
  const total = Object.values(mem.visualPatternFrequency).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const distinct = Object.keys(mem.visualPatternFrequency).length;
  return clamp10((distinct / Math.max(1, total)) * 10);
}

function deriveEmotionalFreshness(mem: CulturalPerceptionMemoryState): number {
  // Inverse of recent emotional concentration. Use last 12 observations.
  const recent = mem.emotionalDriftBuckets.slice(-12);
  if (recent.length === 0) return 5;
  const local: Record<string, number> = {};
  for (const p of recent) local[p.family] = (local[p.family] ?? 0) + 1;
  const conc = concentration(local);
  return clamp10((1 - conc) * 10);
}

function deriveTrustClimate(
  mem: CulturalPerceptionMemoryState,
  quality: CopyQualityMemoryState | null | undefined,
  strategy: AdStrategyMemoryState | null | undefined,
): number {
  // Composite: recent trust trajectory + (quality samples' trustSafety)
  // - (strategyMemory.trustDebt). All optional.
  const trajRecent = mem.trustTrajectory.slice(-12);
  const trajAvg = trajRecent.length > 0
    ? trajRecent.reduce((a, p) => a + p.score, 0) / trajRecent.length
    : null;
  const qualityAvg = quality && quality.samples.length > 0
    ? (quality.samples.slice(-12).reduce((a, s) => a + s.trustSafety, 0) /
       Math.max(1, Math.min(12, quality.samples.length)))
    : null;
  const trustDebt = strategy?.trustDebt ?? 0;
  const parts: number[] = [];
  if (trajAvg !== null) parts.push(trajAvg);
  if (qualityAvg !== null) parts.push(qualityAvg);
  const base = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : 5;
  return clamp10(base - trustDebt * 0.4);
}

function deriveNoveltyScore(
  mem: CulturalPerceptionMemoryState,
  current: CurrentFrame | null | undefined,
): number {
  // Memory-only baseline: novelty drifts down as more obs accumulate.
  const total = mem.totalObservations;
  let base: number;
  if (total === 0) base = 10;
  else if (total < 4) base = 8;
  else {
    // Recent novelty at observation time, EWMA-ish.
    const recent = mem.noveltyDecayTrace.slice(-12);
    base = recent.length > 0
      ? recent.reduce((a, p) => a + p.noveltyAtObservation, 0) / recent.length
      : 5;
  }
  // If a current observation is supplied, measure THIS frame's novelty
  // against the visual pattern table — and combine.
  if (current?.observation) {
    const key = visualPatternKey(current.observation);
    const priorFreq = mem.visualPatternFrequency[key] ?? 0;
    const frameNovelty = clamp10(10 - priorFreq * 1.2);
    base = (base + frameNovelty) / 2;
  }
  return clamp10(base);
}

function derivePerceivedAuthenticity(
  mem: CulturalPerceptionMemoryState,
  current: CurrentFrame | null | undefined,
  copywriterMem: CopywriterMemoryState | null | undefined,
): number {
  // Restraint trend (recent) + low aggressive-CTA marker rate + dignity.
  const driftRecent = mem.emotionalDriftBuckets.slice(-12);
  const avgRestraint = driftRecent.length > 0
    ? driftRecent.reduce((a, p) => a + p.restraint, 0) / driftRecent.length
    : 0.55;
  const aggressiveMarkers = mem.resistanceMarkers
    .slice(-20).filter((r) => r.kind === 'aggressive-cta').length;
  const aggressivePenalty = clamp(0, 5, aggressiveMarkers * 0.5);

  let dignity = 5;
  // Average recent dignitySafety from the trust trajectory.
  const dignities = mem.trustTrajectory
    .slice(-12).map((p) => p.dignitySafety).filter((d): d is number => typeof d === 'number');
  if (dignities.length > 0) {
    dignity = dignities.reduce((a, b) => a + b, 0) / dignities.length;
  }
  // Copywriter erosion subtracts.
  const erosion = copywriterMem?.dignityErosionScore ?? 0;

  // Current-frame restraint also matters when present.
  const frameRestraint = current?.observation?.restraint ?? avgRestraint;
  const restraintComponent = ((avgRestraint + frameRestraint) / 2) * 10;

  const composite =
    restraintComponent * 0.4 +
    dignity * 0.4 +
    (10 - erosion) * 0.2 -
    aggressivePenalty;

  return clamp10(composite);
}

function deriveHumanResonance(
  authenticity: number, freshness: number, conformityRisk: number,
  trustClimate: number, audienceNumbness: number,
): number {
  return clamp10(
    authenticity * 0.30 +
    freshness * 0.20 +
    (10 - conformityRisk) * 0.20 +
    trustClimate * 0.20 +
    (10 - audienceNumbness) * 0.10,
  );
}

// ─── trend lifecycle for top pattern ──────────────────────────

function topTrendPattern(mem: CulturalPerceptionMemoryState):
  { key: string; freq: number; firstSeen: number; lastSeen: number } | null
{
  const entries = Object.entries(mem.visualPatternFrequency);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [key, freq] = entries[0];
  return {
    key, freq,
    firstSeen: mem.firstSeenAt[key] ?? 0,
    lastSeen: mem.lastSeenAt[key] ?? 0,
  };
}

function trendLifecycleSignal(
  mem: CulturalPerceptionMemoryState, now: number,
): CulturalSignal | null {
  const top = topTrendPattern(mem);
  if (!top) return null;
  if (top.freq <= 1) return null;
  // Rising: still being used (recent last-seen) and emerging.
  const ageSinceFirst = now - top.firstSeen;
  const ageSinceLast = now - top.lastSeen;
  if (top.freq >= 3 && top.freq <= 5 && ageSinceLast < ageSinceFirst * 0.6) return 'trend-rising';
  if (top.freq >= 6 && ageSinceLast < ageSinceFirst * 0.4) return 'trend-peaking';
  if (top.freq >= 4 && ageSinceLast > ageSinceFirst * 0.6) return 'trend-decaying';
  return null;
}

// ─── emotional drift directional reading ──────────────────────

function emotionalDriftDirections(
  mem: CulturalPerceptionMemoryState,
): { toward: string[]; awayFrom: string[] } {
  const drifts = mem.emotionalDriftBuckets;
  if (drifts.length < 4) return { toward: [], awayFrom: [] };
  const half = Math.floor(drifts.length / 2);
  const early = drifts.slice(0, half);
  const recent = drifts.slice(half);
  const earlyFreq: Record<string, number> = {};
  const recentFreq: Record<string, number> = {};
  for (const p of early) earlyFreq[p.family] = (earlyFreq[p.family] ?? 0) + 1;
  for (const p of recent) recentFreq[p.family] = (recentFreq[p.family] ?? 0) + 1;
  const families = new Set([...Object.keys(earlyFreq), ...Object.keys(recentFreq)]);
  const toward: Array<[string, number]> = [];
  const awayFrom: Array<[string, number]> = [];
  for (const f of families) {
    const earlyShare = (earlyFreq[f] ?? 0) / Math.max(1, early.length);
    const recentShare = (recentFreq[f] ?? 0) / Math.max(1, recent.length);
    const delta = recentShare - earlyShare;
    if (delta > 0.1) toward.push([f, delta]);
    if (delta < -0.1) awayFrom.push([f, delta]);
  }
  toward.sort((a, b) => b[1] - a[1]);
  awayFrom.sort((a, b) => a[1] - b[1]);
  return {
    toward: toward.slice(0, 3).map(([f]) => f),
    awayFrom: awayFrom.slice(0, 3).map(([f]) => f),
  };
}

// ─── signal selection ─────────────────────────────────────────

interface ScoredSignal { signal: CulturalSignal; priority: number; reason: string }

function selectSignals(args: {
  mem: CulturalPerceptionMemoryState,
  noveltyScore: number,
  emotionalFreshness: number,
  trustClimate: number,
  aestheticFatigue: number,
  pacingFatigue: number,
  hookSaturation: number,
  conformityRisk: number,
  audienceNumbness: number,
  perceivedAuthenticity: number,
  humanResonance: number,
  visualNoiseLevel: number,
  trendLifecycle: CulturalSignal | null,
}): CulturalSignal[] {
  const out: ScoredSignal[] = [];
  const {
    mem, noveltyScore, emotionalFreshness, trustClimate, aestheticFatigue,
    pacingFatigue, hookSaturation, conformityRisk, audienceNumbness,
    perceivedAuthenticity, humanResonance, visualNoiseLevel, trendLifecycle,
  } = args;

  if (trendLifecycle) out.push({ signal: trendLifecycle, priority: 95, reason: 'top-trend-lifecycle' });

  if (audienceNumbness >= 6) out.push({ signal: 'emotionally-numb', priority: 90, reason: `numbness ${audienceNumbness.toFixed(1)}` });
  if (aestheticFatigue >= 7) out.push({ signal: 'aesthetic-burnout', priority: 88, reason: `aestheticFatigue ${aestheticFatigue.toFixed(1)}` });
  if (aestheticFatigue >= 5) out.push({ signal: 'visually-exhausted', priority: 86, reason: `aestheticFatigue ${aestheticFatigue.toFixed(1)}` });

  if (conformityRisk >= 7) out.push({ signal: 'over-performed', priority: 82, reason: `conformityRisk ${conformityRisk.toFixed(1)}` });
  if (conformityRisk >= 6 && visualNoiseLevel < 4) out.push({ signal: 'high-pattern-density', priority: 78, reason: 'concentration + low diversity' });

  if (trustClimate <= 4) out.push({ signal: 'trust-fragile', priority: 80, reason: `trustClimate ${trustClimate.toFixed(1)}` });

  if (mem.resistanceMarkers.filter((r) => r.kind === 'aggressive-cta').length >= 3) {
    out.push({ signal: 'algorithmically-obvious', priority: 76, reason: 'aggressive-cta markers ≥3' });
  }

  if (noveltyScore >= 6 && trustClimate < 5) {
    out.push({ signal: 'novel-but-unsafe', priority: 70, reason: 'high novelty + low trust' });
  }

  if (emotionalFreshness >= 7 && pacingFatigue < 6) {
    out.push({ signal: 'emotionally-fresh', priority: 60, reason: `emotionalFreshness ${emotionalFreshness.toFixed(1)}` });
  }
  if (humanResonance >= 7 && perceivedAuthenticity >= 7) {
    out.push({ signal: 'human-resonant', priority: 55, reason: `resonance ${humanResonance.toFixed(1)}` });
  }
  if (mem.totalObservations >= 4 && noveltyScore <= 3 && hookSaturation >= 6) {
    out.push({ signal: 'emotionally-understimulated', priority: 50, reason: 'low novelty + saturated hooks' });
  }

  // Dedupe + order.
  const seen = new Set<CulturalSignal>();
  return out
    .sort((a, b) => b.priority - a.priority)
    .filter((s) => { if (seen.has(s.signal)) return false; seen.add(s.signal); return true; })
    .slice(0, 6)
    .map((s) => s.signal);
}

// ─── opportunities / warnings / forbidden ─────────────────────

function buildAdvisories(args: {
  signals: CulturalSignal[],
  mem: CulturalPerceptionMemoryState,
  aestheticFatigue: number,
  audienceNumbness: number,
  trustClimate: number,
  conformityRisk: number,
  emotionalFreshness: number,
  noveltyScore: number,
  perceivedAuthenticity: number,
  hookSaturation: number,
  drift: { toward: string[], awayFrom: string[] },
}): { warnings: string[]; opportunities: string[]; forbidden: string[] } {
  const warnings: string[] = [];
  const opportunities: string[] = [];
  const forbidden: string[] = [];

  if (args.aestheticFatigue >= 7) warnings.push(`aesthetic fatigue is high (${args.aestheticFatigue.toFixed(1)}/10) — visual vocabulary is saturating`);
  if (args.audienceNumbness >= 6) warnings.push(`emotional vocabulary is repeating — numbness ${args.audienceNumbness.toFixed(1)}/10`);
  if (args.trustClimate <= 4) warnings.push(`trust climate is fragile (${args.trustClimate.toFixed(1)}/10)`);
  if (args.conformityRisk >= 7) warnings.push(`creative output is concentrating around one pattern — conformity risk ${args.conformityRisk.toFixed(1)}/10`);
  if (args.hookSaturation >= 7) warnings.push(`hook structures repeating — saturation ${args.hookSaturation.toFixed(1)}/10`);
  if (args.mem.resistanceMarkers.filter((r) => r.kind === 'aggressive-cta').length >= 3) {
    warnings.push(`aggressive CTA pattern recurring — audience resistance building`);
  }

  if (args.emotionalFreshness >= 7) opportunities.push(`emotional vocabulary is diverse — current freshness ${args.emotionalFreshness.toFixed(1)}/10`);
  if (args.noveltyScore >= 7 && args.trustClimate >= 6) {
    opportunities.push(`novel territory under trust — lean into less-used patterns`);
  }
  if (args.perceivedAuthenticity >= 7 && args.conformityRisk <= 4) {
    opportunities.push(`restraint + diversity reading authentic — sustain it`);
  }
  for (const f of args.drift.toward) {
    opportunities.push(`emotional drift moving toward "${f}" — emerging emotional opening`);
  }

  // Forbidden directions — exhaustively-observed visual patterns.
  const visualEntries = Object.entries(args.mem.visualPatternFrequency)
    .sort((a, b) => b[1] - a[1]);
  for (const [key, freq] of visualEntries.slice(0, 2)) {
    if (freq >= 6) forbidden.push(`avoid further repetition of pattern "${key}" (×${freq})`);
  }
  if (args.signals.includes('aesthetic-burnout')) {
    forbidden.push('avoid "soft documentary realism" pattern reinforcement until fatigue cools');
  }
  if (args.signals.includes('algorithmically-obvious')) {
    forbidden.push('avoid aggressive CTA framings — subconscious resistance is building');
  }
  for (const f of args.drift.awayFrom) {
    forbidden.push(`audience moving away from "${f}" emotional family`);
  }

  return { warnings, opportunities, forbidden };
}

// ─── cultural state phrase ────────────────────────────────────

function describeCulturalState(args: {
  signals: CulturalSignal[],
  aestheticFatigue: number, audienceNumbness: number, trustClimate: number,
  emotionalFreshness: number, humanResonance: number, totalObs: number,
}): string {
  if (args.totalObs === 0) return 'no cultural observations yet — the perception layer has nothing to read';
  if (args.totalObs < 4) return `establishing baseline — ${args.totalObs} observation(s) recorded`;

  const top = args.signals[0];
  switch (top) {
    case 'aesthetic-burnout':       return 'aesthetic vocabulary burning out — visual repetition fatiguing the field';
    case 'visually-exhausted':      return 'visual field tiring — pattern density rising faster than novelty';
    case 'emotionally-numb':        return 'emotional vocabulary numbing — same families recurring';
    case 'over-performed':          return 'creative output concentrating — conformity risk rising';
    case 'trust-fragile':           return `trust climate fragile (${args.trustClimate.toFixed(1)}/10) — audience belief eroding`;
    case 'algorithmically-obvious': return 'creative pattern reading as algorithmic — subconscious resistance building';
    case 'novel-but-unsafe':        return 'novelty present but trust thin — audience may detect the experiment';
    case 'emotionally-fresh':       return 'emotional vocabulary breathing — diversity is sustaining attention';
    case 'human-resonant':          return 'output reading human — restraint and dignity holding';
    case 'high-pattern-density':    return 'output dense and concentrated — diversity is the missing axis';
    case 'emotionally-understimulated': return 'audience under-stimulated — hook variety stalled';
    case 'trend-rising':            return 'one creative pattern rising — early-window emergence';
    case 'trend-peaking':           return 'one creative pattern peaking — usage saturating the recent window';
    case 'trend-decaying':          return 'one creative pattern decaying — usage fading from the recent window';
    default:                        return `cultural climate steady — resonance ${args.humanResonance.toFixed(1)}/10, freshness ${args.emotionalFreshness.toFixed(1)}/10`;
  }
}

// ─── main ──────────────────────────────────────────────────────

export function computeCulturalPerception(
  input: CulturalPerceptionInput,
): CulturalPerception {
  const mem = input.memory ?? {
    observations: [], visualPatternFrequency: {}, emotionalPatternFrequency: {},
    pacingFrequency: {}, hookFrequency: {}, ctaFrequency: {}, toneFrequency: {},
    firstSeenAt: {}, lastSeenAt: {}, trustTrajectory: [], noveltyDecayTrace: [],
    emotionalDriftBuckets: [], resistanceMarkers: [], totalObservations: 0,
    firstUpdatedAt: null, updatedAt: 0,
  } as CulturalPerceptionMemoryState;
  const current = input.current ?? null;
  const now = mem.updatedAt || Date.now();

  // ── derive scores ──────────────────────────────────────────
  const aestheticFatigue   = round1(deriveAestheticFatigue(mem));
  const pacingFatigue      = round1(derivePacingFatigue(mem));
  const hookSaturation     = round1(deriveHookSaturation(mem));
  const audienceNumbness   = round1(deriveAudienceNumbness(mem));
  const conformityRisk     = round1(deriveConformityRisk(mem));
  const visualNoiseLevel   = round1(deriveVisualNoiseLevel(mem));
  const emotionalFreshness = round1(deriveEmotionalFreshness(mem));
  const trustClimate       = round1(deriveTrustClimate(mem, input.qualityMemory, input.strategyMemory));
  const noveltyScore       = round1(deriveNoveltyScore(mem, current));
  const perceivedAuthenticity = round1(derivePerceivedAuthenticity(mem, current, input.copywriterMemory));
  const humanResonance     = round1(deriveHumanResonance(
    perceivedAuthenticity, emotionalFreshness, conformityRisk, trustClimate, audienceNumbness,
  ));

  // ── trend lifecycle + signal selection ─────────────────────
  const trendLifecycle = trendLifecycleSignal(mem, now);
  const drift = emotionalDriftDirections(mem);

  const dominantSignals = selectSignals({
    mem,
    noveltyScore, emotionalFreshness, trustClimate, aestheticFatigue,
    pacingFatigue, hookSaturation, conformityRisk, audienceNumbness,
    perceivedAuthenticity, humanResonance, visualNoiseLevel, trendLifecycle,
  });

  const advisories = buildAdvisories({
    signals: dominantSignals, mem,
    aestheticFatigue, audienceNumbness, trustClimate, conformityRisk,
    emotionalFreshness, noveltyScore, perceivedAuthenticity, hookSaturation,
    drift,
  });

  // ── reason codes — audit trail for the math ─────────────────
  const reasonCodes: string[] = [
    `obs:${mem.totalObservations}`,
    `visual-patterns:${Object.keys(mem.visualPatternFrequency).length}`,
    `emotional-patterns:${Object.keys(mem.emotionalPatternFrequency).length}`,
    `aesthetic-fatigue:${aestheticFatigue}`,
    `freshness:${emotionalFreshness}`,
    `trust-climate:${trustClimate}`,
    `conformity-risk:${conformityRisk}`,
    `human-resonance:${humanResonance}`,
  ];
  if (trendLifecycle) reasonCodes.push(`lifecycle:${trendLifecycle}`);
  if (current?.observation) {
    reasonCodes.push(`current-visual:${visualPatternKey(current.observation)}`);
    reasonCodes.push(`current-emotional:${emotionalPatternKey(current.observation)}`);
  }
  if (input.strategyMemory) reasonCodes.push(`trustDebt:${input.strategyMemory.trustDebt}`);
  if (input.qualityMemory) reasonCodes.push(`quality-samples:${input.qualityMemory.totalSamples}`);
  if (input.policyAudit) reasonCodes.push(`policy-entries:${input.policyAudit.totalEntries}`);
  if (input.copywriterMemory) reasonCodes.push(`erosion:${input.copywriterMemory.dignityErosionScore.toFixed(1)}`);

  return {
    culturalState: describeCulturalState({
      signals: dominantSignals,
      aestheticFatigue, audienceNumbness, trustClimate,
      emotionalFreshness, humanResonance, totalObs: mem.totalObservations,
    }),
    dominantSignals,
    noveltyScore, emotionalFreshness, trustClimate, aestheticFatigue,
    visualNoiseLevel, pacingFatigue, hookSaturation, conformityRisk,
    audienceNumbness, perceivedAuthenticity, humanResonance,
    culturalWarnings: advisories.warnings,
    strategicOpportunities: advisories.opportunities,
    forbiddenDirections: advisories.forbidden,
    emotionalDrift: { movingToward: drift.toward, movingAwayFrom: drift.awayFrom },
    reasonCodes,
  };
}

// ─── re-exports the route may consume ─────────────────────────

export type { CulturalObservation };
export { visualPatternKey, emotionalPatternKey };
