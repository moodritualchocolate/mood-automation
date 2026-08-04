/**
 * ANTI-AI EVOLUTION ENGINE
 *
 * Detects and avoids patterns that start feeling AI-generated:
 *
 *   - fake cinematic lighting
 *   - giant meaningless typography
 *   - overly smooth faces
 *   - perfect symmetrical layouts
 *   - generic premium beige
 *   - pasted product logic
 *   - motivational quote energy
 *   - startup ad templates
 *
 * Two responsibilities:
 *
 *  1) Per-banner: scan the banner's direction/composition/typography
 *     and report which AI signatures are present.
 *
 *  2) Cross-campaign: scan the recent banners and detect DRIFT — when
 *     the system has converged on AI-looking patterns even though no
 *     single banner was hard-rejected. The drift report tells the
 *     campaign brain to push the next banner away from those patterns.
 */

import type { Banner, CreativeDirection, MemorySnapshot, TypographyPlan } from '@/core/types';
import type { ReferenceDNA } from './referenceDNA';

export const AI_SIGNATURES = [
  'fake-cinematic-lighting',
  'giant-meaningless-typography',
  'perfect-symmetric-layout',
  'generic-premium-beige',
  'pasted-product-logic',
  'motivational-quote-energy',
  'startup-ad-template',
  'overly-smooth-face',
] as const;
export type AISignature = (typeof AI_SIGNATURES)[number];

export interface AntiAIReport {
  signatures: AISignature[];
  /** 0..10, higher = more AI signatures present. */
  smell: number;
  /** Cross-campaign drift — names the patterns the campaign is over-using. */
  driftSignatures: AISignature[];
  /** Concrete recommendation for the next banner. */
  pushAwayFrom: AISignature[];
  notes: string[];
}

export interface ScanInput {
  direction: CreativeDirection;
  typography: TypographyPlan;
  bannerDNA: ReferenceDNA;
  truth: { truth: string; tension: string };
  memory: MemorySnapshot;
  imageProvider: string;
}

export function scanAntiAI(input: ScanInput): AntiAIReport {
  const { direction, typography, bannerDNA, truth, memory, imageProvider } = input;
  const present: AISignature[] = [];
  const notes: string[] = [];

  // ─ fake cinematic lighting ─
  // Stub mode is acknowledged; the real signal is low restraint + 'collapsed'.
  if (direction.restraint < 0.4 && direction.emotionalPacing === 'collapsed') {
    present.push('fake-cinematic-lighting');
    notes.push('low restraint + collapsed pacing = theatrical lighting risk');
  }

  // ─ giant meaningless typography ─
  // Loud or timestamp dominance not earned by the truth.
  if (
    (direction.typographyDominance === 'loud' && truth.truth.length > 100) ||
    (direction.typographyDominance === 'timestamp' && !/\d{2}:\d{2}/.test(truth.truth))
  ) {
    present.push('giant-meaningless-typography');
    notes.push('big type without a sharp truth to carry it');
  }

  // ─ perfect symmetric layout ─
  if (bannerDNA.framing_behavior < 0.35 && bannerDNA.silence_ratio < 0.6) {
    present.push('perfect-symmetric-layout');
    notes.push('framing reads centred and balanced');
  }

  // ─ generic premium beige ─
  // Proxy: very high luxury_restraint + low documentary_weight.
  if (bannerDNA.luxury_restraint > 0.8 && bannerDNA.documentary_weight < 0.45) {
    present.push('generic-premium-beige');
    notes.push('restraint without documentary grounding — risk of "beige"');
  }

  // ─ pasted product logic ─
  if (bannerDNA.product_aggression_level > 0.55 && direction.productRole !== 'partial-crop') {
    present.push('pasted-product-logic');
    notes.push('product behavior is too forward — risks reading as PNG');
  }

  // ─ motivational quote energy ─
  if (truth.truth.length > 110 && !truth.truth.includes('.') && !truth.truth.includes(',')) {
    present.push('motivational-quote-energy');
    notes.push('truth reads as a slogan, not an observation');
  }

  // ─ startup ad template ─
  if (direction.layoutFamily === 'documentary-crop' && direction.restraint > 0.6 && direction.restraint < 0.72 && direction.typographyDominance === 'whisper') {
    present.push('startup-ad-template');
    notes.push('falling into the safest possible direction — the startup template');
  }

  // ─ overly smooth face ─
  // Only real-image mode can decide; with stub, skip.
  // (Future hook: vision pass on real-image runs.)

  // Smell composite — diminishing returns past 3 signatures.
  const smell = Math.min(10, present.length * 2.5);

  // Cross-campaign drift detection.
  const driftSignatures = detectDrift(memory);
  const pushAwayFrom = Array.from(new Set([...present.filter((p) => driftSignatures.includes(p)), ...driftSignatures.slice(0, 2)]));

  return { signatures: present, smell, driftSignatures, pushAwayFrom, notes };
}

/**
 * Cross-campaign drift detection — looks at the last 6 banners' patterns
 * via the memory's auxiliary slots. Any pattern that appears ≥ 3 times
 * is considered drift the next banner must push away from.
 */
function detectDrift(memory: MemorySnapshot): AISignature[] {
  const drift: AISignature[] = [];
  const window = 6;
  const arc = memory.campaignArc.slice(0, window);
  const recentDominances = (memory.recentTypographyDominances ?? []).slice(0, window);
  const recentRoles = (memory.recentProductRoles ?? []).slice(0, window);

  // perfect-symmetric-layout drift — same centered behavior across banners.
  // Proxy: recent layouts include "editorial-page" ≥ 3 times AND restraint averages high.
  const editorialPageCount = (memory.recentLayouts ?? []).slice(0, window).filter((l) => l === 'editorial-page').length;
  if (editorialPageCount >= 3) drift.push('perfect-symmetric-layout');

  // generic-premium-beige drift — restraint avg > 0.78 across recent banners.
  if (arc.length >= 3) {
    const restraintAvg = arc.reduce((a, b) => a + b.restraint, 0) / arc.length;
    if (restraintAvg > 0.78) drift.push('generic-premium-beige');
  }

  // startup-ad-template drift — documentary-crop repeated.
  const docCropCount = (memory.recentLayouts ?? []).slice(0, window).filter((l) => l === 'documentary-crop').length;
  if (docCropCount >= 3) drift.push('startup-ad-template');

  // pasted-product-logic drift — same product role ≥ 4 times.
  const roleCounts: Record<string, number> = {};
  for (const r of recentRoles) roleCounts[r] = (roleCounts[r] ?? 0) + 1;
  const dominantRoleEntry = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantRoleEntry && dominantRoleEntry[1] >= 4 && dominantRoleEntry[0] !== 'hidden') {
    drift.push('pasted-product-logic');
  }

  // giant-meaningless-typography drift — loud/timestamp dominance repeated.
  const loudCount = recentDominances.filter((d) => d === 'loud' || d === 'timestamp').length;
  if (loudCount >= 3) drift.push('giant-meaningless-typography');

  return drift;
}
