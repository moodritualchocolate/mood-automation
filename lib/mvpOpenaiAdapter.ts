/**
 * MVP OPENAI ADAPTER
 *
 * Real-LLM path behind `mvpGenerate()`. Consumes the same
 * `GenerationContext` the corpus selector consumes — same vertical
 * vocabulary, same locale rules, same audience archetype, same
 * cross-vertical leakage list. The LLM only does the creative
 * inflection; the constraints come from the vertical knowledge base.
 *
 * STRICT CONTRACT:
 *   - never throws to the caller · failure returns null + a reason
 *   - locale purity, forbidden vocab, MOOD leakage validated post-call
 *   - one retry on validation failure (with the failure detail fed
 *     back into the next user message)
 *   - on second failure, return null · caller falls back to corpus
 *
 * Cost-shape (gpt-4.1-mini default):
 *   ~2.5k input tokens · ~1.8k output tokens · ≈ $0.004 / generation
 */

import OpenAI from 'openai';
import type {
  GenerationContext, HookFamily,
} from './verticalIntelligence';
import {
  validateLocalePurity, hasForbiddenVocab, hasCrossVerticalLeak,
  verticalKeywordDensity,
} from './verticalIntelligence';

// ─── tunables ──────────────────────────────────────────────────

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const REQUEST_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 60_000);

// ─── shape returned by the LLM (matches the JSON schema below) ──

export interface LlmOneLiner { text: string; }
export interface LlmHook {
  family: string;
  text: string;
  audience: string;
  situation: string;
  visualDirection: string;
}
export interface LlmUgcScript {
  title: string;
  durationSec: number;
  script: string;
  shotList: string[];
  callToAction: string;
}
export interface LlmImageConcept {
  title: string;
  visualDescription: string;
  renderingNote: string;
  forUseWith: string;
}
export interface LlmQualitySelfCheck {
  localeIntent: string;
  verticalKeywordsUsed: string[];
  hookFamiliesCovered: string[];
}
export interface LlmGenerationPayload {
  positioningOneLiners: LlmOneLiner[];
  hooks: LlmHook[];
  ugcScripts: LlmUgcScript[];
  imageConcepts: LlmImageConcept[];
  warnings: string[];
  qualitySelfCheck: LlmQualitySelfCheck;
}

export interface OpenaiGenerateResult {
  payload: LlmGenerationPayload;
  attempts: number;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
  model: string;
}

export interface OpenaiGenerateInput {
  artifact: string;
  audience: string;
  emotional: string;
  locale: string;
}

