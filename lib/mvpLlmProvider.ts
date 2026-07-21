/**
 * MVP LLM PROVIDER (boundary · vertical-intelligence-driven)
 *
 * V3 of the generator. Dispatches to:
 *   - `openai` adapter when OPENAI_API_KEY is present (calls a real
 *     LLM, validates output against the vertical contract, retries
 *     once on validation failure, falls back to corpus on second
 *     failure or any error)
 *   - corpus selector otherwise (the V2 fallback that lifts the
 *     baseline from 17.7 → 32.4 / 60 without any LLM call)
 *
 * STRICT CONTRACT:
 *   - the route NEVER hard-codes a vendor URL outside this module
 *   - the route NEVER stores API keys; they live in process.env
 *   - failures degrade to vertical corpus — never throw to the UI
 *   - locale purity is validated before any output is returned
 *   - cross-vertical leakage is blocked at selection time
 *   - operator inputs are SIGNALS (used to rank / instruct the LLM) —
 *     they are NEVER substituted into pre-written sentences
 */

import type {
  OneLinerCandidate, HookItem, UgcScriptItem, ImageConceptItem,
} from './mvpGenerationMemory';
import {
  resolveVerticalContext,
  assembleGenerationContext,
  validateLocalePurity,
  hasForbiddenVocab,
  hasCrossVerticalLeak,
  type GenerationContext,
  type HookFamily,
  type HookTemplate,
} from './verticalIntelligence';
import {
  openaiGenerate,
  type LlmGenerationPayload,
  type OpenaiGenerateOutcome,
} from './mvpOpenaiAdapter';
import { anthropicGenerate } from './mvpAnthropicAdapter';
import { buildLearningModel, learningBoost, type LearningModel } from './mvpLearning';
import { qualityScore, HOOK_QUALITY_FLOOR } from './mvpQualityScore';

export interface MvpGenerateInput {
  artifact: string;
  audience: string;
  emotional: string;
  locale: string;
  /** Optional override · forces a specific vertical (used by verifiers). */
  forceVerticalId?: import('./verticalIntelligence').VerticalId;
  /** Hook texts already shown to this operator · excluded on regenerate. */
  excludeTexts?: string[];
}

export interface MvpGenerateOutput {
  oneLinerCandidates: OneLinerCandidate[];
  hooks: HookItem[];
  ugcScripts: UgcScriptItem[];
  imageConcepts: ImageConceptItem[];
  providerId: 'stub' | 'openai' | 'anthropic';
  /** Metadata about the resolution · useful for logging + UI hints. */
  verticalId: string;
  resolvedLocale: 'he' | 'en';
  detectionConfidence: number;
  /** Diagnostics from the LLM path — undefined when corpus was used. */
  llmDiagnostics?: {
    attempts: number;
    latencyMs: number;
    tokensIn?: number;
    tokensOut?: number;
    model: string;
    fellBack: boolean;
    fallbackReason?: string;
    validationFailuresPerAttempt: string[][];
  };
}

// ─── provider discovery ────────────────────────────────────────

export function activeProvider(): 'stub' | 'openai' | 'anthropic' {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'stub';
}

// ─── id generators ─────────────────────────────────────────────

