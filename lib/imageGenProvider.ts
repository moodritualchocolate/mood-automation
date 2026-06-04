/**
 * IMAGE GENERATION PROVIDER (boundary)
 *
 * Defines the contract for connecting MOOD Creative OS to a real
 * image-generation backend. The concrete providers live behind
 * this interface so the rest of the system never assumes a
 * specific vendor.
 *
 * Default: NO_PROVIDER stub. Returns the prompt and a structured
 * "configure an image provider to render" advisory. The operator
 * can hand the prompt to an external tool (Midjourney, Krea,
 * Runway, Photoshop Generative Fill) manually.
 *
 * Production: configure one of the supported providers via env
 * vars. See `availableProviders()` for the matrix.
 *
 * STRICT CONTRACT:
 *   - the route NEVER hard-codes a vendor URL outside this module
 *   - the route NEVER stores API keys; they live in process.env
 *   - failures degrade to "no provider" — never throw to the UI
 *   - operator approval is still required before any rendered
 *     image enters the asset library
 */

export type ProviderId = 'none' | 'replicate-flux-schnell' | 'replicate-flux-dev' | 'replicate-sdxl';

export interface ImageGenRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16';
  /** Operator-supplied seed for reproducibility. */
  seed?: number;
}

export interface ImageGenResponse {
  ok: boolean;
  providerId: ProviderId;
  /** PNG / JPEG bytes as a base64 string. Null if the provider
   *  returned only a URL or if no provider was configured. */
  imageBase64?: string;
  /** Public URL of the generated image (provider-hosted). */
  imageUrl?: string;
  /** When ok === false, this carries the operator-facing reason. */
  error?: string;
  /** Always populated — the actual prompt the provider received,
   *  in case the adapter modified it. */
  effectivePrompt: string;
  effectiveNegativePrompt?: string;
  /** Latency in ms. */
  latencyMs?: number;
  advisoryNotice: string;
}

export interface ProviderDescriptor {
  id: ProviderId;
  name: string;
  envVar: string;
  notes: string;
  configured: boolean;
}

/** Returns the provider matrix with `configured` reflecting whether
 *  the required env var is set. Pure read of process.env. */
export function availableProviders(): ProviderDescriptor[] {
  const repToken = !!process.env.REPLICATE_API_TOKEN;
  return [
    { id: 'none', name: 'No provider · prompt-only', envVar: '—', notes: 'Default. Returns the prompt for manual use in an external image tool.', configured: true },
    { id: 'replicate-flux-schnell', name: 'Replicate · Flux Schnell (fast, lower fidelity)', envVar: 'REPLICATE_API_TOKEN', notes: 'Best for rapid concept iteration. ~1-3s per image.', configured: repToken },
    { id: 'replicate-flux-dev',     name: 'Replicate · Flux Dev (slower, higher fidelity)', envVar: 'REPLICATE_API_TOKEN', notes: 'Best for final marketing assets. ~10-30s per image.', configured: repToken },
    { id: 'replicate-sdxl',         name: 'Replicate · SDXL (classic)',                     envVar: 'REPLICATE_API_TOKEN', notes: 'Lower cost. Lower fidelity than Flux.', configured: repToken },
  ];
}

/** Pick the active provider based on env. If REPLICATE_API_TOKEN
 *  is set, defaults to flux-dev; otherwise returns the stub. */
export function defaultProvider(): ProviderId {
  const preferred = process.env.MOOD_IMAGE_PROVIDER as ProviderId | undefined;
  if (preferred && availableProviders().some((p) => p.id === preferred && p.configured)) return preferred;
  if (process.env.REPLICATE_API_TOKEN) return 'replicate-flux-dev';
  return 'none';
}

// ─── concrete providers ───────────────────────────────────────

async function generateNoProvider(req: ImageGenRequest): Promise<ImageGenResponse> {
  return {
    ok: false,
    providerId: 'none',
    error:
      'No image-generation provider is configured. ' +
      'Set REPLICATE_API_TOKEN (or another supported provider env var) ' +
      'to enable real-image rendering. Until then, copy the prompt to ' +
      'your image tool of choice (Midjourney, Krea, Runway).',
    effectivePrompt: req.prompt,
    effectiveNegativePrompt: req.negativePrompt,
    advisoryNotice:
      'Operator-supervised — no auto-publishing. The prompt is the ' +
      'deliverable until a provider is wired. Human remains final authority.',
  };
}

