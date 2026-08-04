/**
 * 8. CTA ENGINE
 *
 * Every banner gets one intentional Hebrew CTA. The CTA is selected by
 * the direction's ctaBehavior, then sized and styled for the layout.
 *
 * No "Buy Now". No "Limited Time". The CTA is part of the design
 * language, not a conversion shout.
 */

import type { CTA, CompositionPlan, CreativeDirection, EngineContext } from '@/core/types';

const LIBRARY: Array<{ text: string; tone: 'quiet' | 'curious' | 'direct' }> = [
  { text: 'גלה את הריטואל',   tone: 'curious' },
  { text: 'יש ריטואל אחר',     tone: 'curious' },
  { text: 'להזמנה',            tone: 'direct'  },
  { text: 'נסה עכשיו',         tone: 'direct'  },
  { text: 'לינק בביו',         tone: 'quiet'   },
  { text: 'בחר פורמולה',       tone: 'curious' },
];

const TONE_BY_BEHAVIOR: Record<CreativeDirection['ctaBehavior'], 'quiet' | 'curious' | 'direct'> = {
  quiet:      'quiet',
  integrated: 'curious',
  editorial:  'curious',
  corner:     'direct',
};

const STYLE_BY_BEHAVIOR: Record<CreativeDirection['ctaBehavior'], CTA['style']> = {
  quiet:      'bare',
  integrated: 'underline',
  editorial:  'underline',
  corner:     'pill',
};

export interface BuildCTAInput {
  ctx: EngineContext;
  direction: CreativeDirection;
  composition: CompositionPlan;
  seed?: number;
}

export function buildCTA(input: BuildCTAInput): CTA {
  const { ctx, direction, composition } = input;
  const tone = TONE_BY_BEHAVIOR[direction.ctaBehavior];
  const candidates = LIBRARY.filter((c) => c.tone === tone);
  const pick = candidates[(input.seed ?? Date.now()) % candidates.length];

  const cta: CTA = {
    text: pick.text,
    lang: 'he',
    style: STYLE_BY_BEHAVIOR[direction.ctaBehavior],
    position: composition.typoZones.cta,
  };
  ctx.emit({ stage: 'cta', message: `${cta.text} (${cta.style})`, data: cta });
  return cta;
}
