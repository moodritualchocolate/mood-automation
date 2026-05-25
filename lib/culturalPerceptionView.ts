/**
 * CULTURAL PERCEPTION VIEW (Cultural Intelligence Layer — Foundation)
 *
 * Read-only analyzer. Joins:
 *   - cultural perception memory
 *   - ad strategy memory
 *   - copywriter memory
 *   - copy-quality memory
 *   - policy audit memory
 *
 * Surfaces the longitudinal picture the engine alone can't see:
 *   - trust decay over time
 *   - aesthetic collapse zones (visual patterns near saturation)
 *   - repetitive emotional clusters
 *   - oversaturated hook categories
 *   - platform fatigue ranking (by mode)
 *   - "dying creative patterns" — heavy use + recent decay
 *   - "emerging emotional openings" — emotional drift toward
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  AdStrategyMemoryState,
} from './adStrategyMemory';
import type { CopywriterMemoryState } from './copywriterMemory';
import type { CopyQualityMemoryState } from './copyQualityMemory';
import type { PolicyAuditState } from './copyQualityPolicyAudit';
import type {
  CulturalPerceptionMemoryState, CulturalObservation,
} from './culturalPerceptionMemory';
import {
  computeCulturalPerception, type CulturalPerception,
} from './culturalPerceptionEngine';

// ─── shape ─────────────────────────────────────────────────────

export interface TrustDecayPoint { at: number; score: number }

export interface AestheticCollapseRow {
  patternKey: string;
  freq: number;
  share: number;        // 0..1 of total
  firstSeenAt: number;
  lastSeenAt: number;
}

export interface EmotionalClusterRow {
  patternKey: string;
  freq: number;
  share: number;
}

export interface SaturatedHookRow {
  fingerprint: string;
  freq: number;
}

export interface PlatformFatigueRow {
  mode: string;
  observations: number;
  averageCopyIntegrity: number | null;
  averageTrustSafety: number | null;
  averageRestraint: number;
  aggressiveCtaMarkers: number;
  fatigueScore: number;   // 0..10 composite
}

export interface DyingPatternRow {
  patternKey: string;
  freq: number;
  /** age fraction recent/first — closer to 1 = still active; closer to 0 = decaying. */
  recentActivityRatio: number;
}

export interface CulturalPerceptionLongitudinalView {
  present: boolean;
  statement: string;

  perception: CulturalPerception;

  totalObservations: number;
  totalQualitySamples: number;
  totalStrategyAssessments: number;
  totalCopiesProduced: number;
  totalPolicyAudits: number;

