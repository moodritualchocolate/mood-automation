/**
 * VISUAL FATIGUE / ADDICTION DETECTOR
 *
 * Prevents robotic repetition. Tracks seven fatigue axes the spec
 * named explicitly:
 *
 *   - layout fatigue
 *   - color fatigue            (proxied by visual_temperature in DNA — same warm/cool used too often)
 *   - hook fatigue             (recent hooks reused or echoed)
 *   - timestamp fatigue        (timestamp dominance used too often)
 *   - typography fatigue       (same dominance used too often)
 *   - product placement fatigue (same product role used too often)
 *   - emotional fatigue        (same family used too often)
 *
 * Hard punish (verdict: 'fatigued') is returned when any single axis
 * exceeds its hard threshold — the meta-critic treats this as a soft
 * reject regardless of other scores.
 */

import type { Banner, MemorySnapshot } from '@/core/types';

export interface FatigueScores {
  layout: number;             // 0..10, higher = more fatigued
  color: number;
  hook: number;
  timestamp: number;
  typography: number;
  productPlacement: number;
  emotional: number;
}

export interface FatigueReport {
  scores: FatigueScores;
  totals: number;             // 0..10 weighted total
  verdict: 'fresh' | 'warm' | 'fatigued';
  flags: string[];            // human-readable named fatigues
}

export interface FatigueInput {
  banner: Pick<Banner, 'direction' | 'state' | 'typography'> & { hook: string };
  memory: MemorySnapshot;
}

export function detectFatigue(input: FatigueInput): FatigueReport {
  const { banner, memory } = input;
  const flags: string[] = [];

  // ─── layout fatigue ────────────────────────────────────────────
  const layoutCount = memory.layoutFatigue[banner.direction.layoutFamily] ?? 0;
  const layout = clamp10(layoutCount * 2.5);
  if (layoutCount >= 3) flags.push(`layout "${banner.direction.layoutFamily}" used ${layoutCount}×`);

  // ─── typography fatigue ────────────────────────────────────────
  const typoCount = memory.typographyFatigue[banner.direction.typographyDominance] ?? 0;
  const typography = clamp10(typoCount * 2.5);
  if (typoCount >= 3) flags.push(`typography dominance "${banner.direction.typographyDominance}" used ${typoCount}×`);

  // ─── timestamp fatigue (a subset of typography but worth its own axis) ─
  const timestampCount = memory.typographyFatigue['timestamp'] ?? 0;
  const timestamp = clamp10(timestampCount * 3.5);
  if (timestampCount >= 2 && banner.direction.typographyDominance === 'timestamp')
    flags.push(`timestamp dominance returning for the ${timestampCount + 1}th time — earn it or skip it`);

  // ─── emotional fatigue ─────────────────────────────────────────
  const familyCount = memory.recurringEmotionalPatterns[banner.state.family] ?? 0;
  const emotional = clamp10(familyCount * 2);
  if (familyCount >= 3) flags.push(`state family "${banner.state.family}" used ${familyCount}×`);

  // ─── hook fatigue ──────────────────────────────────────────────
  // We check the current hook against recent hooks for near-duplicate
  // tokens (the cheap version of semantic similarity).
  const currentTokens = tokenize(banner.hook);
  let hookEcho = 0;
  for (const recent of memory.recentHooks.slice(0, 6)) {
    const sim = jaccard(currentTokens, tokenize(recent));
    if (sim >= 0.45) hookEcho += 1;
  }
  const hook = clamp10(hookEcho * 3.5);
  if (hookEcho >= 2) flags.push(`hook echoes ${hookEcho} recent hooks`);

  // ─── product placement fatigue ─────────────────────────────────
  // The memory does not store this directly yet — we estimate by
  // counting layoutFamily occurrences for layouts that imply a
  // specific product zone. (Future: store the role explicitly.)
  const productPlacement = clamp10(layoutCount * 1.5);

  // ─── color / temperature fatigue ───────────────────────────────
  // No persisted color memory yet — we proxy by pacing repetition,
  // since pacing drives visual_temperature in DNA.
  const recentPacings = memory.pacingHistory.slice(0, 4);
  const repeatPacingCount = recentPacings.filter((p) => p === banner.direction.emotionalPacing).length;
  const color = clamp10(repeatPacingCount * 2);
  if (repeatPacingCount >= 3) flags.push(`pacing "${banner.direction.emotionalPacing}" repeats — visual temperature flattening`);

  const scores: FatigueScores = {
    layout, color, hook, timestamp, typography, productPlacement, emotional,
  };

  const totals = (
    layout * 0.18 +
    color * 0.10 +
    hook * 0.18 +
    timestamp * 0.14 +
    typography * 0.14 +
    productPlacement * 0.10 +
    emotional * 0.16
  );

  // Verdict: any single axis ≥ 7 OR totals ≥ 5.5 = fatigued.
  const maxAxis = Math.max(...Object.values(scores));
  let verdict: FatigueReport['verdict'] = 'fresh';
  if (maxAxis >= 7 || totals >= 5.5) verdict = 'fatigued';
  else if (maxAxis >= 4 || totals >= 3.5) verdict = 'warm';

  return { scores, totals, verdict, flags };
}

// ────────────────────────────────────────────────────────────────

function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase().split(/[\s\p{P}]+/u).filter((w) => w.length >= 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
