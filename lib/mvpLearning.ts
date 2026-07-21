/**
 * MVP LEARNING (roadmap #4 + #28)
 *
 * Reads the operator's real review choices (mvpSelectionMemory) against
 * what was generated (mvpGenerationMemory) and turns them into ranking
 * signal: which hook families and which exact texts get KEPT per
 * vertical, and which get skipped.
 *
 * The signal was always captured — this module is the first reader.
 *
 * STRICT CONTRACT:
 *   - read-only over both stores · never mutates
 *   - Laplace-smoothed so small samples can't swing ranking violently
 *   - boost is bounded [0.75 .. 1.25] · learning nudges, never dictates
 */

import { createMvpGenerationMemoryStore } from './mvpGenerationMemory';
import { createMvpSelectionMemoryStore } from './mvpSelectionMemory';

export interface FamilyStat {
  kept: number;
  total: number;
}

export interface LearningModel {
  /** `${verticalId}:${family}` → keep stats */
  byFamily: Record<string, FamilyStat>;
  /** exact hook text → keep stats (for corpus promote/demote) */
  byText: Record<string, FamilyStat>;
  /** total selections that fed the model */
  selections: number;
  builtAt: number;
}

let __cache: { model: LearningModel; at: number } | null = null;
const CACHE_MS = 60_000;

export async function buildLearningModel(): Promise<LearningModel> {
  if (__cache && Date.now() - __cache.at < CACHE_MS) return __cache.model;

  const [selState, genStore] = [
    await createMvpSelectionMemoryStore().read(),
    createMvpGenerationMemoryStore(),
  ];

  const byFamily: Record<string, FamilyStat> = {};
  const byText: Record<string, FamilyStat> = {};
  let selections = 0;

  for (const sel of selState.records) {
    const gen = await genStore.findById(sel.generationId);
    if (!gen) continue;
    selections += 1;
    const kept = new Set(sel.keptHookIds);
    const vertical = gen.verticalId ?? 'unknown';
    for (const hook of gen.hooks) {
      const family = hook.family ?? 'unknown';
      const fKey = `${vertical}:${family}`;
      const f = (byFamily[fKey] ??= { kept: 0, total: 0 });
      f.total += 1;
      if (kept.has(hook.id)) f.kept += 1;

      const t = (byText[hook.text] ??= { kept: 0, total: 0 });
      t.total += 1;
      if (kept.has(hook.id)) t.kept += 1;
    }
  }

  const model: LearningModel = { byFamily, byText, selections, builtAt: Date.now() };
  __cache = { model, at: Date.now() };
  return model;
}

/** Testing hook — drop the memoized model. */
export function __resetLearningCache(): void { __cache = null; }

/**
 * Bounded multiplier for ranking. Neutral (1.0) with no data.
 * Laplace smoothing (α=2) keeps 1-2 observations from dominating.
 */
export function learningBoost(
  model: LearningModel,
  verticalId: string,
  family: string | undefined,
  text: string,
): number {
  const ALPHA = 2;
  let boost = 1;

  const f = family ? model.byFamily[`${verticalId}:${family}`] : undefined;
  if (f && f.total >= 3) {
    const rate = (f.kept + ALPHA) / (f.total + ALPHA * 2); // smoothed keep-rate
    boost *= 0.85 + rate * 0.3; // rate 0 → ×0.85 · rate 1 → ×1.15
  }

  const t = model.byText[text];
  if (t && t.total >= 2) {
    const rate = (t.kept + ALPHA) / (t.total + ALPHA * 2);
    boost *= 0.9 + rate * 0.2; // exact-text signal is stronger evidence, smaller range
  }

  return Math.max(0.75, Math.min(1.25, boost));
}

/**
 * Corpus report for periodic review (roadmap #28): the texts operators
 * consistently keep or consistently skip, per vertical.
 */
export interface CorpusSignal {
  text: string;
  kept: number;
  total: number;
  keepRate: number;
}

export function corpusSignals(model: LearningModel, minTotal = 3): {
  promote: CorpusSignal[];
  demote: CorpusSignal[];
} {
  const rows: CorpusSignal[] = Object.entries(model.byText)
    .filter(([, s]) => s.total >= minTotal)
    .map(([text, s]) => ({ text, kept: s.kept, total: s.total, keepRate: s.kept / s.total }));
  return {
    promote: rows.filter((r) => r.keepRate >= 0.7).sort((a, b) => b.keepRate - a.keepRate),
    demote: rows.filter((r) => r.keepRate <= 0.3).sort((a, b) => a.keepRate - b.keepRate),
  };
}
