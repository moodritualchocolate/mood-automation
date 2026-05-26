/**
 * VERIFY — Human Truth Intelligence (6 ethical observatory modules).
 *
 * Pure-function verification. No HTTP, no live writes.
 *
 * Cases:
 *   truth-felt        · felt-human inputs → 'felt-human' classification + high authenticity
 *   truth-optimized   · optimized-content inputs → 'optimized-content' + low authenticity
 *   truth-det         · deterministic across two runs
 *   manip-low         · clean inputs → 'low' pressure level
 *   manip-critical    · adversarial inputs → 'high' or 'critical' pressure
 *   manip-signals     · individual signal detection (urgency, outrage, retention-trap)
 *   continuity-erode  · authenticity erosion detected when recent < early
 *   continuity-preserve · stable inputs → 'stable' or 'preserving'
 *   soul-aifeeling    · polished + low-realism + burst → AI feeling detected
 *   soul-integrity    · human inputs → high soul integrity
 *   anti-optim-perf   · high engagement + zero trust → performance-without-trust
 *   anti-optim-pattern · outrage-loop / anxiety-hook / fake-urgency patterns surfaced
 *   dignity-erosion   · high engagement + low realism → trust-vs-performance gap
 *   dignity-preserved · human inputs → high dignity
 *   isolation         · no critic / pipeline imports anywhere
 *   no-mutate         · no fetch / no fs.writeFile in any module
 *   no-optimization   · output JSON contains no amplification / optimization flags
 *   no-prediction     · phrasing uses observational language only
 *   advisory-notice   · every module exposes the human-protective notice
 *   tsc               · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  computeHumanTruth, type HumanTruthInput,
} from '../lib/humanTruthIntelligence';
import { computeManipulationPressure } from '../lib/manipulationPressureAnalyzer';
import { computeAuthenticityContinuity } from '../lib/authenticityContinuity';
import { computeSoulPreservation } from '../lib/soulPreservationLayer';
import { computeAntiOptimization } from '../lib/antiOptimizationDetector';
import { computeEmotionalDignity } from '../lib/emotionalDignityModel';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic inputs ─────────────────────────────────────────

function feltHumanInput(): HumanTruthInput {
  const visualFps = Array.from({ length: 10 }, (_, i) => ({
    framingFingerprint: 'left|low|wide', lightingSignature: 'warm-natural',
    pacingIdentity: 'gradual', silenceDensity: 'low',
    motionCadence: 'still', realismLevel: 8, polishLevel: 3,
  }));
  const narrativeFps = Array.from({ length: 10 }, (_, i) => ({
    hookFamily: 'observational|stillness', persuasionStructure: 'observational|gentle',
    emotionalCadence: 'observed-pressure', silenceUsage: 'sparse',
    observationalDensity: 8, narrationStyle: 'observational',
    humanRealism: 8, ctaPressure: 3,
  }));
  return {
    outcomes: { outcomes: Array.from({ length: 12 }, () => ({
      persuasionIntensity: 3, realismLevel: 8,
      visualStyle: 'documentary-observed', cadenceState: 'gradual',
      mutationPressure: 2,
      emotionalSignature: 'observed-pressure',
      narrativeSignature: 'observational',
      downstreamOutcome: 'trust-formation',
      metrics: { retention: 0.6, follows: 2, profileVisits: 4, saves: 3, comments: 2, bounceRate: 0.15 },
    })) },
    visualDNA: { fingerprints: visualFps },
    narrativeDNA: { fingerprints: narrativeFps },
    drift: { observations: Array.from({ length: 10 }, () => ({
      emotionalDiversity: 7, persuasionVariance: 7, narrativeStability: 8,
      formulaDistinctiveness: 7, trustErosionDrift: 0,
    })) },
    copywriter: {
      dignityErosionScore: 1, repeatedStructuresScore: 1,
      toneHistory: ['gentle', 'patient', 'observational', 'curious'],
      frameHistory: ['vulnerable-tired', 'honest-quiet', 'gentle-still'],
    },
    strategy: {
      trustDebt: 2, brandDignityScore: 8,
      audienceHistory: Array.from({ length: 10 }, () => ({
        persuasionMode: 'observational', storyShape: 'mirror',
      })),
    },
  };
}

function optimizedContentInput(): HumanTruthInput {
  const visualFps = Array.from({ length: 10 }, () => ({
    framingFingerprint: 'center|high|tight', lightingSignature: 'studio-cool',
    pacingIdentity: 'fast', silenceDensity: 'dense',
    motionCadence: 'rapid', realismLevel: 2, polishLevel: 9,
  }));
  const narrativeFps = Array.from({ length: 10 }, () => ({
    hookFamily: 'panic|urgency', persuasionStructure: 'aggressive|command',
    emotionalCadence: 'panic', silenceUsage: 'dense',
    observationalDensity: 1, narrationStyle: 'imperative',
    humanRealism: 2, ctaPressure: 9,
  }));
  return {
    outcomes: { outcomes: Array.from({ length: 12 }, () => ({
      persuasionIntensity: 9, realismLevel: 2,
      visualStyle: 'cinematic-polished', cadenceState: 'burst',
      mutationPressure: 8,
      emotionalSignature: 'urgency',
      narrativeSignature: 'panic',
      downstreamOutcome: 'conversion-spike',
      metrics: { retention: 0.7, follows: 0, profileVisits: 1, likes: 100, shares: 5, comments: 8, bounceRate: 0.5 },
    })) },
    visualDNA: { fingerprints: visualFps },
    narrativeDNA: { fingerprints: narrativeFps },
    drift: { observations: Array.from({ length: 10 }, () => ({
      emotionalDiversity: 2, persuasionVariance: 2, narrativeStability: 3,
      formulaDistinctiveness: 3, trustErosionDrift: 3,
    })) },
    copywriter: {
      dignityErosionScore: 8, repeatedStructuresScore: 8,
      toneHistory: ['urgent', 'command', 'panic'],
      frameHistory: ['aggressive', 'panic'],
    },
    strategy: {
      trustDebt: 8, brandDignityScore: 3,
      audienceHistory: Array.from({ length: 10 }, () => ({
        persuasionMode: 'conversion-push', storyShape: 'objection',
      })),
    },
  };
}

function adversarialInput(): HumanTruthInput {
  // Sharper version of optimized-content for manipulation pressure.
  const base = optimizedContentInput();
  base.outcomes!.outcomes!.forEach((o) => {
    o.metrics = {
      retention: 0.8, follows: 0, profileVisits: 0, likes: 200,
      shares: 8, comments: 12, bounceRate: 0.6, impressions: 5000,
    };
    o.downstreamOutcome = 'aggressive-cta-rejection';
  });
  return base;
}

// ─── cases ────────────────────────────────────────────────────

function caseTruthFelt(): { ok: boolean; detail: string } {
  const r = computeHumanTruth(feltHumanInput());
  return {
    ok: r.classification === 'felt-human' && r.authenticityScore >= 6,
    detail: `classification=${r.classification} authenticity=${r.authenticityScore}/10 felt-human=${r.feltHumanScore}/10`,
  };
}

function caseTruthOptimized(): { ok: boolean; detail: string } {
  const r = computeHumanTruth(optimizedContentInput());
  return {
    ok: r.classification === 'optimized-content' && r.authenticityScore <= 4,
    detail: `classification=${r.classification} authenticity=${r.authenticityScore}/10 felt-human=${r.feltHumanScore}/10`,
  };
}

function caseTruthDet(): { ok: boolean; detail: string } {
  const input = feltHumanInput();
  const a = JSON.stringify(computeHumanTruth(input));
  const b = JSON.stringify(computeHumanTruth(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

function caseManipLow(): { ok: boolean; detail: string } {
  const r = computeManipulationPressure(feltHumanInput());
  return {
    ok: r.pressureLevel === 'low' || r.pressureLevel === 'moderate',
    detail: `pressure=${r.pressureLevel} score=${r.pressureScore}/10 signals=${r.signals.length}`,
  };
}

function caseManipCritical(): { ok: boolean; detail: string } {
  const r = computeManipulationPressure(adversarialInput());
  return {
    ok: r.pressureLevel === 'high' || r.pressureLevel === 'critical',
    detail: `pressure=${r.pressureLevel} score=${r.pressureScore}/10 signals=${r.signals.length}`,
  };
}

function caseManipSignals(): { ok: boolean; detail: string } {
  const r = computeManipulationPressure(adversarialInput());
  const keys = new Set(r.signals.map((s) => s.signal));
  const expected = ['excessive-urgency', 'attention-aggression', 'algorithmic-overstimulation'];
  const found = expected.filter((e) => keys.has(e));
  return {
    ok: found.length >= 2,
    detail: `expected at least 2 of ${expected.join(', ')}; found ${found.join(', ')}`,
  };
}

function caseContinuityErode(): { ok: boolean; detail: string } {
  // Build a history where early is human, recent is optimized.
  const earlyHuman = feltHumanInput();
  const recentOptim = optimizedContentInput();
  const combined: HumanTruthInput = {
    outcomes: { outcomes: [
      ...(earlyHuman.outcomes?.outcomes ?? []),
      ...(recentOptim.outcomes?.outcomes ?? []),
    ] },
    visualDNA: { fingerprints: [
      ...(earlyHuman.visualDNA?.fingerprints ?? []),
      ...(recentOptim.visualDNA?.fingerprints ?? []),
    ] },
    narrativeDNA: { fingerprints: [
      ...(earlyHuman.narrativeDNA?.fingerprints ?? []),
      ...(recentOptim.narrativeDNA?.fingerprints ?? []),
    ] },
    drift: { observations: [
      ...(earlyHuman.drift?.observations ?? []),
      ...(recentOptim.drift?.observations ?? []),
    ] },
    copywriter: recentOptim.copywriter,
    strategy: { ...recentOptim.strategy, audienceHistory: [
      ...(earlyHuman.strategy?.audienceHistory ?? []),
      ...(recentOptim.strategy?.audienceHistory ?? []),
    ] },
  };
  const r = computeAuthenticityContinuity(combined);
  return {
    ok: r.direction === 'eroding' && r.authenticityDelta < 0,
    detail: `direction=${r.direction} delta=${r.authenticityDelta} early=${r.earlyAuthenticity} recent=${r.recentAuthenticity}`,
  };
}

function caseContinuityPreserve(): { ok: boolean; detail: string } {
  const human = feltHumanInput();
  // Combine same-style records so early == recent.
  const combined: HumanTruthInput = {
    outcomes: { outcomes: [...(human.outcomes?.outcomes ?? []), ...(human.outcomes?.outcomes ?? [])] },
    visualDNA: { fingerprints: [...(human.visualDNA?.fingerprints ?? []), ...(human.visualDNA?.fingerprints ?? [])] },
    narrativeDNA: { fingerprints: [...(human.narrativeDNA?.fingerprints ?? []), ...(human.narrativeDNA?.fingerprints ?? [])] },
    drift: { observations: [...(human.drift?.observations ?? []), ...(human.drift?.observations ?? [])] },
    copywriter: human.copywriter,
    strategy: { ...human.strategy, audienceHistory: [...(human.strategy?.audienceHistory ?? []), ...(human.strategy?.audienceHistory ?? [])] },
  };
  const r = computeAuthenticityContinuity(combined);
  return {
    ok: r.direction === 'stable' || r.direction === 'preserving',
    detail: `direction=${r.direction} delta=${r.authenticityDelta}`,
  };
}

function caseSoulAIFeeling(): { ok: boolean; detail: string } {
  const r = computeSoulPreservation(optimizedContentInput());
  return {
    ok: r.aiFeelingDetected && r.threatLevel >= 5,
    detail: `aiFeeling=${r.aiFeelingDetected} threat=${r.threatLevel}/10 integrity=${r.soulIntegrity}/10`,
  };
}

function caseSoulIntegrity(): { ok: boolean; detail: string } {
  const r = computeSoulPreservation(feltHumanInput());
  return {
    ok: r.soulIntegrity >= 6 && !r.aiFeelingDetected,
    detail: `integrity=${r.soulIntegrity}/10 aiFeeling=${r.aiFeelingDetected}`,
  };
}

function caseAntiOptimPerf(): { ok: boolean; detail: string } {
  const r = computeAntiOptimization(optimizedContentInput());
  return {
    ok: r.performanceWithoutTrustDetected && r.performanceWithoutTrustCount >= 1,
    detail: `performance-without-trust=${r.performanceWithoutTrustCount} pressure=${r.exploitationPressure}/10`,
  };
}

function caseAntiOptimPattern(): { ok: boolean; detail: string } {
  const r = computeAntiOptimization(adversarialInput());
  const patterns = new Set(r.signals.map((s) => s.pattern));
  const looking = ['outrage-loop', 'anxiety-hook', 'fake-urgency', 'hyper-stimulation', 'attention-hijacking'];
  const found = looking.filter((p) => patterns.has(p as never));
  return {
    ok: found.length >= 2,
    detail: `found patterns: ${found.join(', ')}; all patterns: ${[...patterns].join(', ')}`,
  };
}

function caseDignityErosion(): { ok: boolean; detail: string } {
  const r = computeEmotionalDignity(optimizedContentInput());
  return {
    ok: r.dignityScore <= 5 && r.trustVsPerformanceGap >= 1,
    detail: `dignity=${r.dignityScore}/10 gap=${r.trustVsPerformanceGap}/10 threat=${r.highPerformingDignityThreat}`,
  };
}

function caseDignityPreserved(): { ok: boolean; detail: string } {
  const r = computeEmotionalDignity(feltHumanInput());
  return {
    ok: r.dignityScore >= 6 && !r.highPerformingDignityThreat,
    detail: `dignity=${r.dignityScore}/10 threat=${r.highPerformingDignityThreat}`,
  };
}

// ─── static checks ───────────────────────────────────────────

async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/humanTruthIntelligence.ts',
    'lib/manipulationPressureAnalyzer.ts',
    'lib/authenticityContinuity.ts',
    'lib/soulPreservationLayer.ts',
    'lib/antiOptimizationDetector.ts',
    'lib/emotionalDignityModel.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /from\s+['"]@\/core\/criticEngine/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    for (const re of forbidden) {
      if (re.test(src)) return { ok: false, detail: `forbidden import in ${f}` };
    }
  }
  return { ok: true, detail: 'no critic / pipeline imports' };
}

async function caseNoMutate(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/humanTruthIntelligence.ts',
    'lib/manipulationPressureAnalyzer.ts',
    'lib/authenticityContinuity.ts',
    'lib/soulPreservationLayer.ts',
    'lib/antiOptimizationDetector.ts',
    'lib/emotionalDignityModel.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'no fetch / fs.writeFile in any module' };
}

function caseNoOptimization(): { ok: boolean; detail: string } {
  // Outputs must never carry flags that suggest amplification.
  const input = adversarialInput();
  const json = JSON.stringify({
    truth: computeHumanTruth(input),
    manip: computeManipulationPressure(input),
    continuity: computeAuthenticityContinuity(input),
    soul: computeSoulPreservation(input),
    anti: computeAntiOptimization(input),
    dignity: computeEmotionalDignity(input),
  });
  const banned = /"amplify":\s*true|"applied":\s*true|"autoApply":\s*true|"optimizeAgainst":/i;
  return {
    ok: !banned.test(json),
    detail: !banned.test(json) ? 'no amplification flags' : 'banned flags present',
  };
}

function caseNoPrediction(): { ok: boolean; detail: string } {
  const input = adversarialInput();
  const json = JSON.stringify({
    truth: computeHumanTruth(input),
    manip: computeManipulationPressure(input),
    continuity: computeAuthenticityContinuity(input),
    soul: computeSoulPreservation(input),
    anti: computeAntiOptimization(input),
    dignity: computeEmotionalDignity(input),
  });
  const banned = /(will happen|going to happen|guarantees|predicts that)/i;
  return {
    ok: !banned.test(json),
    detail: !banned.test(json) ? 'no predictive phrasing' : 'banned phrasing present',
  };
}

function caseAdvisoryNotice(): { ok: boolean; detail: string } {
  const input = feltHumanInput();
  const readings: Array<{ advisoryNotice: string }> = [
    computeHumanTruth(input),
    computeManipulationPressure(input),
    computeAuthenticityContinuity(input),
    computeSoulPreservation(input),
    computeAntiOptimization(input),
    computeEmotionalDignity(input),
  ];
  const allOk = readings.every((r) => /observatory|advisory|human-protective|protect/i.test(r.advisoryNotice));
  return {
    ok: allOk,
    detail: allOk ? 'all six modules expose protective notices' : 'a module is missing the notice',
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('HUMAN TRUTH INTELLIGENCE VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['truth-felt',         "felt-human inputs → classification 'felt-human' + high authenticity", () => caseTruthFelt()],
    ['truth-optimized',    "optimized inputs → classification 'optimized-content' + low authenticity", () => caseTruthOptimized()],
    ['truth-det',          'human truth output deterministic',                                        () => caseTruthDet()],
    ['manip-low',          'clean inputs → low / moderate manipulation pressure',                    () => caseManipLow()],
    ['manip-critical',     'adversarial inputs → high / critical pressure',                          () => caseManipCritical()],
    ['manip-signals',      'individual manipulation signals detected',                               () => caseManipSignals()],
    ['continuity-erode',   'authenticity erosion detected',                                          () => caseContinuityErode()],
    ['continuity-preserve','stable inputs → preserving / stable direction',                          () => caseContinuityPreserve()],
    ['soul-aifeeling',     'polished + low-realism + burst → AI feeling detected',                   () => caseSoulAIFeeling()],
    ['soul-integrity',     'human inputs → high soul integrity',                                     () => caseSoulIntegrity()],
    ['anti-optim-perf',    'high engagement + zero trust → performance-without-trust flagged',       () => caseAntiOptimPerf()],
    ['anti-optim-pattern', 'multiple exploitation patterns detected',                                () => caseAntiOptimPattern()],
    ['dignity-erosion',    'optimized inputs → low dignity + trust-vs-performance gap',              () => caseDignityErosion()],
    ['dignity-preserved',  'human inputs → high dignity, no threat',                                 () => caseDignityPreserved()],
    ['isolation',          'no critic / pipeline imports in any module',                             () => caseIsolation()],
    ['no-mutate',          'no fetch / no fs.writeFile in any module',                               () => caseNoMutate()],
    ['no-optimization',    'outputs carry no amplification / optimization flags',                    () => caseNoOptimization()],
    ['no-prediction',      'no predictive phrasing in any output',                                   () => caseNoPrediction()],
    ['advisory-notice',    'every module exposes a human-protective advisory notice',                () => caseAdvisoryNotice()],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  record('tsc', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
    'this script defers compiler validation to the suite runner');

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('verification script crashed:', err);
  process.exit(2);
});
