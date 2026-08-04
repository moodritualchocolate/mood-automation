/**
 * BEHAVIORAL RESIDUE (Phase 18)
 *
 * The survival behaviors that LINGER across days. Not the loop in
 * the moment, not the escape during the meeting — but the slow
 * sediment that builds up across a week, a month, a season, of
 * coping the body did not consciously schedule.
 *
 * Conceptually distinct from:
 *   - Phase 9   emotionalSequence       (the EMOTIONAL arc across banners)
 *   - Phase 15  truthPersistence        (truths that recur as PHRASES)
 *   - Phase 15  emotionalDecay          (truths going decorative)
 *   - Phase 18  behaviorLoopEngine      (LOOPS in-the-moment)
 *
 * Behavioral residue tracks the WEIGHT a body is carrying because
 * it has been doing micro-escapes, compensation rituals, silent
 * coping, and behavior loops day after day without rest. The
 * residue is what's still in the body on Wednesday from what the
 * body did on Sunday.
 *
 * The engine answers two questions:
 *
 *   1. Across this campaign, which survival behaviors have we been
 *      repeatedly observing? Where is the residue accumulating?
 *
 *   2. Does the candidate banner SEE its own residue — i.e. does
 *      it understand the body it's photographing has been carrying
 *      this for weeks, not just today?
 *
 * Scored on:
 *   carryover_score          — how much past-survival is in the body now
 *   recurrence_density        — how many recent banners repeated the same
 *                              behavior (a fingerprint of the campaign)
 *   timeline_awareness        — does the banner photograph TIME, not
 *                              just a single moment? (the cinematic ideal)
 *   sediment_visibility       — does the candidate make the residue
 *                              physically visible (posture, face, hands)
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { BehaviorLoopReading, BehaviorLoopId } from './behaviorLoopEngine';
import type { MicroEscapeReading, MicroEscapeId } from './microEscapeDetection';
import type { CompensationRitualReading, CompensationRitualId } from './ritualCompensation';
import type { FakeRecoveryReading, FakeRecoveryId } from './fakeRecovery';
import type { SilentCopingReading, SilentCopingId } from './silentCopingMechanisms';
import type { EmotionalTraceEntry } from './humanMemory';

export type SurvivalKind = 'loop' | 'escape' | 'ritual' | 'fake-recovery' | 'silent-coping';

export interface SurvivalFingerprint {
  kind: SurvivalKind;
  id: string;
  count: number;       // recurrence in recent trail (banners)
  lastSeen: number;    // timestamp
}

export interface BehavioralResidueReading {
  /** All survival fingerprints observed across the recent campaign trail
   *  (count >= 1). */
  fingerprints: SurvivalFingerprint[];
  /** The most repeated fingerprint, if any. */
  most_repeated: SurvivalFingerprint | null;
  /** 0..10 — how much past-survival the candidate banner is carrying. */
  carryover_score: number;
  /** 0..10 — how dense the recurrence is across the campaign trail. */
  recurrence_density: number;
  /** 0..10 — does the truth-text photograph TIME, not just a moment? */
  timeline_awareness: number;
  /** 0..10 — does the truth/scene make the residue physically visible? */
  sediment_visibility: number;
  /** True when the candidate banner reads as carrying weeks of residue. */
  carries_weeks_not_minutes: boolean;
  /** True when the campaign trail keeps repeating the same coping
   *  behavior — the residue is becoming a campaign signature. */
  residue_becoming_signature: boolean;
  notes: string[];
}

export interface BehavioralResidueInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  /** Phase 18 readings from THIS banner — used to register the
   *  fingerprint and to score residue. */
  behaviorLoop: BehaviorLoopReading;
  microEscape: MicroEscapeReading;
  ritualCompensation: CompensationRitualReading;
  fakeRecovery: FakeRecoveryReading;
  silentCoping: SilentCopingReading;
  /** Recent emotional trail entries — used to count recurrence. The
   *  trail is mined for ids appearing in residue strings or in state
   *  family / truth phrases that match Phase 18 behaviors. */
  recentTrail: EmotionalTraceEntry[];
}

