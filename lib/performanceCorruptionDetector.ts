/**
 * PERFORMANCE CORRUPTION DETECTOR (Phase 33 — Anti-Optimization / Wave 2)
 *
 * Detects the central Wave 2 danger: real data corrupting human
 * truth. A banner can post a better hook, a higher CTR, a louder
 * scroll-stop — and be LESS true. This module catches that trade.
 */

export interface PerformanceCorruptionReading {
  /** 0..10 — how much performance is corrupting truth. */
  corruption_score: number;
  /** True when a performance gain came at the cost of human truth. */
  performance_weakened_truth: boolean;
  /** Named corruption signatures detected. */
  signatures: string[];
  notes: string[];
}

export interface PerformanceCorruptionInput {
  /** 0..10 — the candidate's scroll-stop / hook strength. */
  hookStrength: number;
  /** 0..10 — the candidate's predicted aftertaste / residue. */
  aftertaste: number;
  /** 0..10 — how true the banner is (cognitive-field emergence). */
  truthStrength: number;
  /** True when attention reads as loud rather than true. */
  attentionIsLoud: boolean;
  /** 0..10 — recognition score from the audience / critic. */
  recognition: number;
}

export function readPerformanceCorruption(input: PerformanceCorruptionInput): PerformanceCorruptionReading {
  const { hookStrength, aftertaste, truthStrength, attentionIsLoud, recognition } = input;
  const notes: string[] = [];
  const signatures: string[] = [];

  // Hook improves but aftertaste drops — the spike-over-residue trade.
  if (hookStrength >= 7 && aftertaste < 5) signatures.push('hook-up-aftertaste-down');
  // Loud attention with weak truth — stimulation substituting for truth.
  if (attentionIsLoud && truthStrength < 5) signatures.push('loud-attention-weak-truth');
  // High hook but low recognition — CTR rises, recognition falls.
  if (hookStrength >= 7 && recognition < 4) signatures.push('hook-up-recognition-down');

  let corruption_score = 0;
  corruption_score += signatures.length * 3;
  if (truthStrength < 4 && hookStrength >= 6) corruption_score += 2;
  corruption_score = Math.min(10, corruption_score);

  const performance_weakened_truth = signatures.length >= 1 && truthStrength < 6;

  if (performance_weakened_truth) {
    notes.push(`performance corruption: a performance gain weakened human truth — ${signatures.join(', ')}`);
  } else {
    notes.push('performance corruption: none — performance and truth are not in conflict here');
  }

  return { corruption_score, performance_weakened_truth, signatures, notes };
}
