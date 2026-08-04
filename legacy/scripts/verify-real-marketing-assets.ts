/**
 * VERIFY — Real Marketing Asset Quality (RMAQ).
 *
 * Architectural invariants the real-marketing-asset surface MUST preserve:
 *
 *   1. Product-mode brief includes a product instruction in the prompt.
 *   2. Human-mode brief includes a human-scene instruction in the prompt.
 *   3. The Asset Quality Guard REJECTS a product-mode brief with
 *      productPresence = 'none' (plain-gradient detection).
 *   4. The guard REJECTS a Hebrew-asset brief with English headline.
 *   5. The guard REJECTS a brief with missing CTA.
 *   6. Production spec includes the formula's canonical color hex.
 *   7. Production spec includes approvedProductReferences when
 *      productPresence != 'none'.
 *   8. Banner/post SVG composition includes the pouch when
 *      productPresence is 'pouch' (presence of the pouch label band
 *      in the rendered SVG).
 *   9. The three seed examples (ENERGY hero, FOCUS human, RELAX
 *      carousel) all PASS the guard.
 *  10. The negative prompt mentions the right forbidden patterns
 *      (invented flavors, supplement hype, plain gradient when
 *      product mode).
 */

import {
  briefToPrompt, briefToNegativePrompt, briefToProductionSpec,
  composeCreativeBanner, composeCreativePost, composeCreativeCarousel,
  type CreativeBrief,
} from '../src/components/creative-brief-svg';
import { runQualityGuard } from '../src/engines/creative-quality-guard';
import { FORMULA_PALETTES } from '../src/components/creative-brief-imagery';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

const energyHero: CreativeBrief = {
  formula: 'ENERGY',
  packageType: 'banner',
  paletteKey: 'amber',
  visualMode: 'product-hero',
  productPresence: 'pouch-and-square',
  platformSize: 'banner-1200x628',
  headline: 'בוקר אחד. בלי הצגות.',
  subline: 'אנרגיה מקקאו שלא צריך להתנצל.',
  cta: 'התחילו את הבוקר עם MOOD',
  audience: 'בוגרים 31-49, עירוניים',
  emotion: 'התעוררות שקטה',
  signature: 'MOOD',
};

const focusHuman: CreativeBrief = {
  formula: 'FOCUS',
  packageType: 'post',
  paletteKey: 'ink',
  visualMode: 'human-moment',
  productPresence: 'none',
  platformSize: 'post-1080x1080',
  headline: 'שקט אחד. מספיק.',
  subline: 'הקקאו לא מנסה לעצור אותך — הוא יושב לידך.',
  cta: 'הרגישו את הצלילות',
  audience: 'עובדי מידע',
  emotion: 'הרפיה ממוקדת',
  signature: 'MOOD',
};

const relaxCarousel: CreativeBrief = {
  formula: 'RELAX',
  packageType: 'carousel',
  paletteKey: 'cocoa',
  visualMode: 'carousel-story',
  productPresence: 'pouch',
  platformSize: 'carousel-1080x1080',
  headline: 'שוקולד שעובד לאט',
  subline: 'מסע שמתחיל בקקאו ונגמר בלילה שקט.',
  cta: 'המשיכו לקרוא',
  audience: 'מבוגרים שמחפשים טקס ערב',
  emotion: 'הרגעה איטית',
  signature: 'MOOD',
  slides: [
    { headline: 'שוקולד שעובד לאט', body: 'מסע איטי', cta: 'המשיכו',
      visualMode: 'product-hero', productPresence: 'pouch' },
    { headline: 'יד אחת. פיסה אחת.', body: 'הקקאו לא ממהר.',
      visualMode: 'product-and-human', productPresence: 'chocolate-square' },
    { headline: 'הלילה נהיה רך יותר',
      visualMode: 'human-moment', productPresence: 'none' },
  ],
};

