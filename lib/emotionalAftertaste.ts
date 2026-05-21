/**
 * EMOTIONAL AFTERTASTE ENGINE (Phase 5)
 *
 * This becomes the PRIMARY SUCCESS METRIC.
 *
 * Not CTR. Not engagement spike. Success = emotional residue after
 * viewing.
 *
 * Eight named axes from the spec — each 0..10:
 *   remembered_contradiction
 *   emotional_echo
 *   atmosphere_persistence
 *   identity_resonance
 *   internal_recognition
 *   emotional_stickiness
 *   quiet_memorability
 *   post_view_emotional_state  (descriptive, not numeric)
 *
 * This is a richer companion to lib/aftertaste.ts (Phase 4). That module
 * tracks the storage + signal-weighted residue strength used by the
 * meta-critic. THIS module names the EMOTIONAL components — the
 * vocabulary a director would use when reviewing residue.
 *
 * The two work together: Phase 4 stores a single residue strength +
 * memory phrase; Phase 5 decomposes that residue into the named axes
 * so the campaign brain can see which axes are flat and adjust.
 */

import type { ReferenceDNA } from './referenceDNA';
import type { Reaction } from './humanReaction';
import type { EmotionalCore } from './humanTruthEngine';

export interface EmotionalAftertaste {
  remembered_contradiction: number;
  emotional_echo: number;
  atmosphere_persistence: number;
  identity_resonance: number;
  internal_recognition: number;
  emotional_stickiness: number;
  quiet_memorability: number;
  post_view_emotional_state: string;
  /** 0..10 weighted composite — meta-critic primary signal. */
  composite: number;
  /** Named contributors. */
  positive_drivers: string[];
  /** Named drains. */
  negative_drains: string[];
}

export interface AftertasteInput {
  bannerDNA: ReferenceDNA;
  reactionAt3s: Reaction;
  tensionPhrase: string;
  truthText: string;
  emotionalCore: EmotionalCore | null;
  /** Optional — when signals exist, refine the prediction. */
  observed?: {
    saves: number;
    shares: number;
    emotionalComments: number;
    replays: number;
    negative: number;
    impressions: number;
  };
}