// ─── JSON schema for structured output (OpenAI strict mode) ────

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['positioningOneLiners', 'hooks', 'ugcScripts', 'imageConcepts', 'warnings', 'qualitySelfCheck'],
  properties: {
    positioningOneLiners: {
      type: 'array',
      minItems: 2, maxItems: 2,
      items: {
        type: 'object', additionalProperties: false,
        required: ['text'],
        properties: { text: { type: 'string' } },
      },
    },
    hooks: {
      type: 'array',
      minItems: 10, maxItems: 10,
      items: {
        type: 'object', additionalProperties: false,
        required: ['family', 'text', 'audience', 'situation', 'visualDirection'],
        properties: {
          family: { type: 'string' },
          text: { type: 'string' },
          audience: { type: 'string' },
          situation: { type: 'string' },
          visualDirection: { type: 'string' },
        },
      },
    },
    ugcScripts: {
      type: 'array',
      minItems: 5, maxItems: 5,
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'durationSec', 'script', 'shotList', 'callToAction'],
        properties: {
          title: { type: 'string' },
          durationSec: { type: 'integer' },
          script: { type: 'string' },
          shotList: { type: 'array', items: { type: 'string' }, minItems: 3 },
          callToAction: { type: 'string' },
        },
      },
    },
    imageConcepts: {
      type: 'array',
      minItems: 10, maxItems: 10,
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'visualDescription', 'renderingNote', 'forUseWith'],
        properties: {
          title: { type: 'string' },
          visualDescription: { type: 'string' },
          renderingNote: { type: 'string' },
          forUseWith: { type: 'string' },
        },
      },
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
    qualitySelfCheck: {
      type: 'object', additionalProperties: false,
      required: ['localeIntent', 'verticalKeywordsUsed', 'hookFamiliesCovered'],
      properties: {
        localeIntent: { type: 'string' },
        verticalKeywordsUsed: { type: 'array', items: { type: 'string' } },
        hookFamiliesCovered: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const;

// ─── prompt construction ───────────────────────────────────────

function localeName(locale: 'he' | 'en'): string {
  return locale === 'he' ? 'Hebrew (עברית)' : 'English';
}

function buildSystemPrompt(ctx: GenerationContext): string {
  const loc = ctx.locale;
  const localeWord = localeName(loc);
  const required = ctx.vocabularyRequired.slice(0, 12);
  const forbidden = ctx.vocabularyForbidden;
  const crossForbidden = ctx.vocabularyForbiddenCrossVertical;

  const provenHooks = ctx.availableHooks.slice(0, 6).map((h) => `  · [${h.family}] ${h.text}`).join('\n');
  const hookFamiliesAvailable = Array.from(new Set(ctx.availableHooks.map((h) => h.family))).slice(0, 8).join(', ');

  return [
    `You are a senior creative director with 15+ years of experience writing ad copy for the ${ctx.vertical.displayName} industry.`,
    `You write industry-native copy for: ${ctx.resolvedAudience.label} (${ctx.resolvedAudience.demographic}).`,
    `Psychographic: ${ctx.resolvedAudience.psychographic}.`,
    '',
    `OUTPUT LANGUAGE — ABSOLUTE RULE`,
    `Every string you produce must be entirely in ${localeWord}.`,
    loc === 'he'
      ? 'Use only Hebrew letters · digits · punctuation. Do not include English words longer than 4 characters (single brand names like "WhatsApp" are tolerated but discouraged).'
      : 'Use only English letters · digits · punctuation. Do not include any Hebrew characters.',
    'Mixed-language sentences are a failure.',
    '',
    `INDUSTRY VOCABULARY — REQUIRED`,
    `At least 6 of your 10 hooks must include at least one of these industry-native words/phrases:`,
    `  ${required.map((w) => `"${w}"`).join(' · ')}`,
    '',
    `FORBIDDEN VOCABULARY — NEVER USE`,
    `These phrases signal sketchy operators in this vertical:`,
    `  ${forbidden.map((w) => `"${w}"`).join(' · ')}`,
    crossForbidden.length > 0
      ? `Also never use these (they belong to a different vertical and would feel off-brand):\n  ${crossForbidden.map((w) => `"${w}"`).join(' · ')}`
      : '',
    '',
    `EMOTIONAL TERRITORY`,
    `"${ctx.emotionalTerritory}"`,
    '',
    `CUSTOMER PAINS (mirror 1-2 across the kit · don't list all)`,
    ctx.customerPains.slice(0, 6).map((p) => `  · ${p}`).join('\n'),
    '',
    `CUSTOMER DESIRES`,
    ctx.customerDesires.slice(0, 6).map((d) => `  · ${d}`).join('\n'),
    '',
    `COMMON PURCHASE MOMENTS`,
    ctx.purchaseMoments.slice(0, 6).map((m) => `  · ${m}`).join('\n'),
    '',
    `TRUST SIGNALS YOU MAY WEAVE IN (where natural)`,
    ctx.trustSignals.slice(0, 4).map((t) => `  · ${t}`).join('\n'),
    '',
    `PROOF TYPES THIS VERTICAL RESPONDS TO`,
    ctx.vertical.proofTypes.slice(0, 4).map((p) => `  · ${p}`).join('\n'),
    '',
    `CTA STYLES FOR THIS VERTICAL`,
    ctx.ctaStyles.slice(0, 4).map((c) => `  · ${c}`).join('\n'),
    '',
    `HOOK FAMILIES PROVEN IN THIS VERTICAL`,
    `Available families: ${hookFamiliesAvailable}`,
    `Examples (do NOT copy verbatim · write fresh copy in the same register):`,
    provenHooks,
    '',
    `LEGAL / SAFETY CONSTRAINTS`,
    ctx.vertical.legalConstraints.map((l) => `  · ${l}`).join('\n'),
    ctx.vertical.regulatorySensitivityWarnings.length > 0
      ? `Sensitivities:\n${ctx.vertical.regulatorySensitivityWarnings.map((w) => `  · ${w}`).join('\n')}`
      : '',
    '',
    `BEST-PERFORMING AD FORMATS (mirror in image concepts + UGC angle)`,
    ctx.vertical.bestPerformingAdFormats.slice(0, 4).map((f) => `  · ${f}`).join('\n'),
    '',
    `RULES FOR THE 10 HOOKS`,
    `  · Each must stand alone (no placeholders, no "${'$'}{variable}", no incomplete sentences)`,
    `  · Cover at least 4 distinct hook families`,
    `  · No two hooks share the same opening 4 words`,
    `  · Be specific to THIS brand, not generic`,
    `  · 30-110 characters each (the scroll-stop range)`,
    '',
    `RULES FOR THE 5 UGC SCRIPTS`,
    `  · Each: title + durationSec (12-30) + script with [timecode] markers + shotList 3-5 items + callToAction`,
    `  · Tone: real customer voice, not advertising voice`,
    `  · Match the vertical's best-performing UGC angles · do not reuse chocolate-format scripts unless this IS the chocolate vertical`,
    '',
    `RULES FOR THE 10 IMAGE CONCEPTS`,
    `  · Each: title + visualDescription + renderingNote + forUseWith (= the hook or one-liner it pairs to)`,
    `  · Rendering style: documentary 50mm · single natural light source · real adults · no studio props · no Hebrew text in the image`,
    '',
    `QUALITY SELF-CHECK`,
    `Before returning, fill in qualitySelfCheck with:`,
    `  · localeIntent: "hebrew-only" or "english-only"`,
    `  · verticalKeywordsUsed: the industry words you actually included`,
    `  · hookFamiliesCovered: the distinct families across your 10 hooks`,
  ].filter(Boolean).join('\n');
}

function buildUserPrompt(ctx: GenerationContext, input: OpenaiGenerateInput, retryHint?: string): string {
  const parts = [
    `Brand brief:`,
    `  · Sells: ${input.artifact || '(operator did not specify)'}`,
    `  · For: ${input.audience || '(operator did not specify)'}`,
    `  · Deeper desire: ${input.emotional || '(operator did not specify)'}`,
    `  · Operator-stated locale: ${input.locale}`,
    `  · Resolved vertical: ${ctx.vertical.displayName}`,
    `  · Output locale (binding): ${localeName(ctx.locale)}`,
    '',
    `Produce the full creative kit (2 positioning one-liners · 10 hooks · 5 UGC scripts · 10 image concepts · warnings · qualitySelfCheck) matching the strict JSON schema.`,
  ];
  if (retryHint) {
    parts.push('', `RETRY · the previous response failed validation:`, retryHint, '', 'Fix the issue and produce a fresh kit that passes all constraints.');
  }
  return parts.join('\n');
}

// ─── validation ────────────────────────────────────────────────

export interface ValidationReport {
  ok: boolean;
  failures: string[];
}

function collectAllTexts(p: LlmGenerationPayload): string[] {
  const texts: string[] = [];
  for (const o of p.positioningOneLiners) texts.push(o.text);
  for (const h of p.hooks) {
    texts.push(h.text);
    texts.push(h.audience);
    texts.push(h.situation);
    texts.push(h.visualDirection);
  }
  for (const u of p.ugcScripts) {
    texts.push(u.title);
    texts.push(u.script);
    texts.push(u.callToAction);
    for (const s of u.shotList) texts.push(s);
  }
  for (const c of p.imageConcepts) {
    texts.push(c.title);
    texts.push(c.visualDescription);
    texts.push(c.renderingNote);
    texts.push(c.forUseWith);
  }
  return texts;
}

// shotList + renderingNote are intentionally English production terms
// (50mm, kitchen, dawn light, etc.) so they're allowed to be Latin even
// in a Hebrew-locale brief — they're crew instructions, not consumer copy.
function isConsumerFacing(field: string): boolean {
  return ['oneLiner', 'hookText', 'ugcTitle', 'ugcScript', 'ugcCta'].includes(field);
}

function consumerFacingTexts(p: LlmGenerationPayload): { field: string; text: string }[] {
  const out: { field: string; text: string }[] = [];
  for (const o of p.positioningOneLiners) out.push({ field: 'oneLiner', text: o.text });
  for (const h of p.hooks) out.push({ field: 'hookText', text: h.text });
  for (const u of p.ugcScripts) {
    out.push({ field: 'ugcTitle', text: u.title });
    out.push({ field: 'ugcScript', text: u.script });
    out.push({ field: 'ugcCta', text: u.callToAction });
  }
  return out;
}

export function validateLlmPayload(payload: LlmGenerationPayload, ctx: GenerationContext): ValidationReport {
  const failures: string[] = [];

  // 1 · hook count (schema enforces, but defensively check anyway)
  if (payload.hooks.length !== 10) {
    failures.push(`hook-count: expected 10, got ${payload.hooks.length}`);
  }

  // 2 · locale purity on consumer-facing strings
  const consumerTexts = consumerFacingTexts(payload);
  let localeViolations = 0;
  const localeSamples: string[] = [];
  for (const { field, text } of consumerTexts) {
    const r = validateLocalePurity(text, ctx.locale);
    if (!r.ok) {
      localeViolations += 1;
      if (localeSamples.length < 3) localeSamples.push(`${field}: "${text.slice(0, 60)}" · ${r.reason}`);
    }
  }
  if (localeViolations > 0) {
    failures.push(`locale-purity: ${localeViolations} consumer-facing strings violated ${ctx.locale === 'he' ? 'hebrew-only' : 'english-only'} · examples: ${localeSamples.join(' | ')}`);
  }

  // 3 · forbidden vocabulary across all strings
  const allTexts = collectAllTexts(payload);
  let forbiddenViolations = 0;
  const forbiddenSamples: string[] = [];
  for (const t of allTexts) {
    const r = hasForbiddenVocab(t, ctx.vocabularyForbidden);
    if (r.found) {
      forbiddenViolations += 1;
      if (forbiddenSamples.length < 3) forbiddenSamples.push(`"${t.slice(0, 50)}" leaked "${r.word}"`);
    }
  }
  if (forbiddenViolations > 0) {
    failures.push(`forbidden-vocabulary: ${forbiddenViolations} violations · examples: ${forbiddenSamples.join(' | ')}`);
  }

  // 4 · cross-vertical leakage (e.g., MOOD canon in HVAC)
  let crossViolations = 0;
  const crossSamples: string[] = [];
  for (const t of allTexts) {
    const r = hasCrossVerticalLeak(t, ctx.vocabularyForbiddenCrossVertical);
    if (r.found) {
      crossViolations += 1;
      if (crossSamples.length < 3) crossSamples.push(`"${t.slice(0, 50)}" leaked "${r.word}" (belongs to another vertical)`);
    }
  }
  if (crossViolations > 0) {
    failures.push(`cross-vertical-leakage: ${crossViolations} violations · examples: ${crossSamples.join(' | ')}`);
  }

  // 5 · vertical-keyword density on hooks (≥ 60%)
  const hookTexts = payload.hooks.map((h) => h.text);
  const density = verticalKeywordDensity(hookTexts, ctx.vocabularyRequired);
  if (density < 0.60) {
    const need = Math.ceil(hookTexts.length * 0.60);
    const have = hookTexts.filter((t) => ctx.vocabularyRequired.some((w) => t.includes(w))).length;
    failures.push(`vertical-keyword-density: ${Math.round(density * 100)}% (${have}/${hookTexts.length}) · need ≥ 60% (${need}/${hookTexts.length}) using vocabulary [${ctx.vocabularyRequired.slice(0, 8).join(', ')}]`);
  }

  // 6 · risky-claim guard (legal-claim language sneaking into ads)
  //    we don't try to be exhaustive · we just block the few obvious tells
  const RISKY_CLAIM_PATTERNS_HE = [/\bמובטח\b/, /\bהחזר מס מובטח\b/, /\bתשואה מובטחת\b/, /\bריפוי\b/, /\bלהבטיח ניצחון\b/];
  const RISKY_CLAIM_PATTERNS_EN = [/\bguaranteed\b/i, /\bcure\b/i, /\bwe guarantee\b/i, /\bzero risk\b/i, /\bzero tax\b/i];
  const patterns = ctx.locale === 'he' ? RISKY_CLAIM_PATTERNS_HE : RISKY_CLAIM_PATTERNS_EN;
  const riskyHits: string[] = [];
  for (const { text } of consumerTexts) {
    for (const pat of patterns) {
      if (pat.test(text)) {
        riskyHits.push(`"${text.slice(0, 60)}" matched ${pat.source}`);
        break;
      }
    }
  }
  if (riskyHits.length > 0) {
    failures.push(`risky-claim: ${riskyHits.length} hits · ${riskyHits.slice(0, 3).join(' | ')}`);
  }

  // 7 · generic-template guard (LLM defaulting to the prior stub voice)
  const PRIOR_STUB_TELLS = [
    'בלי הצגות. בלי הבטחות',
    'תראה את הערב שאחרי',
    'אנחנו כבר לא משתמשים בשם הגנרי',
  ];
  // chocolate is allowed to use its canon · skip stub-template guard
  // ONLY for the canon phrases that overlap with legitimate chocolate copy.
  if (ctx.verticalId !== 'chocolate') {
    const tellHits: string[] = [];
    for (const t of allTexts) {
      for (const tell of PRIOR_STUB_TELLS) {
        if (t.includes(tell)) tellHits.push(`"${t.slice(0, 60)}" matched stub tell "${tell}"`);
      }
    }
    if (tellHits.length > 0) {
      failures.push(`generic-template: ${tellHits.length} prior-stub phrases · ${tellHits.slice(0, 2).join(' | ')}`);
    }
  }

  return { ok: failures.length === 0, failures };
}

// ─── OpenAI client ─────────────────────────────────────────────

let __client: OpenAI | null = null;
function getClient(): OpenAI {
  if (__client) return __client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for openai adapter');
  __client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });
  return __client;
}

