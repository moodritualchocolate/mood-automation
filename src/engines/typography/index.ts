/**
 * 7. TYPOGRAPHY ENGINE
 *
 * Typography lives in HTML + CSS + SVG. It is never inside the
 * generated image. The engine decides the headline, secondary, and
 * optional timestamp — sized for the chosen layout family and
 * dominance level.
 *
 * Hebrew is the primary language. The headline is the human truth,
 * adapted into Hebrew. The engine ships a curated Hebrew bank tied to
 * each state; when cognition is available, Claude produces the line.
 */

import type { CreativeDirection, EngineContext, HumanTruth, TypographyPlan } from '@/core/types';
import { TypographyPlanSchema } from '@/core/types';
import { cognitionEnabled, think } from '@/cognition/claude';
import { MOOD_VOICE } from '@/cognition/voice';
import { HEADLINES_HE } from './hebrew-headlines';

const SYSTEM = `
${MOOD_VOICE}

You are the TYPOGRAPHY engine of MOOD CREATIVE OS.

Given a human truth, produce a single editorial Hebrew headline that:
- captures the truth in 4 to 9 Hebrew words
- contains no exclamation points, no emojis, no question marks
- avoids slogan language ("גלה את עצמך")
- avoids product mention
- can be read in under one second
- uses everyday Hebrew, not literary Hebrew
- prefers dryness over drama

Also produce a short secondary line (3-6 Hebrew words, more specific
than the headline). The secondary may be null if the headline carries
the whole weight.
`.trim();

const DOMINANCE_TO_SIZE: Record<CreativeDirection['typographyDominance'], { primary: number; secondary: number }> = {
  absent:    { primary: 0,  secondary: 0  },
  whisper:   { primary: 42, secondary: 22 },
  editorial: { primary: 64, secondary: 26 },
  loud:      { primary: 88, secondary: 28 },
  timestamp: { primary: 56, secondary: 24 },
};

export interface BuildTypoInput {
  ctx: EngineContext;
  truth: HumanTruth;
  direction: CreativeDirection;
}

export async function buildTypography(input: BuildTypoInput): Promise<TypographyPlan> {
  const { ctx, truth, direction } = input;
  const sizes = DOMINANCE_TO_SIZE[direction.typographyDominance];

  let primaryText = '';
  let secondaryText: string | null = null;

  if (cognitionEnabled() && direction.typographyDominance !== 'absent') {
    try {
      const raw = await think<{ primary: string; secondary: string | null }>({
        model: 'judgement',
        system: SYSTEM,
        user: [
          `STATE: ${truth.state.label}`,
          `TRUTH (English source): ${truth.truth}`,
          `TENSION: ${truth.tension}`,
          `TYPOGRAPHY DOMINANCE: ${direction.typographyDominance}`,
          'Return the Hebrew headline and secondary.',
        ].join('\n'),
        jsonShape: `{ "primary": "string (Hebrew)", "secondary": "string (Hebrew) | null" }`,
        temperature: 0.7,
        maxTokens: 200,
      });
      primaryText = raw.primary;
      secondaryText = raw.secondary;
    } catch (e) {
      ctx.emit({ stage: 'typography', message: 'cognition failed, using bank', data: { error: (e as Error).message } });
    }
  }

  if (!primaryText) {
    const entry = HEADLINES_HE[truth.state.id];
    primaryText = entry?.primary ?? truth.state.label;
    secondaryText = entry?.secondary ?? null;
  }

  const plan: TypographyPlan = {
    primary: {
      text: primaryText,
      lang: 'he',
      size: sizes.primary,
      weight: direction.typographyDominance === 'loud' ? 800 : 500,
      tracking: -0.02,
      leading: 1.05,
      color: '#F7F5F2',
      align: 'start',
    },
    secondary: direction.typographyDominance === 'absent' || !secondaryText
      ? null
      : {
          text: secondaryText,
          lang: 'he',
          size: sizes.secondary,
          weight: 400,
          color: '#D8D2C8',
        },
    timestamp: direction.typographyDominance === 'timestamp' && truth.state.timeAnchor
      ? { text: truth.state.timeAnchor, size: 56 }
      : null,
  };

  const validated = TypographyPlanSchema.parse(plan);
  ctx.emit({ stage: 'typography', message: validated.primary.text, data: validated });
  return validated;
}
