/**
 * INSTAGRAM SENSORY ADAPTER (Wave 17.9 — Embodied Runtime Presence)
 *
 * The first weak sensory adapter. Read-only. Meaning-first. The
 * adapter does NOT talk to Instagram. It receives an already-typed
 * `InstagramObservation` from whatever upstream lens transforms raw
 * platform JSON (or fixtures, or a future API client) into meaning-
 * bearing fields, and maps that observation to typed
 * `ExternalPressureReading`s the gateway can digest.
 *
 * The separation matters. When real Instagram access arrives later,
 * the only thing that changes is the *upstream lens* — the NLP /
 * tone-classification / pattern-detection that fills in the
 * observation. This adapter itself never sees raw API data, never
 * touches credentials, and never writes anything anywhere. It is a
 * pure transformation: observation → readings.
 *
 * The user named eight meaning-bearing signals; this adapter
 * receives them as typed fields:
 *
 *   - emotional polarity        → sentiment-drift
 *   - comment tone drift        → sentiment-drift (with weight)
 *   - audience fatigue markers  → audience-fatigue
 *   - repetition density        → audience-fatigue (with weight)
 *   - contradiction clustering  → cultural-tension
 *   - silence after posting     → attention-availability (negative)
 *   - trust language emergence  → trust-velocity (positive)
 *   - coercive patterns         → resonance-decay (positive = decaying)
 *
 * Likes, follower counts, growth metrics are intentionally NOT in
 * the observation type. The adapter cannot consume what it cannot
 * receive.
 */

import type { ExternalPressureReading } from '../pressureIngestionGateway';

/** A single comment, already processed by the upstream lens into
 *  meaning-bearing fields. The lens does the NLP; the adapter does
 *  the mapping. */
export interface InstagramCommentSample {
  /** ms after the parent post was published. */
  postedAfterMs: number;
  /** -1..1 — emotional polarity. */
  tone: number;
  /** True when the comment uses trust-building vocabulary. */
  trustLanguage: boolean;
  /** True when the comment uses pressure / coercion patterns. */
  coercivePattern: boolean;
  /** True when the comment repeats a theme already strongly present. */
  repeatsPriorTheme: boolean;
}

/** What the adapter receives. Notice what is absent: like counts,
 *  follower counts, growth metrics. */
export interface InstagramObservation {
  /** Stable identifier for the source post. */
  postId: string;
  postedAt: number;
  observedAt: number;
  /** Comments processed by the upstream lens. */
  comments: InstagramCommentSample[];
  /** ms of silence since the most recent comment (or since posting
   *  if no comments). Used as the attention-availability signal. */
  silenceAfterPostMs: number;
}

const SOURCE = 'instagram-sensory';

/** Helper. */
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }

/**
 * Read an Instagram observation and produce typed pressure readings.
 *
 * Pure function: same observation in, same readings out. No side
 * effects, no I/O, no platform-specific knowledge. The readings will
 * be digested by the gateway exactly the way every other adapter's
 * readings will be — the architectural contract is uniform.
 *
 * The observation is meant to come from a thin upstream lens that
 * has already done sentiment / pattern detection on raw API data.
 * That lens is intentionally NOT this module's job.
 */
export function readInstagramObservation(obs: InstagramObservation): ExternalPressureReading[] {
  const out: ExternalPressureReading[] = [];
  const at = obs.observedAt;
  const n = obs.comments.length;

  // ── EMOTIONAL POLARITY → sentiment-drift ────────────────────
  // Average tone across all comments. Confidence rises with the
  // number of samples (cap at 0.9 — never absolute certainty).
  if (n > 0) {
    const meanTone = obs.comments.reduce((s, c) => s + c.tone, 0) / n;
    const confidence = clamp(Math.min(0.9, n / 20), 0, 0.9);
    out.push({
      kind: 'sentiment-drift',
      vector: clamp(meanTone, -1, 1),
      confidence,
      source: SOURCE,
      at,
    });
  }

  // ── REPETITION DENSITY → audience-fatigue ───────────────────
  // Fraction of comments repeating a theme already strongly
  // present. A high repetition rate is fatigue forming.
  if (n >= 3) {
    const repeating = obs.comments.filter((c) => c.repeatsPriorTheme).length;
    const rate = repeating / n;
    // 0% repetition → vector 0; 100% → vector +0.9 (heavy fatigue).
    out.push({
      kind: 'audience-fatigue',
      vector: clamp(rate * 0.9, -1, 1),
      confidence: clamp(Math.min(0.8, n / 20), 0, 0.8),
      source: SOURCE,
      at,
    });
  }

  // ── CONTRADICTION CLUSTERING → cultural-tension ─────────────
  // Tension rises when comments are split — many positives AND
  // many negatives. Measured as the product of positive-share and
  // negative-share, scaled to [0..1].
  if (n >= 4) {
    const pos = obs.comments.filter((c) => c.tone > 0.2).length / n;
    const neg = obs.comments.filter((c) => c.tone < -0.2).length / n;
    // Maximum split (50/50) → product 0.25 → tension 1.0.
    const tension = clamp(pos * neg * 4, 0, 1);
    out.push({
      kind: 'cultural-tension',
      vector: tension,
      confidence: clamp(Math.min(0.75, n / 25), 0, 0.75),
      source: SOURCE,
      at,
    });
  }

  // ── SILENCE AFTER POSTING → attention-availability (negative) ──
  // Long silence is low availability. Mapping: 1 hour of silence
  // → vector 0; 24 hours → vector -0.9.
  {
    const hours = obs.silenceAfterPostMs / (1000 * 60 * 60);
    const v = clamp(-(hours - 1) / 24, -1, 0.2);
    out.push({
      kind: 'attention-availability',
      vector: v,
      confidence: 0.6,
      source: SOURCE,
      at,
    });
  }

  // ── TRUST LANGUAGE EMERGENCE → trust-velocity (positive) ────
  // Fraction of comments using trust-building vocabulary.
  if (n > 0) {
    const trust = obs.comments.filter((c) => c.trustLanguage).length / n;
    // 0% → 0; 50% → +0.7 (very strong signal, trust language is rare).
    out.push({
      kind: 'trust-velocity',
      vector: clamp(trust * 1.4, -1, 1),
      confidence: clamp(Math.min(0.7, n / 25), 0, 0.7),
      source: SOURCE,
      at,
    });
  }

  // ── COERCIVE PATTERNS → resonance-decay (positive = decaying) ──
  // When the audience starts using coercive / demanding patterns,
  // the resonance has weakened: people are pushing instead of
  // receiving.
  if (n > 0) {
    const coercive = obs.comments.filter((c) => c.coercivePattern).length / n;
    out.push({
      kind: 'resonance-decay',
      vector: clamp(coercive * 1.2, -1, 1),
      confidence: clamp(Math.min(0.7, n / 20), 0, 0.7),
      source: SOURCE,
      at,
    });
  }

  return out;
}
