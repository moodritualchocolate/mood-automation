/**
 * Creative Brief Renderers — SVG composers for the Asset Generator.
 *
 * These do NOT replace the existing Banner pipeline (banner-svg.ts).
 * They let an operator render a banner / post / carousel from a
 * small, hand-authored brief and register it in the asset library.
 *
 * Pure functions: take a CreativeBrief, return an SVG string. The
 * /api/render route rasterizes the SVG to PNG via Resvg.
 *
 * Visual modes (Real Marketing Asset Quality phase):
 *   - text-only-editorial   — gradient + typography (current behavior)
 *   - product-hero          — large pouch + chocolate square + typography
 *   - human-moment          — still-life scene (window light + table) + typography
 *   - product-and-human     — hand holding the pouch + typography
 *   - carousel-story        — N slides; visualMode applied per-slide
 *
 * When visualMode != 'text-only-editorial', the canvas uses the
 * formula's canonical palette (FORMULA_PALETTES) instead of the
 * arbitrary paletteKey. This keeps the asset formula-correct.
 */

import type { Formula } from '@/core/types';
import {
  FORMULA_PALETTES,
  composeMoodPouch,
  composeChocolateSquare,
  composeHandSilhouette,
  composeStillLifeScene,
  shade,
} from '@/components/creative-brief-imagery';

export type CreativePackageType = 'banner' | 'post' | 'carousel';

export type PaletteKey = 'cocoa' | 'amber' | 'ember' | 'ivory' | 'ink';

export type VisualMode =
  | 'text-only-editorial'
  | 'product-hero'
  | 'human-moment'
  | 'product-and-human'
  | 'carousel-story';

export type ProductPresence = 'none' | 'pouch' | 'chocolate-square' | 'pouch-and-square';

export type PlatformSize =
  | 'banner-1200x628'
  | 'post-1080x1080'
  | 'story-1080x1920'
  | 'carousel-1080x1080';

export interface CreativeBriefSlide {
  headline: string;
  body?: string;
  cta?: string;
  /** Per-slide visualMode override (carousel-story only). When absent,
   *  the slide inherits the brief-level visualMode. */
  visualMode?: VisualMode;
  /** Per-slide productPresence override. */
  productPresence?: ProductPresence;
}

export interface CreativeBrief {
  formula: Formula;
  packageType: CreativePackageType;
  paletteKey: PaletteKey;
  headline: string;
  /** Alias of `subline` — kept for backwards compatibility. */
  body?: string;
  cta: string;
  signature?: string;
  /** Carousel-only. First slide is the cover (headline/body/cta from above). */
  slides?: CreativeBriefSlide[];

  // ─── Real Marketing Asset Quality fields ─────────────────────
  /** Operator-authored audience description (used in production spec
   *  and surfaced to the brand guardian). */
  audience?: string;
  /** Operator-authored emotion descriptor. */
  emotion?: string;
  /** Visual mode — drives the renderer's layout dispatch. */
  visualMode?: VisualMode;
  /** Product presence in the asset. Required for product-hero +
   *  product-and-human modes. */
  productPresence?: ProductPresence;
  /** Explicit subline. When absent, falls back to `body`. */
  subline?: string;
  /** Platform size hint. The renderer picks canvas dimensions per
   *  packageType, but this field is recorded in the production spec
   *  so downstream tooling knows the operator's intent. */
  platformSize?: PlatformSize;
}

const FONT_HEBREW = "Heebo, 'Arial Hebrew', Arial, sans-serif";
const FONT_EDITORIAL = "'Times New Roman', Georgia, serif";

// ─── legacy paletteKey palette (text-only-editorial only) ─────

interface Palette {
  bg0: string;
  bg1: string;
  fg: string;
  accent: string;
  muted: string;
  name: string;
}

