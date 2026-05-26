/**
 * HOOK LIFECYCLE ENGINE (pure, observational)
 *
 * Tracks the freshness / saturation / recovery of specific HOOK
 * archetypes (the opening 1-3 seconds of a generation). Hooks are
 * identified by their narrativeSignature — examples:
 *
 *   "split-screen-emotional-realism"
 *   "stillness-silence"
 *   "fast-panic-escalation"
 *   "israeli-documentary-realism"
 *   "low-cta-emotional-narration"
 *
 * Pure function. Same input → same output. Observational only.
 */

import type { OutcomeRecord, OutcomeMetrics } from './outcomeMemory';

export interface HookLifecycle {
  hook: string;
  occurrences: number;
  firstUsedAt: number;
  lastUsedAt: number;
  /** 0..10 — how fresh the hook still feels (10 = fresh, 0 = saturated). */
  freshness: number;
  /** 0..10 — cumulative exposure pressure (higher = more used). */
  repetitionExposure: number;
  /** Average engagement drop per appearance. Higher = faster saturation. */
  saturationVelocity: number;
  /** Whether the hook has come back from a low. */
  recoveryWindow: boolean;
  /** Recovery success — has the most recent revival outperformed
   *  the historical baseline? */
  revivalSuccess: boolean;
  description: string;
}

// ─── helpers ──────────────────────────────────────────────────

function engagementScore(m: OutcomeMetrics): number {
  // Same composite as decay intelligence; duplicated locally so this
  // module has no internal dependency on decayIntelligence.
  const saves      = Math.min(1, (m.saves ?? 0) / 10);
  const comments   = Math.min(1, (m.comments ?? 0) / 20);
  const shares     = Math.min(1, (m.shares ?? 0) / 10);
  const retention  = m.retention ?? 0;
  const scrollDepth = m.scrollDepth ?? 0;
  const bouncePenalty = 1 - (m.bounceRate ?? 0);
  return Math.max(0, Math.min(10,
    (retention * 0.40 + scrollDepth * 0.15 + saves * 0.15 +
     comments * 0.10 + shares * 0.10 + bouncePenalty * 0.10) * 10,
  ));
}

function r1(n: number): number { return Math.round(n * 10) / 10; }

// ─── main ─────────────────────────────────────────────────────

export function buildHookLifecycle(outcomes: OutcomeRecord[]): HookLifecycle[] {
  const groups = new Map<string, OutcomeRecord[]>();
  for (const r of outcomes) {
    const hook = r.narrativeSignature || 'unknown-hook';
    if (!groups.has(hook)) groups.set(hook, []);
    groups.get(hook)!.push(r);
  }

  const out: HookLifecycle[] = [];
  for (const [hook, records] of groups) {
    if (records.length < 1) continue;
    records.sort((a, b) => a.at - b.at);
    const scores = records.map((r) => engagementScore(r.metrics));
    const half = Math.max(1, Math.floor(scores.length / 2));
    const earlyMean = scores.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half);
    const recentMean = scores.slice(-half).reduce((a, b) => a + b, 0) / Math.max(1, half);
    const avgMean = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Freshness: high when recent ≈ early; low when recent has dropped.
    // Mapped from the early→recent ratio.
    const ratio = earlyMean === 0 ? 1 : recentMean / Math.max(0.01, earlyMean);
    const freshness = Math.max(0, Math.min(10, ratio * 10 - Math.max(0, records.length - 2)));

    const repetitionExposure = Math.min(10, records.length);

    // Saturation velocity: (earlyMean - recentMean) / occurrences.
    // Positive value = engagement falls per appearance.
    const saturationVelocity = r1(Math.max(0, (earlyMean - recentMean) / Math.max(1, records.length - 1)));

    // Recovery window: dip + bounce-back pattern.
    // Approximation: there exists an internal low (mid scores) and the
    // most recent score is above the average.
    const midScores = scores.slice(Math.floor(scores.length * 0.25), Math.floor(scores.length * 0.75));
    const internalLow = midScores.length > 0 ? Math.min(...midScores) : recentMean;
    const recoveryWindow = scores.length >= 4 && internalLow < avgMean * 0.75 && recentMean >= avgMean;
    const revivalSuccess = recoveryWindow && recentMean >= earlyMean;

    out.push({
      hook,
      occurrences: records.length,
      firstUsedAt: records[0].at,
      lastUsedAt: records[records.length - 1].at,
      freshness: r1(freshness),
      repetitionExposure: r1(repetitionExposure),
      saturationVelocity,
      recoveryWindow,
      revivalSuccess,
      description:
        `"${hook}" — ${records.length} use${records.length === 1 ? '' : 's'} · ` +
        `freshness ${r1(freshness)}/10 · saturation velocity ${saturationVelocity}/run` +
        (recoveryWindow ? ' · recovery observed' : ''),
    });
  }

  out.sort((a, b) =>
    b.occurrences - a.occurrences ||
    a.saturationVelocity - b.saturationVelocity ||
    a.hook.localeCompare(b.hook),
  );

  return out;
}
