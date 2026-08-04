/**
 * Creative-Brief Imagery — SVG primitives for product + human scene.
 *
 * Pure functions. Each returns an SVG <g> string that the
 * brief-level composer drops into a slide. Coordinates are
 * "centered at (0,0)" so the parent transform places them.
 *
 * Honesty about scope:
 *   - These are vector illustrations, not photorealism. They
 *     represent the MOOD pouch + chocolate square accurately
 *     in shape, label, and formula color — they are not
 *     attempting AI-image-grade rendering.
 *   - The intent: produce assets that read as "MOOD branded
 *     marketing creative" rather than "abstract gradient
 *     poster with text".
 */

import type { Formula } from '@/core/types';

// ─── formula palette (aligned with FORMULA_COLOR_GUIDE) ───────

export interface FormulaPalette {
  /** Background gradient endpoints. */
  bg0: string;
  bg1: string;
  /** Pouch body color. */
  product: string;
  /** Brand accent (text underline, signature). */
  accent: string;
  /** Label cream — printed area on the pouch + chocolate square edge highlight. */
  cream: string;
  /** Hebrew formula name printed on the pouch. */
  hebrewName: string;
  /** English formula name printed under the brand mark. */
  enName: Formula;
  /** Approximate color-guide tokens — used by the quality guard
   *  to confirm the brief mentions a tone from this family. */
  guideTokens: string[];
}

