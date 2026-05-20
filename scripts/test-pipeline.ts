/**
 * scripts/test-pipeline.ts
 *
 * Runs the full pipeline end-to-end without Next.js. Used to verify
 * engine wiring during development. Run with:
 *
 *   MOOD_FORCE_STUBS=1 npm run engines:test
 */

import { runPipeline } from '@/core/pipeline';
import { composeBannerSvg } from '@/components/banner-svg';
import { exportBanner } from '@/engines/export';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

async function main() {
  console.log('\n MOOD CREATIVE OS — pipeline smoke test\n');

  const result = await runPipeline(
    { formula: 'ENERGY', campaignMode: 'Documentary' },
    {
      onEvent: (e) => {
        const t = new Date(e.ts).toISOString().slice(11, 19);
        console.log(`  [${t}] ${e.stage.padEnd(20)} ${e.message}`);
      },
    },
  );

  const b = result.banner;
  console.log('\n  STATE      :', b.state.label);
  console.log('  TRUTH      :', b.truth.truth);
  console.log('  HEADLINE HE:', b.typography.primary.text);
  console.log('  CTA        :', b.cta.text);
  console.log('  VERDICT    :', b.critique.verdict);
  console.log('  ATTEMPTS   :', b.attempts);

  const svg = composeBannerSvg(b);
  const svgPath = resolve(process.cwd(), 'out-banner.svg');
  await writeFile(svgPath, svg);
  console.log('\n  SVG written:', svgPath);

  const { pngBase64 } = await exportBanner(b);
  const pngPath = resolve(process.cwd(), 'out-banner.png');
  await writeFile(pngPath, Buffer.from(pngBase64, 'base64'));
  console.log('  PNG written:', pngPath, `(${pngBase64.length} b64 chars)\n`);
}

main().catch((e) => {
  console.error('\n  pipeline failed:', e);
  process.exit(1);
});
