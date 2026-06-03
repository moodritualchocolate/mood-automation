/**
 * POST /api/render
 *
 * Operator-supervised. Renders a lightweight CreativeBrief
 * (banner / post / carousel) to SVG + PNG. NEVER publishes.
 * NEVER auto-saves. The operator decides whether to register
 * the result in the asset library.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { renderCreativeBrief } from '@/engines/export/creative';
import type { CreativeBrief, CreativePackageType, PaletteKey } from '@/components/creative-brief-svg';
import { briefToPrompt } from '@/components/creative-brief-svg';
import type { Formula } from '@/core/types';

export const runtime = 'nodejs';

const VALID_FORMULAS: ReadonlySet<Formula> = new Set(['ENERGY', 'FOCUS', 'RELAX', 'SLEEP']);
const VALID_PACKAGE_TYPES: ReadonlySet<CreativePackageType> = new Set(['banner', 'post', 'carousel']);
const VALID_PALETTES: ReadonlySet<PaletteKey> = new Set(['cocoa', 'amber', 'ember', 'ivory', 'ink']);

function validBrief(b: unknown): b is CreativeBrief {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  if (!VALID_FORMULAS.has(o.formula as Formula)) return false;
  if (!VALID_PACKAGE_TYPES.has(o.packageType as CreativePackageType)) return false;
  if (!VALID_PALETTES.has(o.paletteKey as PaletteKey)) return false;
  if (typeof o.headline !== 'string' || o.headline.length === 0) return false;
  if (typeof o.cta !== 'string' || o.cta.length === 0) return false;
  if (o.body !== undefined && typeof o.body !== 'string') return false;
  if (o.signature !== undefined && typeof o.signature !== 'string') return false;
  if (o.slides !== undefined) {
    if (!Array.isArray(o.slides)) return false;
    for (const s of o.slides) {
      if (!s || typeof s !== 'object') return false;
      const sl = s as Record<string, unknown>;
      if (typeof sl.headline !== 'string' || sl.headline.length === 0) return false;
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
    return NextResponse.json({ error: 'brief is required and must include formula, packageType, paletteKey, headline, cta' }, { status: 400 });
  }

  try {
    const rendered = await renderCreativeBrief(body.brief);
    const prompt = briefToPrompt(body.brief);
    return NextResponse.json({
      ok: true,
      rendered,
      prompt,
      advisoryNotice:
        'Render is a preview composition. No publishing. No auto-approval. ' +
        'Operator approval required before the asset enters the library. ' +
        'Human remains final authority.',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
