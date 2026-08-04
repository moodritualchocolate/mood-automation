/**
 * POST /api/image-gen
 *
 * Operator-supervised image generation. Takes a prompt + negative
 * prompt + aspect ratio and dispatches to the configured provider
 * (none / Replicate Flux Schnell / Flux Dev / SDXL). When no
 * provider is configured, returns a structured "configure a
 * provider" advisory along with the prompt — never throws.
 *
 *   Body: {
 *     prompt:          string,
 *     negativePrompt?: string,
 *     aspectRatio?:    '1:1' | '4:5' | '16:9' | '9:16',
 *     seed?:           number,
 *     providerId?:     'none' | 'replicate-flux-schnell' | 'replicate-flux-dev' | 'replicate-sdxl',
 *     operatorReason:  string,
 *   }
 *
 * STRICT CONTRACT:
 *   - the route NEVER saves the generated image to the asset
 *     library — that requires a separate operator-supervised
 *     register call via /api/asset-registry
 *   - never charges (Replicate is metered separately by the
 *     operator's own API key)
 *   - degrades to "no provider" gracefully when env is missing
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import {
  generateImage, availableProviders, defaultProvider, type ProviderId,
} from '@lib/imageGenProvider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16';
  seed?: number;
  providerId?: ProviderId;
  operatorReason: string;
}

export async function GET(): Promise<NextResponse> {
  // Provider discovery — operator UI uses this to pick a provider.
  return NextResponse.json({
    providers: availableProviders(),
    activeProvider: defaultProvider(),
    advisoryNotice:
      'Image-gen providers · read-only · env-gated. The operator selects ' +
      'the provider at request time. Human remains final authority.',
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;

  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.prompt !== 'string' || body.prompt.length < 8) {
    return NextResponse.json({ error: 'prompt must be ≥ 8 characters' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const response = await generateImage({
    prompt: body.prompt,
    negativePrompt: body.negativePrompt,
    aspectRatio: body.aspectRatio,
    seed: body.seed,
  }, body.providerId);

  return NextResponse.json(response);
}