export const PALETTES: Record<PaletteKey, Palette> = {
  cocoa:  { bg0: '#1A0F0A', bg1: '#3A1F12', fg: '#F2E6D8', accent: '#C9A24B', muted: '#A28567', name: 'cocoa' },
  amber:  { bg0: '#1C1208', bg1: '#5A3A16', fg: '#F7E9CC', accent: '#FFB155', muted: '#B89568', name: 'amber' },
  ember:  { bg0: '#1A0606', bg1: '#5A1E14', fg: '#F8E5D8', accent: '#FF6A3D', muted: '#B07565', name: 'ember' },
  ivory:  { bg0: '#F2EEE6', bg1: '#D8D0BE', fg: '#1A1410', accent: '#5A3A1E', muted: '#5F564A', name: 'ivory' },
  ink:    { bg0: '#050505', bg1: '#1A1A1A', fg: '#F7F5F2', accent: '#F7F5F2', muted: '#7A7A7A', name: 'ink' },
};

// ─── helpers ──────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** Returns the canvas-level palette for a brief. When visualMode is
 *  text-only-editorial, uses the paletteKey palette; otherwise uses
 *  the formula palette so the asset is brand-correct. */
function canvasPalette(brief: CreativeBrief, visualMode: VisualMode): {
  bg0: string; bg1: string; fg: string; accent: string;
} {
  if (visualMode === 'text-only-editorial') {
    const p = PALETTES[brief.paletteKey];
    return { bg0: p.bg0, bg1: p.bg1, fg: p.fg, accent: p.accent };
  }
  const fp = FORMULA_PALETTES[brief.formula];
  return { bg0: fp.bg0, bg1: fp.bg1, fg: fp.cream, accent: fp.accent };
}

function defs(palette: { bg0: string; bg1: string }, key: string): string {
  return `
    <defs>
      <linearGradient id="bg-${key}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg0}"/>
        <stop offset="100%" stop-color="${palette.bg1}"/>
      </linearGradient>
      <radialGradient id="vignette-${key}" cx="50%" cy="50%" r="75%">
        <stop offset="60%" stop-color="${palette.bg0}" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
      </radialGradient>
      <filter id="grain-${key}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${(hash(key) % 100) + 1}"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0"/>
      </filter>
    </defs>
  `;
}
function backdrop(w: number, h: number, key: string): string {
  return `
    <rect width="${w}" height="${h}" fill="url(#bg-${key})"/>
    <rect width="${w}" height="${h}" fill="url(#vignette-${key})"/>
    <rect width="${w}" height="${h}" filter="url(#grain-${key})"/>
  `;
}
function hairline(x1: number, y1: number, x2: number, y2: number, color: string): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" stroke-opacity="0.45"/>`;
}
function signatureMark(x: number, y: number, fg: string, label: string): string {
  const text = esc(label);
  return `
    <g>
      <text x="${x}" y="${y}" text-anchor="end"
            font-family="${FONT_EDITORIAL}" font-size="20"
            fill="${fg}" fill-opacity="0.85" letter-spacing="6">${text}</text>
      <line x1="${x - 32}" y1="${y + 6}" x2="${x}" y2="${y + 6}"
            stroke="${fg}" stroke-opacity="0.45" stroke-width="1"/>
    </g>
  `;
}
function eyebrowLabel(x: number, y: number, fg: string, label: string): string {
  return `
    <text x="${x}" y="${y}"
          font-family="${FONT_HEBREW}" font-size="14"
          fill="${fg}" fill-opacity="0.55"
          letter-spacing="4">${esc(label)}</text>
  `;
}

// ─── visualMode renderers ─────────────────────────────────────

/** Drops product imagery (pouch / square / both) into the canvas
 *  at a position appropriate for the package type. */
