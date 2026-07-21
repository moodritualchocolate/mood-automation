/**
 * MVP ANTHROPIC ADAPTER (roadmap #7 · second LLM provider)
 *
 * Same contract as the OpenAI adapter: consumes the identical
 * GenerationContext, produces the identical LlmGenerationPayload,
 * validated by the identical validateLlmPayload — so the pipeline
 * gains provider redundancy with zero new validation surface.
 *
 * Anthropic has no strict-JSON response_format; JSON discipline is
 * enforced by instruction + parse + the shared validator + one retry.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { GenerationContext } from './verticalIntelligence';
import {
  buildSystemPrompt,
  buildUserPrompt,
  validateLlmPayload,
  type LlmGenerationPayload,
  type OpenaiAttempt,
  type OpenaiGenerateInput,
  type OpenaiGenerateOutcome,
} from './mvpOpenaiAdapter';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const REQUEST_TIMEOUT_MS = Number(process.env.ANTHROPIC_TIMEOUT_MS ?? 60_000);

let __client: Anthropic | null = null;
function getClient(): Anthropic {
  if (__client) return __client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required for anthropic adapter');
  __client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS });
  return __client;
}

export function __resetAnthropicClient(): void { __client = null; }

/** Extract the first top-level JSON object from a text response. */
function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return text;
  return text.slice(start, end + 1);
}

export async function anthropicGenerate(
  ctx: GenerationContext,
  input: OpenaiGenerateInput,
): Promise<OpenaiGenerateOutcome> {
  let client: Anthropic;
  try {
    client = getClient();
  } catch (e) {
    return {
      result: null, attempts: [], fellBackToCorpus: true,
      fallbackReason: `client-init · ${(e as Error).message}`,
    };
  }

  const attempts: OpenaiAttempt[] = [];
  let lastFailureSummary: string | undefined;

  for (let i = 0; i < 2; i++) {
    const attemptNumber = i + 1;
    const t0 = Date.now();
    try {
      const msg = await client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 4096,
        system:
          buildSystemPrompt(ctx) +
          '\n\nOUTPUT FORMAT — ABSOLUTE: reply with ONE valid JSON object only. ' +
          'No prose before or after. Schema keys: positioningOneLiners ' +
          '(2 × {text}), hooks (10 × {family,text,audience,situation,visualDirection}), ' +
          'ugcScripts (5 × {title,durationSec,script,shotList[],callToAction}), ' +
          'imageConcepts (10 × {title,visualDescription,renderingNote,forUseWith}), ' +
          'warnings (string[]), qualitySelfCheck ({localeIntent,verticalKeywordsUsed[],hookFamiliesCovered[]}).',
        messages: [{ role: 'user', content: buildUserPrompt(ctx, input, lastFailureSummary) }],
      });
      const latencyMs = Date.now() - t0;
      const raw = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      const tokensIn = msg.usage?.input_tokens;
      const tokensOut = msg.usage?.output_tokens;

      let payload: LlmGenerationPayload | null = null;
      try {
        payload = JSON.parse(extractJson(raw)) as LlmGenerationPayload;
      } catch (e) {
        const fail = `json-parse · ${(e as Error).message}`;
        attempts.push({ attemptNumber, ok: false, failures: [fail], latencyMs, tokensIn, tokensOut });
        lastFailureSummary = fail;
        continue;
      }

      const v = validateLlmPayload(payload, ctx);
      attempts.push({ attemptNumber, ok: v.ok, failures: v.failures, latencyMs, tokensIn, tokensOut });
      if (v.ok) {
        return {
          result: { payload, attempts: attemptNumber, latencyMs, tokensIn, tokensOut, model: DEFAULT_MODEL },
          attempts,
          fellBackToCorpus: false,
        };
      }
      lastFailureSummary = v.failures.join(' · ');
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = e as any;
      const parts = ['call-error'];
      if (typeof err?.status === 'number') parts.push(`status=${err.status}`);
      parts.push(typeof err?.message === 'string' ? err.message : String(e));
      const fullMsg = parts.join(' · ');
      attempts.push({ attemptNumber, ok: false, failures: [fullMsg], latencyMs: Date.now() - t0 });
      lastFailureSummary = fullMsg;
    }
  }

  return {
    result: null, attempts, fellBackToCorpus: true,
    fallbackReason: lastFailureSummary ?? 'unknown-failure',
  };
}
