/**
 * ATTENTION DEPLETION ENGINE (Phase 37 — Cognitive Energy Management / Wave 4)
 *
 * Measures whether a banner EXTRACTS more attention than it returns
 * in emotional value. Attention is a finite human resource — a banner
 * that takes more than it gives depletes the very audience it needs.
 *
 * Hard rule: if attention extraction exceeds emotional value, reject.
 */

export interface AttentionDepletionReading {
  /** 0..10 — how much attention the banner extracts. */
  attention_extracted: number;
  /** 0..10 — how much emotional value the banner returns. */
  emotional_value_returned: number;
  /** True when extraction exceeds value — the banner depletes. */
  extraction_exceeds_value: boolean;
  /** 0..10 — net attention economy (positive = gives more than it takes). */
  attention_economy: number;
  notes: string[];
}

export interface AttentionDepletionInput {
  /** 0..10 — scroll-stop / hook strength (attention taken). */
  hookStrength: number;
  /** 0..10 — how loud the attention grab is. */
  loudness: number;
  /** 0..10 — emotional residue / aftertaste (value returned). */
  aftertaste: number;
  /** 0..10 — recognition the banner produces (value returned). */
  recognition: number;
}

export function readAttentionDepletion(input: AttentionDepletionInput): AttentionDepletionReading {
  const { hookStrength, loudness, aftertaste, recognition } = input;
  const notes: string[] = [];

  // Extraction — the attention the banner takes, weighted up by loudness.
  const attention_extracted = round1(clamp10(hookStrength * 0.6 + loudness * 0.4));
  // Value returned — the emotional residue + recognition.
  const emotional_value_returned = round1(clamp10(aftertaste * 0.55 + recognition * 0.45));

  const attention_economy = round1(emotional_value_returned - attention_extracted);
  const extraction_exceeds_value = attention_extracted > emotional_value_returned + 1.5;

  notes.push(`attention depletion: extracted ${attention_extracted}/10 vs returned ${emotional_value_returned}/10 (economy ${attention_economy})`);
  if (extraction_exceeds_value) {
    notes.push('attention depletion: the banner extracts more attention than it returns in emotional value — it depletes the audience');
  }

  return { attention_extracted, emotional_value_returned, extraction_exceeds_value, attention_economy, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
