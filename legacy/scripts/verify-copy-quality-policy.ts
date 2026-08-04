/**
 * scripts/verify-copy-quality-policy.ts
 *
 * Deterministic verification for the advisory copy-quality policy
 * layer. Drives `computeCopyQualityPolicy` across the matrix.
 *
 * Run: npx tsx scripts/verify-copy-quality-policy.ts
 */

import { createInitialAdStrategyMemory } from '@lib/adStrategyMemory';
import type { AdStrategyAssessment } from '@lib/adStrategyEngine';
import type { CopyQualityAxis } from '@lib/copyQualityAdapter';
import { computeCopyQualityPolicy } from '@lib/copyQualityPolicy';
import type { CampaignMode } from '@/core/types';

function strat(overrides: Partial<AdStrategyAssessment> = {}): AdStrategyAssessment {
  // Minimal viable strategy assessment for policy scoring.
  return {
    primaryAudience: 'tired_parent',
    secondaryAudience: null,
    emotionalWound: 'interrupted-sleep',
    hiddenDesire: 'real-rest',
    surfaceObjection: 'no-time',
    deeperObjection: 'guilt-blocks-acceptance',
    trustBarrier: 'guilt-blocks-acceptance',
    campaignRole: 'awareness',
    recommendedAngle: '[tired_parent/awareness] interrupted-sleep → real-rest via mirror (empathic)',
    forbiddenAngle: 'perfect-mother-aesthetic',
    persuasionMode: 'empathic',
    storyShape: 'mirror',
    proofNeed: 'low',
    urgencyLevel: 3,
    repetitionRisk: 0,
    brandRisk: 1,
    trustDebt: 0,
    strategicDepth: 6,
    confidence: 8,
    reasonCodes: [],
    creativeConstraints: {
      hookIntensity: 5, productVisibility: 3, textAmount: 'minimal',
      ctaStrength: 2, emotionalDirectness: 6, proofRequirement: 'low',
      criticStrictnessRecommendation: 'baseline',
    },
    ...overrides,
  } as AdStrategyAssessment;
}

function quality(integrity = 8): CopyQualityAxis {
  return {
    copyIntegrity: integrity,
    trustSafety: 8, dignitySafety: 8, repetitionConcern: 2,
    proofAdequacy: 9, ctaRestraint: 8, hebrewNaturalness: 9, strategicCopyFit: 9,
    warnings: [], reasonCodes: [],
  };
}

const fatigueMem = (heavyAudiences: number) => {
  const m = createInitialAdStrategyMemory();
  const audiences = Object.keys(m.audienceFatigue) as (keyof typeof m.audienceFatigue)[];
  for (let i = 0; i < Math.min(heavyAudiences, audiences.length); i++) {
    m.audienceFatigue[audiences[i]] = { ...m.audienceFatigue[audiences[i]], usageCount: 10, recency: 0.9 };
  }
  return m;
};

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('COPY-QUALITY POLICY — VERIFICATION\n');

// A: Same inputs → same policy (deterministic)
{
  const inputs = {
    formula: 'ENERGY' as const,
    campaignMode: 'Documentary' as CampaignMode,
    brutality: 0.9,
    strategy: strat({ proofNeed: 'high', trustDebt: 6, campaignRole: 'trust_builder' }),
    strategyMemory: createInitialAdStrategyMemory(),
    copyQuality: quality(),
  };
  const r1 = computeCopyQualityPolicy(inputs);
  const r2 = computeCopyQualityPolicy(inputs);
  check('A · same inputs → same policy',
    JSON.stringify(r1) === JSON.stringify(r2),
    `band=${r1.policyBand} confidence=${r1.confidence} enabled=${r1.recommendedEnabled}`);
}

// B: Emotional + low debt → off/observe
{
  const r = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Emotional',
    brutality: 0.9,
    strategy: strat({ trustDebt: 0, proofNeed: 'low' }),
    strategyMemory: createInitialAdStrategyMemory(),
    copyQuality: quality(),
  });
  check('B · Emotional + low debt → off/observe',
    r.policyBand === 'off' || r.policyBand === 'observe',
    `band=${r.policyBand} recommendedEnabled=${r.recommendedEnabled}`);
}

