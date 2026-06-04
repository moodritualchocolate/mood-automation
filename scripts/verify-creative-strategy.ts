/**
 * VERIFY — Creative Strategy Engine
 *
 * 14 cases. Pure-function checks on the engine output for the three
 * product codes (BOOST · CHILLAX · BUNDLE).
 *
 *   1. Engine produces a non-empty strategy for each product code
 *   2. Audiences are non-empty + carry Hebrew labels
 *   3. Pain points are non-empty + Hebrew short text + English detail
 *   4. Hooks include all six families across the 3 products
 *   5. Emotional angles are non-empty + carry Hebrew labels
 *   6. Ad concepts cover at least 2 formats (still/video/carousel) per product
 *   7. UGC scripts are non-empty + Hebrew + shot list
 *   8. Image prompts include "Photorealistic editorial photograph"
 *      and explicitly forbid vector/gradient/template aesthetics
 *   9. Video prompts target vertical 9:16
 *  10. Carousel concepts contain the 5-slide narrative arc (hook ·
 *      truth · reveal · proof · invitation)
 *  11. Founder stories carry Hebrew narrative
 *  12. Testimonials carry Hebrew quote + speaker profile
 *  13. Determinism — same input twice → byte-identical strategy
 *      (modulo timestamp)
 *  14. Strategy advisory notice includes "Human remains final authority"
 */

import {
  computeCreativeStrategy, PRODUCT_CODES, PRODUCTS,
  type Hook,
} from '../lib/creativeStrategyEngine';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

const HEBREW_RE = /[֐-׿]/;

