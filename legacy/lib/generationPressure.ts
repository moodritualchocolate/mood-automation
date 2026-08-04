/**
 * GENERATION PRESSURE (Phase 15)
 *
 * The more the system generates, the more likely it is to:
 *   - imitate itself
 *   - over-refine taste
 *   - become self-aware aesthetically
 *
 * The engine tracks:
 *   recursion_pressure        — how much the recent banners look
 *                                like prior banners structurally
 *   aesthetic_recursion       — same lighting + same framing band
 *                                + same restraint band repeatedly
 *   motif_over_convergence    — the campaign keeps returning to
 *                                the same object motifs
 *   symbolic_addiction        — the campaign has a "favourite
 *                                symbol" (one object dominates)
 *   over_clean_emotional_framing — recent banners all have
 *                                accidentally_true_score in the
 *                                same high band (suspicious — life
 *                                is not consistently truthful)
 *
 * Output: pressure_score 0..10. When ≥ 7 the meta-critic forces
 * disruption — refuse banners that match the recursive pattern,
 * push the next banner to break the dominant signature.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { ObjectMotif } from './objectEmotionMemory';
import type { AftertasteRecord } from './aftertaste';

export interface GenerationPressureReading {
  pressure_score: number;
  axes: {
    recursion: number;                    // 0..10 — recent banners structurally similar
    aesthetic_recursion: number;          // 0..10 — recent lighting/framing band repeating
    motif_over_convergence: number;       // 0..10 — same motifs returning
    symbolic_addiction: number;           // 0..10 — one motif dominates
    over_clean_emotional_framing: number; // 0..10 — accidentally-true band tight
  };
  /** True when the campaign needs deliberate disruption next. */
  force_disruption: boolean;
  /** Recommendations the next banner should honour to break recursion. */
  disruption_directives: string[];
  notes: string[];
}

export interface GenerationPressureInput {
  trail: EmotionalTraceEntry[];
  motifs: ObjectMotif[];
  recentAftertaste: AftertasteRecord[];
  /** Optional: per-banner recent atmospheric-light behaviours. */
  recentLightBehaviors?: string[];
  /** Optional: per-banner recent layout families. */
  recentLayouts?: string[];
  /** Optional: per-banner recent typography dominances. */
  recentDominances?: string[];
}