// C: Documentary + high proofNeed + high debt → warn/strict
{
  const r = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Documentary',
    brutality: 0.9,
    strategy: strat({ proofNeed: 'high', trustDebt: 7, campaignRole: 'trust_builder' }),
    strategyMemory: createInitialAdStrategyMemory(),
    copyQuality: quality(),
  });
  check('C · Documentary + high proofNeed + high debt → warn/strict',
    r.policyBand === 'warn' || r.policyBand === 'strict',
    `band=${r.policyBand} recommendedEnabled=${r.recommendedEnabled}`);
}

// D: Brutality < 0.8 never strict
{
  const r1 = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Documentary',
    brutality: 0.5,
    strategy: strat({ proofNeed: 'high', trustDebt: 8, campaignRole: 'trust_builder' }),
    strategyMemory: createInitialAdStrategyMemory(),
    copyQuality: quality(2),
  });
  const r2 = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Product-focused',
    brutality: 0.79,
    strategy: strat({ proofNeed: 'high', trustDebt: 9, campaignRole: 'product_proof' }),
    strategyMemory: createInitialAdStrategyMemory(),
    copyQuality: quality(2),
  });
  check('D · brutality < 0.8 never strict (caps to warn)',
    r1.policyBand !== 'strict' && r2.policyBand !== 'strict',
    `0.5 brutality → ${r1.policyBand}; 0.79 brutality → ${r2.policyBand}`);
}

// E: High fatigue alone does NOT force strict
{
  const r = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Emotional',
    brutality: 0.9,
    strategy: strat({ trustDebt: 0, proofNeed: 'low' }),
    strategyMemory: fatigueMem(3),    // 3 heavily-used audiences
    copyQuality: quality(),
  });
  check('E · high audience fatigue alone does not force strict',
    r.policyBand !== 'strict',
    `band=${r.policyBand} (fatigue bumps observe/warn only, not strict)`);
}

// Extra: clean state (high dignity + low debt) → strongly off
{
  const mem = createInitialAdStrategyMemory();
  mem.brandDignityScore = 9;
  const r = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Minimal',
    brutality: 0.9,
    strategy: strat({ trustDebt: 0, proofNeed: 'low' }),
    strategyMemory: mem,
    copyQuality: quality(),
  });
  check('Extra · clean brand state (dignity 9 + debt 0) → off',
    r.policyBand === 'off' && !r.recommendedEnabled,
    `band=${r.policyBand} confidence=${r.confidence}`);
}

// Extra 2: suggested thresholds match phase contract
{
  const strictRun = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Documentary',
    brutality: 0.9,
    strategy: strat({ proofNeed: 'high', trustDebt: 8, campaignRole: 'product_proof' }),
    strategyMemory: createInitialAdStrategyMemory(),
    copyQuality: quality(3),
  });
  const warnRun = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Editorial',
    brutality: 0.9,
    strategy: strat({ proofNeed: 'medium', trustDebt: 4, campaignRole: 'awareness' }),
    strategyMemory: createInitialAdStrategyMemory(),
    copyQuality: quality(),
  });
  const offRun = computeCopyQualityPolicy({
    formula: 'ENERGY',
    campaignMode: 'Emotional',
    brutality: 0.9,
    strategy: strat({ trustDebt: 0 }),
    strategyMemory: createInitialAdStrategyMemory(),
    copyQuality: quality(),
  });
  const strictThresholdsOK = strictRun.policyBand !== 'strict'
    || (strictRun.suggestedIntegrityThreshold === 4.0 && strictRun.suggestedBrutalityThreshold === 0.80);
  const warnThresholdsOK = warnRun.policyBand !== 'warn'
    || (warnRun.suggestedIntegrityThreshold === 5.5 && warnRun.suggestedBrutalityThreshold === 0.85);
  const offThresholdsOK = offRun.suggestedIntegrityThreshold === 0 && offRun.suggestedBrutalityThreshold === 0;
  check('Extra · suggested thresholds match contract per band',
    strictThresholdsOK && warnThresholdsOK && offThresholdsOK,
    `strict(${strictRun.policyBand}): integ=${strictRun.suggestedIntegrityThreshold} brut=${strictRun.suggestedBrutalityThreshold} | ` +
    `warn(${warnRun.policyBand}): integ=${warnRun.suggestedIntegrityThreshold} brut=${warnRun.suggestedBrutalityThreshold} | ` +
    `off(${offRun.policyBand}): integ=${offRun.suggestedIntegrityThreshold} brut=${offRun.suggestedBrutalityThreshold}`);
}

console.log(`\n${passed} passed · ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
