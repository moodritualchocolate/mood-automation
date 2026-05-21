/**
 * EMOTIONAL COMPRESSION (Phase 10)
 *
 * Human emotional advertising works because ONE image implies TEN
 * emotions. The system stops scoring "how much is shown" and starts
 * scoring "how much is IMPLIED".
 *
 * Per banner:
 *   - implied_emotions   — emotions the scene hints at without showing
 *   - shown_emotions     — emotions explicitly displayed (face, copy)
 *   - compression_ratio  — implied / (shown + 1)
 *   - score              — 0..10 — high when implied >> shown
 *
 * Reject literal storytelling. Reward compressed density.
 *
 * Example the spec gave:
 *   "A badly folded blanket beside a glowing laptop can imply
 *    insomnia, work exhaustion, doomscrolling, loneliness, avoidance,
 *    Sunday anxiety — without showing any of them directly."
 *
 * That is the level the score rewards.
 */

import type { CreativeDirection, HumanTruth, TypographyPlan } from '@/core/types';
import type { WorldContinuityPlan } from './worldContinuity';
import type { EmotionalCore } from './humanTruthEngine';

export interface CompressionReading {
  implied_emotions: string[];
  shown_emotions: string[];
  compression_ratio: number;
  score: number;
  literal_storytelling: boolean;
  notes: string[];
}

export interface CompressionInput {
  truth: HumanTruth;
  direction: CreativeDirection;
  typography: TypographyPlan;
  emotionalCore: EmotionalCore | null;
  worldContinuity: WorldContinuityPlan | null;
}

// Object → emotions implied dictionary. Each object can fan out to
// several emotions, which is exactly what compression rewards.
const OBJECT_IMPLICATIONS: Record<string, string[]> = {
  'unfinished-tea': ['avoidance', 'depletion', 'tired ritual'],
  'tabs-open': ['fragmentation', 'overstimulation', 'fake productivity'],
  'chair-slightly-moved': ['someone-left', 'incomplete-conversation'],
  'unread-message': ['guilt', 'avoidance', 'hidden-anxiety'],
  'worn-hoodie': ['ritual', 'depletion', 'self-comfort'],
  'half-open-cabinet': ['absent-mindedness', 'in-the-middle-of-something'],
  'jacket-on-chair': ['inability-to-land', 'arrival-without-arrival'],
  'half-eaten-snack': ['eating-without-hunger', 'numbness', 'self-comfort'],
  'unwashed-sink': ['day-not-put-away', 'depletion', 'silent-burnout'],
  'crumpled-blanket': ['too-tired-to-rest', 'doomscrolling', 'insomnia'],
  'receipt-crumpled': ['errand-done', 'nothing-put-away'],
  'phone-charger-trailing': ['overconnected', 'sleeplessness', 'tether'],
  'used-coffee-filter': ['ritual', 'second-cup', 'depletion'],
  'open-notebook': ['unfinished-thought', 'incomplete-ritual'],
  'shoes-half-off': ['arrived-without-arriving', 'depletion'],
  'window-rain-streak': ['weather-as-mood', 'static-day'],
  'keys-on-counter': ['arrival', 'did-not-move-past-this-spot'],
  'cold-toast': ['morning-intention-without-follow-through', 'flatness'],
};

export function scoreEmotionalCompression(input: CompressionInput): CompressionReading {
  const { truth, direction, typography, emotionalCore, worldContinuity } = input;
  const notes: string[] = [];

  // ─── implied emotions ─────────────────────────────────────────
  const implied = new Set<string>();
  if (worldContinuity) {
    for (const artifact of worldContinuity.artifacts) {
      const list = OBJECT_IMPLICATIONS[artifact.id] ?? [];
      for (const e of list) implied.add(e);
    }
  }
  // Emotional core adds its own implications (the core itself + adjacent moods).
  if (emotionalCore) {
    implied.add(emotionalCore.id);
    // Adjacent emotions implied by the core's cultural examples.
    for (const ex of emotionalCore.cultural_examples) {
      const tokens = ex.toLowerCase().split(/\s+/);
      for (const t of tokens) {
        if (t.length > 4 && !['after', 'their', 'where'].includes(t)) implied.add(t);
      }
    }
  }
  // Tension phrase adds an implication if short and sharp.
  if (truth.tension && truth.tension.length > 0 && truth.tension.length < 40) {
    implied.add(`tension: ${truth.tension}`);
  }

  // ─── shown emotions ───────────────────────────────────────────
  const shown = new Set<string>();
  // Loud typography SHOWS rather than implies.
  if (direction.typographyDominance === 'loud') shown.add('headline-shouting');
  // Long truth (> 110 chars) explains rather than implies.
  if (truth.truth.length > 110) {
    shown.add('explanation-in-copy');
    notes.push('truth length over 110 chars — risks literal storytelling');
  }
  // Face-forward + collapsed = the face is doing the emotion explicitly.
  if (direction.focalPoint === 'human-face' && direction.emotionalPacing === 'collapsed') {
    shown.add('face-showing-emotion-directly');
  }
  // Secondary line shows what the headline did not say.
  if (typography.secondary) shown.add('secondary-line-explaining');
  // Timestamp shown explicitly when not earning it.
  if (typography.timestamp) shown.add('timestamp-named');
  // CTA pill = aggressive announcement.
  // (Encoded loosely — the renderer details vary.)

  // ─── compression ratio + score ────────────────────────────────
  const compression_ratio = implied.size / Math.max(1, shown.size + 1);

  // The score rewards compression up to a cap. The healthy band is
  // about 3-7 implied per shown — beyond ~10 the system is ASSUMING
  // too much (the viewer can't decode any of it).
  let score = 0;
  if (compression_ratio >= 3 && compression_ratio <= 8) score = 9;
  else if (compression_ratio >= 2 && compression_ratio < 3) score = 7;
  else if (compression_ratio >= 1 && compression_ratio < 2) score = 5;
  else if (compression_ratio > 8) score = 6;        // too much implied — risks opacity
  else score = 3;                                    // literal storytelling

  // Bonus for short truth + visible artifact density.
  if (truth.truth.length < 70 && (worldContinuity?.artifacts.length ?? 0) >= 2) {
    score = Math.min(10, score + 1);
    notes.push('short truth + lived-in artifacts → density without explanation');
  }

  const literal_storytelling = shown.size >= 3 && implied.size < shown.size * 2;
  if (literal_storytelling) notes.push('banner is showing more than implying — literal storytelling risk');

  if (notes.length === 0) notes.push('compression healthy — implied emotion dominates');

  return {
    implied_emotions: Array.from(implied),
    shown_emotions: Array.from(shown),
    compression_ratio,
    score,
    literal_storytelling,
    notes,
  };
}