function renderProductLayer(args: {
  w: number; h: number;
  packageType: CreativePackageType;
  formula: Formula;
  presence: ProductPresence;
  textZoneSide: 'left' | 'right';
  idKey: string;
}): string {
  const { w, h, packageType, formula, presence, textZoneSide, idKey } = args;
  if (presence === 'none') return '';
  // Anchor product on the side opposite the text.
  const productX = textZoneSide === 'left' ? w * 0.72 : w * 0.28;
  const productY = h * 0.52;
  const scale = packageType === 'banner' ? 0.78 : 1.0;

  let out = '';
  if (presence === 'pouch' || presence === 'pouch-and-square') {
    out += composeMoodPouch({
      formula, cx: productX, cy: productY, scale, rotateDeg: -4,
      idKey: `${idKey}-pouch`,
    });
  }
  if (presence === 'chocolate-square' || presence === 'pouch-and-square') {
    // Place the square at lower-right of the pouch (or center if no pouch).
    const sqOffsetX = presence === 'pouch-and-square' ? (textZoneSide === 'left' ? -160 : 160) * scale : 0;
    const sqOffsetY = presence === 'pouch-and-square' ? 170 * scale : 0;
    out += composeChocolateSquare({
      cx: productX + sqOffsetX, cy: productY + sqOffsetY,
      scale: 0.55 * scale, rotateDeg: 9,
      idKey: `${idKey}-square`,
    });
  }
  return out;
}

function renderHumanLayer(args: {
  w: number; h: number;
  packageType: CreativePackageType;
  formula: Formula;
  withProduct: boolean;
  textZoneSide: 'left' | 'right';
  idKey: string;
}): string {
  const { w, h, packageType, formula, withProduct, textZoneSide, idKey } = args;
  const palette = FORMULA_PALETTES[formula];
  const scene = composeStillLifeScene({ w, h, palette, idKey: `${idKey}-scene` });

  if (!withProduct) return scene;
  // When paired with product, draw the hand wrapping around the pouch.
  // The pouch is drawn separately by renderProductLayer; here we
  // just add the hand silhouette anchored at the same x.
  const handX = textZoneSide === 'left' ? w * 0.72 - 60 : w * 0.28 - 60;
  const handY = h * 0.52 + 100;
  const hand = composeHandSilhouette({
    cx: handX, cy: handY,
    scale: packageType === 'banner' ? 0.55 : 0.7,
    skinTone: shade(palette.bg1, -0.20),
    idKey: `${idKey}-hand`,
  });
  return scene + hand;
}

// ─── per-package composers ────────────────────────────────────

/** Common text block placement. Returns the SVG and the side the
 *  text occupies (used to decide product side). */
function renderTextBlock(args: {
  w: number; h: number;
  brief: CreativeBrief;
  visualMode: VisualMode;
  packageType: CreativePackageType;
  headline: string;
  subline?: string;
  cta: string;
  fg: string; accent: string;
  textZoneSide: 'left' | 'right';
}): string {
  const { w, h, brief, headline, subline, cta, fg, accent, textZoneSide, packageType } = args;
  const formula = brief.formula;
  const xText = textZoneSide === 'left' ? 80 : w - 80;
  const anchor = textZoneSide === 'left' ? 'start' : 'end';

  // Headline size depends on the package type.
  const hSize = packageType === 'banner' ? 76 : 92;
  const subSize = packageType === 'banner' ? 28 : 34;
  const yHeadline = h * 0.42;

  return `
    ${eyebrowLabel(xText, h * 0.15, fg, formula)}
    ${textZoneSide === 'left'
      ? hairline(xText, h * 0.15 + 18, xText + 160, h * 0.15 + 18, fg)
      : hairline(xText - 160, h * 0.15 + 18, xText, h * 0.15 + 18, fg)}
    <text x="${xText}" y="${yHeadline}" text-anchor="${anchor}"
          font-family="${FONT_HEBREW}" font-size="${hSize}" font-weight="500"
          fill="${fg}" letter-spacing="-2" direction="rtl">${esc(headline)}</text>
    ${subline
      ? `<text x="${xText}" y="${yHeadline + hSize * 1.0}" text-anchor="${anchor}"
             font-family="${FONT_HEBREW}" font-size="${subSize}" font-weight="400"
             fill="${fg}" fill-opacity="0.78" direction="rtl">${esc(subline)}</text>` : ''}
    <g>
      ${textZoneSide === 'left'
        ? hairline(xText, h - 140, xText + 280, h - 140, accent)
        : hairline(xText - 280, h - 140, xText, h - 140, accent)}
      <text x="${xText}" y="${h - 108}" text-anchor="${anchor}"
            font-family="${FONT_HEBREW}" font-size="${packageType === 'banner' ? 22 : 26}" font-weight="500"
            fill="${accent}" letter-spacing="1" direction="rtl">${esc(cta)}</text>
    </g>
  `;
}

