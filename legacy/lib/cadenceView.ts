/**
 * CADENCE VIEW (Wave 25 — Dynamic Signal Architecture)
 *
 * Cadence is the rhythm of cognition — the inter-act gaps over the
 * recent past. Derived purely from directiveLog timestamps; no
 * stored field. Calm runtime with long pauses reads 'slow'; runtime
 * being driven hard reads 'rapid'; uneven runs read 'bursty'.
 *
 * Only consumes directives that carry an 'at' timestamp (Wave 20+).
 * Pre-Wave-20 entries get skipped automatically.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export type CadenceClassification = 'silent' | 'slow' | 'steady' | 'rapid' | 'bursty';

export interface CadenceViewModel {
  present: boolean;
  recentDeltasMs: number[];
  medianDeltaMs: number;
  classification: CadenceClassification;
  statement: string;
}

export function buildCadenceView(snap: RuntimeSnapshot): CadenceViewModel {
  const os = snap.os;
  if (!os) {
    return {
      present: false, recentDeltasMs: [], medianDeltaMs: 0,
      classification: 'silent', statement: 'cadence unknown — no runtime',
    };
  }

  // Last 9 timestamped acts → 8 inter-act deltas.
  const recent = os.directiveLog
    .filter((d) => typeof d.at === 'number')
    .slice(-9);

  if (recent.length < 2) {
    return {
      present: false, recentDeltasMs: [], medianDeltaMs: 0,
      classification: 'silent',
      statement: 'cadence unknown — fewer than two timestamped acts',
    };
  }

  const deltas: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    deltas.push((recent[i].at as number) - (recent[i - 1].at as number));
  }

  const sorted = [...deltas].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  let classification: CadenceClassification;
  if (median > 30_000) classification = 'slow';
  else if (median > 5_000) classification = 'steady';
  else classification = 'rapid';

  // Burstiness check — large standard deviation relative to mean
  // flips the classification regardless of median.
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const variance = deltas.reduce((a, b) => a + (b - mean) ** 2, 0) / deltas.length;
  const stdev = Math.sqrt(variance);
  if (mean > 0 && stdev > mean * 2) classification = 'bursty';

  return {
    present: true,
    recentDeltasMs: deltas,
    medianDeltaMs: median,
    classification,
    statement:
      `cadence ${classification} — median ${Math.round(median / 1000)}s ` +
      `between recent acts (${deltas.length} samples)`,
  };
}
