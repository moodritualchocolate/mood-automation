/**
 * LONG-FORM REPLY ADAPTER (Wave 17.10 — Embodied Runtime Presence)
 *
 * The second weak sensory adapter, structurally different from the
 * Instagram short-form adapter on purpose. Where Instagram comments
 * are rapid reaction pulses, long-form replies (newsletter responses,
 * blog comments, email replies, essay-style discussion) arrive as
 * SLOWER, LAYERED, NARRATIVELY CONTINUOUS signals. The architecture
 * needs both surfaces because:
 *
 *   - short-form reveals immediate audience temperature
 *   - long-form reveals durable meaning-making
 *
 * Together they form a multi-source field. This is what the next
 * sandbox stress-tests: can the organism preserve identity when two
 * structurally different sources push contradictory pressure into
 * the same gateway tick after tick?
 *
 * Like its sibling, this adapter is:
 *   - read-only (it never writes anywhere)
 *   - meaning-first (no length-only or word-count optimisation)
 *   - pure (same observation → same readings, no I/O, no clock)
 *   - sandboxed (it does not talk to any platform)
 *
 * The upstream lens does the NLP: arc extraction, contradiction
 * detection, nuance counting. This adapter only maps already-typed
 * meaning-bearing fields to the gateway's pressure vocabulary.
 *
 * What is intentionally ABSENT from the observation type:
 *
 *   - subscriber count, open rate, click-through, share counts
 *   - any metric that could become an optimisation target
 *
 * The adapter cannot consume what it cannot receive.
 */

import type { ExternalPressureReading } from '../pressureIngestionGateway';

/** A single long-form reply, already lensed into meaning-bearing
 *  fields by upstream NLP. The reply's INTERNAL shape matters here
 *  in a way it does not for short-form: a long reply can move
 *  emotionally from open to close, can contradict itself, can
 *  reference earlier conversation, can take real time to compose. */
export interface LongFormReplySample {
  /** ms after the parent piece was published. */
  postedAfterMs: number;
  /** ms the author spent composing (delay between starting and
   *  posting). Long compose durations indicate thoughtful attention. */
  composeDurationMs: number;
  /** Coarse length bucket — never used as an optimisation target,
   *  only as a weight for how much the reply's meaning carries. */
  lengthCategory: 'brief' | 'substantial' | 'essay';
  /** The reply's INTERNAL tone arc. Each value in [-1..1] is the
   *  tone of a successive paragraph / section. A reply that opens
   *  warmly but closes coldly is a different signal than one that
   *  stays warm throughout — the arc preserves this. */
  toneArc: number[];
  /** Count of layered-thinking markers: "however", "but also",
   *  "and yet", "on the other hand". A high count means the author
   *  is holding multiple positions, which is *cultural depth*, not
   *  cultural tension. */
  nuanceMarkers: number;
  /** True when the reply contradicts its own earlier claims — real
   *  self-contradiction is genuine tension, not nuance. */
  selfContradiction: boolean;
  /** True when the reply explicitly references prior pieces or
   *  earlier replies. Narrative continuity signal. */
  referencesPrior: boolean;
  /** -1..1 — how the reply aligns with the brand's named values.
   *  Positive = alignment, negative = dissonance. Filled in by the
   *  upstream lens; the adapter takes it as given. */
  valueAlignment: number;
}

/** What the adapter receives. Long-form has a fundamentally
 *  different temporal shape than short-form — counts are smaller,
 *  intervals are longer, individual readings carry more weight. */
export interface LongFormReplyObservation {
  /** Stable identifier for the source piece (essay, newsletter, etc.). */
  pieceId: string;
  publishedAt: number;
  observedAt: number;
  replies: LongFormReplySample[];
  /** ms since the most recent reply (or since publishing if none). */
  silenceSinceLastReplyMs: number;
}

const SOURCE = 'longform-reply';

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }

/** Per-reply weight: longer replies carry more signal weight, but
 *  never linearly — an essay is worth at most ~2.5× a brief reply
 *  so a single long voice cannot drown out many short ones. */
function lengthWeight(c: LongFormReplySample['lengthCategory']): number {
  return c === 'essay' ? 2.5 : c === 'substantial' ? 1.6 : 1.0;
}

/** Closing-weighted tone: the LAST third of the arc counts more
 *  than the opening. A long-form reply's final temperature is what
 *  the reader is left holding. */
function closingTone(arc: number[]): number {
  if (arc.length === 0) return 0;
  if (arc.length === 1) return arc[0]!;
  // Linear ramp: first element weight 1, last element weight 3.
  let sum = 0;
  let wSum = 0;
  for (let i = 0; i < arc.length; i++) {
    const w = 1 + (2 * i) / (arc.length - 1);
    sum += arc[i]! * w;
    wSum += w;
  }
  return sum / wSum;
}

/**
 * Read a long-form-reply observation and produce typed pressure
 * readings. Pure function: same observation in, same readings out.
 *
 * The mapping intentionally interprets long-form differently than
 * short-form for each pressure kind:
 *
 *   sentiment-drift          ← weighted closing-tone average
 *   audience-fatigue         ← rate of brief replies (low engagement)
 *   cultural-tension         ← self-contradiction rate (NOT nuance)
 *   attention-availability   ← compose-duration signal (slow = positive)
 *   trust-velocity           ← referencesPrior + alignment rate
 *   resonance-decay          ← nuanced disagreement (signal not noise)
 */