/** Reset client (testing only — when env var is rotated mid-process). */
export function __resetOpenaiClient(): void { __client = null; }

// ─── main entry ────────────────────────────────────────────────

export interface OpenaiAttempt {
  attemptNumber: number;
  ok: boolean;
  failures: string[];
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface OpenaiGenerateOutcome {
  result: OpenaiGenerateResult | null;
  attempts: OpenaiAttempt[];
  fellBackToCorpus: boolean;
  fallbackReason?: string;
}

async function callOnce(
  client: OpenAI,
  ctx: GenerationContext,
  input: OpenaiGenerateInput,
  retryHint?: string,
): Promise<{ payload: LlmGenerationPayload | null; raw: string; latencyMs: number; tokensIn?: number; tokensOut?: number; model: string; parseError?: string }> {
  const t0 = Date.now();
  const model = DEFAULT_MODEL;
  const sysPrompt = buildSystemPrompt(ctx);
  const userPrompt = buildUserPrompt(ctx, input, retryHint);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'mood_generation_kit',
        strict: true,
        schema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      },
    },
    temperature: 0.7,
  });

  const latencyMs = Date.now() - t0;
  const raw = completion.choices[0]?.message?.content ?? '';
  const usage = completion.usage;
  const tokensIn = usage?.prompt_tokens;
  const tokensOut = usage?.completion_tokens;

  let payload: LlmGenerationPayload | null = null;
  let parseError: string | undefined;
  try {
    payload = JSON.parse(raw) as LlmGenerationPayload;
  } catch (e) {
    parseError = (e as Error).message;
  }
  return { payload, raw, latencyMs, tokensIn, tokensOut, model, parseError };
}