export const FORMULA_PALETTES: Record<Formula, FormulaPalette> = {
  ENERGY: {
    bg0: '#1A0F05', bg1: '#3A1F0A',
    product: '#D08048', accent: '#FFB155', cream: '#F2E6D8',
    hebrewName: 'אנרגיה', enName: 'ENERGY',
    guideTokens: ['amber', 'cream', 'orange'],
  },
  FOCUS: {
    bg0: '#0E1418', bg1: '#1F3038',
    product: '#5B7C99', accent: '#A8C5E0', cream: '#E8EEF2',
    hebrewName: 'מיקוד', enName: 'FOCUS',
    guideTokens: ['slate', 'paper', 'blue-gray'],
  },
  RELAX: {
    bg0: '#180A05', bg1: '#3E1F12',
    product: '#B5654A', accent: '#E0A085', cream: '#F2DCC4',
    hebrewName: 'הרגעה', enName: 'RELAX',
    guideTokens: ['terracotta', 'amber', 'rose'],
  },
  SLEEP: {
    bg0: '#0A0E1A', bg1: '#1A2235',
    product: '#3A4A6B', accent: '#7589C2', cream: '#D8DBE5',
    hebrewName: 'שינה', enName: 'SLEEP',
    guideTokens: ['navy', 'charcoal', 'indigo'],
  },
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── MOOD pouch (stand-up sachet) ─────────────────────────────

/** Renders the MOOD pouch at the requested scale. cx/cy is the
 *  center of the pouch body (label area). Scale 1 = 280×400 footprint. */
export function composeMoodPouch(args: {
  formula: Formula;
  cx: number;
  cy: number;
  scale?: number;
  rotateDeg?: number;
  idKey: string;
}): string {
  const { cx, cy, formula, idKey } = args;
  const s = args.scale ?? 1;
  const rot = args.rotateDeg ?? 0;
  const p = FORMULA_PALETTES[formula];

  // Reference coords (scaled by s). Pouch occupies x: -140..140, y: -240..240.
  const W = 280 * s;
  const H = 460 * s;
  const halfW = W / 2;
  const halfH = H / 2;
  const labelW = 200 * s;
  const labelH = 240 * s;

  return `
    <g transform="translate(${cx} ${cy}) rotate(${rot})">
      <defs>
        <linearGradient id="pouch-body-${idKey}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stop-color="${shade(p.product, -0.18)}"/>
          <stop offset="45%" stop-color="${p.product}"/>
          <stop offset="100%" stop-color="${shade(p.product, -0.30)}"/>
        </linearGradient>
        <linearGradient id="pouch-shine-${idKey}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stop-color="#FFFFFF" stop-opacity="0.00"/>
          <stop offset="30%" stop-color="#FFFFFF" stop-opacity="0.10"/>
          <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.00"/>
        </linearGradient>
        <filter id="pouch-shadow-${idKey}" x="-30%" y="-10%" width="160%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="${10 * s}"/>
          <feOffset dx="0" dy="${14 * s}"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#pouch-shadow-${idKey})">
        <!-- top heat-seal crimp -->
        <path d="M ${-halfW + 6 * s} ${-halfH}
                 L ${halfW - 6 * s} ${-halfH}
                 L ${halfW - 14 * s} ${-halfH + 28 * s}
                 L ${-halfW + 14 * s} ${-halfH + 28 * s} Z"
              fill="${shade(p.product, -0.35)}"/>
        <!-- main body (subtle inward curve, fuller middle) -->
        <path d="M ${-halfW + 14 * s} ${-halfH + 28 * s}
                 Q ${-halfW - 4 * s} 0, ${-halfW + 14 * s} ${halfH - 28 * s}
                 L ${halfW - 14 * s} ${halfH - 28 * s}
                 Q ${halfW + 4 * s} 0, ${halfW - 14 * s} ${-halfH + 28 * s} Z"
              fill="url(#pouch-body-${idKey})"/>
        <!-- bottom gusset (stand-up base) -->
        <path d="M ${-halfW + 30 * s} ${halfH - 28 * s}
                 L ${halfW - 30 * s} ${halfH - 28 * s}
                 L ${halfW - 50 * s} ${halfH}
                 L ${-halfW + 50 * s} ${halfH} Z"
              fill="${shade(p.product, -0.42)}"/>
        <!-- shine -->
        <path d="M ${-halfW + 14 * s} ${-halfH + 28 * s}
                 Q ${-halfW - 4 * s} 0, ${-halfW + 14 * s} ${halfH - 28 * s}
                 L ${halfW - 14 * s} ${halfH - 28 * s}
                 Q ${halfW + 4 * s} 0, ${halfW - 14 * s} ${-halfH + 28 * s} Z"
              fill="url(#pouch-shine-${idKey})"/>
        <!-- printed label band -->
        <rect x="${-labelW / 2}" y="${-labelH / 2}" width="${labelW}" height="${labelH}"
              fill="${p.cream}" stroke="${shade(p.product, -0.45)}" stroke-width="${1.5 * s}"/>
        <!-- hairline accents -->
        <line x1="${-labelW / 2 + 16 * s}" y1="${-labelH / 2 + 24 * s}"
              x2="${ labelW / 2 - 16 * s}" y2="${-labelH / 2 + 24 * s}"
              stroke="${p.product}" stroke-width="${1 * s}" stroke-opacity="0.55"/>
        <!-- MOOD wordmark -->
        <text x="0" y="${-30 * s}" text-anchor="middle"
              font-family="'Times New Roman', Georgia, serif"
              font-size="${42 * s}" fill="#1A0F05" letter-spacing="${4 * s}">MOOD</text>
        <!-- Hebrew formula name -->
        <text x="0" y="${22 * s}" text-anchor="middle"
              font-family="Heebo, 'Arial Hebrew', sans-serif"
              font-size="${36 * s}" fill="${p.product}" font-weight="500"
              direction="rtl">${esc(p.hebrewName)}</text>
        <!-- English formula name -->
        <text x="0" y="${60 * s}" text-anchor="middle"
              font-family="Helvetica, Arial, sans-serif"
              font-size="${14 * s}" fill="${shade(p.product, -0.25)}"
              letter-spacing="${5 * s}">${p.enName}</text>
        <!-- net weight (canonical 30g for MOOD format) -->
        <text x="0" y="${labelH / 2 - 18 * s}" text-anchor="middle"
              font-family="Helvetica, Arial, sans-serif"
              font-size="${11 * s}" fill="${shade(p.product, -0.20)}"
              letter-spacing="${2 * s}">30g · NET WT</text>
      </g>
    </g>
  `;
}

// ─── chocolate square ─────────────────────────────────────────

/** A single square of MOOD chocolate. cx/cy = center. Scale 1 = 200×200. */
export function composeChocolateSquare(args: {
  cx: number;
  cy: number;
  scale?: number;
  rotateDeg?: number;
  idKey: string;
}): string {
  const { cx, cy, idKey } = args;
  const s = args.scale ?? 1;
  const rot = args.rotateDeg ?? 0;
  const sz = 200 * s;
  const half = sz / 2;
  // 4×4 grid of cells.
  const cellLines = [];
  for (let i = 1; i < 4; i++) {
    const offset = -half + (sz * i) / 4;
    cellLines.push(`<line x1="${offset}" y1="${-half}" x2="${offset}" y2="${half}"
                          stroke="#1F0F06" stroke-width="${2 * s}" stroke-opacity="0.55"/>`);
    cellLines.push(`<line x1="${-half}" y1="${offset}" x2="${half}" y2="${offset}"
                          stroke="#1F0F06" stroke-width="${2 * s}" stroke-opacity="0.55"/>`);
  }

  return `
    <g transform="translate(${cx} ${cy}) rotate(${rot})">
      <defs>
        <linearGradient id="choc-${idKey}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stop-color="#5C2E14"/>
          <stop offset="55%" stop-color="#3F1E0C"/>
          <stop offset="100%" stop-color="#28140A"/>
        </linearGradient>
        <filter id="choc-shadow-${idKey}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="${6 * s}"/>
          <feOffset dx="${4 * s}" dy="${8 * s}"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.50"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter="url(#choc-shadow-${idKey})">
        <rect x="${-half}" y="${-half}" width="${sz}" height="${sz}" rx="${4 * s}"
              fill="url(#choc-${idKey})"/>
        ${cellLines.join('\n        ')}
        <!-- embossed MOOD on center cell -->
        <text x="0" y="${5 * s}" text-anchor="middle"
              font-family="'Times New Roman', Georgia, serif"
              font-size="${22 * s}" fill="#1A0A05" fill-opacity="0.75"
              letter-spacing="${3 * s}">MOOD</text>
        <!-- subtle top highlight -->
        <rect x="${-half + 4 * s}" y="${-half + 4 * s}" width="${sz - 8 * s}" height="${10 * s}"
              fill="#FFFFFF" fill-opacity="0.06"/>
      </g>
    </g>
  `;
}

// ─── hand silhouette (holding pouch) ──────────────────────────

/** Abstract hand silhouette anchored at (cx, cy). Hand wraps around
 *  the pouch positioned at the same x. Scale 1 ≈ 320×460. */
export function composeHandSilhouette(args: {
  cx: number;
  cy: number;
  scale?: number;
  skinTone?: string;
  idKey: string;
}): string {
  const { cx, cy, idKey } = args;
  const s = args.scale ?? 1;
  const tone = args.skinTone ?? '#1A0F0A';

  // A simplified hand: forearm rising from below, fingers curling
  // around the lower-right side of the pouch. Vector silhouette only.
  return `
    <g transform="translate(${cx} ${cy})">
      <defs>
        <linearGradient id="hand-${idKey}" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"  stop-color="${shade(tone, -0.30)}"/>
          <stop offset="100%" stop-color="${tone}"/>
        </linearGradient>
      </defs>
      <!-- forearm -->
      <path d="M ${110 * s} ${340 * s}
               C ${100 * s} ${260 * s}, ${130 * s} ${180 * s}, ${160 * s} ${120 * s}
               L ${230 * s} ${120 * s}
               C ${260 * s} ${190 * s}, ${250 * s} ${280 * s}, ${230 * s} ${340 * s} Z"
            fill="url(#hand-${idKey})"/>
      <!-- thumb wrap (over front of pouch) -->
      <path d="M ${160 * s} ${130 * s}
               C ${120 * s} ${110 * s}, ${80 * s} ${130 * s}, ${60 * s} ${170 * s}
               C ${50 * s} ${210 * s}, ${80 * s} ${230 * s}, ${130 * s} ${220 * s} Z"
            fill="${tone}"/>
    </g>
  `;
}

// ─── scene props (still life: cup + table edge + window light) ─

export function composeStillLifeScene(args: {
  w: number;
  h: number;
  palette: FormulaPalette;
  idKey: string;
}): string {
  const { w, h, palette, idKey } = args;

  // Window light from upper-left.
  // Table edge along the bottom 25%.
  // Steam from a cup on the right.
  return `
    <defs>
      <radialGradient id="window-${idKey}" cx="20%" cy="20%" r="55%">
        <stop offset="0%"  stop-color="${palette.cream}" stop-opacity="0.22"/>
        <stop offset="60%" stop-color="${palette.cream}" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="${palette.cream}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="table-${idKey}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"  stop-color="${shade(palette.bg1, -0.25)}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${shade(palette.bg1, -0.35)}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <!-- window light -->
    <rect width="${w}" height="${h}" fill="url(#window-${idKey})"/>
    <!-- table -->
    <rect x="0" y="${h * 0.78}" width="${w}" height="${h * 0.22}" fill="url(#table-${idKey})"/>
    <line x1="0" y1="${h * 0.78}" x2="${w}" y2="${h * 0.78}"
          stroke="${palette.cream}" stroke-width="1" stroke-opacity="0.25"/>
  `;
}

// ─── helpers ──────────────────────────────────────────────────

/** Shade a hex color by amount in [-1, 1]. Negative darkens. */
export function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const adj = (c: number): number => {
    const v = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`;
}
