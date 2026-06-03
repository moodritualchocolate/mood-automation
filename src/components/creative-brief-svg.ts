/**
 * Creative Brief Renderers — lightweight SVG composers for the Asset
 * Generator surface. These do NOT replace the existing Banner
 * pipeline (see banner-svg.ts) — they let an operator render a
 * banner / post / carousel from a small, hand-authored brief and
 * register it in the asset library.
 *
 * Pure functions: take a CreativeBrief, return an SVG string. The
 * /api/render route rasterizes the SVG to PNG via Resvg.
 */

import type { Formula } from '@/core/types';

export type CreativePackageType = 'banner' | 'post' | 'carousel';

export type PaletteKey = 'cocoa' | 'amber' | 'ember' | 'ivory' | 'ink';

export interface CreativeBriefSlide {
  headline: string;
  body?: string;
  cta?: string;
}

export interface CreativeBrief {
  formula: Formula;
  packageType: CreativePackageType;
  headline: string;
  body?: string;
  cta: string;
  paletteKey: PaletteKey;
  signature?: string;
  /** Carousel-only. First slide is the cover (headline/body/cta from above). */
  slides?: CreativeBriefSlide[];
}

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

const FONT_HEBREW = "Heebo, 'Arial Hebrew', Arial, sans-serif";
const FONT_EDITORIAL = "'Times New Roman', Georgia, serif";

// ─── helpers ──────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function defs(palette: Palette, key: string): string {
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

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function backdrop(w: number, h: number, palette: Palette, key: string): string {
  return `
    <rect width="${w}" height="${h}" fill="url(#bg-${key})"/>
    <rect width="${w}" height="${h}" fill="url(#vignette-${key})"/>
    <rect width="${w}" height="${h}" filter="url(#grain-${key})"/>
  `;
}

function hairline(x1: number, y1: number, x2: number, y2: number, color: string): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" stroke-opacity="0.45"/>`;
}

function signatureMark(x: number, y: number, palette: Palette, label: string): string {
  const text = esc(label);
  return `
    <g>
      <text x="${x}" y="${y}" text-anchor="end"
            font-family="${FONT_EDITORIAL}" font-size="20"
            fill="${palette.fg}" fill-opacity="0.85"
            letter-spacing="6">${text}</text>
      <line x1="${x - 32}" y1="${y + 6}" x2="${x}" y2="${y + 6}"
            stroke="${palette.fg}" stroke-opacity="0.45" stroke-width="1"/>
    </g>
  `;
}

function eyebrowLabel(x: number, y: number, palette: Palette, label: string): string {
  return `
    <text x="${x}" y="${y}"
          font-family="${FONT_HEBREW}" font-size="14"
          fill="${palette.fg}" fill-opacity="0.55"
          letter-spacing="4">${esc(label)}</text>
  `;
}

// ─── banner: 1200 × 628 (LinkedIn / web hero) ─────────────────

export function composeCreativeBanner(brief: CreativeBrief): string {
  const w = 1200;
  const h = 628;
  const p = PALETTES[brief.paletteKey];
  const key = `b${hash(brief.headline + brief.formula).toString(36)}`;
  const sig = brief.signature ?? 'MOOD';

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  ${defs(p, key)}
  ${backdrop(w, h, p, key)}
  ${eyebrowLabel(72, 96, p, brief.formula)}
  ${hairline(72, 116, 220, 116, p.fg)}
  <text x="72" y="220"
        font-family="${FONT_HEBREW}" font-size="86" font-weight="500"
        fill="${p.fg}" letter-spacing="-2"
        direction="rtl">${esc(brief.headline)}</text>
  ${brief.body
    ? `<text x="72" y="312"
            font-family="${FONT_HEBREW}" font-size="34" font-weight="400"
            fill="${p.fg}" fill-opacity="0.75" letter-spacing="0"
            direction="rtl">${esc(brief.body)}</text>` : ''}
  <g>
    ${hairline(72, h - 96, 72 + 360, h - 96, p.accent)}
    <text x="72" y="${h - 72}"
          font-family="${FONT_HEBREW}" font-size="22" font-weight="500"
          fill="${p.accent}" letter-spacing="1"
          direction="rtl">${esc(brief.cta)}</text>
  </g>
  ${signatureMark(w - 64, 80, p, sig)}
</svg>`.trim();
}

// ─── post: 1080 × 1080 (Instagram square) ─────────────────────

export function composeCreativePost(brief: CreativeBrief): string {
  const s = 1080;
  const p = PALETTES[brief.paletteKey];
  const key = `p${hash(brief.headline + brief.formula).toString(36)}`;
  const sig = brief.signature ?? 'MOOD';

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  ${defs(p, key)}
  ${backdrop(s, s, p, key)}
  ${eyebrowLabel(80, 110, p, brief.formula)}
  ${hairline(80, 128, 240, 128, p.fg)}
  <text x="80" y="${s / 2 - 40}"
        font-family="${FONT_HEBREW}" font-size="100" font-weight="500"
        fill="${p.fg}" letter-spacing="-2"
        direction="rtl">${esc(brief.headline)}</text>
  ${brief.body
    ? `<text x="80" y="${s / 2 + 60}"
            font-family="${FONT_HEBREW}" font-size="38" font-weight="400"
            fill="${p.fg}" fill-opacity="0.75"
            direction="rtl">${esc(brief.body)}</text>` : ''}
  <g>
    ${hairline(80, s - 160, 80 + 320, s - 160, p.accent)}
    <text x="80" y="${s - 124}"
          font-family="${FONT_HEBREW}" font-size="26" font-weight="500"
          fill="${p.accent}" letter-spacing="1"
          direction="rtl">${esc(brief.cta)}</text>
  </g>
  ${signatureMark(s - 80, 110, p, sig)}
</svg>`.trim();
}

