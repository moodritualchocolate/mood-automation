/**
 * scripts/test-reality-execution-wave.ts
 *
 * WAVE 2 — Reality Execution Architecture verification (Phases 28–35).
 *
 * Eight tests proving the system ACTS in reality without becoming an
 * engagement machine. Each test drives the Wave 2 modules directly
 * with a constructed scenario, so the checks are fast and
 * deterministic.
 *
 * Run with:  npx tsx scripts/test-reality-execution-wave.ts
 */

import type { BannerEngagement } from '@lib/engagementMemory';
import type { EmotionalTraceEntry } from '@lib/humanMemory';
import type { CreativeDirection, HumanState, HumanTruth } from '@/core/types';
import { readAudienceRealityFeedback } from '@lib/audienceRealityFeedback';
import { readAntiOptimization } from '@lib/antiOptimization';
import { weightRealityFeedback } from '@lib/realityFeedbackWeighting';
import { readSilentEngagementSignals } from '@lib/silentEngagementSignals';
import { readCommentRecognition } from '@lib/commentRecognitionParser';
import { readSaveShareMeaning } from '@lib/saveShareMeaning';
import { readEmotionalFatigue } from '@lib/emotionalFatigueMonitor';
import { readMotifDecay } from '@lib/motifDecay';
import { readProductGravity } from '@lib/productGravity';
import { readAttentionPhysics } from '@lib/attentionPhysics';
import { checkBrandTruth } from '@lib/brandTruthCore';
import { readToneIntegrity } from '@lib/toneIntegrity';
import { directAutonomousCreative } from '@lib/autonomousCreativeDirection';
import { readCampaignNervousSystem } from '@lib/campaignNervousSystem';
import { readEmotionalContinuityRuntime } from '@lib/emotionalContinuityRuntime';
import { readIdentityPersistence } from '@lib/identityPersistence';

// ── builders ────────────────────────────────────────────────────
function engagement(id: string, totals: Partial<BannerEngagement['totals']>, comments: string[] = []): BannerEngagement {
  const t = {
    impressions: 1000, saves: 0, shares: 0, pauses: 0, replays: 0, clicks: 0,
    comments: 0, emotionalComments: 0, negative: 0, watchSecTotal: 0, watchSecAvg: 0,
    negativeRatio: 0, ...totals,
  };
  return {
    bannerId: id,
    signals: comments.map((text, i) => ({ kind: 'comment' as const, text, ts: Date.now() - i })),
    totals: t,
    lastSignalAt: Date.now(),
    firstSignalAt: Date.now() - 86400000,
  };
}

function trace(family: string, truth: string, residue: string, i: number): EmotionalTraceEntry {
  return {
    bannerId: `b${i}`,
    createdAt: Date.now() - i * 3600000,
    stateId: `s-${family}`,
    family,
    truth,
    tension: 'wanting rest / fearing stillness',
    job: 'anti-ad',
    culturalMoment: null,
    reaction: { at_0_3s: 'recognition', at_1s: 'discomfort', at_3s: 'emotional tension' },
    engagement: 4,
    residue,
  };
}

const TRUTH: HumanTruth = {
  state: { id: 's', label: 's', family: 'fatigue', timeAnchor: null, setting: [], body: [], weight: 1 },
  truth: 'It is past midnight and the laptop is still open.',
  tension: 'wanting rest / fearing stillness',
  voice: 'observed',
  forbidden: [],
};
const STATE: HumanState = { id: 's', label: 's', family: 'fatigue', timeAnchor: null, setting: [], body: [], weight: 1 };
const DIRECTION: CreativeDirection = {
  hook: 'h', focalPoint: 'human-face', emotionalPacing: 'quiet', productRole: 'environmental',
  typographyDominance: 'whisper', ctaBehavior: 'quiet', layoutFamily: 'documentary-crop', restraint: 0.7,
};

