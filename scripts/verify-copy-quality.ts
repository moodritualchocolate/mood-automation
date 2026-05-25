/**
 * scripts/verify-copy-quality.ts
 *
 * Deterministic verification for the Copy-Quality Adapter (read-only).
 * Checks A–F + I + J in-process. Checks G + H verified separately
 * (G via end-to-end run + studio inspection, H via grep — neither
 * the adapter nor any new file is imported by src/engines/).
 *
 * Run: npx tsx scripts/verify-copy-quality.ts
 */

import { createInitialAdStrategyMemory } from '@lib/adStrategyMemory';
import {
  computeAdStrategy,
  type AdStrategyAssessment,
} from '@lib/adStrategyEngine';
import { createInitialCopywriterMemory } from '@lib/copywriterMemory';
import {
  composeCopy, recordCopyOutput, type CopywriterOutput,
} from '@lib/copywriterEngine';
import { evaluateCopyQuality } from '@lib/copyQualityAdapter';
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
const aggressive: CreativeDirection = {
  hook: '', focalPoint: 'product-in-hand', emotionalPacing: 'wired',
  productRole: 'foreground-blur', typographyDominance: 'loud', ctaBehavior: 'corner',
  layoutFamily: 'documentary-crop', restraint: 0.15,
};
const proof: CreativeDirection = {
  hook: '', focalPoint: 'object', emotionalPacing: 'tense',
  productRole: 'desk-proof', typographyDominance: 'editorial', ctaBehavior: 'editorial',
  layoutFamily: 'editorial-page', restraint: 0.5,
};

function stratOf(stateF: string, stateL: string, t: string, tn: string, mode: CampaignMode, dir: CreativeDirection): AdStrategyAssessment {
  const st = mkState(stateF, stateL);
  return computeAdStrategy({
    state: st, truth: mkTruth(st, t, tn), direction: dir,
    campaignMode: mode, bannerId: 'b-fix', memory: createInitialAdStrategyMemory(),
  });
}

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('COPY-QUALITY ADAPTER — VERIFICATION\n');

// A: deterministic — same copy + same strategy → same quality
{
  const s = stratOf('exhausted', 'tired parent at 3am', 'truth', 'wants real-rest and feels guilt-when-resting', 'Emotional', calm);
  const c = composeCopy({ strategy: s, brutality: 0.65, memory: createInitialCopywriterMemory() });
  const q1 = evaluateCopyQuality({ copywriter: c, strategy: s, brutality: 0.65 });
  const q2 = evaluateCopyQuality({ copywriter: c, strategy: s, brutality: 0.65 });
  check('A · same copy + strategy → same quality',
    JSON.stringify(q1) === JSON.stringify(q2),
    `integrity=${q1.copyIntegrity}/10 trustSafety=${q1.trustSafety} dignitySafety=${q1.dignitySafety}`);
}

// B: forbidden phrases lower score
{
  const s = stratOf('exhausted', 'tired parent', 't', 'wants real-rest', 'Emotional', calm);
  const cClean = composeCopy({ strategy: s, brutality: 0.65, memory: createInitialCopywriterMemory() });
  const qClean = evaluateCopyQuality({ copywriter: cClean, strategy: s, brutality: 0.65 });
  // Inject forbidden into a copy of the output.
  const cDirty: CopywriterOutput = {
    ...cClean,
    hook: 'תעשה מהפך לחייך עכשיו!!!',
    body: 'transform your life with this one trick. you won\'t believe what happened.',
    cta: 'act now',
    forbiddenPhrasesTriggered: ['תעשה מהפך', 'transform your life', 'this one trick', 'you won\'t believe', 'act now', 'multiple-exclamations'],
    trustAlignment: 2, dignityAlignment: 2,
  };
  const qDirty = evaluateCopyQuality({ copywriter: cDirty, strategy: s, brutality: 0.65 });
  check('B · forbidden phrases lower integrity + trust + dignity',
    qDirty.copyIntegrity < qClean.copyIntegrity
      && qDirty.trustSafety < qClean.trustSafety
      && qDirty.dignitySafety < qClean.dignitySafety,
    `clean integrity=${qClean.copyIntegrity} → dirty integrity=${qDirty.copyIntegrity}; ` +
    `clean trust=${qClean.trustSafety} → dirty trust=${qDirty.trustSafety}; ` +
    `clean dignity=${qClean.dignitySafety} → dirty dignity=${qDirty.dignitySafety}`);
}

// C: high repetition lowers score (via repetitionConcern → integrity)
{
  const s = stratOf('exhausted', 'tired parent', 't', 'wants real-rest', 'Emotional', calm);
  const cLow: CopywriterOutput = {
    ...composeCopy({ strategy: s, brutality: 0.65, memory: createInitialCopywriterMemory() }),
    repetitionSimilarity: 1,
  };
  const cHigh: CopywriterOutput = { ...cLow, repetitionSimilarity: 9 };
  const qLow  = evaluateCopyQuality({ copywriter: cLow,  strategy: s, brutality: 0.65 });
  const qHigh = evaluateCopyQuality({ copywriter: cHigh, strategy: s, brutality: 0.65 });
  check('C · high repetition lowers integrity + raises concern',
    qHigh.repetitionConcern > qLow.repetitionConcern && qHigh.copyIntegrity < qLow.copyIntegrity,
    `low rep=${qLow.repetitionConcern} → high rep=${qHigh.repetitionConcern}; ` +
    `integrity ${qLow.copyIntegrity} → ${qHigh.copyIntegrity}`);
}