// ─── Case 1: product mode prompt mentions product ───────────────
function case1(): void {
  const prompt = briefToPrompt(energyHero);
  const ok = /pouch/i.test(prompt) && /MOOD ENERGY/i.test(prompt) && /stand-up sachet/i.test(prompt);
  record('1', 'product-mode prompt includes pouch + stand-up sachet reference',
    ok, ok ? 'prompt references the pouch + label' : 'prompt missing product reference');
}

// ─── Case 2: human mode prompt mentions scene ───────────────────
function case2(): void {
  const prompt = briefToPrompt(focusHuman);
  // The renderer adds the still-life scene; the prompt itself
  // surfaces the visual mode label and the formula's color tokens.
  const ok = /human-moment/.test(prompt) && /FOCUS/.test(prompt);
  record('2', 'human-mode prompt labels visualMode + formula',
    ok, ok ? 'prompt mentions human-moment + FOCUS' : 'prompt missing scene reference');
}

// ─── Case 3: guard rejects product mode with no product ─────────
function case3(): void {
  const bad: CreativeBrief = { ...energyHero, productPresence: 'none' };
  const guard = runQualityGuard(bad);
  const ok = !guard.ok
    && guard.rejections.some((r) => r.code === 'product-missing');
  record('3', 'guard rejects product-mode brief with productPresence=none',
    ok, ok ? `rejections=${guard.rejections.map((r) => r.code).join(',')}`
           : `unexpected: ${JSON.stringify(guard)}`);
}

// ─── Case 4: guard rejects English headline ─────────────────────
function case4(): void {
  const bad: CreativeBrief = { ...focusHuman, headline: 'Quiet morning, one cup.' };
  const guard = runQualityGuard(bad);
  const ok = !guard.ok
    && guard.rejections.some((r) => r.code === 'hebrew-required' && r.field === 'headline');
  record('4', 'guard rejects English headline on Hebrew asset',
    ok, ok ? 'hebrew-required rejection for headline'
           : `unexpected: ${JSON.stringify(guard.rejections)}`);
}

// ─── Case 5: guard rejects missing CTA ──────────────────────────
function case5(): void {
  const bad: CreativeBrief = { ...energyHero, cta: '' };
  const guard = runQualityGuard(bad);
  const ok = !guard.ok
    && guard.rejections.some((r) => r.code === 'cta-missing' || r.code === 'cta-too-short');
  record('5', 'guard rejects missing/short CTA',
    ok, ok ? 'cta-missing rejection raised'
           : `unexpected: ${JSON.stringify(guard.rejections)}`);
}

// ─── Case 6: production spec includes formula hex ───────────────
function case6(): void {
  const spec = briefToProductionSpec(energyHero);
  const fp = FORMULA_PALETTES.ENERGY;
  const ok = spec.formulaPaletteHex.product === fp.product
    && spec.formulaPaletteHex.accent === fp.accent
    && spec.formulaPaletteHex.background[0] === fp.bg0
    && spec.formulaPaletteHex.background[1] === fp.bg1;
  record('6', 'production spec carries the formula\'s canonical color hex',
    ok, ok ? 'all four palette hexes match'
           : `spec=${JSON.stringify(spec.formulaPaletteHex)} fp=${JSON.stringify({ p: fp.product, a: fp.accent, bg: [fp.bg0, fp.bg1] })}`);
}

// ─── Case 7: production spec lists approved product references ──
function case7(): void {
  const spec = briefToProductionSpec(energyHero);
  const ok = spec.approvedProductReferences.length === 2
    && spec.approvedProductReferences.some((r) => /pouch/.test(r))
    && spec.approvedProductReferences.some((r) => /chocolate-square/.test(r));
  record('7', 'production spec lists approvedProductReferences when product is present',
    ok, ok ? `refs=${spec.approvedProductReferences.join(' | ')}`
           : `refs=${spec.approvedProductReferences.join(' | ')}`);
}

