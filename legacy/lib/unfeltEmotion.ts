/**
 * UNFELT EMOTION (Phase 14)
 *
 * The most powerful banners often contain a feeling the subject
 * themselves has not yet consciously processed. The viewer realizes
 * it before the character does.
 *
 * This module answers the spec's new headline question:
 *
 *   "Does the character know what they are feeling,
 *    or is the viewer realizing it before they are?"
 *
 * If the banner is fully self-explanatory (the truth NAMES the
 * feeling, the character is aware), the meta-critic rejects at
 * brutal. The intended shape is: behavior leaking the truth, language
 * not naming it.
 *
 * This module also detects the spec's named "therapy content"
 * failures:
 *   inspirational healing language
 *   self-awareness clichés
 *   mental-health-aesthetic vocabulary
 *   emotional TED-talk energy
 *   over-verbalized pain
 */

import type { HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export interface UnfeltReading {
  /** 0..10 — high when the character APPEARS to know what they feel. */
  character_self_awareness: number;
  /** True when the viewer realises it before the character does. */
  viewer_realizes_before_character: boolean;
  /** True when the truth uses therapy / self-help vocabulary. */
  reads_as_therapy_content: boolean;
  /** Named therapy-content failures present. */
  therapy_signatures: string[];
  /** True when the truth describes BEHAVIOR (subject does X) rather
   *  than INTERNAL state ("I feel"). */
  describes_behavior_not_feeling: boolean;
  /** True when emotion is leaked through behavior — the spec's
   *  intended outcome. */
  accidentally_revealed: boolean;
  notes: string[];
}

// First-person inner-state language — "I feel", "I am sad", "my anxiety".
// When the truth uses these the character KNOWS what they feel.
const SELF_AWARE_LANGUAGE = /\b(i\s+(feel|am|was|realized|recognized|understand|know|notice)|my\s+(anxiety|burnout|sadness|loneliness|grief|exhaustion|stress)|feeling\s+(sad|anxious|lonely|broken|empty|tired))\b/i;

// Therapy / self-help / wellness vocabulary the spec named.
const THERAPY_PATTERNS: Array<{ pattern: RegExp; signature: string }> = [
  { pattern: /\b(embrace|embracing|embraced)\b/i,                signature: 'embrace-language' },
  { pattern: /\b(heal|healing|healed|wholeness)\b/i,              signature: 'healing-language' },
  { pattern: /\b(self[-\s]?love|self[-\s]?care|self[-\s]?worth|self[-\s]?aware|self[-\s]?awareness)\b/i, signature: 'self-care-cliche' },
  { pattern: /\b(my truth|honor(?:ing)?\s+my|honor(?:ing)?\s+your|mental health journey)\b/i, signature: 'mental-health-aesthetic' },
  { pattern: /\b(boundaries|holding space|sit with|check in with myself|inner child)\b/i, signature: 'therapy-jargon' },
  { pattern: /\b(it\'?s okay to|you are enough|you matter|you got this)\b/i, signature: 'inspirational-cliche' },
  { pattern: /\b(deserve|worthy|empower(?:ed|ing)?|reclaim(?:ed|ing)?|own your)\b/i, signature: 'empowerment-cliche' },
];

// Behavioral verbs — the truth describes what the body is doing.
const BEHAVIOR_VERB = /\b(opens|opened|closes|closed|reaches|reached|types|typed|walks|walked|sits|sat|stands|stood|scrolls|scrolled|checks|checked|answers|answered|replies|replied|smiles|laughs|laughed|laughs|drinks|drank|eats|ate|stares|stared|holds|held|stops|stopped|continues|continued|keeps|kept|leaves|left|arrives|arrived)\b/i;

export interface UnfeltInput {
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readUnfeltEmotion(input: UnfeltInput): UnfeltReading {
  const { truth } = input;
  const text = truth.truth;
  const notes: string[] = [];

  // ─── character_self_awareness ─────────────────────────────────
  let self_awareness = 3;
  if (SELF_AWARE_LANGUAGE.test(text)) {
    self_awareness += 5;
    notes.push('truth uses first-person inner-state language — character knows what they feel');
  }
  // Tension phrase that is self-described ("I am tired" / "I feel") raises self-awareness.
  if (truth.tension && SELF_AWARE_LANGUAGE.test(truth.tension)) {
    self_awareness += 2;
  }
  self_awareness = Math.min(10, self_awareness);

  // ─── therapy-content detection ────────────────────────────────
  const therapy_signatures: string[] = [];
  for (const { pattern, signature } of THERAPY_PATTERNS) {
    if (pattern.test(text)) therapy_signatures.push(signature);
    if (truth.tension && pattern.test(truth.tension)) {
      if (!therapy_signatures.includes(signature)) therapy_signatures.push(signature);
    }
  }
  const reads_as_therapy_content = therapy_signatures.length > 0;
  if (reads_as_therapy_content) notes.push(`therapy-content vocabulary present: ${therapy_signatures.join(', ')}`);

  // ─── behavior-vs-feeling ──────────────────────────────────────
  const describes_behavior_not_feeling = BEHAVIOR_VERB.test(text) && !SELF_AWARE_LANGUAGE.test(text);

  // ─── viewer realises before character ────────────────────────
  // The intended outcome: the camera catches BEHAVIOR, the character
  // is unaware, the viewer puts it together.
  const viewer_realizes_before_character =
    describes_behavior_not_feeling
    && self_awareness <= 5
    && !reads_as_therapy_content;

  // ─── accidentally revealed ───────────────────────────────────
  const accidentally_revealed = viewer_realizes_before_character;

  if (viewer_realizes_before_character) notes.push('viewer realises before the character — accidentally revealed');
  if (!describes_behavior_not_feeling && self_awareness >= 7) notes.push('character knows what they feel — risks over-verbalised pain');

  return {
    character_self_awareness: self_awareness,
    viewer_realizes_before_character,
    reads_as_therapy_content,
    therapy_signatures,
    describes_behavior_not_feeling,
    accidentally_revealed,
    notes,
  };
}