let __idSeq = 0;
function newId(prefix: string): string {
  __idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${__idSeq.toString(36)}`;
}

// ─── ranking heuristics ────────────────────────────────────────

/**
 * Score a candidate template based on its overlap with the operator's
 * `audience` + `emotional` inputs. Higher score = more relevant. Inputs
 * are tokenized; we look for character-prefix matches to be tolerant of
 * Hebrew morphology + English suffixes.
 */
function relevanceScore(text: string, operatorSignals: string): number {
  const lower = text.toLowerCase();
  const tokens = operatorSignals.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
  let score = 0;
  for (const t of tokens) {
    const prefix = t.slice(0, 4);
    if (lower.includes(prefix)) score += 1;
  }
  // Light length bias toward middle-length sentences for hooks.
  if (text.length >= 18 && text.length <= 90) score += 1;
  return score;
}

function deterministicHash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h) + text.charCodeAt(i);
  return Math.abs(h);
}

function commercialScoreFor(text: string, signals: string): number {
  const base = 50 + relevanceScore(text, signals) * 6;
  const jitter = (deterministicHash(text) % 11) - 5;
  return Math.max(0, Math.min(100, base + jitter));
}

// ─── core selector ─────────────────────────────────────────────

interface SignalBundle {
  audience: string;
  emotional: string;
  artifact: string;
  combined: string;
}

function makeSignalBundle(input: MvpGenerateInput): SignalBundle {
  return {
    audience: input.audience || '',
    emotional: input.emotional || '',
    artifact: input.artifact || '',
    combined: `${input.audience || ''} ${input.emotional || ''} ${input.artifact || ''}`,
  };
}

/**
 * Predicate: a piece of text passes locale + forbidden + cross-vertical
 * checks given the assembled context.
 */
function isSafeOutput(text: string, ctx: GenerationContext): boolean {
  const localeOk = validateLocalePurity(text, ctx.locale).ok;
  if (!localeOk) return false;
  if (hasForbiddenVocab(text, ctx.vocabularyForbidden).found) return false;
  if (hasCrossVerticalLeak(text, ctx.vocabularyForbiddenCrossVertical).found) return false;
  return true;
}

/**
 * Pick one-liners: 2 of them, ranked by relevance, locale-pure.
 * Pads from the same vertical's English/Hebrew counterpart only when
 * the requested locale has fewer than 2 safe candidates.
 */
function pickOneLiners(ctx: GenerationContext, signals: SignalBundle): OneLinerCandidate[] {
  const safe = ctx.availableOneLiners.filter((o) => isSafeOutput(o.text, ctx));
  const ranked = [...safe].sort(
    (a, b) => relevanceScore(b.text, signals.combined) - relevanceScore(a.text, signals.combined),
  );
  const taken = ranked.slice(0, 2);
  return taken.map((o) => ({ id: newId('ol'), text: o.text }));
}

/**
 * Pick 10 hooks distributed across as many hook families as possible.
 * Algorithm:
 *   1. Filter to locale-pure, vocab-safe hooks.
 *   2. Group by family.
 *   3. Round-robin across families, picking the highest-relevance hook
 *      per family per round, until we have 10 (or run out of hooks).
 */
function pickHooks(
  ctx: GenerationContext,
  signals: SignalBundle,
  learning: LearningModel,
  excludeTexts?: string[],
): HookItem[] {
  const excluded = new Set(excludeTexts ?? []);
  const safe = ctx.availableHooks.filter(
    (h) => isSafeOutput(h.text, ctx) && !excluded.has(h.text),
  );
  if (safe.length === 0) return [];

  const byFamily = new Map<HookFamily, HookTemplate[]>();
  for (const h of safe) {
    const arr = byFamily.get(h.family) ?? [];
    arr.push(h);
    byFamily.set(h.family, arr);
  }
  // Sort each family bucket by (vocab-presence DESC, relevance DESC) so
  // hooks containing the vertical's required vocabulary are picked
  // first when a family has multiple candidates · this is what lifts
  // the vertical-keyword-density above 60% across the 10 fixtures.
  const containsRequiredVocab = (t: string): boolean =>
    ctx.vocabularyRequired.length === 0
    || ctx.vocabularyRequired.some((w) => t.includes(w));
  for (const arr of byFamily.values()) {
    arr.sort((a, b) => {
      const av = containsRequiredVocab(a.text) ? 1 : 0;
      const bv = containsRequiredVocab(b.text) ? 1 : 0;
      if (bv !== av) return bv - av;
      return relevanceScore(b.text, signals.combined) - relevanceScore(a.text, signals.combined);
    });
  }

  // Overpick (up to 14) so the quality floor can drop weak hooks and
  // still deliver a full set of 10.
  const TARGET = 14;
  const families = Array.from(byFamily.keys());
  const picked: HookTemplate[] = [];
  let round = 0;
  while (picked.length < TARGET) {
    let pickedThisRound = false;
    for (const f of families) {
      const bucket = byFamily.get(f);
      if (!bucket || bucket.length <= round) continue;
      picked.push(bucket[round]);
      pickedThisRound = true;
      if (picked.length >= TARGET) break;
    }
    if (!pickedThisRound) break;
    round += 1;
  }

  // De-duplicate by text (defensive guard).
  const seen = new Set<string>();
  const unique = picked.filter((h) => {
    if (seen.has(h.text)) return false;
    seen.add(h.text);
    return true;
  });

  const audienceLabel = ctx.resolvedAudience.label;
  const audienceDemo = ctx.resolvedAudience.demographic;
  const proven = ctx.vertical.bestPerformingAdFormats[0] ?? '';

  const items = unique.map((h) => {
    const q = qualityScore({
      text: h.text, locale: ctx.locale, vocabulary: ctx.vocabularyRequired,
    });
    // Learning folds into commercialScore so downstream sorting
    // (engine re-sorts by commercialScore desc) inherits the signal.
    // Archetype-targeted hooks (roadmap #3) get a further boost when
    // the operator's audience resolved to that archetype.
    const archetypeBoost = h.archetypeId === ctx.resolvedAudience.id ? 1.15 : 1;
    const boost = learningBoost(learning, ctx.verticalId, h.family, h.text) * archetypeBoost;
    return {
      id: newId('hook'),
      text: h.text,
      audience: `${audienceLabel} · ${audienceDemo}`,
      situation: ctx.purchaseMoments[deterministicHash(h.text) % Math.max(1, ctx.purchaseMoments.length)] ?? '',
      visualDirection: proven || (ctx.locale === 'he'
        ? 'צילום דוקומנטרי 50מ"מ · אור טבעי · אדם אמיתי לא מדגמן'
        : 'documentary 50mm · natural light · real adult · no posed shots'),
      commercialScore: Math.round(commercialScoreFor(h.text, signals.combined) * boost),
      family: h.family as string,
      qualityScore: q,
    };
  });

  // Quality floor (roadmap #9): drop weak hooks while ≥10 remain.
  const strong = items.filter((h) => (h.qualityScore ?? 0) >= HOOK_QUALITY_FLOOR);
  const pool = strong.length >= 10 ? strong : items;
  return pool
    .sort((a, b) => b.commercialScore - a.commercialScore)
    .slice(0, 10);
}

/**
 * Pick 5 UGC scripts: locale-pure, vocab-safe, ranked by relevance.
 */
function pickUgcScripts(ctx: GenerationContext, signals: SignalBundle): UgcScriptItem[] {
  const safe = ctx.availableUgcScripts.filter(
    (u) => isSafeOutput(u.title, ctx) && isSafeOutput(u.script, ctx) && isSafeOutput(u.cta, ctx),
  );
  const ranked = [...safe].sort(
    (a, b) => relevanceScore(b.script, signals.combined) - relevanceScore(a.script, signals.combined),
  );
  const taken = ranked.slice(0, 5);
  return taken.map((u) => ({
    id: newId('ugc'),
    title: u.title,
    durationSec: u.durationSec,
    scriptHebrew: u.script, // schema-name kept for backwards-compat with memory
    shotList: u.shotList,
    callToActionHebrew: u.cta,
  }));
}

/**
 * Pick 10 image concepts: locale-pure, vocab-safe.
 */
function pickImageConcepts(ctx: GenerationContext, signals: SignalBundle): ImageConceptItem[] {
  const safe = ctx.availableImageConcepts.filter(
    (c) => isSafeOutput(c.title, ctx) && isSafeOutput(c.description, ctx),
  );
  // Rank by relevance, then pad to 10 by repeating with deterministic
  // hash-based reordering if the vertical has fewer than 10 concepts.
  const ranked = [...safe].sort(
    (a, b) => relevanceScore(b.description, signals.combined) - relevanceScore(a.description, signals.combined),
  );
  if (ranked.length === 0) return [];
  const out: ImageConceptItem[] = [];
  let idx = 0;
  while (out.length < 10 && idx < ranked.length * 3) {
    const c = ranked[idx % ranked.length];
    out.push({
      id: newId('img'),
      title: c.title,
      visualDescription: c.description,
      forUseWith: ctx.emotionalTerritory,
      renderingNote: c.renderingNote,
    });
    idx += 1;
  }
  return out.slice(0, 10);
}

// ─── LLM-output → MvpGenerateOutput adapter ────────────────────

function llmPayloadToOutput(
  payload: LlmGenerationPayload,
  ctx: GenerationContext,
  signals: SignalBundle,
  learning: LearningModel,
): {
  oneLinerCandidates: OneLinerCandidate[];
  hooks: HookItem[];
  ugcScripts: UgcScriptItem[];
  imageConcepts: ImageConceptItem[];
} {
  const oneLinerCandidates: OneLinerCandidate[] = payload.positioningOneLiners
    .slice(0, 2)
    .map((o) => ({ id: newId('ol'), text: o.text }));

  // Deterministic commercial scoring × learning boost + quality score.
  const scored = payload.hooks.map((h) => {
    const boost = learningBoost(learning, ctx.verticalId, h.family, h.text);
    return {
      id: newId('hook'),
      text: h.text,
      audience: h.audience || `${ctx.resolvedAudience.label} · ${ctx.resolvedAudience.demographic}`,
      situation: h.situation || (ctx.purchaseMoments[0] ?? ''),
      visualDirection: h.visualDirection || (ctx.vertical.bestPerformingAdFormats[0] ?? ''),
      commercialScore: Math.round(commercialScoreFor(h.text, signals.combined) * boost),
      family: h.family,
      qualityScore: qualityScore({
        text: h.text, locale: ctx.locale, vocabulary: ctx.vocabularyRequired,
      }),
    };
  });
  scored.sort((a, b) => b.commercialScore - a.commercialScore);
  // Quality floor: drop weak LLM hooks only while ≥8 survive.
  const strong = scored.filter((h) => (h.qualityScore ?? 0) >= HOOK_QUALITY_FLOOR);
  const hooks: HookItem[] = (strong.length >= 8 ? strong : scored).slice(0, 10);

  const ugcScripts: UgcScriptItem[] = payload.ugcScripts.slice(0, 5).map((u) => ({
    id: newId('ugc'),
    title: u.title,
    durationSec: u.durationSec,
    scriptHebrew: u.script, // schema-name retained for backwards-compat with memory
    shotList: u.shotList,
    callToActionHebrew: u.callToAction,
  }));

  const imageConcepts: ImageConceptItem[] = payload.imageConcepts.slice(0, 10).map((c) => ({
    id: newId('img'),
    title: c.title,
    visualDescription: c.visualDescription,
    forUseWith: c.forUseWith,
    renderingNote: c.renderingNote,
  }));

  return { oneLinerCandidates, hooks, ugcScripts, imageConcepts };
}

function buildFromCorpus(
  ctx: GenerationContext,
  signals: SignalBundle,
  learning: LearningModel,
  excludeTexts?: string[],
) {
  return {
    oneLinerCandidates: pickOneLiners(ctx, signals),
    hooks: pickHooks(ctx, signals, learning, excludeTexts),
    ugcScripts: pickUgcScripts(ctx, signals),
    imageConcepts: pickImageConcepts(ctx, signals),
  };
}

function summarizeOutcome(outcome: OpenaiGenerateOutcome): MvpGenerateOutput['llmDiagnostics'] {
  const last = outcome.attempts[outcome.attempts.length - 1];
  return {
    attempts: outcome.attempts.length,
    latencyMs: outcome.attempts.reduce((s, a) => s + a.latencyMs, 0),
    tokensIn: last?.tokensIn,
    tokensOut: last?.tokensOut,
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    fellBack: outcome.fellBackToCorpus,
    fallbackReason: outcome.fallbackReason,
    validationFailuresPerAttempt: outcome.attempts.map((a) => a.failures),
  };
}

// ─── public entrypoint ─────────────────────────────────────────

export async function mvpGenerate(input: MvpGenerateInput): Promise<MvpGenerateOutput> {
  // 1 · resolve vertical + locale + audience
  const verticalContext = resolveVerticalContext(
    {
      artifact: input.artifact,
      audience: input.audience,
      emotional: input.emotional,
      locale: input.locale,
    },
    { forceVerticalId: input.forceVerticalId },
  );

  // 2 · assemble the locale-filtered generation context + learning model
  const ctx = assembleGenerationContext(verticalContext);
  const signals = makeSignalBundle(input);
  const learning = await buildLearningModel();

  const provider = activeProvider();

  // 3 · LLM path · OpenAI first, Anthropic as the second provider
  // (roadmap #7) · both consume the same context + validator.
  if (provider === 'openai' || provider === 'anthropic') {
    const llmCall = provider === 'openai' ? openaiGenerate : anthropicGenerate;
    const outcome = await llmCall(ctx, {
      artifact: input.artifact,
      audience: input.audience,
      emotional: input.emotional,
      locale: input.locale,
    });

    if (outcome.result) {
      const built = llmPayloadToOutput(outcome.result.payload, ctx, signals, learning);
      return {
        ...built,
        providerId: provider,
        verticalId: verticalContext.verticalId,
        resolvedLocale: verticalContext.locale,
        detectionConfidence: verticalContext.detectionConfidence,
        llmDiagnostics: summarizeOutcome(outcome),
      };
    }

    // LLM path failed after retry · degrade to corpus selection so the
    // user still gets a valid kit instead of an empty response.
    const built = buildFromCorpus(ctx, signals, learning, input.excludeTexts);
    return {
      ...built,
      providerId: 'stub', // record what was actually used
      verticalId: verticalContext.verticalId,
      resolvedLocale: verticalContext.locale,
      detectionConfidence: verticalContext.detectionConfidence,
      llmDiagnostics: summarizeOutcome(outcome),
    };
  }

  // 4 · Corpus path (stub provider) · no API key, no LLM call
  const built = buildFromCorpus(ctx, signals, learning, input.excludeTexts);
  return {
    ...built,
    providerId: 'stub',
    verticalId: verticalContext.verticalId,
    resolvedLocale: verticalContext.locale,
    detectionConfidence: verticalContext.detectionConfidence,
  };
}
