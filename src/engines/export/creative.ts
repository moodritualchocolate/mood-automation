/**
 * Creative Brief Export — rasterizes a CreativeBrief (banner / post
 * / carousel) to PNG via Resvg. Sister of exportBanner() but for the
 * lighter-weight Asset Generator surface.
 *
 * The output shape is the same as ExportResult so the same UI download
 * code can consume it. Carousels return an array of slides.
 */

import { Resvg } from '@resvg/resvg-js';
import {
  composeCreativeBanner,
  composeCreativePost,
  composeCreativeCarousel,
  type CreativeBrief,
} from '@/components/creative-brief-svg';

export interface CreativeRenderSlide {
  index: number;
  svg: string;
  pngBase64: string;
  width: number;
  height: number;
}

export interface CreativeRenderResult {
  packageType: 'banner' | 'post' | 'carousel';
  slides: CreativeRenderSlide[];
}

function rasterize(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, {
    background: '#0A0A0A',
    fitTo: { mode: 'width', value: width },
    font: {
      defaultFontFamily: 'Helvetica Neue',
      loadSystemFonts: true,
    },
  });
  return Buffer.from(resvg.render().asPng());
}

export async function renderCreativeBrief(brief: CreativeBrief): Promise<CreativeRenderResult> {
  if (brief.packageType === 'banner') {
    const svg = composeCreativeBanner(brief);
    const png = rasterize(svg, 1200);
    return {
      packageType: 'banner',
      slides: [{ index: 0, svg, pngBase64: png.toString('base64'), width: 1200, height: 628 }],
    };
  }
  if (brief.packageType === 'post') {
    const svg = composeCreativePost(brief);
    const png = rasterize(svg, 1080);
    return {
      packageType: 'post',
      slides: [{ index: 0, svg, pngBase64: png.toString('base64'), width: 1080, height: 1080 }],
    };
  }
  // carousel
  const composed = composeCreativeCarousel(brief);
  const slides: CreativeRenderSlide[] = composed.slides.map((s) => ({
    index: s.index,
    svg: s.svg,
    pngBase64: rasterize(s.svg, 1080).toString('base64'),
    width: 1080,
    height: 1080,
  }));
  return { packageType: 'carousel', slides };
}