function composeFrame(args: {
  w: number; h: number;
  brief: CreativeBrief;
  visualMode: VisualMode;
  headline: string;
  subline?: string;
  cta: string;
  productPresence: ProductPresence;
  idKey: string;
  sig: string;
}): string {
  const { w, h, brief, visualMode, headline, subline, cta, productPresence, idKey, sig } = args;
  const palette = canvasPalette(brief, visualMode);

  // When product is present, text goes left and product goes right.
  const textZoneSide: 'left' | 'right' = (visualMode === 'text-only-editorial') ? 'left' : 'left';

  let imageryLayers = '';
  if (visualMode === 'product-hero') {
    imageryLayers = renderProductLayer({
      w, h, packageType: brief.packageType, formula: brief.formula,
      presence: productPresence === 'none' ? 'pouch' : productPresence,
      textZoneSide, idKey,
    });
  } else if (visualMode === 'human-moment') {
    imageryLayers = renderHumanLayer({
      w, h, packageType: brief.packageType, formula: brief.formula,
      withProduct: false, textZoneSide, idKey,
    });
  } else if (visualMode === 'product-and-human') {
    const presence = productPresence === 'none' ? 'pouch' : productPresence;
    imageryLayers =
      renderHumanLayer({ w, h, packageType: brief.packageType, formula: brief.formula,
                         withProduct: true, textZoneSide, idKey }) +
      renderProductLayer({ w, h, packageType: brief.packageType, formula: brief.formula,
                           presence, textZoneSide, idKey });
  }

  const text = renderTextBlock({
    w, h, brief, visualMode, packageType: brief.packageType,
    headline, subline, cta,
    fg: palette.fg, accent: palette.accent,
    textZoneSide,
  });

  const sigX = w - 64;
  const sigY = 80;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  ${defs({ bg0: palette.bg0, bg1: palette.bg1 }, idKey)}
  ${backdrop(w, h, idKey)}
  ${imageryLayers}
  ${text}
  ${signatureMark(sigX, sigY, palette.fg, sig)}
</svg>`.trim();
}

// ─── banner: 1200 × 628 ───────────────────────────────────────

export function composeCreativeBanner(brief: CreativeBrief): string {
  const w = 1200;
  const h = 628;
  const key = `b${hash(brief.headline + brief.formula).toString(36)}`;
  const sig = brief.signature ?? 'MOOD';
  return composeFrame({
    w, h, brief,
    visualMode: brief.visualMode ?? 'text-only-editorial',
    headline: brief.headline,
    subline: brief.subline ?? brief.body,
    cta: brief.cta,
    productPresence: brief.productPresence ?? 'none',
    idKey: key, sig,
  });
}

// ─── post: 1080 × 1080 ────────────────────────────────────────

export function composeCreativePost(brief: CreativeBrief): string {
  const w = 1080;
  const h = 1080;
  const key = `p${hash(brief.headline + brief.formula).toString(36)}`;
  const sig = brief.signature ?? 'MOOD';
  return composeFrame({
    w, h, brief,
    visualMode: brief.visualMode ?? 'text-only-editorial',
    headline: brief.headline,
    subline: brief.subline ?? brief.body,
    cta: brief.cta,
    productPresence: brief.productPresence ?? 'none',
    idKey: key, sig,
  });
}

// ─── carousel: N × 1080 × 1080 ────────────────────────────────

export interface CarouselRender {
  slides: Array<{ index: number; svg: string }>;
}

export function composeCreativeCarousel(brief: CreativeBrief): CarouselRender {
  const slides = brief.slides && brief.slides.length > 0
    ? brief.slides
    : [{ headline: brief.headline, body: brief.body, cta: brief.cta }];

  return {
    slides: slides.map((slide, idx) => ({
      index: idx,
      svg: composeCarouselSlide(brief, slide, idx, slides.length),
    })),
  };
}

function composeCarouselSlide(
  brief: CreativeBrief,
  slide: CreativeBriefSlide,
  idx: number,
  total: number,
): string {
  const w = 1080;
  const h = 1080;
  const key = `c${hash(slide.headline + brief.formula + String(idx)).toString(36)}`;
  const sig = brief.signature ?? 'MOOD';
  // Per-slide visualMode + productPresence override the brief defaults.
  const slideVisualMode: VisualMode = slide.visualMode ?? brief.visualMode ?? 'text-only-editorial';
  const slidePresence: ProductPresence = slide.productPresence ?? brief.productPresence ?? 'none';
  // The cover slide always gets the full signature mark; follow-ups
  // get a tiny mark + slide counter.
  const isCover = idx === 0;
  const eyebrowText = isCover
    ? brief.formula
    : `${String(idx + 1).padStart(2, '0')} · ${String(total).padStart(2, '0')}`;

  // Use composeFrame for the body, then overlay the counter eyebrow.
  const palette = canvasPalette(brief, slideVisualMode);
  const xText = 80;

  let imageryLayers = '';
  if (slideVisualMode === 'product-hero') {
    imageryLayers = renderProductLayer({
      w, h, packageType: 'carousel', formula: brief.formula,
      presence: slidePresence === 'none' ? 'pouch' : slidePresence,
      textZoneSide: 'left', idKey: key,
    });
  } else if (slideVisualMode === 'human-moment') {
    imageryLayers = renderHumanLayer({
      w, h, packageType: 'carousel', formula: brief.formula,
      withProduct: false, textZoneSide: 'left', idKey: key,
    });
  } else if (slideVisualMode === 'product-and-human') {
    const presence = slidePresence === 'none' ? 'pouch' : slidePresence;
    imageryLayers =
      renderHumanLayer({ w, h, packageType: 'carousel', formula: brief.formula,
                         withProduct: true, textZoneSide: 'left', idKey: key }) +
      renderProductLayer({ w, h, packageType: 'carousel', formula: brief.formula,
                           presence, textZoneSide: 'left', idKey: key });
  }

  const subline = slide.body;
  const headlineSize = isCover ? 92 : 76;
  const sublineSize  = 34;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  ${defs({ bg0: palette.bg0, bg1: palette.bg1 }, key)}
  ${backdrop(w, h, key)}
  ${imageryLayers}
  ${eyebrowLabel(xText, 110, palette.fg, eyebrowText)}
  ${hairline(xText, 128, xText + (isCover ? 160 : 120), 128, palette.fg)}
  <text x="${xText}" y="${h / 2 - 40}"
        font-family="${FONT_HEBREW}" font-size="${headlineSize}" font-weight="500"
        fill="${palette.fg}" letter-spacing="-2" direction="rtl">${esc(slide.headline)}</text>
  ${subline
    ? `<text x="${xText}" y="${h / 2 + 60}"
            font-family="${FONT_HEBREW}" font-size="${sublineSize}" font-weight="400"
            fill="${palette.fg}" fill-opacity="0.78"
            direction="rtl">${esc(subline)}</text>` : ''}
  ${slide.cta
    ? `<g>
         ${hairline(xText, h - 160, xText + 280, h - 160, palette.accent)}
         <text x="${xText}" y="${h - 124}"
               font-family="${FONT_HEBREW}" font-size="24" font-weight="500"
               fill="${palette.accent}" letter-spacing="1"
               direction="rtl">${esc(slide.cta)}</text>
       </g>` : ''}
  ${isCover
    ? signatureMark(w - 80, 110, palette.fg, sig)
    : `<text x="${w - 80}" y="110" text-anchor="end"
             font-family="${FONT_HEBREW}" font-size="14"
             fill="${palette.fg}" fill-opacity="0.40"
             letter-spacing="4">${esc(sig)}</text>`}
</svg>`.trim();
}

