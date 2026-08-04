/**
 * COMPOSITION RHYTHM (Phase 8) — spatial repetition detector.
 *
 * Phase 3's campaignRhythm tracks EMOTIONAL pacing across generations
 * (loud vs quiet, product vs no-product, direct vs soft CTA).
 *
 * Phase 8's compositionRhythm tracks SPATIAL repetition:
 *   - left-heavy layouts
 *   - centered faces
 *   - repeated crop ratios
 *   - repeated product positions
 *   - repeated text anchors
 *   - repeated emotional geometry
 *
 * The engine reads the emotional trace's stored banner facts +
 * the recent composition signatures, and reports which spatial
 * patterns are repeating. The meta-critic rejects banners that
 * would extend the named repetition.
 */

import type { CreativeDirection, MemorySnapshot } from '@/core/types';
import type { EmotionalTraceEntry } from './humanMemory';

export interface CompositionRhythmReport {
  /** True when the banner would extend a named visual pattern. */
  would_repeat: boolean;
  repeated_pattern: string | null;
  /** Top recurring spatial patterns (top 3, name + count). */
  recurring: Array<{ pattern: string; count: number }>;
  /** Suggested correction the layout director will apply. */
  suggested_correction: string | null;
  notes: string[];
}

export interface RhythmInput {
  trail: EmotionalTraceEntry[];
  memory: MemorySnapshot;
  /** The candidate banner about to ship. */
  candidate: {
    layoutFamily: CreativeDirection['layoutFamily'];
    focalPoint: CreativeDirection['focalPoint'];
    productRole: CreativeDirection['productRole'];
    typographyDominance: CreativeDirection['typographyDominance'];
    negativeSpaceBias: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'corners';
  };
}

export function analyzeCompositionRhythm(input: RhythmInput): CompositionRhythmReport {
  const { trail, memory, candidate } = input;
  const notes: string[] = [];

  // Build pattern frequency from the last 8 banners.
  const recent = trail.slice(0, 8);
  const counts = new Map<string, number>();
  const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);

  for (const t of recent) {
    if (!t.facts) continue;
    bump(`layout=${t.facts.layoutFamily}`);
    bump(`role=${t.facts.productRole}`);
    bump(`dominance=${t.facts.typographyDominance}`);
  }
  // Use memory's recent arrays as an additional source (covers banners
  // whose trail entry might predate facts persistence).
  for (const l of (memory.recentLayouts ?? []).slice(0, 8)) bump(`layout=${l}`);
  for (const r of (memory.recentProductRoles ?? []).slice(0, 8)) bump(`role=${r}`);
  for (const d of (memory.recentTypographyDominances ?? []).slice(0, 8)) bump(`dominance=${d}`);

  const recurring = Array.from(counts.entries())
    .filter(([, n]) => n >= 3)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Decide if the candidate would extend a heavy repetition.
  const candidateKeys = [
    `layout=${candidate.layoutFamily}`,
    `role=${candidate.productRole}`,
    `dominance=${candidate.typographyDominance}`,
  ];
  let would_repeat = false;
  let repeated_pattern: string | null = null;
  for (const key of candidateKeys) {
    const c = counts.get(key) ?? 0;
    if (c >= 3) {
      would_repeat = true;
      repeated_pattern = `${key} repeated ${c}× — this banner would be the ${c + 1}th`;
      notes.push(repeated_pattern);
      break;
    }
  }

  // Spatial pattern: focal-point repetition.
  // The trail doesn't persist focalPoint specifically, but we can
  // approximate via layoutFamily heuristics.
  const centeredFamilies: Array<CreativeDirection['layoutFamily']> = ['editorial-page', 'negative-space'];
  const centeredCount = (memory.recentLayouts ?? []).slice(0, 6)
    .filter((l) => centeredFamilies.includes(l as CreativeDirection['layoutFamily'])).length;
  if (centeredCount >= 3 && centeredFamilies.includes(candidate.layoutFamily)) {
    would_repeat = true;
    repeated_pattern = repeated_pattern ?? `centered layouts repeated ${centeredCount}× — this would be the ${centeredCount + 1}th`;
    notes.push(`centered-layout pattern repeating (${centeredCount}×)`);
  }

  // Headline-top-and-product-bottom: detect via dominance=editorial +
  // role=desk-proof or table-object. If this pattern has appeared 2+
  // times AND the candidate matches, refuse.
  const headlineProductPattern = recurring.find(
    (r) => r.pattern === 'dominance=editorial' && r.count >= 3,
  );
  if (
    headlineProductPattern &&
    (candidate.productRole === 'desk-proof' || candidate.productRole === 'table-object') &&
    candidate.typographyDominance === 'editorial'
  ) {
    would_repeat = true;
    repeated_pattern = `headline-top + product-bottom pattern repeated ${headlineProductPattern.count}× — campaign needs a new geometry`;
    notes.push('headline-top + product-bottom is becoming the campaign template');
  }

  // Suggested correction.
  let suggested_correction: string | null = null;
  if (would_repeat) {
    if (repeated_pattern?.includes('layout=')) {
      suggested_correction = 'rotate to a layout family the campaign has not used in the last 5 banners';
    } else if (repeated_pattern?.includes('role=')) {
      suggested_correction = 'change the product role — hidden or environmental';
    } else if (repeated_pattern?.includes('dominance=')) {
      suggested_correction = 'change typography dominance to break the rhythm';
    } else if (repeated_pattern?.includes('centered')) {
      suggested_correction = 'pull the layout off-axis — try documentary-crop or off-center-portrait';
    } else if (repeated_pattern?.includes('headline-top')) {
      suggested_correction = 'invert geometry — primary typography at top or right, product hidden';
    }
  }
  if (notes.length === 0) notes.push('composition rhythm healthy');

  return { would_repeat, repeated_pattern, recurring, suggested_correction, notes };
}
