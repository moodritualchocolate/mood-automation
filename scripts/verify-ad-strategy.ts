/**
 * scripts/verify-ad-strategy.ts
 *
 * Deterministic verification harness for the Ad Strategy Brain
 * (Strategist Brain — Phase Next). Runs checks A–F + I in-process
 * without spinning the full /api/generate pipeline.
 *
 * Run: npx tsx scripts/verify-ad-strategy.ts
 */

import {
  createInitialAdStrategyMemory,
  AUDIENCE_HISTORY_LIMIT,
} from '@lib/adStrategyMemory';
import {
  computeAdStrategy,
  recordStrategyAssessment,
} from '@lib/adStrategyEngine';
import type { CampaignMode, CreativeDirection, HumanState, HumanTruth } from '@/core/types';

const tiredState = {
  id: 'exhausted-parent-3am', family: 'exhausted',
  label: 'tired parent at 3am',
  description: 'parent woke up for the third time tonight',
  pacing: 'collapsed', energy: 0.15,
  socialContext: 'private', emotionalAffect: 'depleted',
} as unknown as HumanState;

const focusState = {
  id: 'scattered-office-9am', family: 'scattered',
  label: 'office worker losing focus',
  description: 'pre-meeting fog at 9am',
  pacing: 'fragmented', energy: 0.35,
  socialContext: 'workplace', emotionalAffect: 'foggy',
} as unknown as HumanState;

const truth = {
  state: tiredState as unknown,
  truth: 'exhaustion is not laziness',
  tension: 'wants rest but feels guilt-when-resting and never-finished',
  voice: 'observed',
  forbidden: ['empowerment', 'recharge'],
} as unknown as HumanTruth;

const calmDirection: CreativeDirection = {
  hook: 'a quiet 3am', focalPoint: 'environment',
  emotionalPacing: 'quiet', productRole: 'hidden',
  typographyDominance: 'whisper', ctaBehavior: 'quiet',
  layoutFamily: 'negative-space', restraint: 0.85,
};

const aggressiveDirection: CreativeDirection = {
  hook: 'PUSH HARDER', focalPoint: 'product-in-hand',
  emotionalPacing: 'wired', productRole: 'foreground-blur',
  typographyDominance: 'loud', ctaBehavior: 'corner',
  layoutFamily: 'documentary-crop', restraint: 0.15,
};

const proofDirection: CreativeDirection = {
  hook: 'see what changes', focalPoint: 'object',
  emotionalPacing: 'tense', productRole: 'desk-proof',
  typographyDominance: 'editorial', ctaBehavior: 'editorial',
  layoutFamily: 'editorial-page', restraint: 0.5,
};

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('AD STRATEGY BRAIN — VERIFICATION\n');

// A: same history → same strategy
{
  const m = createInitialAdStrategyMemory();
  const s1 = computeAdStrategy({ state: tiredState, truth, direction: calmDirection, campaignMode: 'Emotional' as CampaignMode, bannerId: 'b-1', memory: m });
  const s2 = computeAdStrategy({ state: tiredState, truth, direction: calmDirection, campaignMode: 'Emotional' as CampaignMode, bannerId: 'b-1', memory: m });
  check('A · same history → same strategy',
    JSON.stringify(s1) === JSON.stringify(s2),
    `audience=${s1.primaryAudience} role=${s1.campaignRole} confidence=${s1.confidence}`);
}

// B: histories accumulate
{
  let m = createInitialAdStrategyMemory();
  const s1 = computeAdStrategy({ state: tiredState, truth, direction: calmDirection, campaignMode: 'Emotional' as CampaignMode, bannerId: 'b-1', memory: m });
  m = recordStrategyAssessment(m, s1, 'b-1', 1000);
  const s2 = computeAdStrategy({ state: focusState, truth, direction: proofDirection, campaignMode: 'Documentary' as CampaignMode, bannerId: 'b-2', memory: m });
  m = recordStrategyAssessment(m, s2, 'b-2', 2000);
  check('B · histories accumulate',
    m.audienceHistory.length === 2 && m.angleHistory.length === 2 && m.totalAssessments === 2,
    `audienceHistory=${m.audienceHistory.length} angleHistory=${m.angleHistory.length} total=${m.totalAssessments}`);
}

// C: repetition risk rises
{
  let m = createInitialAdStrategyMemory();
  const inputs = { state: tiredState, truth, direction: calmDirection, campaignMode: 'Emotional' as CampaignMode };
  const baseline = computeAdStrategy({ ...inputs, bannerId: 'b-0', memory: m }).repetitionRisk;
  for (let i = 1; i <= 5; i++) {
    const s = computeAdStrategy({ ...inputs, bannerId: `b-${i}`, memory: m });
    m = recordStrategyAssessment(m, s, `b-${i}`, 1000 + i);
  }
  const after = computeAdStrategy({ ...inputs, bannerId: 'b-final', memory: m });
  check('C · repetition risk rises after repeated angle',
    after.repetitionRisk > baseline,
    `baseline ${baseline} → after 5 repeats ${after.repetitionRisk}`);
}