// D: high proofNeed without proof line lowers proofAdequacy
{
  // Build a strategy with high proofNeed (Documentary + proof direction → role
  // typically trust_builder or product_proof — both proofRequirement=high).
  const s = stratOf('skeptical', 'wellness skeptic', 'just data', 'allergic-to-marketing-language', 'Documentary', proof);
  // Force-confirm proofNeed === 'high'.
  const sH: AdStrategyAssessment = { ...s, proofNeed: 'high' };
  const c = composeCopy({ strategy: sH, brutality: 0.65, memory: createInitialCopywriterMemory() });
  // Build a stripped copy with no proof line.
  const cNoProof: CopywriterOutput = { ...c, proofLine: null };
  const cWithProof: CopywriterOutput = { ...c, proofLine: 'נבדק במעבדה חיצונית.' };
  const qNo   = evaluateCopyQuality({ copywriter: cNoProof,   strategy: sH, brutality: 0.65 });
  const qYes  = evaluateCopyQuality({ copywriter: cWithProof, strategy: sH, brutality: 0.65 });
  check('D · high proofNeed without proofLine lowers proofAdequacy',
    qNo.proofAdequacy < qYes.proofAdequacy && qNo.proofAdequacy <= 3,
    `no-proof proofAdequacy=${qNo.proofAdequacy} → with-proof=${qYes.proofAdequacy} (high-need)`);
}

// E: strong restraint (silent urgency) improves trustSafety
{
  const s = stratOf('exhausted', 'tired parent', 't', 'wants real-rest', 'Emotional', calm);
  const sDebt: AdStrategyAssessment = { ...s, trustDebt: 7 };
  const c = composeCopy({ strategy: sDebt, brutality: 0.65, memory: createInitialCopywriterMemory() });
  const cPressed: CopywriterOutput = { ...c, urgencyStyle: 'pressed' };
  const cSilent:  CopywriterOutput = { ...c, urgencyStyle: 'silent' };
  const qPressed = evaluateCopyQuality({ copywriter: cPressed, strategy: sDebt, brutality: 0.65 });
  const qSilent  = evaluateCopyQuality({ copywriter: cSilent,  strategy: sDebt, brutality: 0.65 });
  check('E · silent urgency improves trustSafety + ctaRestraint under high debt',
    qSilent.trustSafety > qPressed.trustSafety && qSilent.ctaRestraint > qPressed.ctaRestraint,
    `pressed trust=${qPressed.trustSafety} ctaRestraint=${qPressed.ctaRestraint} → ` +
    `silent trust=${qSilent.trustSafety} ctaRestraint=${qSilent.ctaRestraint}`);
}

// F: Hebrew calques + English intrusion trigger warnings + lower naturalness
{
  const s = stratOf('exhausted', 'tired parent', 't', 'wants real-rest', 'Emotional', calm);
  const c = composeCopy({ strategy: s, brutality: 0.65, memory: createInitialCopywriterMemory() });
  // Fabricate a body with calques + English intrusion.
  const cCalque: CopywriterOutput = {
    ...c,
    hook: 'לעלות רמה. transform your morning.',
    body: 'גרסה הטובה ביותר שלך מחכה. unlock your true potential with this amazing breakthrough.',
    cta: 'התחל את המסע',
  };
  const q = evaluateCopyQuality({ copywriter: cCalque, strategy: s, brutality: 0.65 });
  const calqueWarn = q.warnings.some((w) => w.includes('calque:') || w.includes('english-intrusion'));
  check('F · Hebrew calques + English intrusion trigger warnings + lower naturalness',
    calqueWarn && q.hebrewNaturalness < 8,
    `hebrewNaturalness=${q.hebrewNaturalness}/10; warnings=${q.warnings.filter((w) => w.includes('hebrew')).join(' | ')}`);
}

// Extra: role-tone mismatch lowers strategicCopyFit
{
  const s = stratOf('exhausted', 'tired parent', 't', 'wants real-rest', 'Emotional', calm);
  const c = composeCopy({ strategy: s, brutality: 0.65, memory: createInitialCopywriterMemory() });
  // Force a tone that doesn't fit "emotional_mirror"
  const cMismatched: CopywriterOutput = { ...c, persuasionTone: 'confrontational-soft' };
  const qOK = evaluateCopyQuality({ copywriter: c, strategy: s, brutality: 0.65 });
  const qMis = evaluateCopyQuality({ copywriter: cMismatched, strategy: s, brutality: 0.65 });
  check('Extra · role × tone mismatch lowers strategicCopyFit',
    qMis.strategicCopyFit < qOK.strategicCopyFit,
    `fit-tone (${c.persuasionTone})=${qOK.strategicCopyFit} → mismatch (confrontational-soft)=${qMis.strategicCopyFit}`);
}

console.log(`\n${passed} passed · ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
