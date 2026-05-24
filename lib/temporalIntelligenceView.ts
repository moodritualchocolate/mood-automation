/**
 * TEMPORAL INTELLIGENCE VIEW (Wave 30)
 *
 * Derives currentTemporalAssessment from temporal memory + current
 * state. Pure functions — no randomness, no LLM pattern invention.
 * Every metric and every "detected pattern" comes from real data in
 * the history arrays.
 *
 * Also exports buildTemporalIntelligenceView for the dashboard, and
 * suggestDeferReason for the defer evolve function (so refused
 * cognitive thoughts and the dashboard agree on why waiting is wise).
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  TemporalMemoryState,
  CadenceObservation,
  ApprovalObservation,
  FragmentationObservation,
  RecoveryObservation,
} from './temporalMemory';

export type DeferRecommendation = 'now' | 'soon' | 'not-yet' | 'not-needed';

export interface TemporalAssessment {
  /** 0..10 — how healthy the cognition rhythm is.
   *  High = comfortable spacing. Low = bursts or starvation. */
  cadenceHealth: number;
  /** 0..10 — average effectiveness of recent rest events.
   *  10 = max possible recovery achieved per rest. */
  recoveryEfficiency: number;
  /** 0..10 — recent fragmentation tendency.
   *  Higher = more refusal cycles, more breakage. */
  fragmentationRisk: number;
  /** 0..10 — approval stability over recent events.
   *  10 = consistent outcomes. Drops with variance. */
  approvalStability: number;
  /** 0..10 — directives per uptime tick recently.
   *  High = the runtime is being driven hard. */
  cognitionDensity: number;
  /** Defer recommendation based on metrics. */
  deferRecommendation: DeferRecommendation;
  /** 0..10 — composite measure of the organism's earned patience. */
  strategicPatienceScore: number;
}

export interface TemporalIntelligenceViewModel {
  present: boolean;
  assessment: TemporalAssessment;
  observationCounts: {
    cadence: number;
    recovery: number;
    approval: number;
    fragmentation: number;
    defer: number;
  };
  totalDefers: number;
  /** Plain-English descriptions of patterns detected in the histories.
   *  Each one references real numbers from the underlying data — no
   *  fabricated narratives. */
  detectedPatterns: string[];
  statement: string;
}

// ─── individual metric derivations ─────────────────────────────

function cadenceHealth(history: CadenceObservation[]): number {
  if (history.length < 3) return 7;  // not enough data — assume mid-healthy
  const recent = history.slice(-10).filter((h) => h.interActMs != null);
  if (recent.length === 0) return 7;
  const meanMs = recent.reduce((a, b) => a + (b.interActMs ?? 0), 0) / recent.length;
  // Bands: < 1s rapid (2), < 5s brisk (6), 5-30s healthy (9), 30-120s slow (7), > 2min sparse (5).
  if (meanMs < 1000) return 2;
  if (meanMs < 5000) return 6;
  if (meanMs <= 30000) return 9;
  if (meanMs <= 120000) return 7;
  return 5;
}

function recoveryEfficiency(history: RecoveryObservation[]): number {
  if (history.length === 0) return 5;  // no data — neutral
  const recent = history.slice(-8);
  const mean = recent.reduce((a, b) => a + b.effectiveness, 0) / recent.length;
  // effectiveness is 0..1; map to 0..10.
  return Math.round(Math.max(0, Math.min(10, mean * 10)));
}

function fragmentationRisk(
  history: FragmentationObservation[],
  currentStreak: number,
): number {
  // current streak weighs heavy — if we're fragmenting NOW, risk is real.
  let risk = Math.min(10, currentStreak * 2);
  if (history.length > 0) {
    const recentPeaks = history.slice(-5).map((h) => h.peakStreak);
    const meanPeak = recentPeaks.reduce((a, b) => a + b, 0) / recentPeaks.length;
    risk = Math.max(risk, Math.min(10, meanPeak * 1.5));
  }
  return Math.round(risk);
}

function approvalStability(history: ApprovalObservation[]): number {
  const recent = history.slice(-8);
  if (recent.length < 2) return 7;  // not enough data — assume stable
  // Penalize refused outcomes (refusals reduce stability).
  const refused = recent.filter((h) => h.outcome === 'refused').length;
  if (refused === recent.length) return 0;
  // Among successful approvals, low variance in quality = high stability.
  const qualities = recent
    .filter((h) => h.outcome === 'approved' && typeof h.qualityScore === 'number')
    .map((h) => h.qualityScore as number);
  if (qualities.length === 0) return Math.max(0, 5 - refused);
  const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
  const variance = qualities.reduce((a, b) => a + (b - mean) ** 2, 0) / qualities.length;
  const stdev = Math.sqrt(variance);
  // stdev 0 → 10, stdev 3+ → 0. Linear inverse.
  const base = Math.max(0, Math.min(10, Math.round(10 - stdev * 3)));
  return Math.max(0, base - refused);
}