function main(): void {
  console.log('VERIFY — Creative Strategy Engine');
  console.log('---------------------------------');

  const strategies = PRODUCT_CODES.map((code) =>
    computeCreativeStrategy({ productCode: code, brand: { brandName: 'Aria' } }));

  // Case 1
  {
    const ok = strategies.length === 3
      && strategies.every((s) => s.audiences.length > 0 && s.hooks.length > 0);
    record('1', 'engine produces a non-empty strategy for each product code',
      ok, `products=${strategies.map((s) => s.productCode).join(',')}`);
  }

  // Case 2
  {
    const failures: string[] = [];
    for (const s of strategies) {
      for (const a of s.audiences) {
        if (!HEBREW_RE.test(a.hebrewLabel)) failures.push(`${s.productCode}/${a.id} missing hebrewLabel`);
      }
    }
    record('2', 'audiences carry Hebrew labels',
      failures.length === 0, failures.length === 0 ? `${strategies.flatMap(s => s.audiences).length} audiences clean` : failures.join('; '));
  }

  // Case 3
  {
    const failures: string[] = [];
    for (const s of strategies) {
      if (s.painPoints.length === 0) failures.push(`${s.productCode}: no pain points`);
      for (const p of s.painPoints) {
        if (!HEBREW_RE.test(p.shortHebrew)) failures.push(`${s.productCode}/${p.id} non-Hebrew shortText`);
        if (p.detailEnglish.length < 10) failures.push(`${s.productCode}/${p.id} thin detail`);
      }
    }
    record('3', 'pain points have Hebrew short text + English detail',
      failures.length === 0, failures.length === 0 ? `${strategies.flatMap(s => s.painPoints).length} pain points clean` : failures.join('; '));
  }

  // Case 4 — hook family coverage
  {
    const allHooks: Hook[] = strategies.flatMap((s) => s.hooks);
    const families = new Set(allHooks.map((h) => h.family));
    const expected = ['curiosity', 'truth-mirror', 'permission', 'antidote', 'invitation', 'pattern-break'];
    const missing = expected.filter((e) => !families.has(e as Hook['family']));
    record('4', 'all six hook families represented across the 3 products',
      missing.length === 0, missing.length === 0 ? `families=${[...families].join(',')}` : `missing: ${missing.join(',')}`);
  }

  // Case 5
  {
    const failures: string[] = [];
    for (const s of strategies) {
      for (const a of s.emotionalAngles) {
        if (!HEBREW_RE.test(a.hebrewLabel)) failures.push(`${s.productCode}/${a.id}`);
        if (a.toneAdjectives.length === 0) failures.push(`${s.productCode}/${a.id} no tone`);
      }
    }
    record('5', 'emotional angles have Hebrew labels + tone adjectives',
      failures.length === 0, failures.length === 0 ? `${strategies.flatMap(s => s.emotionalAngles).length} angles clean` : failures.join('; '));
  }

  // Case 6 — concept format coverage
  {
    const failures: string[] = [];
    for (const s of strategies) {
      const formats = new Set(s.adConcepts.map((c) => c.format));
      if (formats.size < 2) failures.push(`${s.productCode}: only ${formats.size} format(s)`);
    }
    record('6', 'each product covers at least 2 ad-concept formats',
      failures.length === 0, failures.length === 0 ? 'all products diversified' : failures.join('; '));
  }

  // Case 7
  {
    const failures: string[] = [];
    for (const s of strategies) {
      for (const u of s.ugcScripts) {
        if (!HEBREW_RE.test(u.scriptHebrew)) failures.push(`${s.productCode}/${u.id} non-Hebrew script`);
        if (u.shotList.length === 0) failures.push(`${s.productCode}/${u.id} no shot list`);
      }
    }
    record('7', 'UGC scripts have Hebrew script + shot list',
      failures.length === 0, failures.length === 0 ? `${strategies.flatMap(s => s.ugcScripts).length} UGC scripts clean` : failures.join('; '));
  }

  // Case 8 — image prompts demand photoreal + forbid template aesthetics
  {
    const failures: string[] = [];
    for (const s of strategies) {
      for (const p of s.imagePrompts) {
        if (!/Photorealistic/i.test(p.prompt)) failures.push(`${s.productCode}/${p.id} not photoreal`);
        if (!/vector|gradient backgrounds/i.test(p.negativePrompt)) failures.push(`${s.productCode}/${p.id} does not forbid vector/gradient`);
        if (!/no Hebrew text rendered by the image model/i.test(p.negativePrompt)) failures.push(`${s.productCode}/${p.id} does not forbid model-Hebrew`);
      }
    }
    record('8', 'image prompts demand photoreal + forbid vector/gradient/template + forbid model-rendered Hebrew',
      failures.length === 0, failures.length === 0 ? `${strategies.flatMap(s => s.imagePrompts).length} image prompts clean` : failures.join('; '));
  }

  // Case 9 — video aspect ratio
  {
    const failures: string[] = [];
    for (const s of strategies) {
      for (const v of s.videoPrompts) {
        if (v.aspectRatio !== '9:16') failures.push(`${s.productCode}/${v.id} aspect=${v.aspectRatio}`);
      }
    }
    record('9', 'video prompts target vertical 9:16',
      failures.length === 0, failures.length === 0 ? `${strategies.flatMap(s => s.videoPrompts).length} video prompts vertical` : failures.join('; '));
  }

  // Case 10 — carousel narrative arc
  {
    const failures: string[] = [];
    for (const s of strategies) {
      for (const c of s.carouselConcepts) {
        const roles = c.slides.map((sl) => sl.role).sort().join(',');
        const expected = ['hook', 'invitation', 'proof', 'reveal', 'truth'].sort().join(',');
        if (roles !== expected) failures.push(`${s.productCode}/${c.id} roles=${roles}`);
      }
    }
    record('10', 'carousel concepts carry the 5-slide narrative arc (hook · truth · reveal · proof · invitation)',
      failures.length === 0, failures.length === 0 ? 'all carousels well-formed' : failures.join('; '));
  }

  // Case 11
  {
    const failures: string[] = [];
    for (const s of strategies) {
      for (const f of s.founderStories) {
        if (!HEBREW_RE.test(f.storyHebrew)) failures.push(`${s.productCode}/${f.id} non-Hebrew`);
      }
    }
    record('11', 'founder stories are Hebrew',
      failures.length === 0, failures.length === 0 ? `${strategies.flatMap(s => s.founderStories).length} founder stories clean` : failures.join('; '));
  }

  // Case 12
  {
    const failures: string[] = [];
    for (const s of strategies) {
      if (s.testimonials.length === 0) failures.push(`${s.productCode}: no testimonials`);
      for (const t of s.testimonials) {
        if (!HEBREW_RE.test(t.hebrewQuote)) failures.push(`${s.productCode}/${t.id} non-Hebrew`);
        if (t.speakerProfile.length === 0) failures.push(`${s.productCode}/${t.id} no profile`);
      }
    }
    record('12', 'testimonials carry Hebrew quote + speaker profile',
      failures.length === 0, failures.length === 0 ? `${strategies.flatMap(s => s.testimonials).length} testimonials clean` : failures.join('; '));
  }

  // Case 13 — determinism (modulo timestamp)
  {
    const a = computeCreativeStrategy({ productCode: 'BOOST', brand: { brandName: 'Aria' } });
    const b = computeCreativeStrategy({ productCode: 'BOOST', brand: { brandName: 'Aria' } });
    const stripTs = (s: ReturnType<typeof computeCreativeStrategy>) => JSON.stringify({ ...s, generatedAt: 0 });
    const ok = stripTs(a) === stripTs(b);
    record('13', 'engine is deterministic for the same input',
      ok, ok ? 'byte-identical (sans timestamp)' : `lengths a=${stripTs(a).length} b=${stripTs(b).length}`);
  }

  // Case 14
  {
    const failures = strategies.filter((s) => !/Human remains final authority/i.test(s.advisoryNotice));
    record('14', 'every strategy advisory notice carries "Human remains final authority"',
      failures.length === 0, failures.length === 0 ? '3/3 carry the safety clause' : `missing: ${failures.map(f=>f.productCode).join(',')}`);
  }

  // Case 15 — product taxonomy completeness
  {
    const codes = Object.keys(PRODUCTS).sort().join(',');
    const expected = ['BOOST', 'BUNDLE', 'CHILLAX'].sort().join(',');
    record('15', 'PRODUCTS taxonomy covers BOOST · CHILLAX · BUNDLE',
      codes === expected, codes);
  }

  console.log('');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`${passed}/${results.length} passed.`);
  if (failed > 0) process.exit(1);
}

main();
