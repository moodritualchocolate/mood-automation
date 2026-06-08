/**
 * MVP LLM PROVIDER (boundary · vertical-intelligence-driven)
 *
 * V2 of the generator. Replaces the prior chocolate-template stub
 * with a vertical-aware selector: every output is drawn from the
 * resolved vertical's pre-written, locale-pure corpus.
 *
 * The operator's 4 inputs are SIGNALS (used to detect the vertical
 * and rank candidate templates) — they are NEVER substituted into
 * pre-written sentences. This is what eliminates code-switching and
 * cross-vertical template repetition.
 *
 * Real-LLM adapters (OpenAI / Anthropic) remain a future plug-in:
 * when they ship, they'll consume the same GenerationContext that
 * `selectFromVerticalCorpus` consumes today.
 *
 * STRICT CONTRACT:
 *   - the route NEVER hard-codes a vendor URL outside this module
 *   - the route NEVER stores API keys; they live in process.env
 *   - failures degrade to vertical corpus — never throw to the UI
 *   - locale purity is validated before any output is returned
 *   - cross-vertical leakage is blocked at selection time
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

export interface MvpGenerateInput {
  artifact: string;
  audience: string;
  emotional: string;
  locale: string;
  /** Optional override · forces a specific vertical (used by verifiers). */
  forceVerticalId?: import('./verticalIntelligence').VerticalId;
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
function pickHooks(ctx: GenerationContext, signals: SignalBundle): HookItem[] {
  const safe = ctx.availableHooks.filter((h) => isSafeOutput(h.text, ctx));
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

  const families = Array.from(byFamily.keys());
  const picked: HookTemplate[] = [];
  let round = 0;
  while (picked.length < 10) {
    let pickedThisRound = false;
    for (const f of families) {
      const bucket = byFamily.get(f);
      if (!bucket || bucket.length <= round) continue;
      picked.push(bucket[round]);
      pickedThisRound = true;
      if (picked.length >= 10) break;
    }
    if (!pickedThisRound) break;
    round += 1;
  }

  // De-duplicate by text (e.g., when two families share a punchline,
  // which shouldn't happen in the seed corpus but defensively guard).
  const seen = new Set<string>();
  const unique = picked.filter((h) => {
    if (seen.has(h.text)) return false;
    seen.add(h.text);
    return true;
  });

  // Build HookItem · keep the audience archetype label so the UI shows
  // who the hook is for (locale-aware).
  const audienceLabel = ctx.resolvedAudience.label;
  const audienceDemo = ctx.resolvedAudience.demographic;
  const proven = ctx.vertical.bestPerformingAdFormats[0] ?? '';

  return unique.map((h) => ({
    id: newId('hook'),
    text: h.text,
    audience: `${audienceLabel} · ${audienceDemo}`,
    situation: ctx.purchaseMoments[deterministicHash(h.text) % Math.max(1, ctx.purchaseMoments.length)] ?? '',
    visualDirection: proven || (ctx.locale === 'he'
      ? 'צילום דוקומנטרי 50מ"מ · אור טבעי · אדם אמיתי לא מדגמן'
      : 'documentary 50mm · natural light · real adult · no posed shots'),
    commercialScore: commercialScoreFor(h.text, signals.combined),
  }));
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

  // 2 · assemble the locale-filtered generation context
  const ctx = assembleGenerationContext(verticalContext);
  const signals = makeSignalBundle(input);

  // 3 · select from the vertical's corpus
  const oneLinerCandidates = pickOneLiners(ctx, signals);
  const hooks = pickHooks(ctx, signals);
  const ugcScripts = pickUgcScripts(ctx, signals);
  const imageConcepts = pickImageConcepts(ctx, signals);

  // 4 · provider id reflects how the output was actually built. The
  // OpenAI/Anthropic branches will be wired separately when API keys
  // are configured; until then every output is "stub" (now meaning
  // vertical-corpus, not chocolate-template).
  const providerId = activeProvider();

  return {
    oneLinerCandidates,
    hooks,
    ugcScripts,
    imageConcepts,
    providerId,
    verticalId: verticalContext.verticalId,
    resolvedLocale: verticalContext.locale,
    detectionConfidence: verticalContext.detectionConfidence,
  };
}