// ─── prompt / negative prompt / production spec ───────────────

export function briefToPrompt(brief: CreativeBrief): string {
  const lines: string[] = [];
  const fp = FORMULA_PALETTES[brief.formula];
  lines.push(`# ${brief.packageType.toUpperCase()} · ${brief.formula} · ${brief.visualMode ?? 'text-only-editorial'}`);
  lines.push('');
  lines.push(`Formula:   ${brief.formula} (${fp.hebrewName}) — palette: ${fp.guideTokens.join(', ')}`);
  lines.push(`Format:    ${brief.packageType}${brief.platformSize ? ` · ${brief.platformSize}` : ''}`);
  if (brief.audience) lines.push(`Audience:  ${brief.audience}`);
  if (brief.emotion)  lines.push(`Emotion:   ${brief.emotion}`);
  lines.push(`Visual:    ${brief.visualMode ?? 'text-only-editorial'}` +
             (brief.productPresence && brief.productPresence !== 'none'
               ? ` · product: ${brief.productPresence}` : ''));
  lines.push('');
  lines.push(`Headline (Hebrew, RTL): ${brief.headline}`);
  const sub = brief.subline ?? brief.body;
  if (sub) lines.push(`Subline (Hebrew, RTL):  ${sub}`);
  lines.push(`CTA (Hebrew, RTL):      ${brief.cta}`);
  if (brief.signature) lines.push(`Signature:              ${brief.signature}`);

  // Product reference (approved asset reference for downstream tools).
  if (brief.productPresence && brief.productPresence !== 'none') {
    lines.push('');
    lines.push('Approved product references (MOOD canonical):');
    if (brief.productPresence === 'pouch' || brief.productPresence === 'pouch-and-square') {
      lines.push(`  - pouch: MOOD ${brief.formula} 30g stand-up sachet, body color ${fp.product}, ` +
                 `printed label "MOOD / ${fp.hebrewName} / ${fp.enName}" on ${fp.cream} cream.`);
    }
    if (brief.productPresence === 'chocolate-square' || brief.productPresence === 'pouch-and-square') {
      lines.push(`  - chocolate square: 4×4 grid, deep brown gradient (#28140A–#5C2E14), ` +
                 `embossed MOOD wordmark on center cell.`);
    }
  }
  if (brief.slides && brief.slides.length > 0) {
    lines.push('');
    lines.push(`Slides (${brief.slides.length}):`);
    brief.slides.forEach((s, i) => {
      const sMode = s.visualMode ?? brief.visualMode ?? 'text-only-editorial';
      const sProd = s.productPresence ?? brief.productPresence ?? 'none';
      lines.push(`  ${String(i + 1).padStart(2, '0')}. [${sMode}${sProd !== 'none' ? `/${sProd}` : ''}] ` +
                 `${s.headline}${s.body ? ' — ' + s.body : ''}${s.cta ? '  CTA: ' + s.cta : ''}`);
    });
  }
  lines.push('');
  lines.push('Composition: Hebrew RTL typography. Editorial restraint.');
  lines.push('Background: formula-palette gradient + film grain + radial vignette.');
  lines.push('Operator approval required before publication. Human remains final authority.');
  return lines.join('\n');
}