export function readGenerationPressure(input: GenerationPressureInput): GenerationPressureReading {
  const { trail, motifs, recentAftertaste, recentLightBehaviors = [], recentLayouts = [], recentDominances = [] } = input;
  const notes: string[] = [];

  if (trail.length < 4) {
    return {
      pressure_score: 0,
      axes: { recursion: 0, aesthetic_recursion: 0, motif_over_convergence: 0, symbolic_addiction: 0, over_clean_emotional_framing: 0 },
      force_disruption: false,
      disruption_directives: [],
      notes: ['campaign too short to measure generation pressure'],
    };
  }

  // ─── recursion (structural repetition) ────────────────────────
  // Counts the same layout-family within last 6 banners.
  const layoutsWindow = recentLayouts.slice(0, 6);
  const layoutCounts = countOccurrences(layoutsWindow);
  const topLayoutCount = topValue(layoutCounts);
  const recursion = clamp10(topLayoutCount * 1.6);

  // ─── aesthetic recursion (lighting band) ─────────────────────
  const lightWindow = recentLightBehaviors.slice(0, 6);
  const lightCounts = countOccurrences(lightWindow);
  const topLightCount = topValue(lightCounts);
  const aesthetic_recursion = clamp10(topLightCount * 1.6);

  // ─── motif over-convergence ──────────────────────────────────
  // Same top motif appearing across banners. We measure by the
  // appearances of the top motif relative to banner count.
  const topMotif = motifs.slice().sort((a, b) => b.appearances - a.appearances)[0];
  const motif_over_convergence = topMotif
    ? clamp10(((topMotif.appearances / Math.max(trail.length, 1)) - 0.3) * 15)
    : 0;

  // ─── symbolic addiction (one motif dominates) ────────────────
  let symbolic_addiction = 0;
  if (motifs.length >= 2) {
    const sortedMotifs = motifs.slice().sort((a, b) => b.appearances - a.appearances);
    const dominance = sortedMotifs[0].appearances / Math.max(1, sortedMotifs.slice(0, 4).reduce((a, b) => a + b.appearances, 0));
    symbolic_addiction = clamp10((dominance - 0.45) * 18);
  }

  // ─── over-clean emotional framing ────────────────────────────
  // When recent aftertaste records cluster in a tight high band,
  // the system is producing the same level of "truth" too consistently.
  if (recentAftertaste.length >= 4) {
    const lastFour = recentAftertaste.slice(0, 4).map((r) => r.residueStrength);
    const mean = lastFour.reduce((a, b) => a + b, 0) / lastFour.length;
    const variance = lastFour.reduce((a, b) => a + (b - mean) ** 2, 0) / lastFour.length;
    const stddev = Math.sqrt(variance);
    // Healthy stddev is ~1.5+. When stddev < 0.6 AND mean >= 8, the
    // campaign is suspiciously consistent.
    if (stddev < 0.6 && mean >= 8) {
      notes.push(`aftertaste cluster: mean ${mean.toFixed(1)}, stddev ${stddev.toFixed(2)} — too consistent`);
    }
    const tightness = Math.max(0, 1 - stddev / 1.5);
    const highMean = Math.max(0, (mean - 6) / 4);
    var over_clean_emotional_framing = clamp10(tightness * highMean * 12);
  } else {
    var over_clean_emotional_framing = 0;
  }

  // ─── dominance check on typography dominances (additional axis) ─
  const dominanceWindow = recentDominances.slice(0, 6);
  const dominanceCounts = countOccurrences(dominanceWindow);
  const topDominanceCount = topValue(dominanceCounts);
  // Roll into recursion when typography dominance also repeats.
  const recursionFinal = clamp10(recursion + (topDominanceCount >= 4 ? 1.5 : 0));

  // ─── composite ────────────────────────────────────────────────
  const axes = {
    recursion: recursionFinal,
    aesthetic_recursion,
    motif_over_convergence,
    symbolic_addiction,
    over_clean_emotional_framing,
  };
  const pressure_score = clamp10(
    recursionFinal * 0.25 +
    aesthetic_recursion * 0.20 +
    motif_over_convergence * 0.20 +
    symbolic_addiction * 0.15 +
    over_clean_emotional_framing * 0.20,
  );

  const force_disruption = pressure_score >= 7;

  // ─── disruption directives ────────────────────────────────────
  const disruption_directives: string[] = [];
  if (recursionFinal >= 6 && topLayoutCount >= 3) {
    disruption_directives.push(`break layout pattern — recent layouts repeated ${topLayoutCount}× in last ${layoutsWindow.length}`);
  }
  if (aesthetic_recursion >= 6 && topLightCount >= 3) {
    disruption_directives.push(`break atmospheric-light pattern — change light family next banner`);
  }
  if (motif_over_convergence >= 6 && topMotif) {
    disruption_directives.push(`rest motif "${topMotif.objectId}" — appeared in ${topMotif.appearances} banners`);
  }
  if (symbolic_addiction >= 6) {
    disruption_directives.push(`one motif is dominating — broaden the object vocabulary`);
  }
  if (over_clean_emotional_framing >= 6) {
    disruption_directives.push(`aftertaste cluster too tight — let the next banner risk being less polished`);
  }

  if (force_disruption) notes.push(`generation pressure HIGH (${pressure_score.toFixed(1)}/10) — force disruption next`);
  else if (pressure_score >= 4) notes.push(`generation pressure moderate (${pressure_score.toFixed(1)}/10)`);
  else if (notes.length === 0) notes.push('no recursion pressure detected');

  return { pressure_score, axes, force_disruption, disruption_directives, notes };
}

function countOccurrences(arr: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of arr) out[v] = (out[v] ?? 0) + 1;
  return out;
}
function topValue(map: Record<string, number>): number {
  const values = Object.values(map);
  return values.length === 0 ? 0 : Math.max(...values);
}
function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