// Truth-text patterns suggesting the photograph captures time itself.
const TIMELINE_PATTERNS = /\b(again|still|every|always|all week|all month|days?|weeks?|by (now|wednesday|friday|the (end|time))|carried|carrying|kept|keeps|hasn[' ]?t (slept|stopped|broken|recovered))\b/i;
// Body-evidence patterns suggesting sediment is physically visible.
const SEDIMENT_PATTERNS = /\b(shoulder(s)?|jaw|eyes?|skin|face|hands?|posture|slouch|hunch|grip|grip(s|ping)?|shadow under)\b/i;

export function readBehavioralResidue(input: BehavioralResidueInput): BehavioralResidueReading {
  const {
    state, truth, emotionalCore,
    behaviorLoop, microEscape, ritualCompensation, fakeRecovery, silentCoping,
    recentTrail,
  } = input;
  const notes: string[] = [];

  // ─── Build fingerprints from the recent trail ──────────────────
  // We infer fingerprints by string-matching loop/escape/ritual ids
  // and key phrases against the trail's residue + truth + tension.
  const fingerprintCounts = new Map<string, SurvivalFingerprint>();
  const bump = (kind: SurvivalKind, id: string, ts: number) => {
    const key = `${kind}:${id}`;
    const existing = fingerprintCounts.get(key);
    if (existing) {
      existing.count += 1;
      if (ts > existing.lastSeen) existing.lastSeen = ts;
    } else {
      fingerprintCounts.set(key, { kind, id, count: 1, lastSeen: ts });
    }
  };

  const PHRASE_LOOPS: Array<[BehaviorLoopId, RegExp]> = [
    ['doomscroll',                       /\b(doomscroll|scrolling|feed|infinite scroll)\b/i],
    ['reopen-laptop',                    /\b(laptop|reopened|opened (it|the laptop) again)\b/i],
    ['refresh-inbox',                    /\b(inbox|refresh(es|ed|ing)?|email|unread)\b/i],
    ['tab-switching',                    /\b(tab|tabs|cmd[- ]?tab|switch(ing|ed)?)\b/i],
    ['fridge-without-hunger',            /\b(fridge|not hungry|opened the fridge)\b/i],
    ['phone-during-family',              /\b(phone|kid|child|family)\b/i],
    ['one-more-thing-before-sleep',      /\b(one more|just one more|before sleep|23:|midnight)\b/i],
    ['lock-screen-pull',                 /\b(lock[- ]?screen|notification|pull[- ]?down)\b/i],
    ['reply-rehearsal',                  /\b(reply|typed and deleted|drafted)\b/i],
    ['pacing-without-destination',       /\b(pace|paced|pacing|walked the kitchen)\b/i],
  ];
  const PHRASE_ESCAPES: Array<[MicroEscapeId, RegExp]> = [
    ['bathroom-scrolling',                /\b(bathroom|stall|toilet)\b/i],
    ['parked-car-silence',                /\b(car|parked|driveway|engine off)\b/i],
    ['fake-productivity',                 /\b(looked busy|fake[- ]?busy|productivity theater)\b/i],
    ['disappearing-into-phone',           /\b(phone glance|checked their phone|dropped to the screen)\b/i],
    ['lingering-after-shower',            /\b(shower|towel|edge of the bed)\b/i],
    ['unnecessary-errand',                /\b(errand|run to|grocery|milk run|pharmacy)\b/i],
    ['staring-moment',                    /\b(staring|stared|zoned out|at nothing)\b/i],
  ];
  const PHRASE_RITUALS: Array<[CompensationRitualId, RegExp]> = [
    ['third-coffee',                      /\b(third coffee|another coffee|coffee #3)\b/i],
    ['nighttime-snack',                   /\b(midnight snack|fridge at|2(2|3):\d{2})\b/i],
    ['long-shower-as-pause',              /\b(long shower|shower running|stood in the shower)\b/i],
    ['late-afternoon-sugar',              /\b(sugar|chocolate|candy|the drawer)\b/i],
    ['post-bedtime-alcohol',              /\b(after the kids|glass of wine|just one|nightcap)\b/i],
    ['fridge-light-at-23-45',             /\b(fridge light|fridge at night)\b/i],
    ['energy-drink-at-15-30',             /\b(energy drink|red bull|can opens)\b/i],
  ];
  const PHRASE_FAKE: Array<[FakeRecoveryId, RegExp]> = [
    ['sunday-reset-as-second-workday',    /\b(sunday reset|reset day|meal[- ]?prep)\b/i],
    ['meditation-app-checklist',          /\b(meditation app|streak|10[- ]?minute session)\b/i],
    ['workout-as-anxiety-burnoff',        /\b(workout|run|gym|burn off)\b/i],
    ['nature-walk-on-a-call',             /\b(walking meeting|trail.*call|airpods.*walk)\b/i],
    ['rest-day-on-slack-from-bed',        /\b(PTO|day off.*slack|quick checks)\b/i],
    ['weekend-trip-that-was-work-with-views',/\b(workation|getaway.*laptop|airbnb)\b/i],
  ];
  const PHRASE_COPING: Array<[SilentCopingId, RegExp]> = [
    ['jaw-unclench',                       /\b(jaw|unclench(ed|ing)?)\b/i],
    ['breath-held-then-released',          /\b(held (her|his|their) breath|exhaled finally|breath released)\b/i],
    ['silent-withdrawal',                  /\b(stopped talking|stopped contributing|went quiet)\b/i],
    ['internal-monologue-muting',          /\b(went silent inside|inner voice (off|quiet))\b/i],
    ['private-decompression',              /\b(shoulders dropped|posture different|after the door)\b/i],
    ['two-second-eye-close',               /\b(eyes closed|closed (her|his|their) eyes)\b/i],
    ['face-wash-as-reset',                 /\b(cold water on (the|her|his|their) face|face wash)\b/i],
  ];

  for (const t of recentTrail.slice(0, 30)) {
    const hay = `${t.truth} ${t.tension} ${t.residue}`;
    for (const [id, rx] of PHRASE_LOOPS)   if (rx.test(hay)) bump('loop',          id, t.createdAt);
    for (const [id, rx] of PHRASE_ESCAPES) if (rx.test(hay)) bump('escape',        id, t.createdAt);
    for (const [id, rx] of PHRASE_RITUALS) if (rx.test(hay)) bump('ritual',        id, t.createdAt);
    for (const [id, rx] of PHRASE_FAKE)    if (rx.test(hay)) bump('fake-recovery', id, t.createdAt);
    for (const [id, rx] of PHRASE_COPING)  if (rx.test(hay)) bump('silent-coping', id, t.createdAt);
  }
  // Add the current banner's primary readings to the fingerprints too.
  const now = Date.now();
  if (behaviorLoop.primary_loop)        bump('loop',          behaviorLoop.primary_loop.id, now);
  if (microEscape.primary)              bump('escape',        microEscape.primary.id, now);
  if (ritualCompensation.primary)       bump('ritual',        ritualCompensation.primary.id, now);
  if (fakeRecovery.primary)             bump('fake-recovery', fakeRecovery.primary.id, now);
  if (silentCoping.primary)             bump('silent-coping', silentCoping.primary.id, now);

  const fingerprints = Array.from(fingerprintCounts.values()).sort((a, b) => b.count - a.count);
  const most_repeated = fingerprints[0] ?? null;

  // ─── Carryover score ──────────────────────────────────────────
  // The body is carrying past-survival when (a) recent banners have
  // accumulated the same behavior multiple times, (b) the current
  // banner's primary loop is COMPULSIVE or SUBCONSCIOUS, (c) the truth
  // uses timeline language.
  let carryover_score = 0;
  if (most_repeated && most_repeated.count >= 3) carryover_score += 5;
  else if (most_repeated && most_repeated.count >= 2) carryover_score += 3;
  if (behaviorLoop.is_automatic) carryover_score += 2;
  if (microEscape.in_the_act) carryover_score += 1;
  if (ritualCompensation.ritual_compulsion >= 7) carryover_score += 1;
  if (fakeRecovery.performs_rest) carryover_score += 1;
  carryover_score = clamp10(carryover_score);

  // ─── Recurrence density across trail ──────────────────────────
  const distinctRepeats = fingerprints.filter((f) => f.count >= 2).length;
  let recurrence_density = clamp10(distinctRepeats * 1.5);
  // If the trail is too thin to mean anything, scale down.
  if (recentTrail.length < 4) recurrence_density = Math.min(recurrence_density, 3);

  // ─── Timeline awareness ───────────────────────────────────────
  const timeline_awareness = TIMELINE_PATTERNS.test(truth.truth) ? 8 : 3;

  // ─── Sediment visibility ──────────────────────────────────────
  let sediment_visibility = SEDIMENT_PATTERNS.test(truth.truth) ? 7 : 3;
  if (silentCoping.captures_real_humanity >= 7) sediment_visibility += 2;
  sediment_visibility = clamp10(sediment_visibility);

  // ─── Composite booleans ───────────────────────────────────────
  const carries_weeks_not_minutes =
    carryover_score >= 6 && timeline_awareness >= 6;
  const residue_becoming_signature =
    most_repeated !== null && most_repeated.count >= 4;

  // ─── Notes ────────────────────────────────────────────────────
  if (most_repeated) {
    notes.push(
      `most-repeated survival behavior: ${most_repeated.kind}:${most_repeated.id} (×${most_repeated.count})`,
    );
  } else {
    notes.push('no recurring survival behavior in the trail');
  }
  if (carries_weeks_not_minutes) {
    notes.push('banner photographs accumulated TIME — not a single moment');
  }
  if (residue_becoming_signature) {
    notes.push('WARNING: residue is becoming a campaign signature — risk of repetition');
  }
  if (timeline_awareness < 4 && carryover_score >= 6) {
    notes.push('body carries weeks of residue but truth uses today-language — banner under-photographs the time');
  }
  // referenced for completeness — emotionalCore informs whether the
  // residue is recognisably one persistent feeling.
  if (emotionalCore) notes.push(`emotional core "${emotionalCore.id}" persists alongside the residue`);
  if (state.family === 'collapse' && carryover_score < 5) {
    notes.push('state is "collapse" but residue is shallow — banner is dramatising collapse without earning it');
  }

  return {
    fingerprints,
    most_repeated,
    carryover_score,
    recurrence_density,
    timeline_awareness,
    sediment_visibility,
    carries_weeks_not_minutes,
    residue_becoming_signature,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
