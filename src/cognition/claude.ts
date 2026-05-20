/**
 * Cognition layer — thin wrapper around Anthropic's SDK.
 *
 * Engines call `think()` with a structured prompt; the wrapper handles
 * prompt caching of the long system prompts, model selection, and JSON
 * extraction. When ANTHROPIC_API_KEY is missing, callers should fall
 * back to their own deterministic banks (each engine ships one).
 */

import Anthropic from '@anthropic-ai/sdk';

const ENABLED = !!process.env.ANTHROPIC_API_KEY && process.env.MOOD_FORCE_STUBS !== '1';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return client;
}

export function cognitionEnabled(): boolean {
  return ENABLED;
}

// Model selection — see system context for current Claude family.
// Opus drives creative judgement (truth, direction, critique).
// Haiku handles fast structural work (composition, typography choices).
export const MODELS = {
  judgement: 'claude-opus-4-5' as const,
  structural: 'claude-haiku-4-5' as const,
} as const;

export interface ThinkInput {
  model: 'judgement' | 'structural';
  /** Long, stable system text — eligible for prompt caching. */
  system: string;
  /** Short, per-call user message. */
  user: string;
  /** Optional response schema hint (we ask the model for JSON). */
  jsonShape?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function think<T = unknown>(input: ThinkInput): Promise<T> {
  if (!ENABLED) {
    throw new Error('cognition-disabled');
  }
  const modelId = MODELS[input.model];
  const userMessage = input.jsonShape
    ? `${input.user}\n\nReturn ONLY a single JSON object matching this shape:\n${input.jsonShape}\n\nNo prose. No code fences. JSON only.`
    : input.user;

  const response = await getClient().messages.create({
    model: modelId,
    max_tokens: input.maxTokens ?? 1024,
    temperature: input.temperature ?? 0.8,
    system: [
      {
        type: 'text',
        text: input.system,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  if (!input.jsonShape) return text as T;
  return parseJsonStrict<T>(text);
}

function parseJsonStrict<T>(text: string): T {
  // Strip code fences if a model insists on them.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // Last-resort: find the first { … } balanced block.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error(`cognition: invalid JSON: ${cleaned.slice(0, 200)}`);
  }
}
