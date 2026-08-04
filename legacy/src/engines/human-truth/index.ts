/**
 * 2. HUMAN TRUTH ENGINE
 *
 * Transforms a HumanState into a sharp human insight: a single sentence
 * that someone reading would feel was written from inside their day.
 *
 * Strategy:
 *  - If cognition is enabled, ask Claude (Opus) with strict voice rules.
 *  - Otherwise, fall back to a curated bank per state. Both paths return
 *    the same shape; downstream engines never know which ran.
 */

import type { EngineContext, HumanState, HumanTruth } from '@/core/types';
import { HumanTruthSchema } from '@/core/types';
import { cognitionEnabled, think } from '@/cognition/claude';
import { MOOD_VOICE } from '@/cognition/voice';
import { EngineError } from '@/core/errors';
import { TRUTH_BANK } from './bank';

const SYSTEM = `
${MOOD_VOICE}

You are the HUMAN TRUTH engine of MOOD CREATIVE OS.

Your only job: produce one sharp human truth that names what a specific
emotional state actually is, beneath its surface. The truth should:

- be a single sentence, maximum 18 words
- feel observed, not advised
- contain a contradiction or quiet recognition
- never offer hope, solutions, or product mention
- never use words: "feel", "energy", "moment", "journey", "fuel"
- be written in English (will be translated later if needed)

You will also output:
- "tension": one short phrase naming the internal contradiction
- "voice": one of "observed" (third-person watching) | "overheard"
  (heard from a friend) | "internal" (their own thoughts)
- "forbidden": three motivational phrases that must never appear nearby
`.trim();

export interface BuildInput {
  ctx: EngineContext;
  state: HumanState;
}

export async function buildHumanTruth(input: BuildInput): Promise<HumanTruth> {
  const { ctx, state } = input;

  ctx.emit({ stage: 'human-truth', message: `unfolding: ${state.label}` });

  if (cognitionEnabled()) {
    try {
      const raw = await think<HumanTruth>({
        model: 'judgement',
        system: SYSTEM,
        user: buildUserPrompt(state),
        jsonShape: `{
  "state": <pass through exactly>,
  "truth": "string (single sentence, <= 18 words)",
  "tension": "short phrase",
  "voice": "observed" | "overheard" | "internal",
  "forbidden": ["string", "string", "string"]
}`,
        temperature: 0.85,
        maxTokens: 400,
      });

      const parsed = HumanTruthSchema.parse({ ...raw, state });
      ctx.emit({ stage: 'human-truth', message: parsed.truth });
      return parsed;
    } catch (e) {
      ctx.emit({
        stage: 'human-truth',
        message: 'cognition failed, falling back to curated bank',
        data: { error: (e as Error).message },
      });
    }
  }

  return fallbackTruth(ctx, state);
}

function buildUserPrompt(state: HumanState): string {
  return [
    `STATE: ${state.label}`,
    `FAMILY: ${state.family}`,
    `SETTINGS: ${state.setting.join('; ')}`,
    `BODY: ${state.body.join('; ')}`,
    state.timeAnchor ? `TIME: ${state.timeAnchor}` : '',
    '',
    'Output the JSON now.',
  ].filter(Boolean).join('\n');
}

function fallbackTruth(ctx: EngineContext, state: HumanState): HumanTruth {
  const entry = TRUTH_BANK[state.id];
  if (!entry) throw new EngineError('human-truth', `no fallback for ${state.id}`);
  const truth: HumanTruth = {
    state,
    truth: entry.truth,
    tension: entry.tension,
    voice: entry.voice,
    forbidden: ['embrace the moment', 'fuel your day', 'unlock your potential'],
  };
  ctx.emit({ stage: 'human-truth', message: truth.truth });
  return truth;
}