/** Negative prompt: what the asset must NOT contain. Drives the
 *  quality guard's intent and is surfaced to the operator. */
export function briefToNegativePrompt(brief: CreativeBrief): string {
  const lines: string[] = [];
  lines.push('# NEGATIVE PROMPT');
  lines.push('');
  lines.push('Forbidden in the asset:');
  lines.push('  - invented MOOD flavors (no strawberry / matcha / caramel / peanut butter MOOD)');
  lines.push('  - invented MOOD formulas (no CALM / JOY / VIBE / HUSTLE)');
  lines.push('  - invented packaging (no "limited edition" / "holiday edition" / "gold edition")');
  lines.push('  - influencer wellness phrasing (no "link in bio", "use my code", "sponsored")');
  lines.push('  - supplement hype (no "boost", "fuel", "dose", "nootropic")');
  lines.push('  - productivity-drug framing (no "hack", "unlock focus", "peak performance")');
  lines.push('  - English text outside the brand mark + formula name + units (g, mL)');
  lines.push('  - cliché Hebrew CTAs ("גלו עכשיו", "קנו עכשיו", "לחצו כאן")');
  const mode = brief.visualMode ?? 'text-only-editorial';
  if (mode === 'product-hero' || mode === 'product-and-human') {
    lines.push('  - plain gradient + text only (the asset must include the product)');
  }
  if (mode === 'human-moment' || mode === 'product-and-human') {
    lines.push('  - empty scene without still-life props (window light + table)');
  }
  return lines.join('\n');
}

