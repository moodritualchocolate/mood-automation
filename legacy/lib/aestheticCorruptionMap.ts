/**
 * AESTHETIC CORRUPTION MAP (Phase 39 — Executive Identity Governance / Wave 4)
 *
 * Maps the named aesthetic CORRUPTIONS that mutate MOOD into
 * something it is not — supplement-hype, productivity-guru, fake
 * spirituality, therapy-tone, luxury aesthetic, TikTok wellness,
 * over-designed emotion, startup-bro language, motivational poison.
 */

import type { HumanTruth } from '@/core/types';

export interface CorruptionPattern {
  id: string;
  vocabulary: RegExp;
  mutates_into: string;
}

export const CORRUPTION_PATTERNS: CorruptionPattern[] = [
  { id: 'supplement-hype', vocabulary: /\b(supplement|nootropic|formula|dose|fuel your|boost your|stack)\b/i, mutates_into: 'a supplement-hype brand' },
  { id: 'productivity-guru', vocabulary: /\b(productivity|optimi[sz]e|deep work|monk mode|10x|systemi[sz]e|peak performance)\b/i, mutates_into: 'a productivity-guru brand' },
  { id: 'fake-spirituality', vocabulary: /\b(sacred|the universe|alignment|manifest|higher self|energy field|divine)\b/i, mutates_into: 'a fake-spirituality brand' },
  { id: 'therapy-tone', vocabulary: /\b(holding space|inner child|nervous system|trauma|emotional bandwidth|sit with the)\b/i, mutates_into: 'therapy-tone content' },
  { id: 'luxury-aesthetic', vocabulary: /\b(luxur(y|ious)|indulge|elevate|premium|exquisite|refined|bespoke)\b/i, mutates_into: 'a luxury-aesthetic brand' },
  { id: 'tiktok-wellness', vocabulary: /\b(that girl|soft girl|wellness era|romanticis(e|ing)|hot girl walk|glow up)\b/i, mutates_into: 'TikTok wellness' },
  { id: 'startup-bro', vocabulary: /\b(crush it|grind|hustle|ship it|founder mode|let's go|disrupt)\b/i, mutates_into: 'startup-bro content' },
  { id: 'motivational-poison', vocabulary: /\b(you got this|never give up|believe|rise and grind|no excuses|push through|unlock your)\b/i, mutates_into: 'motivational poison' },
];

export interface AestheticCorruptionReading {
  detected: CorruptionPattern[];
  /** 0..10 — overall aesthetic-corruption load. */
  corruption_load: number;
  /** True when at least one corruption is mutating the brand. */
  brand_mutating: boolean;
  notes: string[];
}

export interface AestheticCorruptionInput {
  truth: HumanTruth;
  copyText?: string;
}

export function mapAestheticCorruption(input: AestheticCorruptionInput): AestheticCorruptionReading {
  const { truth, copyText } = input;
  const notes: string[] = [];
  const hay = `${truth.truth} ${truth.tension} ${copyText ?? ''}`;

  const detected = CORRUPTION_PATTERNS.filter((p) => p.vocabulary.test(hay));
  const corruption_load = Math.min(10, detected.length * 3.5);
  const brand_mutating = detected.length > 0;

  for (const d of detected) notes.push(`aesthetic corruption: "${d.id}" detected — mutates MOOD into ${d.mutates_into}`);
  if (!brand_mutating) notes.push('aesthetic corruption: none — the brand is not mutating');

  return { detected, corruption_load, brand_mutating, notes };
}