export function predictEmotionalAftertaste(input: AftertasteInput): EmotionalAftertaste {
  const { bannerDNA, reactionAt3s, tensionPhrase, truthText, emotionalCore, observed } = input;
  const positives: string[] = [];
  const drains: string[] = [];

  // ─── remembered_contradiction ─────────────────────────────────
  // The viewer remembers the BANNER if the contradiction was sharp.
  let remembered_contradiction = 3 + bannerDNA.tension_map * 5;
  if (tensionPhrase && tensionPhrase.length > 0 && tensionPhrase.length < 40) {
    remembered_contradiction += 1.5;
    positives.push(`sharp contradiction phrase "${tensionPhrase}"`);
  }
  remembered_contradiction = clamp10(remembered_contradiction);

  // ─── emotional_echo ───────────────────────────────────────────
  // How much the banner reverberates AFTER the viewer has scrolled past.
  // High when the closing reaction is unresolved (emotional-tension,
  // discomfort) and the truth is short and specific.
  const echoBonus = { 'emotional tension': 2.5, intimacy: 1.8, discomfort: 2.0, curiosity: 1.5, recognition: 1.2, interruption: 1.0, validation: 0.5, aspiration: 0.3, confusion: 0.6, indifference: -2, rejection: -2.5 }[reactionAt3s] ?? 0;
  let emotional_echo = 4 + echoBonus + (truthText.length < 80 ? 1.2 : 0);
  emotional_echo = clamp10(emotional_echo);
  if (echoBonus >= 1.5) positives.push(`unresolved closing reaction "${reactionAt3s}"`);
  if (echoBonus < 0) drains.push(`closing reaction "${reactionAt3s}" silences the echo`);

  // ─── atmosphere_persistence ───────────────────────────────────
  // The mood the banner leaves in the room. Restraint + anti-commercial
  // + documentary weight are the contributors.
  const atmosphere_persistence = clamp10(
    bannerDNA.anti_commercial_feel * 4 + bannerDNA.luxury_restraint * 3 + bannerDNA.documentary_weight * 3,
  );
  if (atmosphere_persistence >= 7) positives.push('atmosphere lingers after view');
  if (atmosphere_persistence < 4) drains.push('no atmosphere to persist');

  // ─── identity_resonance ───────────────────────────────────────
  // "This is me". Higher when the emotional core's silent_sentence
  // is the kind of thing the viewer would think word-for-word.
  let identity_resonance = 5 + bannerDNA.emotional_density * 3;
  if (emotionalCore && emotionalCore.silent_sentence.length > 0 && emotionalCore.silent_sentence.length < 100) {
    identity_resonance += 1.5;
    positives.push('silent sentence reads like an internal thought');
  }
  identity_resonance = clamp10(identity_resonance);

  // ─── internal_recognition ────────────────────────────────────
  // The "I have lived this exact second" moment. Highest when realism +
  // documentary weight + tension are aligned.
  const internal_recognition = clamp10(
    bannerDNA.realism_type * 4 + bannerDNA.documentary_weight * 3 + bannerDNA.tension_map * 3,
  );
  if (internal_recognition >= 8) positives.push('reads as an observed second from the viewer’s own life');

  // ─── emotional_stickiness ────────────────────────────────────
  // Will the viewer think about this banner tomorrow?
  let emotional_stickiness = (remembered_contradiction + emotional_echo) / 2 - 1;
  if (observed) {
    const imps = Math.max(1, observed.impressions);
    const stickRate = (observed.saves + observed.replays + observed.emotionalComments * 2) / imps;
    emotional_stickiness += clamp(stickRate * 30, 0, 2.5);
    if (stickRate > 0.04) positives.push('saves + replays + emotional comments confirm stickiness');
    const negRate = observed.negative / imps;
    if (negRate > 0.03) {
      emotional_stickiness -= clamp(negRate * 30, 0, 2);
      drains.push(`${(negRate * 100).toFixed(1)}% negative reactions`);
    }
  }
  emotional_stickiness = clamp10(emotional_stickiness);

  // ─── quiet_memorability ───────────────────────────────────────
  // Memorability earned through silence rather than shouting.
  let quiet_memorability = clamp10(
    bannerDNA.silence_ratio * 5 + bannerDNA.luxury_restraint * 3 + (bannerDNA.negative_space_usage * 2),
  );
  if (quiet_memorability >= 7) positives.push('quietly memorable — the silence does the work');

  // ─── post_view_emotional_state ────────────────────────────────
  const post_view_emotional_state = describePostViewState({
    reactionAt3s, remembered_contradiction, emotional_echo, atmosphere_persistence,
  });

  // ─── composite ───────────────────────────────────────────────
  const components = [
    remembered_contradiction, emotional_echo, atmosphere_persistence,
    identity_resonance, internal_recognition, emotional_stickiness, quiet_memorability,
  ];
  const composite = clamp10(components.reduce((a, b) => a + b, 0) / components.length);

  return {
    remembered_contradiction,
    emotional_echo,
    atmosphere_persistence,
    identity_resonance,
    internal_recognition,
    emotional_stickiness,
    quiet_memorability,
    post_view_emotional_state,
    composite,
    positive_drivers: positives,
    negative_drains: drains,
  };
}

function describePostViewState(args: { reactionAt3s: Reaction; remembered_contradiction: number; emotional_echo: number; atmosphere_persistence: number; }): string {
  const { reactionAt3s, remembered_contradiction, emotional_echo, atmosphere_persistence } = args;
  if (remembered_contradiction >= 7 && emotional_echo >= 7) return 'viewer carries the contradiction into their next scroll';
  if (atmosphere_persistence >= 7 && emotional_echo >= 6) return 'viewer feels a quiet residue of the room without remembering the banner specifically';
  if (reactionAt3s === 'intimacy') return 'viewer remembers being seen';
  if (reactionAt3s === 'discomfort' && emotional_echo >= 6) return 'viewer flinched — and the flinch did not leave';
  if (reactionAt3s === 'indifference' || reactionAt3s === 'rejection') return 'viewer has already forgotten';
  return 'viewer has a faint impression — the banner did its job at low resolution';
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
