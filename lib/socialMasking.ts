/**
 * SOCIAL MASKING (Phase 14)
 *
 * The gap between the public surface and the private state.
 *
 * Most modern people do not collapse publicly. They:
 *   - answer normally
 *   - joke normally
 *   - post normally
 *   - work normally
 *   - reply "all good"
 * while internally overloaded.
 *
 * The engine measures the GAP between observable surface signals
 * (what other people see) and internal signals (what is actually
 * being felt). High gap = strong mask = the most quietly true
 * banners. Low gap = the person is wearing what they feel — which
 * is rare in adult life.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export interface SocialMaskingReading {
  /** 0..10 — how composed the surface is in this banner. */
  surface_coherence_score: number;
  /** 0..10 — how depleted the private state is. */
  internal_fracture_score: number;
  /** abs(surface - inverted internal). High = strong mask. */
  mask_gap: number;
  /** Top 2 observable surface signals the camera should catch. */
  surface_signals: string[];
  /** The private state the surface is hiding. */
  hidden_state_description: string;
  /** True when the candidate is a mask-banner (the spec's intended outcome). */
  is_mask_present: boolean;
  notes: string[];
}

const SURFACE_PATTERNS: Array<{ pattern: RegExp; signal: string }> = [
  { pattern: /\b(reply|replying|replied|answer|answering|answered)\b/i, signal: 'replying as if everything is fine' },
  { pattern: /\b(smile|smiling|smiled|laugh|laughing|laughed)\b/i, signal: 'smiling at the right moments' },
  { pattern: /\b(post|posting|posted|share|shared)\b/i, signal: 'posting as if nothing is wrong' },
  { pattern: /\b(meeting|standup|video call|zoom|on call)\b/i, signal: 'attending the meeting with the right tone' },
  { pattern: /\b(all good|fine|okay|i\'?m good|all right|i\'?m fine)\b/i, signal: 'saying "all good" as a verbal mask' },
  { pattern: /\b(deck|presentation|pitch|deliver|shipping|present)\b/i, signal: 'delivering with composure' },
  { pattern: /\b(table|dinner|family|kids?|partner|spouse|wife|husband|date|friend)\b/i, signal: 'showing up at the social table' },
];

const SURFACE_BY_STATE_FAMILY: Record<HumanState['family'], string[]> = {
  pressure:        ['delivering with composure', 'replying as if everything is fine'],
  fragmentation:   ['attending the meeting with the right tone', 'replying as if everything is fine'],
  overstimulation: ['saying "all good" as a verbal mask', 'replying as if everything is fine'],
  fatigue:         ['saying "all good" as a verbal mask', 'showing up at the social table'],
  collapse:        ['saying "all good" as a verbal mask', 'attending the meeting with the right tone'],
  numbness:        ['smiling at the right moments', 'attending the meeting with the right tone'],
  paralysis:       ['saying "all good" as a verbal mask', 'replying as if everything is fine'],
  avoidance:       ['posting as if nothing is wrong', 'showing up at the social table'],
};

export interface SocialMaskingInput {
  truth: HumanTruth;
  state: HumanState;
  emotionalCore: EmotionalCore | null;
}

export function readSocialMasking(input: SocialMaskingInput): SocialMaskingReading {
  const { truth, state, emotionalCore } = input;
  const notes: string[] = [];
  const text = truth.truth;

  // ─── surface coherence ─────────────────────────────────────────
  const detected: string[] = [];
  for (const { pattern, signal } of SURFACE_PATTERNS) {
    if (pattern.test(text)) detected.push(signal);
  }
  // Family fallback — the family carries an implied surface even if
  // the truth doesn't name it.
  const familySurface = SURFACE_BY_STATE_FAMILY[state.family] ?? [];
  for (const signal of familySurface) {
    if (!detected.includes(signal)) detected.push(signal);
  }

  // Higher surface_coherence when the truth contains multiple surface
  // patterns or the family is one of the "high-mask" families
  // (numbness / fatigue / collapse / pressure).
  const highMaskFamilies: HumanState['family'][] = ['numbness', 'fatigue', 'collapse', 'pressure', 'paralysis'];
  let surface_coherence_score = Math.min(10, detected.length * 1.5 + (highMaskFamilies.includes(state.family) ? 4 : 2));

  // ─── internal fracture ────────────────────────────────────────
  // Driven by the emotional core's depletion signal + the truth's
  // tension phrase. When the tension is short and sharp, the
  // internal fracture is more measurable.
  let internal_fracture_score = 4;
  if (truth.tension && truth.tension.length > 0 && truth.tension.length < 40) internal_fracture_score += 2;
  if (emotionalCore) {
    const heavyCores = ['silent-burnout', 'invisible-pressure', 'hidden-anxiety', 'functional-collapse', 'too-tired-to-rest'];
    if (heavyCores.includes(emotionalCore.id)) internal_fracture_score += 3;
    else if (emotionalCore.id === 'emotional-numbness' || emotionalCore.id === 'emotional-drift') internal_fracture_score += 1.5;
  }
  // Heavy family — the family itself signals fracture.
  if (['collapse', 'fatigue', 'pressure'].includes(state.family)) internal_fracture_score += 1.5;
  internal_fracture_score = Math.min(10, internal_fracture_score);

  // ─── mask gap ─────────────────────────────────────────────────
  // mask_gap = surface_coherence + internal_fracture / 2 — a banner
  // is most "masked" when BOTH surface coherence AND internal
  // fracture are high. We treat the gap as the absolute distance
  // between surface_coherence and (10 - internal_fracture) — i.e.
  // how much the visible surface contradicts the private state.
  const mask_gap = Math.min(10, Math.abs(surface_coherence_score - (10 - internal_fracture_score)));

  // ─── verdict ──────────────────────────────────────────────────
  const is_mask_present = surface_coherence_score >= 5 && internal_fracture_score >= 5;

  const hidden_state_description = emotionalCore?.silent_sentence ?? truth.tension ?? 'a private state the surface does not name';

  if (is_mask_present) notes.push(`mask present — surface ${surface_coherence_score.toFixed(1)}/10, fracture ${internal_fracture_score.toFixed(1)}/10`);
  else notes.push('no measurable mask — surface and internal state are aligned');

  return {
    surface_coherence_score,
    internal_fracture_score,
    mask_gap,
    surface_signals: detected.slice(0, 3),
    hidden_state_description,
    is_mask_present,
    notes,
  };
}
