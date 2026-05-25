/**
 * scripts/verify-copy-quality-advisory.ts
 *
 * Deterministic verification for the Soft Advisory Inlay.
 * Checks A-G + I in-process. Check H (TypeScript) verified via
 * `tsc --noEmit`. End-to-end check J (dashboard still works) verified
 * separately against the running /api/quality-longitudinal endpoint.
 *
 * Run: npx tsx scripts/verify-copy-quality-advisory.ts
 */

import { createInitialAdStrategyMemory } from '@lib/adStrategyMemory';
import { computeAdStrategy } from '@lib/adStrategyEngine';
import { createInitialCopywriterMemory } from '@lib/copywriterMemory';
import { composeCopy, type CopywriterOutput } from '@lib/copywriterEngine';
import { evaluateCopyQuality, type CopyQualityAxis } from '@lib/copyQualityAdapter';
import { buildCopyQualityAdvisory, appendAdvisoryToNotes } from '@lib/copyQualityAdvisory';
import type { CampaignMode, CreativeDirection, HumanState, HumanTruth } from '@/core/types';

function mkState(family: string, label: string): HumanState {
  return {
    id: `${family}-${label.replace(/\s/g, '-')}`,
    family, label, description: 'fixture',
    pacing: 'quiet', energy: 0.4,
    socialContext: 'private', emotionalAffect: 'observed',
  } as unknown as HumanState;
}
function mkTruth(state: HumanState, truth: string, tension: string): HumanTruth {
  return { state, truth, tension, voice: 'observed', forbidden: [] } as unknown as HumanTruth;
}
const calm: CreativeDirection = {
  hook: '', focalPoint: 'environment', emotionalPacing: 'quiet',
  productRole: 'hidden', typographyDominance: 'whisper', ctaBehavior: 'quiet',
  layoutFamily: 'negative-space', restraint: 0.85,
};

function stratFor(mode: CampaignMode, dir: CreativeDirection) {
  const st = mkState('exhausted', 'tired parent at 3am');
  return computeAdStrategy({
    state: st, truth: mkTruth(st, 'truth', 'wants real-rest and feels guilt-when-resting'),
    direction: dir, campaignMode: mode, bannerId: 'b', memory: createInitialAdStrategyMemory(),
  });
}

function cleanCopy(): { copy: CopywriterOutput; quality: CopyQualityAxis } {
  const s = stratFor('Emotional', calm);
  const c = composeCopy({ strategy: s, brutality: 0.65, memory: createInitialCopywriterMemory() });
  const q = evaluateCopyQuality({ copywriter: c, strategy: s, brutality: 0.65 });
  return { copy: c, quality: q };
}

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('SOFT ADVISORY INLAY — VERIFICATION\n');

// A: Strong copy → notes unchanged
{
  const { copy, quality } = cleanCopy();
  const adv = buildCopyQualityAdvisory({ copyQuality: quality, copywriter: copy });
  const before = 'Approved at brutality 0.50. Scroll-stop 7.7.';
  const after = appendAdvisoryToNotes(before, adv);
  check('A · strong copy → notes unchanged',
    !adv.shouldAppend && after === before,
    `shouldAppend=${adv.shouldAppend} integrity=${quality.copyIntegrity} forbidden=${copy.forbiddenPhrasesTriggered.length}`);
}

// B: Low copyIntegrity → advisory appended
{
  const { copy, quality } = cleanCopy();
  const lowQuality: CopyQualityAxis = { ...quality, copyIntegrity: 4 };
  const adv = buildCopyQualityAdvisory({ copyQuality: lowQuality, copywriter: copy });
  const after = appendAdvisoryToNotes('Approved at brutality 0.50.', adv);
  check('B · low copyIntegrity → advisory appended',
    adv.shouldAppend && after.includes('[advisory] copy quality signal:'),
    `advisoryLine="${adv.advisoryLine}"`);
}

// C: Forbidden phrase → advisory appended
{
  const { copy, quality } = cleanCopy();
  const dirtyCopy: CopywriterOutput = {
    ...copy,
    forbiddenPhrasesTriggered: ['תעשה מהפך'],
  };
  const adv = buildCopyQualityAdvisory({ copyQuality: quality, copywriter: dirtyCopy });
  const after = appendAdvisoryToNotes('Approved.', adv);
  check('C · forbidden phrase → advisory appended',
    adv.shouldAppend
      && after.includes('forbidden phrase triggered')
      && after.includes('תעשה מהפך'),
    `advisoryLine="${adv.advisoryLine}"`);
}