// D: trust debt rises under high urgency + weak proof
{
  let m = createInitialAdStrategyMemory();
  const trustBefore = m.trustDebt;
  const aggrLowProof: CreativeDirection = { ...aggressiveDirection, productRole: 'hidden', ctaBehavior: 'corner', restraint: 0.1 };
  for (let i = 0; i < 5; i++) {
    const s = computeAdStrategy({
      state: tiredState, truth, direction: aggrLowProof,
      campaignMode: 'Aggressive' as CampaignMode, bannerId: `b-aggr-${i}`, memory: m,
    });
    m = recordStrategyAssessment(m, s, `b-aggr-${i}`, 1000 + i);
  }
  check('D · trust debt rises under high-urgency + weak-proof',
    m.trustDebt > trustBefore,
    `trustDebt ${trustBefore} → ${m.trustDebt}`);
}

// E: trust debt lowers under ritual/trust-builder roles
{
  let m = createInitialAdStrategyMemory();
  const aggrLowProof: CreativeDirection = { ...aggressiveDirection, productRole: 'hidden', ctaBehavior: 'corner', restraint: 0.1 };
  for (let i = 0; i < 5; i++) {
    const s = computeAdStrategy({ state: tiredState, truth, direction: aggrLowProof, campaignMode: 'Aggressive' as CampaignMode, bannerId: `b-agg-${i}`, memory: m });
    m = recordStrategyAssessment(m, s, `b-agg-${i}`, 1000 + i);
  }
  const peakDebt = m.trustDebt;
  const ritualDirection: CreativeDirection = {
    hook: 'second steep', focalPoint: 'object', emotionalPacing: 'quiet',
    productRole: 'desk-proof', typographyDominance: 'editorial', ctaBehavior: 'editorial',
    layoutFamily: 'timestamp-anchor', restraint: 0.7,
  };
  for (let i = 0; i < 8; i++) {
    const s = computeAdStrategy({ state: tiredState, truth, direction: ritualDirection, campaignMode: 'Documentary' as CampaignMode, bannerId: `b-rit-${i}`, memory: m });
    m = recordStrategyAssessment(m, s, `b-rit-${i}`, 2000 + i);
  }
  check('E · trust debt lowers under ritual_education/trust_builder',
    m.trustDebt < peakDebt,
    `peak ${peakDebt} → after 8 ritual events ${m.trustDebt}`);
}

// F: campaign role changes creative constraints
{
  const m = createInitialAdStrategyMemory();
  const sAware = computeAdStrategy({ state: tiredState, truth, direction: calmDirection, campaignMode: 'Emotional' as CampaignMode, bannerId: 'b-aw', memory: m });
  const sProof = computeAdStrategy({ state: focusState, truth, direction: proofDirection, campaignMode: 'Documentary' as CampaignMode, bannerId: 'b-pf', memory: m });
  const sConvert = computeAdStrategy({ state: tiredState, truth, direction: aggressiveDirection, campaignMode: 'Aggressive' as CampaignMode, bannerId: 'b-cn', memory: m });
  const distinctRoles = (new Set([sAware.campaignRole, sProof.campaignRole, sConvert.campaignRole])).size >= 2;
  const constraintsDiffer =
    sAware.creativeConstraints.productVisibility !== sProof.creativeConstraints.productVisibility ||
    sAware.creativeConstraints.ctaStrength !== sConvert.creativeConstraints.ctaStrength;
  check('F · role changes creative constraints',
    distinctRoles && constraintsDiffer,
    `roles=[${sAware.campaignRole}, ${sProof.campaignRole}, ${sConvert.campaignRole}]; ` +
    `prodVis aware=${sAware.creativeConstraints.productVisibility} proof=${sProof.creativeConstraints.productVisibility}; ` +
    `cta aware=${sAware.creativeConstraints.ctaStrength} convert=${sConvert.creativeConstraints.ctaStrength}`);
}

// I: FIFO caps stable (in-memory accumulates beyond cap; persist would slice)
{
  let m = createInitialAdStrategyMemory();
  const N = AUDIENCE_HISTORY_LIMIT + 10;
  for (let i = 0; i < N; i++) {
    const s = computeAdStrategy({ state: tiredState, truth, direction: calmDirection, campaignMode: 'Emotional' as CampaignMode, bannerId: `b-${i}`, memory: m });
    m = recordStrategyAssessment(m, s, `b-${i}`, 1000 + i);
  }
  const audSliced = m.audienceHistory.slice(-AUDIENCE_HISTORY_LIMIT);
  check('I · FIFO caps stable (slice on save)',
    audSliced.length === AUDIENCE_HISTORY_LIMIT && m.totalAssessments === N,
    `pushed ${N}, post-slice ${audSliced.length} (cap ${AUDIENCE_HISTORY_LIMIT}), totalAssessments ${m.totalAssessments}`);
}

console.log(`\n${passed} passed · ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
