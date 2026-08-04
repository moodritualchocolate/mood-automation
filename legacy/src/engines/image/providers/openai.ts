/**
 * OpenAI image provider (gpt-image-1).
 *
 * Returns a base64-encoded inline image so the rest of the pipeline
 * (renderer, exporter) does not depend on remote URL availability.
 */

import OpenAI from 'openai';
import type { ImageProvider } from './base';
import { flatten } from '../prompt-builder';

const ASPECT_TO_SIZE: Record<string, '1024x1024' | '1024x1536' | '1536x1024'> = {
  '1:1': '1024x1024',
  '4:5': '1024x1536',
  '9:16': '1024x1536',
  '16:9': '1536x1024',
};

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return client;
}

export const openaiProvider: ImageProvider = {
  name: 'openai-gpt-image-1',
  async generate({ brief }) {
    const prompt = flatten(brief);
    const size = ASPECT_TO_SIZE[brief.aspect] ?? '1024x1536';

    const response = await getClient().images.generate({
      model: 'gpt-image-1',
      prompt,
      size,
      quality: 'high',
      n: 1,
    });

    const datum = response.data?.[0];
    if (!datum) throw new Error('openai: empty image response');

    const dataUrl = datum.b64_json
      ? `data:image/png;base64,${datum.b64_json}`
      : null;

    const [w, h] = size.split('x').map(Number) as [number, number];
    return {
      provider: 'openai-gpt-image-1',
      url: datum.url ?? null,
      dataUrl,
      width: w,
      height: h,
      cost: null,
    };
  },
};