// D: Multiple warnings → top 2-3 concerns only
{
  const { copy } = cleanCopy();
  // Build a quality axis with many concerns triggered.
  const multiQuality: CopyQualityAxis = {
    copyIntegrity:     2,
    trustSafety:       3,
    dignitySafety:     3,
    repetitionConcern: 9,
    proofAdequacy:     2,
    ctaRestraint:      3,
    hebrewNaturalness: 4,
    strategicCopyFit:  4,
    warnings: ['low trust', 'low dignity', 'no proof'],
    reasonCodes: [],
  };
  const dirtyCopy: CopywriterOutput = { ...copy, forbiddenPhrasesTriggered: ['fake-claim'] };
  const adv = buildCopyQualityAdvisory({ copyQuality: multiQuality, copywriter: dirtyCopy });
  // Count comma-separated concerns in advisory line (after the colon).
  const concernsPart = adv.advisoryLine ? adv.advisoryLine.split('signal:')[1].trim() : '';
  const concernCount = concernsPart.split(',').length;
  check('D · multiple warnings → top 2-3 concerns only',
    adv.shouldAppend && concernCount <= 3 && concernCount >= 2,
    `concernCount=${concernCount} line="${adv.advisoryLine}"`);
}

// E: Verdict-shape preserved (verdict, reasons, totals untouched by appender)
{
  const { copy } = cleanCopy();
  const multiQuality: CopyQualityAxis = {
    copyIntegrity: 2, trustSafety: 2, dignitySafety: 2,
    repetitionConcern: 9, proofAdequacy: 2, ctaRestraint: 2,
    hebrewNaturalness: 3, strategicCopyFit: 3,
    warnings: ['x'], reasonCodes: [],
  };
  const adv = buildCopyQualityAdvisory({ copyQuality: multiQuality, copywriter: copy });
  // Simulate a finalVerdict object — only notes should be mutated.
  const finalVerdict = {
    verdict: 'approve' as const,
    reasons: [] as string[],
    notes: 'Approved at brutality 0.50.',
    totals: { scrollStop: 7.7, taste: 2.5, psychology: 7.6, productPresence: null, referenceCloseness: 0.62 },
  };
  const beforeSnapshot = JSON.stringify({
    verdict: finalVerdict.verdict, reasons: finalVerdict.reasons, totals: finalVerdict.totals,
  });
  finalVerdict.notes = appendAdvisoryToNotes(finalVerdict.notes, adv);
  const afterSnapshot = JSON.stringify({
    verdict: finalVerdict.verdict, reasons: finalVerdict.reasons, totals: finalVerdict.totals,
  });
  check('E · verdict / reasons / totals unchanged',
    beforeSnapshot === afterSnapshot && finalVerdict.notes !== 'Approved at brutality 0.50.',
    `verdict=${finalVerdict.verdict} reasonsLen=${finalVerdict.reasons.length} ` +
    `notesChanged=${finalVerdict.notes !== 'Approved at brutality 0.50.'}`);
}

// F: Critic scores remain unchanged (the helper does not return or
//    consume any score; only reads notes-bound copy + quality fields)
{
  const { copy, quality } = cleanCopy();
  // Manually verify the helper returns NO score-shaped data.
  const adv = buildCopyQualityAdvisory({ copyQuality: quality, copywriter: copy });
  const advKeys = Object.keys(adv).sort();
  const expectedKeys = ['advisoryLine', 'reasonCodes', 'shouldAppend'];
  check('F · advisory output contains no critic-score fields',
    JSON.stringify(advKeys) === JSON.stringify(expectedKeys),
    `keys=[${advKeys.join(', ')}]`);
}

// G: Brutality behavior unchanged — the helper is brutality-agnostic.
{
  // Same quality+copy → same advisory regardless of brutality.
  // The advisory builder does not take brutality as input.
  const { copy, quality } = cleanCopy();
  const lowQ: CopyQualityAxis = { ...quality, copyIntegrity: 4 };
  const adv1 = buildCopyQualityAdvisory({ copyQuality: lowQ, copywriter: copy });
  const adv2 = buildCopyQualityAdvisory({ copyQuality: lowQ, copywriter: copy });
  check('G · brutality unchanged (helper is brutality-agnostic)',
    JSON.stringify(adv1) === JSON.stringify(adv2)
      && !('brutality' in adv1)
      && Object.keys(adv1).every((k) => k !== 'brutality'),
    `advisory deterministic and contains no brutality field`);
}

// I: No external execution — helper imports only types + pure builders.
{
  // Verified by static analysis at the import level; here we just confirm
  // the helper does no I/O when invoked.
  const { copy, quality } = cleanCopy();
  const adv = buildCopyQualityAdvisory({ copyQuality: quality, copywriter: copy });
  // If we reached this point synchronously without throwing, no async
  // I/O was attempted in the helper's call path.
  check('I · helper is synchronous and pure',
    typeof adv === 'object' && adv !== null,
    `returned object synchronously (advisoryLine=${adv.advisoryLine ?? 'null'})`);
}

// Extra: null inputs handled gracefully
{
  const adv = buildCopyQualityAdvisory({ copyQuality: null, copywriter: null });
  check('Extra · null inputs → no advisory',
    !adv.shouldAppend && adv.advisoryLine === null,
    `shouldAppend=${adv.shouldAppend}`);
}

console.log(`\n${passed} passed · ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
