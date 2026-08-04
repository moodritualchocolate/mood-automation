/**
 * 5. IMAGE GENERATION ENGINE
 *
 * The image generator is NOT the designer. It is ONLY the camera.
 *
 * It will NEVER generate:
 *  - Hebrew or English text
 *  - numbers, CTAs, logos, packaging text
 *  - fake typography of any kind
 *
 * It produces a cinematic, photographic scene aligned with the
 * composition plan's negative-space bias so the typography overlay has
 * a place to live.
 */

import type { CompositionPlan, CreativeDirection, EngineContext, HumanTruth, ImageBrief, ImageResult } from '@/core/types';
import { buildImagePrompt } from './prompt-builder';
import { stubProvider } from './providers/stub';
import { openaiProvider } from './providers/openai';

export interface GenerateImageInput {
  ctx: EngineContext;
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
}

export async function generateImage(input: GenerateImageInput): Promise<{ brief: ImageBrief; image: ImageResult }> {
  const { ctx, truth, direction, composition } = input;

  const brief = buildImagePrompt({ truth, direction, composition });
  ctx.emit({ stage: 'image-brief', message: brief.scene, data: brief });

  const useReal = !!process.env.OPENAI_API_KEY && process.env.MOOD_FORCE_STUBS !== '1';
  const provider = useReal ? openaiProvider : stubProvider;

  ctx.emit({ stage: 'image-generation', message: `provider: ${provider.name}` });

  const image = await provider.generate({ brief, composition });
  ctx.emit({
    stage: 'image-generation',
    message: 'image ready',
    data: { provider: image.provider, w: image.width, h: image.height },
  });

  return { brief, image };
}
