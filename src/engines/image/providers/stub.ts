/**
 * Stub image provider.
 *
 * Generates a cinematic-feeling SVG placeholder that:
 *  - matches the requested aspect ratio
 *  - honours the negative-space bias from the composition plan
 *  - uses a desaturated, slightly grainy palette derived from the brief
 *  - includes faint silhouette suggestions so the layout reads as scene
 *
 * Returned as a data URL. This is what the renderer uses when no
 * image API key is configured.
 */

import type { ImageProvider } from './base';
import type { CompositionPlan, ImageBrief } from '@/core/types';

const ASPECT_TO_DIMS: Record<string, { w: number; h: number }> = {
  '1:1': { w: 1080, h: 1080 },
  '4:5': { w: 1080, h: 1350 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
};

// Palette by mood word — picked to feel observed, not branded.
const PALETTES = [
  { bg: '#1a1715', fg: '#2a2522', accent: '#5b4a3f', skin: '#a08775' },  // late afternoon
  { bg: '#10110f', fg: '#1d1f1c', accent: '#2c302b', skin: '#766658' },  // documentary night
  { bg: '#1d1a1a', fg: '#2d2828', accent: '#3a3535', skin: '#8c7666' },  // office quiet
  { bg: '#191614', fg: '#231f1c', accent: '#4a3d34', skin: '#9b8472' },  // window light
];

export const stubProvider: ImageProvider = {
  name: 'stub-cinematic-svg',
  async generate({ brief, composition }) {
    const dims = ASPECT_TO_DIMS[brief.aspect] ?? ASPECT_TO_DIMS['4:5'];
    const seed = hash(brief.scene);
    const palette = PALETTES[seed % PALETTES.length];

    const svg = renderCinematicSvg({
      brief,
      composition,
      dims,
      palette,
      seed,
    });

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return {
      provider: 'stub-cinematic-svg',
      url: null,
      dataUrl,
      width: dims.w,
      height: dims.h,
      cost: 0,
    };
  },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function renderCinematicSvg(args: {
  brief: ImageBrief;
  composition: CompositionPlan;
  dims: { w: number; h: number };
  palette: { bg: string; fg: string; accent: string; skin: string };
  seed: number;
}): string {
  const { brief, composition, dims, palette, seed } = args;
  const { w, h } = dims;
  const focal = composition.focal;
  const fx = focal.x * w;
  const fy = focal.y * h;
  const fw = focal.w * w;
  const fh = focal.h * h;

  // Pseudo-random per seed.
  const rand = (n: number) => ((seed * (n + 1) * 9301 + 49297) % 233280) / 233280;

  // Vignette gradient anchor based on negative-space bias — light enters
  // FROM the opposite side of where text will sit.
  const lightFrom = oppositeOf(composition.negativeSpaceBias);
  const gradStops = gradientFor(lightFrom, palette);

  // Soft silhouette of a human figure inside the focal zone.
  const silhouette = silhouettePath(fx, fy, fw, fh, palette);

  // Grain texture via filter.
  const grain = `
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed % 100}"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  `;

  // Faint scene props — a horizontal surface line and a soft shadow.
  const surfaceY = fy + fh * 0.78;
  const sceneProps = `
    <line x1="0" y1="${surfaceY}" x2="${w}" y2="${surfaceY}" stroke="${palette.accent}" stroke-opacity="0.35" stroke-width="1"/>
    <ellipse cx="${fx + fw * 0.5}" cy="${surfaceY + 6}" rx="${fw * 0.42}" ry="3" fill="${palette.bg}" fill-opacity="0.6"/>
  `;

  // A subtle "wrong" element: an off-center small mark (the imperfection promise).
  const markX = rand(1) * w;
  const markY = surfaceY + 14 + rand(2) * 24;
  const wrongElement = `<circle cx="${markX}" cy="${markY}" r="2" fill="${palette.accent}" fill-opacity="0.4"/>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="cinematic scene placeholder">
  <defs>
    <radialGradient id="bgGrad" cx="${gradStops.cx}" cy="${gradStops.cy}" r="0.9">
      <stop offset="0%" stop-color="${palette.fg}"/>
      <stop offset="60%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    ${grain}
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  ${sceneProps}
  ${silhouette}
  ${wrongElement}
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.7"/>
  <!-- camera-only: no text, no logos, no numbers -->
  <!-- brief: ${escapeXml(brief.scene.slice(0, 120))} -->
</svg>
  `.trim();
}

function silhouettePath(fx: number, fy: number, fw: number, fh: number, palette: { skin: string; fg: string }): string {
  // Very abstract human silhouette: head + shoulders + slight forward lean.
  const cx = fx + fw * 0.5;
  const headR = fw * 0.18;
  const headY = fy + fh * 0.30;
  const shoulderY = headY + headR * 1.4;
  const shoulderW = fw * 0.78;
  return `
    <g opacity="0.55" filter="blur(0.6px)">
      <circle cx="${cx}" cy="${headY}" r="${headR}" fill="${palette.skin}"/>
      <path d="M ${cx - shoulderW / 2} ${shoulderY + fh * 0.35}
               C ${cx - shoulderW / 2 + 20} ${shoulderY + 10},
                 ${cx - shoulderW / 3} ${shoulderY},
                 ${cx} ${shoulderY + 4}
               C ${cx + shoulderW / 3} ${shoulderY},
                 ${cx + shoulderW / 2 - 20} ${shoulderY + 10},
                 ${cx + shoulderW / 2} ${shoulderY + fh * 0.35} Z"
            fill="${palette.fg}"/>
    </g>
  `;
}

function gradientFor(side: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'corners', palette: { fg: string; bg: string }) {
  switch (side) {
    case 'top':    return { cx: '50%', cy: '0%' };
    case 'bottom': return { cx: '50%', cy: '100%' };
    case 'left':   return { cx: '0%', cy: '50%' };
    case 'right':  return { cx: '100%', cy: '50%' };
    case 'corners':return { cx: '15%', cy: '15%' };
    case 'center': return { cx: '50%', cy: '50%' };
  }
}

function oppositeOf(bias: CompositionPlan['negativeSpaceBias']): CompositionPlan['negativeSpaceBias'] {
  switch (bias) {
    case 'top': return 'bottom';
    case 'bottom': return 'top';
    case 'left': return 'right';
    case 'right': return 'left';
    case 'center': return 'corners';
    case 'corners': return 'center';
  }
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
}