// ─── Case 8: SVG includes the pouch label band ──────────────────
function case8(): void {
  const svgBanner = composeCreativeBanner(energyHero);
  const svgPost   = composeCreativePost  ({ ...energyHero, packageType: 'post' });
  // The pouch composer prints the MOOD wordmark + the Hebrew formula
  // name on the label. Find both.
  const okBanner = svgBanner.includes('>MOOD<') && svgBanner.includes(FORMULA_PALETTES.ENERGY.hebrewName);
  const okPost   = svgPost  .includes('>MOOD<') && svgPost  .includes(FORMULA_PALETTES.ENERGY.hebrewName);
  const ok = okBanner && okPost;
  record('8', 'pouch SVG (MOOD wordmark + Hebrew formula) appears in banner + post',
    ok, ok ? 'pouch label band rendered in both formats'
           : `banner=${okBanner} post=${okPost}`);
}

// ─── Case 9: all three seed examples pass the guard ─────────────
function case9(): void {
  const seeds = [
    { name: 'ENERGY hero',     brief: energyHero },
    { name: 'FOCUS human',     brief: focusHuman },
    { name: 'RELAX carousel',  brief: relaxCarousel },
  ];
  const failed: string[] = [];
  for (const s of seeds) {
    const g = runQualityGuard(s.brief);
    if (!g.ok) failed.push(`${s.name}: ${g.rejections.map((r) => r.code).join(',')}`);
  }
  record('9', 'all three seed examples pass the Asset Quality Guard',
    failed.length === 0, failed.length === 0 ? 'all 3 seeds clean'
                                              : `failed: ${failed.join(' | ')}`);
}

// ─── Case 10: negative prompt forbids the right things ──────────
function case10(): void {
  const negProduct = briefToNegativePrompt(energyHero);
  const negHuman   = briefToNegativePrompt(focusHuman);
  const okProduct =
    /invented MOOD flavors/i.test(negProduct) &&
    /supplement hype/i.test(negProduct) &&
    /plain gradient \+ text only/i.test(negProduct);
  const okHuman =
    /invented MOOD formulas/i.test(negHuman) &&
    /empty scene/i.test(negHuman);
  record('10', 'negative prompt forbids invented flavors / hype / plain-gradient (when applicable)',
    okProduct && okHuman,
    `product-mode neg ok=${okProduct}, human-mode neg ok=${okHuman}`);
}

// ─── Case 11: carousel slide modes are honoured in the prompt ────
function case11(): void {
  const prompt = briefToPrompt(relaxCarousel);
  const ok = /product-hero\/pouch/.test(prompt)
    && /product-and-human\/chocolate-square/.test(prompt)
    && /human-moment/.test(prompt);
  record('11', 'carousel prompt records per-slide visualMode + productPresence',
    ok, ok ? 'all three slide modes recorded'
           : 'one or more per-slide modes missing in prompt');
}

// ─── Case 12: carousel SVGs reflect per-slide visual modes ──────
function case12(): void {
  const out = composeCreativeCarousel(relaxCarousel);
  // First slide is product-hero/pouch → must include the pouch
  // label. Third slide is human-moment/none → must NOT include the
  // pouch label.
  const slide0 = out.slides[0].svg;
  const slide2 = out.slides[2].svg;
  const okFirst = slide0.includes('>MOOD<') && slide0.includes(FORMULA_PALETTES.RELAX.hebrewName);
  const okThird = !(slide2.includes('30g · NET WT'));
  record('12', 'carousel slides honour their per-slide visualMode in the SVG',
    okFirst && okThird, `slide0(pouch)=${okFirst}, slide2(no-pouch)=${okThird}`);
}

// ─── runner ─────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('VERIFY — Real Marketing Asset Quality');
  console.log('-------------------------------------');
  case1(); case2(); case3(); case4(); case5(); case6();
  case7(); case8(); case9(); case10(); case11(); case12();
  console.log('');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`${passed}/${results.length} passed.`);
  if (failed > 0) {
    console.log(`${failed} failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
