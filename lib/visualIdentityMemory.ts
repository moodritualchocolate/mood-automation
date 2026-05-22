/**
 * VISUAL IDENTITY MEMORY (Phase 34 — Identity Persistence / Wave 2)
 *
 * Remembers the campaign's VISUAL signature across runs — its layout
 * families, its restraint band, its product behaviour — and detects
 * when a new banner is drifting away from that signature.
 */

import type { CreativeDirection } from '@/core/types';
import type { EmotionalTraceEntry } from './humanMemory';

export interface VisualIdentityMemoryReading {
  /** 0..10 — how continuous the visual identity is. */
  visual_continuity: number;
  /** True when the banner's visual signature drifts from the campaign. */
  visual_drift: boolean;
  /** The campaign's established restraint band, if any. */
  established_restraint_band: [number, number] | null;
  notes: string[];
}

export interface VisualIdentityMemoryInput {
  direction: CreativeDirection;
  trail: EmotionalTraceEntry[];
}

export function readVisualIdentityMemory(input: VisualIdentityMemoryInput): VisualIdentityMemoryReading {
  const { direction, trail } = input;
  const notes: string[] = [];

  // The trail's facts carry layoutFamily; restraint is not persisted,
  // so we use the layout-family continuity as the visual signature.
  const window = trail.slice(0, 10).filter((t) => !!t.facts);
  if (window.length < 3) {
    return {
      visual_continuity: 6, visual_drift: false, established_restraint_band: null,
      notes: ['visual identity memory: campaign too young to have a visual signature'],
    };
  }

  const layoutCounts: Record<string, number> = {};
  for (const t of window) {
    const lf = t.facts!.layoutFamily;
    layoutCounts[lf] = (layoutCounts[lf] ?? 0) + 1;
  }
  // The signature is the set of layout families the campaign uses.
  const signatureLayouts = new Set(Object.keys(layoutCounts));
  const usesSignatureLayout = signatureLayouts.has(direction.layoutFamily);

  // Documentary weight is persisted on facts — use it as a restraint proxy.
  const docWeights = window.map((t) => t.facts!.documentary_weight).filter((d) => typeof d === 'number');
  const established_restraint_band: [number, number] | null = docWeights.length
    ? [round1(Math.min(...docWeights)), round1(Math.max(...docWeights))]
    : null;

  let visual_continuity = usesSignatureLayout ? 8 : 4;
  // A campaign that has only ever used ONE layout family AND this
  // banner also uses it is highly continuous (but watch for monotony
  // — that is the saturation engine's job, not this one).
  if (signatureLayouts.size === 1 && usesSignatureLayout) visual_continuity = 9;
  const visual_drift = !usesSignatureLayout && signatureLayouts.size <= 3;

  if (visual_drift) notes.push(`visual identity memory: layout "${direction.layoutFamily}" drifts from the campaign signature (${[...signatureLayouts].join(', ')})`);
  else notes.push('visual identity memory: the banner holds the campaign visual signature');

  return { visual_continuity, visual_drift, established_restraint_band, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