// ─── carousel: array of 1080 × 1080 slides ────────────────────

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
  const s = 1080;
  const p = PALETTES[brief.paletteKey];
  const key = `c${hash(slide.headline + brief.formula + String(idx)).toString(36)}`;
  const sig = brief.signature ?? 'MOOD';
  const isCover = idx === 0;
  const headlineSize = isCover ? 92 : 76;
  const bodySize = 34;

  // Slide counter (top-left), e.g., 01 · 05
  const counter = `${String(idx + 1).padStart(2, '0')} · ${String(total).padStart(2, '0')}`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  ${defs(p, key)}
  ${backdrop(s, s, p, key)}
  ${eyebrowLabel(80, 110, p, isCover ? brief.formula : counter)}
  ${hairline(80, 128, isCover ? 240 : 200, 128, p.fg)}
  <text x="80" y="${s / 2 - 40}"
        font-family="${FONT_HEBREW}" font-size="${headlineSize}" font-weight="500"
        fill="${p.fg}" letter-spacing="-2"
        direction="rtl">${esc(slide.headline)}</text>
  ${slide.body
    ? `<text x="80" y="${s / 2 + 60}"
            font-family="${FONT_HEBREW}" font-size="${bodySize}" font-weight="400"
            fill="${p.fg}" fill-opacity="0.78"
            direction="rtl">${esc(slide.body)}</text>` : ''}
  ${slide.cta
    ? `<g>
         ${hairline(80, s - 160, 80 + 280, s - 160, p.accent)}
         <text x="80" y="${s - 124}"
               font-family="${FONT_HEBREW}" font-size="24" font-weight="500"
               fill="${p.accent}" letter-spacing="1"
               direction="rtl">${esc(slide.cta)}</text>
       </g>` : ''}
  ${isCover ? signatureMark(s - 80, 110, p, sig) : ''}
  ${!isCover
    ? `<text x="${s - 80}" y="110" text-anchor="end"
            font-family="${FONT_HEBREW}" font-size="14"
            fill="${p.fg}" fill-opacity="0.40"
            letter-spacing="4">${esc(sig)}</text>` : ''}
</svg>`.trim();
}

// ─── promptize: derive a prompt the operator can save / copy ──

export function briefToPrompt(brief: CreativeBrief): string {
  const lines: string[] = [];
  lines.push(`# ${brief.packageType.toUpperCase()} · ${brief.formula} · palette: ${brief.paletteKey}`);
  lines.push('');
  lines.push(`Headline (Hebrew, RTL): ${brief.headline}`);
  if (brief.body) lines.push(`Body (Hebrew, RTL):     ${brief.body}`);
  lines.push(`CTA (Hebrew, RTL):      ${brief.cta}`);
  if (brief.signature) lines.push(`Signature:              ${brief.signature}`);
  if (brief.slides && brief.slides.length > 0) {
    lines.push('');
    lines.push(`Slides (${brief.slides.length}):`);
    brief.slides.forEach((s, i) => {
      lines.push(`  ${String(i + 1).padStart(2, '0')}. ${s.headline}${s.body ? ' — ' + s.body : ''}${s.cta ? '  CTA: ' + s.cta : ''}`);
    });
  }
  lines.push('');
  lines.push('Composition: Hebrew RTL typography. Editorial restraint. ');
  lines.push('Background: gradient + film grain + radial vignette.');
  lines.push('Operator approval required before publication. Human remains final authority.');
  return lines.join('\n');
}
