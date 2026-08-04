/**
 * scripts/verify-longitudinal-quality.ts
 *
 * Deterministic verification for the Longitudinal Quality Dashboard.
 * Checks 1–5 + 7 in-process. Check 6 (critic unchanged) is verified by
 * grep — no critic engine imports the new view/store. End-to-end
 * verification through /api/quality-longitudinal happens separately.
 *
 * Run: npx tsx scripts/verify-longitudinal-quality.ts
 */

import { createInitialAdStrategyMemory } from '@lib/adStrategyMemory';
import { computeAdStrategy, recordStrategyAssessment, type AdStrategyAssessment } from '@lib/adStrategyEngine';
import { createInitialCopywriterMemory } from '@lib/copywriterMemory';
import { composeCopy, recordCopyOutput } from '@lib/copywriterEngine';
import { evaluateCopyQuality } from '@lib/copyQualityAdapter';
import { createInitialCopyQualityMemory, axisToSample } from '@lib/copyQualityMemory';
import { buildQualityLongitudinalView } from '@lib/qualityLongitudinalView';
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

function stratOf(stateF: string, stateL: string, t: string, tn: string, mode: CampaignMode, dir: CreativeDirection): AdStrategyAssessment {
  const st = mkState(stateF, stateL);
  return computeAdStrategy({
    state: st, truth: mkTruth(st, t, tn), direction: dir,
    campaignMode: mode, bannerId: 'b', memory: createInitialAdStrategyMemory(),
  });
}

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('LONGITUDINAL QUALITY — VERIFICATION\n');

// 1: Empty memory → not enough history yet
{
  const view = buildQualityLongitudinalView({ strategy: null, copywriter: null, quality: null });
  check('1 · empty memory → not enough history yet',
    view.driftStatus === 'no-history' && !view.present,
    `status="${view.driftStatus}" statement="${view.statement}"`);
}

// 2: After several generations → trends populate
{
  let strat   = createInitialAdStrategyMemory();
  let copy    = createInitialCopywriterMemory();
  let quality = createInitialCopyQualityMemory();
  for (let i = 0; i < 5; i++) {
    const s = stratOf('exhausted', 'tired parent at 3am', 'truth', 'wants real-rest', 'Emotional', calm);
    strat = recordStrategyAssessment(strat, s, `b-trend-${i}`, 1000 + i);
    const c = composeCopy({ strategy: s, brutality: 0.65, memory: copy });
    copy = recordCopyOutput(copy, c, s, `b-trend-${i}`, 1000 + i);
    const q = evaluateCopyQuality({ copywriter: c, strategy: s, brutality: 0.65 });
    const sample = axisToSample(q, `b-trend-${i}`, 1000 + i);
    quality = {
      ...quality,
      samples: [...quality.samples, sample],
      totalSamples: quality.totalSamples + 1,
      firstUpdatedAt: quality.firstUpdatedAt ?? sample.at,
      updatedAt: sample.at,
    };
  }
  const view = buildQualityLongitudinalView({ strategy: strat, copywriter: copy, quality });
  check('2 · trends populate after several generations',
    view.present
      && view.trustDebtTrend.length >= 3
      && view.copyIntegrityTrend.length >= 3
      && view.axisAverages.length === 8,
    `present=${view.present} status=${view.driftStatus} trustDebtTrend=${view.trustDebtTrend.length} ` +
    `copyIntegrityTrend=${view.copyIntegrityTrend.length} axisAverages=${view.axisAverages.length}`);
}

// 3: Repetition increases repeatedStructures
{
  let copy = createInitialCopywriterMemory();
  const s = stratOf('exhausted', 'tired parent at 3am', 'truth', 'wants real-rest', 'Emotional', calm);
  const baseline = copy.repeatedStructuresScore;
  for (let i = 0; i < 10; i++) {
    const c = composeCopy({ strategy: s, brutality: 0.65, memory: copy });
    copy = recordCopyOutput(copy, c, s, `b-rep-${i}`, 1000 + i);
  }
  const view = buildQualityLongitudinalView({ strategy: null, copywriter: copy, quality: null });
  check('3 · repetition increases repeatedStructures',
    view.repeatedStructuresCurrent > baseline,
    `baseline ${baseline} → after 10 repeats ${view.repeatedStructuresCurrent}/10`);
}