function main() {
  console.log('\n WAVE 2 — Reality Execution Architecture verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── TEST 1: feedback influences next decisions ──────────────────
  {
    const deepFeedback = readAudienceRealityFeedback({
      engagements: [engagement('a', { saves: 90, replays: 40, emotionalComments: 20, comments: 22 },
        ['this is literally me', 'why is this so accurate', 'i felt this'])],
    });
    const shallowFeedback = readAudienceRealityFeedback({
      engagements: [engagement('b', { clicks: 200, comments: 80, shares: 60 },
        ['so aesthetic', 'obsessed', 'iconic vibes'])],
    });
    const trail = [trace('fatigue', 'a quiet truth', 'r', 1)];
    const nervous = readCampaignNervousSystem({ engagements: [], trail });
    const continuity = readEmotionalContinuityRuntime({ trail, candidateTruth: TRUTH, candidateFamily: 'fatigue', candidateMotifs: [] });
    const identity = readIdentityPersistence({ truth: TRUTH, direction: DIRECTION, emotionalCore: null, trail, recognition: 6, nonPerformative: 7, emergence: 7 });
    const antiOpt = readAntiOptimization({
      direction: DIRECTION, hookStrength: 6, aftertaste: 6, truthStrength: 7, attentionIsLoud: false,
      recognition: 6, engagementStrength: 6, engagementDepth: 6, viralContamination: 0,
      usesOverCirculatedVocab: false, commentPerformativeness: 3, trendContaminationFlagged: false,
    });
    const dirDeep = directAutonomousCreative({ state: STATE, trail, nervousSystem: nervous, continuity, feedback: deepFeedback, antiOptimization: antiOpt, identity });
    const dirShallow = directAutonomousCreative({ state: STATE, trail, nervousSystem: nervous, continuity, feedback: shallowFeedback, antiOptimization: antiOpt, identity });
    checks.push([
      'TEST 1 — feedback influences next decisions',
      dirDeep.campaignHypothesis.hypothesis !== dirShallow.campaignHypothesis.hypothesis,
      `deep-feedback and shallow-feedback produced different hypotheses`,
    ]);
  }

  // ── TEST 2: shallow high-engagement is blocked by anti-optimization
  {
    const antiOpt = readAntiOptimization({
      direction: { ...DIRECTION, typographyDominance: 'loud', restraint: 0.3 },
      hookStrength: 9, aftertaste: 3, truthStrength: 3, attentionIsLoud: true,
      recognition: 2, engagementStrength: 9, engagementDepth: 2, viralContamination: 6,
      usesOverCirculatedVocab: true, commentPerformativeness: 8, trendContaminationFlagged: true,
    });
    checks.push([
      'TEST 2 — anti-optimization blocks shallow high-engagement corruption',
      antiOpt.optimization_corrupts_truth,
      `optimization_corrupts_truth = ${antiOpt.optimization_corrupts_truth}; "${antiOpt.recommendedResistance}"`,
    ]);
  }

  // ── TEST 3: deep low-volume recognition is weighted highly ──────
  {
    const eng = [engagement('deep', { impressions: 300, saves: 38, replays: 20, emotionalComments: 12, comments: 14 },
      ['this is literally me', 'i thought i was the only one', 'too real'])];
    const silent = readSilentEngagementSignals({ engagements: eng });
    const comments = readCommentRecognition({ engagements: eng });
    const saveShare = readSaveShareMeaning({ engagements: eng });
    const weighted = weightRealityFeedback({ silent, comments, saveShare });
    checks.push([
      'TEST 3 — deep low-volume recognition is weighted highly',
      weighted.audience_recognised_itself && weighted.deep_engagement >= weighted.shallow_engagement,
      `deep ${weighted.deep_engagement}/10 vs shallow ${weighted.shallow_engagement}/10 — recognised itself: ${weighted.audience_recognised_itself}`,
    ]);
  }

  // ── TEST 4: repeated motif activates fatigue + motif decay ──────
  {
    const repeatedTrail: EmotionalTraceEntry[] = [];
    for (let i = 0; i < 8; i++) {
      repeatedTrail.push(trace('fatigue', 'the laptop is still open and the coffee is cold', 'the coffee went cold again', i));
    }
    const fatigue = readEmotionalFatigue({ trail: repeatedTrail });
    const decay = readMotifDecay({ trail: repeatedTrail, candidateMotifs: ['coffee', 'laptop'] });
    checks.push([
      'TEST 4 — repeated motif activates emotional fatigue + motif decay',
      fatigue.emotional_fatigue >= 4 && decay.motif_decay_detected,
      `emotional fatigue ${fatigue.emotional_fatigue}/10, motif decay detected: ${decay.motif_decay_detected}`,
    ]);
  }

  // ── TEST 5: identity persistence protects product role ──────────
  {
    const productHeavy: CreativeDirection = { ...DIRECTION, productRole: 'hand-held', restraint: 0.3 };
    const heavyComposition = {
      aspect: '4:5' as const,
      focal: { x: 0.3, y: 0.2, w: 0.4, h: 0.4 },
      productZone: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
      typoZones: { primary: { x: 0, y: 0, w: 1, h: 0.2 }, secondary: null, cta: { x: 0, y: 0.9, w: 1, h: 0.1 }, timestamp: null },
      safeZones: [], eyeFlow: [[0.5, 0.5]] as Array<[number, number]>, negativeSpaceBias: 'center' as const,
    };
    const productGravity = readProductGravity({ composition: heavyComposition, direction: productHeavy });
    checks.push([
      'TEST 5 — identity persistence / product gravity flags a pasted product-heavy frame',
      !productGravity.has_physical_logic || productGravity.pasted_risk >= 5,
      `product belongs ${productGravity.belongs_to_world}/10, pasted-risk ${productGravity.pasted_risk}/10`,
    ]);
  }

  // ── TEST 6: attention physics rejects loud-but-empty interruption
  {
    const loud = readAttentionPhysics({
      truth: { ...TRUTH, tension: '' },
      direction: { ...DIRECTION, typographyDominance: 'loud', restraint: 0.2 },
      composition: {
        aspect: '4:5', focal: { x: 0.4, y: 0.4, w: 0.2, h: 0.2 },
        productZone: { x: 0.2, y: 0.2, w: 0.6, h: 0.6 },
        typoZones: { primary: { x: 0, y: 0, w: 1, h: 0.3 }, secondary: null, cta: { x: 0, y: 0.9, w: 1, h: 0.1 }, timestamp: null },
        safeZones: [], eyeFlow: [[0.5, 0.5]], negativeSpaceBias: 'center',
      },
      psychology: null, gravity: null,
      at_0_3s: 'indifference', at_1s: 'indifference', at_3s: 'indifference',
    });
    checks.push([
      'TEST 6 — attention physics rejects loud-but-empty interruption',
      loud.attention_is_loud && !loud.attention_is_true,
      `attention_is_loud = ${loud.attention_is_loud}, attention_is_true = ${loud.attention_is_true}`,
    ]);
  }

  // ── TEST 7: brand truth core rejects generic wellness tone ──────
  {
    const wellnessTruth: HumanTruth = {
      ...TRUTH,
      truth: 'Treat yourself — this is your self-care moment to recharge and glow.',
    };
    const brand = checkBrandTruth({ truth: wellnessTruth });
    const tone = readToneIntegrity({ truth: wellnessTruth, direction: DIRECTION });
    checks.push([
      'TEST 7 — brand truth core rejects generic wellness tone',
      brand.violates_brand_truth && tone.generic_wellness_tone,
      `violated refusals: ${brand.violated_refusals.join(', ')}; tone violations: ${tone.violations.join(', ')}`,
    ]);
  }

  // ── TEST 8: autonomous creative direction produces a real decision
  {
    const trail = [trace('fatigue', 'a truth', 'r', 1), trace('pressure', 'another truth', 'r2', 2)];
    const nervous = readCampaignNervousSystem({ engagements: [], trail });
    const continuity = readEmotionalContinuityRuntime({ trail, candidateTruth: TRUTH, candidateFamily: 'numbness', candidateMotifs: ['phone'] });
    const feedback = readAudienceRealityFeedback({ engagements: [] });
    const antiOpt = readAntiOptimization({
      direction: DIRECTION, hookStrength: 6, aftertaste: 6, truthStrength: 7, attentionIsLoud: false,
      recognition: 6, engagementStrength: 6, engagementDepth: 6, viralContamination: 0,
      usesOverCirculatedVocab: false, commentPerformativeness: 3, trendContaminationFlagged: false,
    });
    const identity = readIdentityPersistence({ truth: TRUTH, direction: DIRECTION, emotionalCore: null, trail, recognition: 6, nonPerformative: 7, emergence: 7 });
    const dir = directAutonomousCreative({ state: { ...STATE, family: 'numbness' }, trail, nervousSystem: nervous, continuity, feedback, antiOptimization: antiOpt, identity });
    const hasAll =
      dir.campaignHypothesis.hypothesis.length > 0 &&
      dir.doNotDoList.length > 0 &&
      dir.nextCreativeMove.length > 0 &&
      dir.creativeDirectorMemo.length > 0 &&
      dir.is_a_real_decision;
    checks.push([
      'TEST 8 — autonomous creative direction produces a real decision',
      hasAll,
      `hypothesis + ${dir.rejectedTerritories.length} rejected territories + ${dir.doNotDoList.length} do-not-do items + next move`,
    ]);
  }

  // ── report ──────────────────────────────────────────────────────
  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
    console.log(`        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} tests passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 2 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 2 VERIFIED — the system acts in reality, protects truth, and resists corruption.\n');
}

main();
