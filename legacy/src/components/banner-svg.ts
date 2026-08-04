/**
 * Composes the final banner as a single SVG string.
 *
 * Layers (bottom → top):
 *  1. Background photo (data URL or remote URL) inside an <image>
 *  2. Optional subtle gradient to seat typography on top of bias side
 *  3. Timestamp (if present) — small editorial label, English numerals
 *  4. Primary headline — Hebrew, RTL, dominant
 *  5. Secondary line — Hebrew, RTL, restrained
 *  6. CTA — Hebrew, styled per cta.style
 *  7. Top-right MOOD signature mark
 *
 * Everything is in SVG so resvg can rasterise it directly.
 */

import type { Banner } from '@/core/types';
import { imperfectionFor } from '@/engines/imperfection';

export function composeBannerSvg(banner: Banner): string {
  const w = banner.image.width;
  const h = banner.image.height;
  const seed = hash(banner.id);
  const imp = imperfectionFor(banner.formula, banner.composition, seed, banner.state);

  const imageHref = banner.image.dataUrl ?? banner.image.url ?? '';
  const negBias = banner.composition.negativeSpaceBias;
  const overlayGradient = overlayGradientFor(negBias);

  const typoPrimary = banner.typography.primary;
  const typoSecondary = banner.typography.secondary;
  const timestamp = banner.typography.timestamp;
  const cta = banner.cta;

  // Helper to convert normalised zone → absolute coords.
  const abs = (z: { x: number; y: number; w: number; h: number }) => ({
    x: z.x * w + imp.typoOffsetPx.x,
    y: z.y * h + imp.typoOffsetPx.y,
    w: z.w * w,
    h: z.h * h,
  });

  const primaryZone = abs(banner.composition.typoZones.primary);
  const secondaryZone = banner.composition.typoZones.secondary ? abs(banner.composition.typoZones.secondary) : null;
  const ctaZone = abs(banner.composition.typoZones.cta);
  const timestampZone = banner.composition.typoZones.timestamp ? abs(banner.composition.typoZones.timestamp) : null;

  const primaryY = primaryZone.y + typoPrimary.size * 0.85;
  const primaryX = primaryZone.x + primaryZone.w;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="overlay" x1="${overlayGradient.x1}" y1="${overlayGradient.y1}" x2="${overlayGradient.x2}" y2="${overlayGradient.y2}">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="60%" stop-color="#000000" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.82"/>
    </linearGradient>
    <filter id="grain-final" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="${seed % 100}"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${imp.grainOpacity} 0"/>
    </filter>
  </defs>

  <!-- Layer 1: photographed scene -->
  ${imageHref
    ? `<image href="${escapeAttr(imageHref)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="100%" height="100%" fill="#1a1715"/>`}

  <!-- Layer 2: typographic seating gradient -->
  <rect width="100%" height="100%" fill="url(#overlay)"/>

  <!-- Layer 2.5: grain -->
  <rect width="100%" height="100%" filter="url(#grain-final)"/>

  <!-- Layer 3: timestamp -->
  ${timestamp && timestampZone ? `
    <text x="${timestampZone.x}" y="${timestampZone.y + timestamp.size * 0.85}"
          font-family="Helvetica Neue, Arial, sans-serif"
          font-size="${timestamp.size}"
          font-weight="500"
          letter-spacing="-1"
          fill="#F7F5F2"
          fill-opacity="0.92">${escapeText(timestamp.text)}</text>
  ` : ''}

  <!-- Layer 4: primary headline (Hebrew, RTL) -->
  ${renderHebrewBlock({
    text: typoPrimary.text,
    x: primaryX,
    y: primaryY,
    maxWidth: primaryZone.w,
    size: typoPrimary.size,
    weight: typoPrimary.weight,
    leading: typoPrimary.leading,
    tracking: typoPrimary.tracking,
    color: typoPrimary.color,
  })}

  <!-- Layer 5: secondary (Hebrew, RTL) -->
  ${typoSecondary && secondaryZone ? renderHebrewBlock({
    text: typoSecondary.text,
    x: secondaryZone.x + secondaryZone.w,
    y: secondaryZone.y + typoSecondary.size * 0.85,
    maxWidth: secondaryZone.w,
    size: typoSecondary.size,
    weight: typoSecondary.weight,
    leading: 1.15,
    tracking: -0.01,
    color: typoSecondary.color,
  }) : ''}

  <!-- Layer 6: CTA -->
  ${renderCta(cta, ctaZone)}

  <!-- Layer 7: MOOD signature mark -->
  <text x="${w - 28}" y="${36}"
        text-anchor="end"
        font-family="Helvetica Neue, Arial, sans-serif"
        font-size="14"
        font-weight="600"
        letter-spacing="6"
        fill="#F7F5F2"
        fill-opacity="0.88">MOOD</text>
  <text x="${w - 28}" y="${56}"
        text-anchor="end"
        font-family="Helvetica Neue, Arial, sans-serif"
        font-size="10"
        letter-spacing="3"
        fill="#F7F5F2"
        fill-opacity="0.55">${escapeText(banner.formula)}</text>
</svg>
  `.trim();
}

function overlayGradientFor(bias: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'corners') {
  switch (bias) {
    case 'top':    return { x1: '0',   y1: '1',   x2: '0',   y2: '0'   };
    case 'bottom': return { x1: '0',   y1: '0',   x2: '0',   y2: '1'   };
    case 'left':   return { x1: '1',   y1: '0',   x2: '0',   y2: '0'   };
    case 'right':  return { x1: '0',   y1: '0',   x2: '1',   y2: '0'   };
    case 'center': return { x1: '0',   y1: '0',   x2: '0',   y2: '1'   };
    case 'corners':return { x1: '0',   y1: '0',   x2: '0',   y2: '1'   };
  }
}

/**
 * Word-wraps a Hebrew line by characters-per-line approximation, then
 * emits right-anchored <text> rows. SVG text doesn't wrap natively;
 * for Hebrew we set direction="rtl" and anchor the line at its right
 * edge, so the wrapping logic only needs to break visually.
 */
function renderHebrewBlock(args: {
  text: string;
  x: number;        // right edge of the line (RTL anchor)
  y: number;        // baseline of first line
  maxWidth: number;
  size: number;
  weight: number;
  leading: number;
  tracking: number;
  color: string;
}): string {
  const { text, x, y, maxWidth, size, weight, leading, tracking, color } = args;
  const approxCharWidth = size * 0.52;
  const charsPerLine = Math.max(8, Math.floor(maxWidth / approxCharWidth));
  const lines = wrap(text, charsPerLine);
  const lineHeight = size * leading;

  return lines
    .map(
      (line, i) => `<text
        x="${x}"
        y="${y + i * lineHeight}"
        direction="rtl"
        text-anchor="end"
        font-family="Heebo, Arial, sans-serif"
        font-size="${size}"
        font-weight="${weight}"
        letter-spacing="${tracking}em"
        fill="${color}">${escapeText(line)}</text>`,
    )
    .join('\n');
}

function wrap(text: string, charsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const tentative = current ? `${current} ${word}` : word;
    if (tentative.length > charsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = tentative;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function renderCta(
  cta: Banner['cta'],
  zone: { x: number; y: number; w: number; h: number },
): string {
  const baseY = zone.y + zone.h * 0.7;
  const fontSize = Math.min(zone.h * 0.7, 22);
  const rightX = zone.x + zone.w;

  switch (cta.style) {
    case 'underline':
      return `
        <text x="${rightX}" y="${baseY}" direction="rtl" text-anchor="end"
              font-family="Heebo, Arial, sans-serif" font-size="${fontSize}" font-weight="600"
              letter-spacing="-0.01em" fill="#F7F5F2">${escapeText(cta.text)}</text>
        <line x1="${rightX - cta.text.length * fontSize * 0.55}" y1="${baseY + 6}"
              x2="${rightX}" y2="${baseY + 6}" stroke="#F7F5F2" stroke-width="1.2"/>
      `;
    case 'pill':
      const padX = 16;
      const padY = 8;
      const textW = cta.text.length * fontSize * 0.6;
      const pillX = rightX - textW - padX * 2;
      const pillY = baseY - fontSize;
      return `
        <rect x="${pillX}" y="${pillY}" rx="${(fontSize + padY) / 2}" ry="${(fontSize + padY) / 2}"
              width="${textW + padX * 2}" height="${fontSize + padY * 1.6}"
              fill="#F7F5F2"/>
        <text x="${rightX - padX}" y="${baseY + 2}" direction="rtl" text-anchor="end"
              font-family="Heebo, Arial, sans-serif" font-size="${fontSize}" font-weight="600"
              fill="#0A0A0A">${escapeText(cta.text)}</text>
      `;
    case 'enclosed':
      return `
        <rect x="${rightX - cta.text.length * fontSize * 0.6 - 16}" y="${baseY - fontSize}"
              width="${cta.text.length * fontSize * 0.6 + 16}" height="${fontSize + 14}"
              fill="none" stroke="#F7F5F2" stroke-width="1"/>
        <text x="${rightX - 8}" y="${baseY + 2}" direction="rtl" text-anchor="end"
              font-family="Heebo, Arial, sans-serif" font-size="${fontSize}" font-weight="500"
              fill="#F7F5F2">${escapeText(cta.text)}</text>
      `;
    case 'bare':
    default:
      return `
        <text x="${rightX}" y="${baseY}" direction="rtl" text-anchor="end"
              font-family="Heebo, Arial, sans-serif" font-size="${fontSize}" font-weight="500"
              letter-spacing="0.02em" fill="#F7F5F2" fill-opacity="0.85">${escapeText(cta.text)} ←</text>
      `;
  }
}

function escapeText(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
}
function escapeAttr(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!));
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