// 4: Forbidden triggers appear in ranking
{
  let copy = createInitialCopywriterMemory();
  const s = stratOf('exhausted', 'tired parent', 't', 'wants real-rest', 'Emotional', calm);
  const baseClean = composeCopy({ strategy: s, brutality: 0.65, memory: copy });
  // Manually craft a polluted output and record it.
  const polluted = {
    ...baseClean,
    hook: 'תעשה מהפך לחייך עכשיו!!',
    body: 'transform your life with this one trick',
    forbiddenPhrasesTriggered: ['תעשה מהפך', 'transform your life', 'this one trick', 'multiple-exclamations'],
  };
  copy = recordCopyOutput(copy, polluted, s, 'b-poll-1', 2000);
  copy = recordCopyOutput(copy, polluted, s, 'b-poll-2', 2001);
  const view = buildQualityLongitudinalView({ strategy: null, copywriter: copy, quality: null });
  check('4 · forbidden triggers appear in ranking',
    view.topForbiddenTriggers.length >= 3
      && view.topForbiddenTriggers[0].count >= 2,
    `top triggers: ${view.topForbiddenTriggers.map((t) => `${t.phrase}×${t.count}`).join(', ')}`);
}

// 5: Trust debt + brand dignity surfaced correctly
{
  let strat = createInitialAdStrategyMemory();
  // Push aggressive low-proof events to raise trustDebt + erode brandDignity.
  const aggrLow: CreativeDirection = { ...aggressive, productRole: 'hidden', ctaBehavior: 'corner', restraint: 0.1 };
  for (let i = 0; i < 6; i++) {
    const s = stratOf('exhausted', 'tired parent', 't', 'wants real-rest', 'Aggressive', aggrLow);
    strat = recordStrategyAssessment(strat, s, `b-deb-${i}`, 1000 + i);
  }
  const view = buildQualityLongitudinalView({ strategy: strat, copywriter: null, quality: null });
  check('5 · trust debt + brand dignity surface correctly',
    view.trustDebtCurrent > 0 && view.brandDignityCurrent <= 7,
    `trustDebtCurrent=${view.trustDebtCurrent}/10 brandDignityCurrent=${view.brandDignityCurrent}/10 status=${view.driftStatus}`);
}

// 7 (= the user's check 7 → TypeScript clean is verified separately;
// here we confirm the view itself stays inside type bounds across many
// quality samples)
{
  let strat   = createInitialAdStrategyMemory();
  let copy    = createInitialCopywriterMemory();
  let quality = createInitialCopyQualityMemory();
  for (let i = 0; i < 30; i++) {
    const s = stratOf('exhausted', 'tired parent at 3am', 'truth', 'wants real-rest', 'Emotional', calm);
    strat = recordStrategyAssessment(strat, s, `b-${i}`, 1000 + i);
    const c = composeCopy({ strategy: s, brutality: 0.65, memory: copy });
    copy = recordCopyOutput(copy, c, s, `b-${i}`, 1000 + i);
    const q = evaluateCopyQuality({ copywriter: c, strategy: s, brutality: 0.65 });
    const sample = axisToSample(q, `b-${i}`, 1000 + i);
    quality = {
      ...quality,
      samples: [...quality.samples, sample].slice(-48),
      totalSamples: quality.totalSamples + 1,
      firstUpdatedAt: quality.firstUpdatedAt ?? sample.at,
      updatedAt: sample.at,
    };
  }
  const view = buildQualityLongitudinalView({ strategy: strat, copywriter: copy, quality });
  const validRanges =
    view.trustDebtCurrent >= 0 && view.trustDebtCurrent <= 10
    && view.brandDignityCurrent >= 0 && view.brandDignityCurrent <= 10
    && view.mirrorSuccessRate >= 0 && view.mirrorSuccessRate <= 1
    && view.copyIntegrityTrend.every((p) => p.value >= 0 && p.value <= 10)
    && view.axisAverages.every((a) => a.averageRecent >= 0 && a.averageRecent <= 10);
  check('Extra · all view fields stay within bounds after 30 cycles',
    validRanges,
    `trustDebt=${view.trustDebtCurrent} mirrorRate=${view.mirrorSuccessRate} ` +
    `integrity-trend bounds=[${Math.min(...view.copyIntegrityTrend.map((p) => p.value)).toFixed(1)}, ` +
    `${Math.max(...view.copyIntegrityTrend.map((p) => p.value)).toFixed(1)}]`);
}

console.log(`\n${passed} passed · ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