function cognitionDensity(history: CadenceObservation[], currentTick: number): number {
  if (history.length < 2) return 1;
  // Look at last 20 acts, compute acts-per-tick ratio.
  const window = history.slice(-20);
  const firstTick = window[0].tick;
  const lastTick = window[window.length - 1].tick;
  const span = Math.max(1, lastTick - firstTick);
  const density = window.length / span;
  // density 1.0 (act every tick) → 10, density 0.1 → 1
  return Math.round(Math.max(0, Math.min(10, density * 10)));
}

function deferRecommendation(a: Omit<TemporalAssessment, 'deferRecommendation' | 'strategicPatienceScore'>): DeferRecommendation {
  if (a.fragmentationRisk >= 7 || a.cadenceHealth <= 3) return 'now';
  if (a.fragmentationRisk >= 5 || a.cadenceHealth <= 5 || a.cognitionDensity >= 8) return 'soon';
  if (a.recoveryEfficiency < 4 || a.approvalStability < 5) return 'not-yet';
  return 'not-needed';
}

function strategicPatienceScore(
  a: Omit<TemporalAssessment, 'strategicPatienceScore'>,
  totalDefers: number,
  totalCognitiveActs: number,
): number {
  // Composite — reward recovery effectiveness, light cognition density,
  // and a non-zero defer rate (the organism has demonstrated it knows
  // when to wait).
  const inverseDensity = Math.max(0, 10 - a.cognitionDensity * 0.5);
  const deferRate = totalCognitiveActs > 0
    ? Math.min(10, (totalDefers / Math.max(1, totalCognitiveActs)) * 50)
    : 0;
  const composite = (a.recoveryEfficiency + inverseDensity + deferRate) / 3;
  return Math.round(Math.max(0, Math.min(10, composite)));
}

// ─── pattern detection (real signals only) ─────────────────────

function detectPatterns(
  mem: TemporalMemoryState,
  assessment: TemporalAssessment,
): string[] {
  const patterns: string[] = [];

  // 1. rapid cognition burst
  const recentGaps = mem.cadenceHistory.slice(-5)
    .map((h) => h.interActMs)
    .filter((g): g is number => g != null);
  if (recentGaps.length === 5 && recentGaps.every((g) => g < 2000)) {
    const meanMs = Math.round(recentGaps.reduce((a, b) => a + b, 0) / recentGaps.length);
    patterns.push(`rapid cognition burst — last 5 acts averaged ${meanMs}ms apart`);
  }

  // 2. rest pattern
  if (mem.recoveryHistory.length >= 2) {
    const recent = mem.recoveryHistory.slice(-3);
    const meanEff = recent.reduce((a, b) => a + b.effectiveness, 0) / recent.length;
    if (meanEff >= 0.7) {
      patterns.push(`rest pattern — last ${recent.length} rests averaged ${Math.round(meanEff * 100)}% effectiveness`);
    } else if (meanEff < 0.3) {
      patterns.push(`rest pattern — last ${recent.length} rests averaged only ${Math.round(meanEff * 100)}% effectiveness`);
    }
  }

  // 3. fragmentation accumulating
  if (mem.fragmentationHistory.length >= 4) {
    const peaks = mem.fragmentationHistory.slice(-4).map((h) => h.peakStreak);
    const earlier = (peaks[0] + peaks[1]) / 2;
    const later = (peaks[2] + peaks[3]) / 2;
    if (later > earlier + 1) {
      patterns.push(`fragmentation cycles lengthening — recent peaks ${later.toFixed(1)} vs earlier ${earlier.toFixed(1)}`);
    } else if (later < earlier - 1) {
      patterns.push(`fragmentation cycles settling — recent peaks ${later.toFixed(1)} vs earlier ${earlier.toFixed(1)}`);
    }
  }

  // 4. approval trend
  const apps = mem.approvalHistory.filter((h) => h.outcome === 'approved' && typeof h.qualityScore === 'number');
  if (apps.length >= 4) {
    const mid = Math.floor(apps.length / 2);
    const earlier = apps.slice(0, mid).map((h) => h.qualityScore as number);
    const later = apps.slice(mid).map((h) => h.qualityScore as number);
    const earlierMean = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const laterMean = later.reduce((a, b) => a + b, 0) / later.length;
    if (laterMean > earlierMean + 0.5) {
      patterns.push(`approval quality rising — ${earlierMean.toFixed(1)} → ${laterMean.toFixed(1)} mean across ${apps.length} approvals`);
    } else if (laterMean < earlierMean - 0.5) {
      patterns.push(`approval quality falling — ${earlierMean.toFixed(1)} → ${laterMean.toFixed(1)} mean across ${apps.length} approvals`);
    }
  }

  // 5. defer pattern
  if (mem.totalDefers >= 3 && mem.cadenceHistory.length > 0) {
    const ratio = mem.totalDefers / (mem.cadenceHistory.length + mem.totalDefers);
    if (ratio >= 0.15) {
      patterns.push(`defer pattern — ${mem.totalDefers} defers / ${Math.round(ratio * 100)}% of cognitive acts`);
    }
  }

  return patterns;
}

