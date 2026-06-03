/**
 * POST /api/render
 *
 * Operator-supervised. Validates a CreativeBrief through the
 * Asset Quality Guard, then renders banner / post / carousel
 * to SVG + PNG. NEVER publishes. NEVER auto-saves.
 *
 * Response shape (200):
 *   {
 *     ok: true,
 *     rendered: { packageType, slides: [{ pngBase64, svg, width, height }] },
 *     prompt:          string,
 *     negativePrompt:  string,
 *     productionSpec:  object,
 *     qualityGuard:    { ok, warnings, rejections, advisoryNotice },
 *     advisoryNotice:  string,
 *   }
 *
 * Response shape (422) — guard rejected:
 *   {
 *     ok: false,
 *     qualityGuard: { ok: false, rejections: [...], warnings: [...] },
 *     advisoryNotice: string,
 *   }
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { renderCreativeBrief } from '@/engines/export/creative';
import {
  briefToPrompt, briefToNegativePrompt, briefToProductionSpec,
  type CreativeBrief, type CreativePackageType, type PaletteKey,
  type VisualMode, type ProductPresence, type PlatformSize,
} from '@/components/creative-brief-svg';
import { runQualityGuard } from '@/engines/creative-quality-guard';
import type { Formula } from '@/core/types';

export const runtime = 'nodejs';

const VALID_FORMULAS: ReadonlySet<Formula> = new Set(['ENERGY', 'FOCUS', 'RELAX', 'SLEEP']);
const VALID_PACKAGE_TYPES: ReadonlySet<CreativePackageType> = new Set(['banner', 'post', 'carousel']);
const VALID_PALETTES: ReadonlySet<PaletteKey> = new Set(['cocoa', 'amber', 'ember', 'ivory', 'ink']);
const VALID_VISUAL_MODES: ReadonlySet<VisualMode> = new Set([
  'text-only-editorial', 'product-hero', 'human-moment', 'product-and-human', 'carousel-story',
]);
const VALID_PRESENCE: ReadonlySet<ProductPresence> = new Set([
  'none', 'pouch', 'chocolate-square', 'pouch-and-square',
]);
const VALID_PLATFORM_SIZES: ReadonlySet<PlatformSize> = new Set([
  'banner-1200x628', 'post-1080x1080', 'story-1080x1920', 'carousel-1080x1080',
]);

function validBrief(b: unknown): b is CreativeBrief {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  if (!VALID_FORMULAS.has(o.formula as Formula)) return false;
  if (!VALID_PACKAGE_TYPES.has(o.packageType as CreativePackageType)) return false;
  if (!VALID_PALETTES.has(o.paletteKey as PaletteKey)) return false;
  if (typeof o.headline !== 'string' || o.headline.length === 0) return false;
  if (typeof o.cta !== 'string' || o.cta.length === 0) return false;
  if (o.body !== undefined && typeof o.body !== 'string') return false;
  if (o.subline !== undefined && typeof o.subline !== 'string') return false;
  if (o.signature !== undefined && typeof o.signature !== 'string') return false;
  if (o.audience !== undefined && typeof o.audience !== 'string') return false;
  if (o.emotion !== undefined && typeof o.emotion !== 'string') return false;
  if (o.visualMode !== undefined && !VALID_VISUAL_MODES.has(o.visualMode as VisualMode)) return false;
  if (o.productPresence !== undefined && !VALID_PRESENCE.has(o.productPresence as ProductPresence)) return false;
  if (o.platformSize !== undefined && !VALID_PLATFORM_SIZES.has(o.platformSize as PlatformSize)) return false;
  if (o.slides !== undefined) {
    if (!Array.isArray(o.slides)) return false;
    for (const s of o.slides) {
      if (!s || typeof s !== 'object') return false;
      const sl = s as Record<string, unknown>;
      if (typeof sl.headline !== 'string' || sl.headline.length === 0) return false;
      if (sl.visualMode !== undefined && !VALID_VISUAL_MODES.has(sl.visualMode as VisualMode)) return false;
      if (sl.productPresence !== undefined && !VALID_PRESENCE.has(sl.productPresence as ProductPresence)) return false;
    }
  }
  return true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;

  let body: { brief?: CreativeBrief };
  try {
    body = (await req.json()) as { brief?: CreativeBrief };
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!validBrief(body.brief)) {
    return NextResponse.json({
      error: 'brief is required and must include formula, packageType, paletteKey, headline, cta',
    }, { status: 400 });
  }

  const brief = body.brief;

  // ─── Asset Quality Guard ─────────────────────────────────────
  const guard = runQualityGuard(brief);
  if (!guard.ok) {
    return NextResponse.json({
      ok: false,
      qualityGuard: guard,
      advisoryNotice:
        'Asset Quality Guard rejected the brief — render NOT executed. ' +
        'See qualityGuard.rejections. Operator review required.',
    }, { status: 422 });
  }

  try {
    const rendered = await renderCreativeBrief(brief);
    const prompt = briefToPrompt(brief);
    const negativePrompt = briefToNegativePrompt(brief);
    const productionSpec = briefToProductionSpec(brief);
    return NextResponse.json({
      ok: true,
      rendered,
      prompt,
      negativePrompt,
      productionSpec,
      qualityGuard: guard,
      advisoryNotice:
        'Render preview composed. No publishing. No auto-approval. ' +
        'Operator approval required before the asset enters the library. ' +
        'Human remains final authority.',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
