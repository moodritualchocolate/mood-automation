/**
 * TONE INTEGRITY (Phase 34 — Identity Persistence / Wave 2)
 *
 * Protects the MOOD voice. The tone is never inspirational, never
 * motivational, never wellness-coded, never loud for the sake of
 * loud. Tone integrity measures how far an output's voice has drifted
 * from that restraint.
 */

import type { CreativeDirection, HumanTruth } from '@/core/types';

export interface ToneIntegrityReading {
  /** 0..10 — how intact the MOOD tone is. */
  tone_integrity: number;
  /** Named tone violations. */
  violations: string[];
  /** True when the tone has drifted into generic wellness. */
  generic_wellness_tone: boolean;
  notes: string[];
}

export interface ToneIntegrityInput {
  truth: HumanTruth;
  direction: CreativeDirection;
  copyText?: string;
}

const INSPIRATIONAL_RX = /\b(you got this|believe in yourself|your journey|rise|shine|unleash|thrive|you deserve|never give up|best self)\b/i;
const WELLNESS_RX = /\b(self[- ]?care|wellness|mindful|nourish|recharge|sacred|glow|balance your|holistic)\b/i;
const MOTIVATIONAL_RX = /\b(crush it|level up|10x|grind|hustle|seize|conquer|optimi[sz]e your)\b/i;

export function readToneIntegrity(input: ToneIntegrityInput): ToneIntegrityReading {
  const { truth, direction, copyText } = input;
  const notes: string[] = [];
  const hay = `${truth.truth} ${copyText ?? ''}`;
  const violations: string[] = [];

  if (INSPIRATIONAL_RX.test(hay)) violations.push('inspirational voice');
  if (WELLNESS_RX.test(hay)) violations.push('wellness-coded voice');
  if (MOTIVATIONAL_RX.test(hay)) violations.push('motivational voice');
  // Loud for the sake of loud — loud typography with low restraint and
  // no tonal reason.
  if (direction.typographyDominance === 'loud' && direction.restraint < 0.35) {
    violations.push('loud-for-the-sake-of-loud');
  }

  const generic_wellness_tone = violations.includes('wellness-coded voice') || violations.includes('inspirational voice');

  let tone_integrity = 9;
  tone_integrity -= violations.length * 3;
  tone_integrity = Math.max(0, Math.min(10, tone_integrity));

  if (violations.length) notes.push(`tone integrity: the voice drifted — ${violations.join(', ')}`);
  else notes.push('tone integrity: intact — restrained, non-performative, non-wellness');

  return { tone_integrity, violations, generic_wellness_tone, notes };
}