// ─── public API ────────────────────────────────────────────────

export function computeTemporalAssessment(snap: RuntimeSnapshot): TemporalAssessment {
  const mem = snap.temporalMemory ?? null;
  const os = snap.os;
  if (!mem || !os) {
    return {
      cadenceHealth: 7,
      recoveryEfficiency: 5,
      fragmentationRisk: 0,
      approvalStability: 7,
      cognitionDensity: 1,
      deferRecommendation: 'not-needed',
      strategicPatienceScore: 5,
    };
  }

  const base = {
    cadenceHealth: cadenceHealth(mem.cadenceHistory),
    recoveryEfficiency: recoveryEfficiency(mem.recoveryHistory),
    fragmentationRisk: fragmentationRisk(mem.fragmentationHistory, os.fragmentationStreak),
    approvalStability: approvalStability(mem.approvalHistory),
    cognitionDensity: cognitionDensity(mem.cadenceHistory, os.uptime),
  };
  const deferRec = deferRecommendation(base);
  const patience = strategicPatienceScore(
    { ...base, deferRecommendation: deferRec },
    mem.totalDefers,
    mem.cadenceHistory.length,
  );

  return {
    ...base,
    deferRecommendation: deferRec,
    strategicPatienceScore: patience,
  };
}

/**
 * Suggest the WHY for a defer thought based on current assessment.
 * The defer verb's evolve function calls this to compose the thought
 * deterministically. Returns the most-pressing reason; falls back to
 * a "general patience" line when no specific concern stands out.
 */
export function suggestDeferReason(assessment: TemporalAssessment): string {
  if (assessment.fragmentationRisk >= 7) {
    return `fragmentation risk elevated (${assessment.fragmentationRisk}/10) — recovery before further cognition`;
  }
  if (assessment.cadenceHealth <= 3) {
    return `cadence unhealthy (${assessment.cadenceHealth}/10) — cooling cycle preferred`;
  }
  if (assessment.cognitionDensity >= 8) {
    return `cognition density high (${assessment.cognitionDensity}/10) — slowing the rhythm`;
  }
  if (assessment.approvalStability <= 4) {
    return `approval stability weakened (${assessment.approvalStability}/10) — recovery before sandbox expansion`;
  }
  if (assessment.recoveryEfficiency <= 3) {
    return `recovery efficiency low (${assessment.recoveryEfficiency}/10) — patience before next cycle`;
  }
  return `chosen patience — preserving longitudinal coherence`;
}

export function buildTemporalIntelligenceView(snap: RuntimeSnapshot): TemporalIntelligenceViewModel {
  const mem = snap.temporalMemory ?? null;
  if (!mem) {
    return {
      present: false,
      assessment: computeTemporalAssessment(snap),
      observationCounts: { cadence: 0, recovery: 0, approval: 0, fragmentation: 0, defer: 0 },
      totalDefers: 0,
      detectedPatterns: [],
      statement: 'no temporal memory yet — observations will accumulate as cognition runs',
    };
  }
  const assessment = computeTemporalAssessment(snap);
  const detectedPatterns = detectPatterns(mem, assessment);

  const statement =
    assessment.deferRecommendation === 'now'  ? `defer recommended now — fragmentation ${assessment.fragmentationRisk}/10, cadence ${assessment.cadenceHealth}/10` :
    assessment.deferRecommendation === 'soon' ? `defer recommended soon — density ${assessment.cognitionDensity}/10` :
    assessment.deferRecommendation === 'not-yet' ? `defer not yet — recovery ${assessment.recoveryEfficiency}/10, approval stability ${assessment.approvalStability}/10` :
                                                   `defer not needed — temporal metrics healthy`;

  return {
    present: mem.cadenceHistory.length > 0
      || mem.recoveryHistory.length > 0
      || mem.approvalHistory.length > 0
      || mem.fragmentationHistory.length > 0
      || mem.deferHistory.length > 0,
    assessment,
    observationCounts: {
      cadence: mem.cadenceHistory.length,
      recovery: mem.recoveryHistory.length,
      approval: mem.approvalHistory.length,
      fragmentation: mem.fragmentationHistory.length,
      defer: mem.deferHistory.length,
    },
    totalDefers: mem.totalDefers,
    detectedPatterns,
    statement,
  };
}