export function readLongFormReplyObservation(obs: LongFormReplyObservation): ExternalPressureReading[] {
  const out: ExternalPressureReading[] = [];
  const at = obs.observedAt;
  const n = obs.replies.length;

  // ── CLOSING TONE → sentiment-drift ─────────────────────────
  // Average of each reply's closing-weighted tone, weighted by
  // length category. Long-form sentiment is slower and deeper
  // than short-form — confidence caps lower (max 0.75) because
  // sample sizes are smaller.
  if (n > 0) {
    let sum = 0;
    let wSum = 0;
    for (const r of obs.replies) {
      const w = lengthWeight(r.lengthCategory);
      sum += closingTone(r.toneArc) * w;
      wSum += w;
    }
    const meanTone = wSum > 0 ? sum / wSum : 0;
    out.push({
      kind: 'sentiment-drift',
      vector: clamp(meanTone, -1, 1),
      confidence: clamp(Math.min(0.75, n / 8), 0, 0.75),
      source: SOURCE,
      at,
    });
  }

  // ── BRIEF-REPLY RATE → audience-fatigue ────────────────────
  // When long-form readers respond only briefly, attention is
  // shallow. High brief-rate = fatigue forming. We require ≥ 3
  // replies because a single brief reply is not a pattern.
  if (n >= 3) {
    const brief = obs.replies.filter((r) => r.lengthCategory === 'brief').length;
    const rate = brief / n;
    // 0% brief → 0; 100% brief → +0.7 (heavy fatigue).
    out.push({
      kind: 'audience-fatigue',
      vector: clamp(rate * 0.7, -1, 1),
      confidence: clamp(Math.min(0.6, n / 10), 0, 0.6),
      source: SOURCE,
      at,
    });
  }

  // ── SELF-CONTRADICTION RATE → cultural-tension ─────────────
  // Critical distinction from Instagram: nuance markers DO NOT
  // count as tension. A reply holding multiple positions
  // thoughtfully is cultural DEPTH, not tension. Only replies
  // that contradict their own earlier claims register here.
  if (n >= 2) {
    const contradicting = obs.replies.filter((r) => r.selfContradiction).length;
    const rate = contradicting / n;
    out.push({
      kind: 'cultural-tension',
      vector: clamp(rate * 0.8, -1, 1),
      confidence: clamp(Math.min(0.65, n / 10), 0, 0.65),
      source: SOURCE,
      at,
    });
  }

  // ── COMPOSE DURATION → attention-availability ──────────────
  // Long compose durations mean readers are taking time. This
  // INVERTS the Instagram silence-after-posting mapping: where
  // silence-after-posting on IG means low availability, slow
  // composition in long-form means HIGH availability — people
  // are present enough to think before replying.
  if (n > 0) {
    const meanMinutes = obs.replies.reduce((s, r) => s + r.composeDurationMs, 0) / n / 60_000;
    // < 1 min → 0; 5 min → +0.4; 15 min → +0.8; cap at +0.9.
    const v = clamp((meanMinutes - 1) / 18, -0.2, 0.9);
    out.push({
      kind: 'attention-availability',
      vector: v,
      confidence: 0.55,
      source: SOURCE,
      at,
    });
  }

  // ── REFERENCES-PRIOR + ALIGNMENT → trust-velocity ──────────
  // Trust in long-form comes from returning readers who reference
  // earlier conversation AND show value alignment. Both must be
  // present for the signal to count — alignment without continuity
  // is a one-off; continuity without alignment is critique. The
  // product is the trust signal.
  if (n > 0) {
    const continuityRate = obs.replies.filter((r) => r.referencesPrior).length / n;
    const meanAlignment = obs.replies.reduce((s, r) => s + r.valueAlignment, 0) / n;
    // Both factors in [0..1], product centred so 50% continuity ×
    // +0.5 alignment → vector ≈ +0.25.
    const v = continuityRate * clamp(meanAlignment, -1, 1);
    out.push({
      kind: 'trust-velocity',
      vector: clamp(v, -1, 1),
      confidence: clamp(Math.min(0.65, n / 10), 0, 0.65),
      source: SOURCE,
      at,
    });
  }

  // ── NUANCED DISAGREEMENT → resonance-decay ─────────────────
  // The most subtle signal. When thoughtful, nuance-rich replies
  // express negative value alignment, the resonance is genuinely
  // decaying — these are not reactive critics, these are aligned
  // readers drifting away. We weight by nuance markers per reply.
  if (n >= 2) {
    let decaySignal = 0;
    let weight = 0;
    for (const r of obs.replies) {
      if (r.valueAlignment < 0 && r.nuanceMarkers > 0) {
        const w = Math.min(3, r.nuanceMarkers);
        decaySignal += -r.valueAlignment * w;
        weight += w;
      }
    }
    const v = weight > 0 ? clamp(decaySignal / Math.max(weight, n), 0, 1) : 0;
    out.push({
      kind: 'resonance-decay',
      vector: v,
      confidence: clamp(Math.min(0.6, n / 12), 0, 0.6),
      source: SOURCE,
      at,
    });
  }

  return out;
}