export async function openaiGenerate(
  ctx: GenerationContext,
  input: OpenaiGenerateInput,
): Promise<OpenaiGenerateOutcome> {
  let client: OpenAI;
  try {
    client = getClient();
  } catch (e) {
    return {
      result: null,
      attempts: [],
      fellBackToCorpus: true,
      fallbackReason: `client-init · ${(e as Error).message}`,
    };
  }

  const attempts: OpenaiAttempt[] = [];
  let lastFailureSummary: string | undefined;

  for (let i = 0; i < 2; i++) {
    const attemptNumber = i + 1;
    try {
      const { payload, latencyMs, tokensIn, tokensOut, model, parseError } = await callOnce(client, ctx, input, lastFailureSummary);
      if (!payload) {
        const fail = parseError ? `json-parse · ${parseError}` : 'empty-response';
        attempts.push({ attemptNumber, ok: false, failures: [fail], latencyMs, tokensIn, tokensOut });
        lastFailureSummary = fail;
        continue;
      }
      const v = validateLlmPayload(payload, ctx);
      attempts.push({ attemptNumber, ok: v.ok, failures: v.failures, latencyMs, tokensIn, tokensOut });
      if (v.ok) {
        return {
          result: { payload, attempts: attemptNumber, latencyMs, tokensIn, tokensOut, model },
          attempts,
          fellBackToCorpus: false,
        };
      }
      lastFailureSummary = v.failures.join(' · ');
    } catch (e) {
      // Capture HTTP status + OpenAI error code when available so the
      // failure message identifies the root cause (401 / 404 / 429 /
      // network / timeout) without needing to run the diagnose script.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = e as any;
      const msg = typeof err?.message === 'string' ? err.message : String(e);
      const status = typeof err?.status === 'number' ? err.status : undefined;
      const code = typeof err?.code === 'string' ? err.code : undefined;
      const reqId = err?.headers?.['x-request-id'] || err?.requestID || err?.requestId;
      const parts = ['call-error'];
      if (status !== undefined) parts.push(`status=${status}`);
      if (code) parts.push(`code=${code}`);
      if (reqId) parts.push(`req=${reqId}`);
      parts.push(msg);
      const fullMsg = parts.join(' · ');
      // When OPENAI_DEBUG=1, also emit to stderr so it's visible even when
      // the caller swallows the diagnostics object.
      if (process.env.OPENAI_DEBUG === '1') {
        console.error(`[openai · attempt ${attemptNumber}] ${fullMsg}`);
        if (err?.stack) console.error(String(err.stack).split('\n').slice(0, 6).join('\n'));
      }
      attempts.push({ attemptNumber, ok: false, failures: [fullMsg], latencyMs: 0 });
      lastFailureSummary = fullMsg;
    }
  }

  return {
    result: null,
    attempts,
    fellBackToCorpus: true,
    fallbackReason: lastFailureSummary ?? 'unknown-failure',
  };
}

// Re-export the HookFamily type so consumers don't need a deep import.
export type { HookFamily };