export interface ProductionSpec {
  formula: string;
  packageType: CreativePackageType;
  visualMode: VisualMode;
  productPresence: ProductPresence;
  paletteKey: PaletteKey;
  platformSize?: PlatformSize;
  copy: {
    headline: string;
    subline?: string;
    cta: string;
    signature?: string;
  };
  audience?: string;
  emotion?: string;
  formulaPaletteHex: {
    background: [string, string];
    product: string;
    accent: string;
    cream: string;
  };
  approvedProductReferences: string[];
  slides?: Array<{
    index: number;
    headline: string;
    body?: string;
    cta?: string;
    visualMode: VisualMode;
    productPresence: ProductPresence;
  }>;
}

export function briefToProductionSpec(brief: CreativeBrief): ProductionSpec {
  const fp = FORMULA_PALETTES[brief.formula];
  const productRefs: string[] = [];
  if (brief.productPresence === 'pouch' || brief.productPresence === 'pouch-and-square') {
    productRefs.push(`pouch · MOOD ${brief.formula} 30g stand-up sachet`);
  }
  if (brief.productPresence === 'chocolate-square' || brief.productPresence === 'pouch-and-square') {
    productRefs.push('chocolate-square · 4×4 grid, deep brown, MOOD-embossed');
  }
  return {
    formula: brief.formula,
    packageType: brief.packageType,
    visualMode: brief.visualMode ?? 'text-only-editorial',
    productPresence: brief.productPresence ?? 'none',
    paletteKey: brief.paletteKey,
    platformSize: brief.platformSize,
    copy: {
      headline: brief.headline,
      subline: brief.subline ?? brief.body,
      cta: brief.cta,
      signature: brief.signature ?? 'MOOD',
    },
    audience: brief.audience,
    emotion: brief.emotion,
    formulaPaletteHex: {
      background: [fp.bg0, fp.bg1],
      product: fp.product,
      accent: fp.accent,
      cream: fp.cream,
    },
    approvedProductReferences: productRefs,
    slides: brief.slides?.map((s, i) => ({
      index: i,
      headline: s.headline,
      body: s.body,
      cta: s.cta,
      visualMode: s.visualMode ?? brief.visualMode ?? 'text-only-editorial',
      productPresence: s.productPresence ?? brief.productPresence ?? 'none',
    })),
  };
}
