/**
 * 13. EXPORT ENGINE
 *
 * Composites the photographed scene + typography + CTA into a single
 * deliverable SVG, then rasterises to PNG via @resvg/resvg-js.
 *
 * Why SVG composition rather than HTML→PNG via headless browser:
 *  - no playwright/chromium runtime in the container
 *  - SVG keeps the typography layer crisp and Hebrew RTL is well-defined
 *  - resvg is fast and deterministic
 *
 * The same composite is used by the in-app renderer for the live preview.
 */

import { Resvg } from '@resvg/resvg-js';
import type { Banner } from '@/core/types';
import { composeBannerSvg } from '@/components/banner-svg';

export interface ExportResult {
  svg: string;
  pngBase64: string;
  width: number;
  height: number;
}

export async function exportBanner(banner: Banner): Promise<ExportResult> {
  const svg = composeBannerSvg(banner);
  const width = banner.image.width;
  const height = banner.image.height;

  const resvg = new Resvg(svg, {
    background: '#0A0A0A',
    fitTo: { mode: 'width', value: width },
    font: {
      // Use system fallbacks; in production, ship Heebo for Hebrew.
      defaultFontFamily: 'Helvetica Neue',
      loadSystemFonts: true,
    },
  });
  const png = resvg.render().asPng();

  return {
    svg,
    pngBase64: Buffer.from(png).toString('base64'),
    width,
    height,
  };
}
