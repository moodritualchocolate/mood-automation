/**
 * CULTURAL DRIFT (Phase 12)
 *
 * The danger at this depth: the system gets stuck on burnout forever.
 *
 * Phase 4's tasteDrift.ts tracked AUDIENCE taste drift (oversized-
 * typography-fatigue, anti-ad-documentary-strengthening, etc.).
 *
 * Phase 12's culturalDrift detects when the CAMPAIGN ITSELF has
 * drifted into a CULTURALLY-CONSUMED pattern. The spec named several:
 *
 *   Instagram burnout aesthetic
 *   startup-core fatigue clichés
 *   "soft sad reels" loneliness
 *   romanticised exhaustion
 *   detox-retreat wellness pitch
 *   mom-burnout self-care
 *
 * These were once true, then went viral, then became the language of
 * EVERY brand at once. Using them now does not produce recognition —
 * it produces "I have seen this before."
 *
 * The engine reads the candidate's emotional core + cultural pattern
 * + treatment choices and flags when the banner is replaying a
 * culturally-consumed treatment.
 */

import type { CulturalPattern } from './sharedCulturalMemory';
import type { CreativeDirection } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { AtmosphericLight } from './atmosphericLight';

export type CulturalCliche =
  | 'instagram-burnout-aesthetic'
  | 'soft-sad-reels-loneliness'
  | 'startup-core-fatigue-cliche'
  | 'romanticised-exhaustion'
  | 'detox-retreat-pitch'
  | 'mom-burnout-self-care'
  | 'hustle-vs-recovery-pitch'
  | 'productivity-detox-motif';

export interface DriftReading {
  saturation_score: number;          // 0..10 — higher = more culturally consumed
  detected_cliches: CulturalCliche[];
  /** True when the banner is replaying language the culture has already
   *  processed and discarded. */
  feels_culturally_consumed: boolean;
  notes: string[];
}

export interface DriftInput {
  direction: CreativeDirection;
  emotionalCore: EmotionalCore | null;
  pattern: CulturalPattern | null;
  atmosphericLight: AtmosphericLight;
  truthText: string;
}

export function detectCulturalDrift(input: DriftInput): DriftReading {
  const { direction, pattern, atmosphericLight, truthText } = input;
  const detected: CulturalCliche[] = [];
  const notes: string[] = [];

  // instagram-burnout-aesthetic — high-restraint, warm-window-light,
  // single-cup, beige-everything-feeling.
  if (direction.restraint > 0.8 && atmosphericLight.behavior === 'window-soft-warm' && /coffee|mug|cup/i.test(truthText)) {
    detected.push('instagram-burnout-aesthetic');
    notes.push('warm window light + restraint + coffee object → Instagram burnout aesthetic');
  }

  // soft-sad-reels-loneliness — face-forward, sunset-emotional-pause,
  // low restraint, single-line wistful truth.
  if (direction.focalPoint === 'human-face' && atmosphericLight.behavior === 'sunset-emotional-pause' && truthText.length < 60) {
    detected.push('soft-sad-reels-loneliness');
    notes.push('face + sunset + short wistful copy → soft-sad reels visual');
  }

  // startup-core-fatigue-cliche — late-office-warmth + truth mentions
  // pitch/founder/team/MRR/raise.
  if (atmosphericLight.behavior === 'late-office-warmth' &&
      /\b(pitch|founder|team|raise|MRR|deck|investors|product market fit|PMF|growth|burn rate)\b/i.test(truthText)) {
    detected.push('startup-core-fatigue-cliche');
    notes.push('late office warmth + founder vocabulary → startup-core fatigue cliché');
  }

  // romanticised-exhaustion — explicit "tired" / "exhausted" language
  // shipped under warm light + high restraint.
  if (/\b(tired|exhausted|worn out|drained|burnt)\b/i.test(truthText) && direction.restraint > 0.78 &&
      (atmosphericLight.behavior === 'window-soft-warm' || atmosphericLight.behavior === 'late-office-warmth' || atmosphericLight.behavior === 'sunset-emotional-pause')) {
    detected.push('romanticised-exhaustion');
    notes.push('tiredness in copy + warm-lit restraint → romanticised exhaustion');
  }

  // detox-retreat-pitch — pattern matches `phone-from-anxiety` and the
  // truth signals "off" / "unplug" / "disconnect".
  if (pattern?.id === 'phone-from-anxiety' && /\b(off|unplug|disconnect|away from|airplane mode)\b/i.test(truthText)) {
    detected.push('detox-retreat-pitch');
    notes.push('digital anxiety + detox vocabulary → wellness-detox cliché');
  }

  // mom-burnout-self-care — pattern matches `parent-of-young-children-collapse`
  // AND the treatment is high restraint + warm light.
  if (pattern?.id === 'parent-of-young-children-collapse' && direction.restraint > 0.75 &&
      atmosphericLight.behavior === 'window-soft-warm') {
    detected.push('mom-burnout-self-care');
    notes.push('parent overload + warm restraint → mom-burnout self-care reel');
  }

  // hustle-vs-recovery-pitch — startup vocabulary + recovery vocabulary.
  if (/\b(grind|hustle|crushing it|all in|locked in)\b/i.test(truthText) && /\b(rest|recovery|breathe|reset)\b/i.test(truthText)) {
    detected.push('hustle-vs-recovery-pitch');
    notes.push('grind + recovery → hustle-vs-recovery wellness cliché');
  }

  // productivity-detox-motif — productivity vocabulary used to mean its
  // opposite. Pattern matches `cannot-rest-without-guilt` + truth has
  // productivity language.
  if (pattern?.id === 'cannot-rest-without-guilt' && /\b(productive|productivity|efficient|optimise|optimize)\b/i.test(truthText)) {
    detected.push('productivity-detox-motif');
    notes.push('productivity vocabulary used inside rest-guilt pattern → consumed treatment');
  }

  // Pattern-encoded consumed treatments — if the pattern listed
  // consumed_treatments, and the truth matches any keyword from them,
  // flag a soft saturation increase.
  if (pattern) {
    for (const consumed of pattern.consumed_treatments) {
      const tokens = consumed.toLowerCase().split(/\s+/).filter((t) => t.length > 4);
      if (tokens.some((t) => truthText.toLowerCase().includes(t))) {
        notes.push(`pattern "${pattern.id}" already has consumed treatment "${consumed}" in cultural circulation`);
      }
    }
  }

  // Saturation score — sum of detected clichés.
  const saturation_score = Math.min(10, detected.length * 2.5);

  const feels_culturally_consumed = saturation_score >= 5 || detected.length >= 2;

  if (notes.length === 0) notes.push('no detected cultural drift — treatment is not in mass circulation');

  return {
    saturation_score,
    detected_cliches: detected,
    feels_culturally_consumed,
    notes,
  };
}