async function generateReplicate(model: 'flux-schnell' | 'flux-dev' | 'sdxl', req: ImageGenRequest): Promise<ImageGenResponse> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return generateNoProvider(req);

  const aspect = req.aspectRatio ?? '1:1';
  const versions: Record<typeof model, string> = {
    'flux-schnell': 'black-forest-labs/flux-schnell',
    'flux-dev':     'black-forest-labs/flux-dev',
    'sdxl':         'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  };
  const slug = versions[model];
  const startTime = Date.now();
  try {
    // Use the /predictions endpoint with the model slug. Replicate's
    // newer API accepts a `model` field for first-party models.
    const body = {
      input: {
        prompt: req.prompt,
        ...(req.negativePrompt ? { negative_prompt: req.negativePrompt } : {}),
        aspect_ratio: aspect,
        ...(req.seed ? { seed: req.seed } : {}),
        output_format: 'png',
      },
    };
    const res = await fetch(`https://api.replicate.com/v1/models/${slug}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        providerId: model === 'flux-schnell' ? 'replicate-flux-schnell' : model === 'flux-dev' ? 'replicate-flux-dev' : 'replicate-sdxl',
        error: `Replicate API error ${res.status}: ${text.slice(0, 200)}`,
        effectivePrompt: req.prompt, effectiveNegativePrompt: req.negativePrompt,
        latencyMs: Date.now() - startTime,
        advisoryNotice: 'Operator-supervised — the call failed. Inspect logs. Human remains final authority.',
      };
    }
    const json = await res.json() as { output?: string | string[]; status?: string; error?: string };
    const url = Array.isArray(json.output) ? json.output[0] : json.output;
    if (!url) {
      return {
        ok: false,
        providerId: model === 'flux-schnell' ? 'replicate-flux-schnell' : model === 'flux-dev' ? 'replicate-flux-dev' : 'replicate-sdxl',
        error: `Replicate returned no image URL · status=${json.status} error=${json.error ?? 'none'}`,
        effectivePrompt: req.prompt, effectiveNegativePrompt: req.negativePrompt,
        latencyMs: Date.now() - startTime,
        advisoryNotice: 'Operator-supervised — empty response from provider.',
      };
    }
    return {
      ok: true,
      providerId: model === 'flux-schnell' ? 'replicate-flux-schnell' : model === 'flux-dev' ? 'replicate-flux-dev' : 'replicate-sdxl',
      imageUrl: url,
      effectivePrompt: req.prompt, effectiveNegativePrompt: req.negativePrompt,
      latencyMs: Date.now() - startTime,
      advisoryNotice: 'Operator-supervised — image returned. No auto-save. Operator approves before it enters the library.',
    };
  } catch (e) {
    return {
      ok: false,
      providerId: model === 'flux-schnell' ? 'replicate-flux-schnell' : model === 'flux-dev' ? 'replicate-flux-dev' : 'replicate-sdxl',
      error: `Network / runtime error: ${(e as Error).message}`,
      effectivePrompt: req.prompt, effectiveNegativePrompt: req.negativePrompt,
      latencyMs: Date.now() - startTime,
      advisoryNotice: 'Operator-supervised — provider unreachable. Human remains final authority.',
    };
  }
}

// ─── public entrypoint ────────────────────────────────────────

export async function generateImage(req: ImageGenRequest, providerId?: ProviderId): Promise<ImageGenResponse> {
  const id = providerId ?? defaultProvider();
  switch (id) {
    case 'replicate-flux-schnell': return generateReplicate('flux-schnell', req);
    case 'replicate-flux-dev':     return generateReplicate('flux-dev', req);
    case 'replicate-sdxl':         return generateReplicate('sdxl', req);
    case 'none':
    default:                       return generateNoProvider(req);
  }
}