  trustDecayTrend: TrustDecayPoint[];
  aestheticCollapseZones: AestheticCollapseRow[];
  repetitiveEmotionalClusters: EmotionalClusterRow[];
  oversaturatedHookCategories: SaturatedHookRow[];
  platformFatigueRanking: PlatformFatigueRow[];
  dyingCreativePatterns: DyingPatternRow[];
  emergingEmotionalOpenings: string[];
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function avgOrNull(nums: Array<number | null | undefined>): number | null {
  const real = nums.filter((n): n is number => typeof n === 'number');
  if (real.length === 0) return null;
  return round1(real.reduce((a, b) => a + b, 0) / real.length);
}

function totalFreq(table: Record<string, number>): number {
  return Object.values(table).reduce((a, b) => a + b, 0);
}

// ─── derivations ───────────────────────────────────────────────

function trustDecayTrend(mem: CulturalPerceptionMemoryState): TrustDecayPoint[] {
  return mem.trustTrajectory.slice(-24).map((p) => ({ at: p.at, score: round1(p.score) }));
}

function aestheticCollapseZones(mem: CulturalPerceptionMemoryState): AestheticCollapseRow[] {
  const total = totalFreq(mem.visualPatternFrequency);
  if (total === 0) return [];
  return Object.entries(mem.visualPatternFrequency)
    .map(([patternKey, freq]) => ({
      patternKey, freq, share: round2(freq / total),
      firstSeenAt: mem.firstSeenAt[patternKey] ?? 0,
      lastSeenAt: mem.lastSeenAt[patternKey] ?? 0,
    }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 5);
}

function repetitiveEmotionalClusters(mem: CulturalPerceptionMemoryState): EmotionalClusterRow[] {
  const total = totalFreq(mem.emotionalPatternFrequency);
  if (total === 0) return [];
  return Object.entries(mem.emotionalPatternFrequency)
    .map(([patternKey, freq]) => ({ patternKey, freq, share: round2(freq / total) }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 5);
}

function oversaturatedHookCategories(mem: CulturalPerceptionMemoryState): SaturatedHookRow[] {
  return Object.entries(mem.hookFrequency)
    .filter(([, freq]) => freq >= 2)
    .map(([fingerprint, freq]) => ({ fingerprint, freq }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 5);
}

function platformFatigueRanking(
  mem: CulturalPerceptionMemoryState,
): PlatformFatigueRow[] {
  const groups = new Map<string, CulturalObservation[]>();
  for (const o of mem.observations) {
    const k = o.campaignMode ?? 'auto';
    const arr = groups.get(k) ?? [];
    arr.push(o);
    groups.set(k, arr);
  }
  const rows: PlatformFatigueRow[] = [];
  for (const [mode, list] of groups.entries()) {
    const integrity = avgOrNull(list.map((x) => x.copyIntegrity));
    const trust     = avgOrNull(list.map((x) => x.trustSafety));
    const restraint = list.reduce((a, x) => a + x.restraint, 0) / Math.max(1, list.length);
    const aggressive = list.filter((x) =>
      (x.ctaBehavior === 'corner' || x.ctaStyle === 'pill' || x.ctaStyle === 'enclosed') && x.restraint < 0.4
    ).length;
    // Fatigue = volume + low integrity + low restraint. Bounded to 10.
    const volumeFactor = Math.min(10, list.length * 0.5);
    const integrityPenalty = integrity !== null ? Math.max(0, 6 - integrity) : 0;
    const restraintPenalty = Math.max(0, 5 - restraint * 10);
    const fatigue = Math.min(10, volumeFactor * 0.4 + integrityPenalty * 0.4 + restraintPenalty * 0.2);
    rows.push({
      mode,
      observations: list.length,
      averageCopyIntegrity: integrity,
      averageTrustSafety: trust,
      averageRestraint: round2(restraint),
      aggressiveCtaMarkers: aggressive,
      fatigueScore: round1(fatigue),
    });
  }
  return rows.sort((a, b) => b.fatigueScore - a.fatigueScore || b.observations - a.observations);
}

function dyingCreativePatterns(
  mem: CulturalPerceptionMemoryState,
): DyingPatternRow[] {
  const now = mem.updatedAt || Date.now();
  const rows: DyingPatternRow[] = [];
  for (const [key, freq] of Object.entries(mem.visualPatternFrequency)) {
    if (freq < 3) continue;
    const first = mem.firstSeenAt[key] ?? now;
    const last  = mem.lastSeenAt[key] ?? now;
    const lifespan = now - first;
    const recency  = now - last;
    // 0..1 — close to 1 = still active. Close to 0 = decaying.
    const recentActivityRatio = lifespan === 0 ? 1 : Math.max(0, Math.min(1, 1 - (recency / lifespan)));
    if (recentActivityRatio < 0.5) {
      rows.push({ patternKey: key, freq, recentActivityRatio: round2(recentActivityRatio) });
    }
  }
  return rows.sort((a, b) => a.recentActivityRatio - b.recentActivityRatio).slice(0, 5);
}

// ─── main builder ──────────────────────────────────────────────

export interface CulturalPerceptionViewInput {
  cultural: CulturalPerceptionMemoryState | null;
  strategy: AdStrategyMemoryState | null;
  copywriter: CopywriterMemoryState | null;
  quality: CopyQualityMemoryState | null;
  policyAudit: PolicyAuditState | null;
}

export function buildCulturalPerceptionView(
  input: CulturalPerceptionViewInput,
): CulturalPerceptionLongitudinalView {
  const cultural = input.cultural;

  const perception = computeCulturalPerception({
    memory: cultural,
    current: null,
    strategyMemory: input.strategy,
    copywriterMemory: input.copywriter,
    qualityMemory: input.quality,
    policyAudit: input.policyAudit,
  });

  if (!cultural || cultural.totalObservations === 0) {
    return {
      present: false,
      statement: 'cultural perception layer has no observations yet — ship a few banners to populate it',
      perception,
      totalObservations: 0,
      totalQualitySamples: input.quality?.totalSamples ?? 0,
      totalStrategyAssessments: input.strategy?.totalAssessments ?? 0,
      totalCopiesProduced: input.copywriter?.totalCopiesProduced ?? 0,
      totalPolicyAudits: input.policyAudit?.totalEntries ?? 0,
      trustDecayTrend: [],
      aestheticCollapseZones: [],
      repetitiveEmotionalClusters: [],
      oversaturatedHookCategories: [],
      platformFatigueRanking: [],
      dyingCreativePatterns: [],
      emergingEmotionalOpenings: [],
    };
  }

  return {
    present: true,
    statement: perception.culturalState,
    perception,
    totalObservations: cultural.totalObservations,
    totalQualitySamples: input.quality?.totalSamples ?? 0,
    totalStrategyAssessments: input.strategy?.totalAssessments ?? 0,
    totalCopiesProduced: input.copywriter?.totalCopiesProduced ?? 0,
    totalPolicyAudits: input.policyAudit?.totalEntries ?? 0,
    trustDecayTrend: trustDecayTrend(cultural),
    aestheticCollapseZones: aestheticCollapseZones(cultural),
    repetitiveEmotionalClusters: repetitiveEmotionalClusters(cultural),
    oversaturatedHookCategories: oversaturatedHookCategories(cultural),
    platformFatigueRanking: platformFatigueRanking(cultural),
    dyingCreativePatterns: dyingCreativePatterns(cultural),
    emergingEmotionalOpenings: perception.emotionalDrift.movingToward,
  };
}
