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

/**
 * TYPOGRAPHY INTELLIGENCE V2 — emotionally earned.
 *
 * Sizes do NOT come from the direction's dominance label alone.
 * The engine asks four questions before settling on a size:
 *
 *   1. Does the truth EARN oversized type? (short, sharp, contradictory)
 *   2. Does the state EARN silence? (numbness/paralysis/collapse families
 *      can survive without text — the photo carries it.)
 *   3. Does the time anchor EARN a timestamp? (only if the time itself
 *      is the emotional payload.)
 *   4. Does the layout EARN a secondary line? (some layouts collapse
 *      better with one line.)
 *
 * Failures here propagate as "randomTypography" failures in the taste
 * critic — but this engine tries to never let them happen.
 */

const DOMINANCE_TO_SIZE: Record<CreativeDirection['typographyDominance'], { primary: number; secondary: number }> = {
  absent:    { primary: 0,  secondary: 0  },
  whisper:   { primary: 42, secondary: 22 },
  editorial: { primary: 64, secondary: 26 },
  loud:      { primary: 88, secondary: 28 },
  timestamp: { primary: 56, secondary: 24 },
};

/**
 * "Earned size" — adjusts the base size up or down based on the truth
 * itself. A short truth (≤ 60 chars) with a contradiction earns more
 * size. A long, explanatory truth gets shrunk to whisper.
 */
function earnedSize(base: number, truth: HumanTruth, dominance: CreativeDirection['typographyDominance']): number {
  if (base === 0) return 0;
  const len = truth.truth.length;
  let factor = 1;
  if (len <= 50) factor += 0.15;          // short and sharp — push bigger
  else if (len <= 80) factor += 0.05;
  else if (len > 120) factor -= 0.15;     // too long for the chosen size — shrink

  // Tension exists → small bump.
  if (truth.tension && truth.tension.length < 40) factor += 0.05;

  // Loud dominance must be EARNED — for collapsed/numb families, refuse the loud bump.
  if (dominance === 'loud' && ['numbness', 'paralysis', 'collapse'].includes(truth.state.family)) {
    factor *= 0.7;
  }

  return Math.round(base * factor);
}

/**
 * The engine has the right to OVERRULE the direction's dominance and
 * fall back to whisper when typography is not earned. This is the
 * "silence is stronger" rule from the spec.
 */
function effectiveDominance(
  dominance: CreativeDirection['typographyDominance'],
  truth: HumanTruth,
): CreativeDirection['typographyDominance'] {
  // Timestamp dominance without a time anchor → silently downgrade to
  // editorial. (Taste critic will still penalise this — the engine just
  // refuses to draw the offending big timestamp.)
  if (dominance === 'timestamp' && !truth.state.timeAnchor) return 'editorial';

  // Loud dominance on a numb / paralysis family → downgrade to editorial.
  if (dominance === 'loud' && ['numbness', 'paralysis'].includes(truth.state.family)) return 'editorial';

  return dominance;
}

export interface BuildTypoInput {
  ctx: EngineContext;
  truth: HumanTruth;
  direction: CreativeDirection;
}

export async function buildTypography(input: BuildTypoInput): Promise<TypographyPlan> {
  const { ctx, truth, direction } = input;
  const dominance = effectiveDominance(direction.typographyDominance, truth);
  if (dominance !== direction.typographyDominance) {
    ctx.emit({
      stage: 'typography',
      message: `dominance overruled: ${direction.typographyDominance} → ${dominance} (not earned)`,
    });
  }

  const baseSizes = DOMINANCE_TO_SIZE[dominance];
  const sizes = {
    primary: earnedSize(baseSizes.primary, truth, dominance),
    secondary: baseSizes.secondary,
  };

  let primaryText = '';
  let secondaryText: string | null = null;

  if (cognitionEnabled() && dominance !== 'absent') {
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

  // Secondary line should disappear when restraint is high or when the
  // headline carries the whole weight. "Silence is stronger."
  const dropSecondary =
    dominance === 'absent' ||
    direction.restraint > 0.8 ||
    truth.truth.length < 60;

  const plan: TypographyPlan = {
    primary: {
      text: primaryText,
      lang: 'he',
      size: sizes.primary,
      weight: dominance === 'loud' ? 800 : dominance === 'whisper' ? 400 : 500,
      tracking: -0.02,
      leading: 1.05,
      color: '#F7F5F2',
      align: 'start',
    },
    secondary: dropSecondary || !secondaryText
      ? null
      : {
          text: secondaryText,
          lang: 'he',
          size: sizes.secondary,
          weight: 400,
          color: '#D8D2C8',
        },
    timestamp: dominance === 'timestamp' && truth.state.timeAnchor
      ? { text: truth.state.timeAnchor, size: 56 }
      : null,
  };

  const validated = TypographyPlanSchema.parse(plan);
  ctx.emit({ stage: 'typography', message: validated.primary.text, data: validated });
  return validated;
}
