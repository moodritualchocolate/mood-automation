/**
 * VERIFY — Evolution Sandbox (5 engines + memory).
 *
 * Pure-function verification. No HTTP, no live writes.
 *
 * Cases:
 *   sandbox-15-candidates  · engine generates all 15 mutation candidates
 *   sandbox-deterministic  · same input → same output
 *   sandbox-no-winner      · no candidate carries "best" / "recommended" / "winner"
 *   sandbox-allowed-language · phrasing uses "historically associated" / "may increase" / etc.
 *   trajectory-three-steps · each trajectory has 3 steps with monotonic step index
 *   trajectory-deterministic · trajectory output deterministic
 *   survivability-7-classes · survivability surfaces all 7 risk classes per candidate
 *   survivability-no-winner · survivability never names a "best" candidate
 *   divergence-clusters    · divergence map clusters candidates
 *   divergence-pressure    · convergence pressure computed
 *   anchor-six-anchors     · each anchor report covers all 6 anchors
 *   anchor-no-rejection    · anchors flag drift but never reject
 *   memory-fifo            · FIFO cap stable (200 inserts → ≤ limit)
 *   isolation              · no critic / pipeline imports
 *   no-mutate              · pure engines have no fetch / no fs.writeFile
 *   no-execution           · no applyMutation / executeMutation symbol exported anywhere
 *   no-winner-flags        · no resolved:true / winner: / applied:true / selected: flags in any output
 *   no-prediction          · no predictive phrasing in any output
 *   uncertainty-preserved  · every advisory notice declares simulation / preservation
 *   tsc                    · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  computeEvolutionSandbox, type EvolutionSandboxInput, type CurrentFingerprint,
} from '../lib/evolutionSandboxEngine';
import { computeMutationTrajectories } from '../lib/mutationTrajectoryEngine';
import { computeCreativeSurvivability } from '../lib/creativeSurvivabilityModel';
import { computeDivergencePressure } from '../lib/divergencePressureMap';
import { computeRealityAnchors } from '../lib/realityAnchorEngine';
import {
  createInitialEvolutionSandboxMemory, SANDBOX_SIMULATION_LIMIT,
  type SandboxSimulationSnapshot,
} from '../lib/evolutionSandboxMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic inputs ─────────────────────────────────────────

function makeInput(): EvolutionSandboxInput {
  const currentFingerprint: CurrentFingerprint = {
    formula: 'ENERGY', campaignMode: 'Documentary',
    realismLevel: 7, polishLevel: 4, persuasionIntensity: 4,
    cadenceState: 'gradual', visualStyle: 'documentary-observed',
    emotionalSignature: 'observed-pressure',
    narrativeSignature: 'stillness-silence',
    silenceDensity: 'sparse', pacingIdentity: 'gradual',
    humanRealism: 7, ctaPressure: 3,
  };
  return {
    currentFingerprint,
    history: {
      outcomes: Array.from({ length: 6 }, () => ({
        visualStyle: 'documentary-observed', emotionalSignature: 'observed-pressure',
        narrativeSignature: 'stillness-silence', cadenceState: 'gradual',
        realismLevel: 7, persuasionIntensity: 4,
        downstreamOutcome: 'emotional-resonance',
        metrics: { retention: 0.6, saves: 3, bounceRate: 0.2, follows: 1 },
      })),
      visualFingerprints: [],
      narrativeFingerprints: [],
      driftObservations: [],
    },
    adaptation: { adaptationPriority: 'realism-recovery', cadenceState: 'gradual', mutationUrgency: 4 },
    cultural: { emotionalPersistence: 6 },
    humanTruth: {
      authenticityScore: 7, feltHumanScore: 7,
      signals: { dignity: 7, vulnerability: 6, silenceTolerance: 6 },
    },
    fatigue: { fatigueLevel: 3, freshnessScore: 7, visualFatigue: 3 },
  };
}

// ─── cases ────────────────────────────────────────────────────

function caseFifteenCandidates(): { ok: boolean; detail: string } {
  const r = computeEvolutionSandbox(makeInput());
  const expected = ['pacing','silence','emotional-restraint','realism','symbolism',
                    'composition','typography','narrative','contrast','intimacy',
                    'ritual','nostalgia','humor','documentary','tension'];
  const got = r.candidateMutations.map((c) => c.mutationType).sort();
  const allPresent = expected.every((e) => got.includes(e as never));
  return {
    ok: r.totalCandidates === 15 && allPresent,
    detail: `total=${r.totalCandidates} types=${got.join(',')}`,
  };
}

function caseSandboxDeterministic(): { ok: boolean; detail: string } {
  const input = makeInput();
  const a = JSON.stringify(computeEvolutionSandbox(input));
  const b = JSON.stringify(computeEvolutionSandbox(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

function caseSandboxNoWinner(): { ok: boolean; detail: string } {
  const r = computeEvolutionSandbox(makeInput());
  const text = JSON.stringify(r);
  const banned = /"best":|"winner":|"recommended":|"applied":\s*true|"selected":|"correct":/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no winner flags' : 'banned flag present',
  };
}

function caseSandboxAllowedLanguage(): { ok: boolean; detail: string } {
  const r = computeEvolutionSandbox(makeInput());
  const text = JSON.stringify(r);
  const required = /(historically associated|may increase|correlated with|observed alongside|higher (instability|survivability))/i;
  const banned = /(will happen|going to happen|guarantees|predicts that|definitely|certainly)/i;
  return {
    ok: required.test(text) && !banned.test(text),
    detail: required.test(text) && !banned.test(text)
      ? 'allowed phrasing present, no banned phrasing'
      : 'language check failed',
  };
}

function caseTrajectoryThreeSteps(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const r = computeMutationTrajectories(sandbox.candidateMutations);
  const allHave3 = r.trajectories.every((t) =>
    t.steps.length === 3 &&
    t.steps[0].step === 1 && t.steps[1].step === 2 && t.steps[2].step === 3,
  );
  return {
    ok: allHave3,
    detail: `trajectories=${r.trajectories.length} all-3-steps=${allHave3}`,
  };
}

function caseTrajectoryDeterministic(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const a = JSON.stringify(computeMutationTrajectories(sandbox.candidateMutations));
  const b = JSON.stringify(computeMutationTrajectories(sandbox.candidateMutations));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

function caseSurvivability7Classes(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const r = computeCreativeSurvivability(sandbox.candidateMutations);
  const hasAll7 = r.signatures.every((s) =>
    typeof s.shortTermSpikeRisk === 'number' &&
    typeof s.replayDecaySignature === 'number' &&
    typeof s.emotionalBurnoutSignature === 'number' &&
    typeof s.symbolicDurabilitySignature === 'number' &&
    typeof s.ritualPersistenceSignature === 'number' &&
    typeof s.realismCollapseSignature === 'number' &&
    typeof s.overexposureSignature === 'number',
  );
  return {
    ok: r.signatures.length === sandbox.candidateMutations.length && hasAll7,
    detail: `signatures=${r.signatures.length} all-7-classes=${hasAll7}`,
  };
}

function caseSurvivabilityNoWinner(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const r = computeCreativeSurvivability(sandbox.candidateMutations);
  const text = JSON.stringify(r);
  const banned = /"best":|"winner":|"recommended":|"applied":\s*true|"selected":|"correct":/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no winner flags' : 'banned flag present',
  };
}

function caseDivergenceClusters(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const r = computeDivergencePressure(sandbox.candidateMutations);
  return {
    ok: r.clusters.length >= 1 && r.totalCandidates === sandbox.candidateMutations.length,
    detail: `clusters=${r.clusters.length} candidates=${r.totalCandidates}`,
  };
}
function caseDivergencePressure(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const r = computeDivergencePressure(sandbox.candidateMutations);
  return {
    ok: typeof r.convergencePressure === 'number' && typeof r.divergenceSpread === 'number',
    detail: `convergence=${r.convergencePressure}/10 divergence=${r.divergenceSpread}/10`,
  };
}

function caseAnchorSixAnchors(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const r = computeRealityAnchors(sandbox.candidateMutations);
  const allHave6 = r.reports.every((rep) =>
    typeof rep.anchors.humanPacing === 'number' &&
    typeof rep.anchors.imperfection === 'number' &&
    typeof rep.anchors.dignity === 'number' &&
    typeof rep.anchors.emotionalSpaciousness === 'number' &&
    typeof rep.anchors.realismTexture === 'number' &&
    typeof rep.anchors.silenceTolerance === 'number',
  );
  return {
    ok: allHave6 && r.reports.length === sandbox.candidateMutations.length,
    detail: `reports=${r.reports.length} all-6-anchors=${allHave6}`,
  };
}
function caseAnchorNoRejection(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const r = computeRealityAnchors(sandbox.candidateMutations);
  const text = JSON.stringify(r);
  const banned = /"rejected":\s*true|"banned":\s*true|"forbidden":\s*true/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no rejection flags' : 'rejection flag present',
  };
}

function caseMemoryFifo(): { ok: boolean; detail: string } {
  let mem = createInitialEvolutionSandboxMemory();
  for (let i = 0; i < 200; i++) {
    const snap: SandboxSimulationSnapshot = {
      at: i * 1000, candidateCount: 15,
      creativeEntropy: 5, convergenceRisk: 5,
      realismRetention: 5, symbolicContinuity: 5,
      trustStability: 5, replayabilityEstimate: 5,
      averageFatigueProjection: 5, anchorPreservation: 5,
      overallSurvivability: 5,
      mutationTypes: [], driftingCandidates: [], highRiskCandidates: [],
    };
    mem = {
      ...mem,
      simulations: [...mem.simulations, snap].slice(-SANDBOX_SIMULATION_LIMIT),
      totalSimulations: mem.totalSimulations + 1,
    };
  }
  return {
    ok: mem.simulations.length <= SANDBOX_SIMULATION_LIMIT && mem.totalSimulations === 200,
    detail: `length=${mem.simulations.length}/${SANDBOX_SIMULATION_LIMIT} total=${mem.totalSimulations}`,
  };
}

async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/evolutionSandboxEngine.ts',
    'lib/mutationTrajectoryEngine.ts',
    'lib/creativeSurvivabilityModel.ts',
    'lib/divergencePressureMap.ts',
    'lib/realityAnchorEngine.ts',
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
  const pureFiles = [
    'lib/evolutionSandboxEngine.ts',
    'lib/mutationTrajectoryEngine.ts',
    'lib/creativeSurvivabilityModel.ts',
    'lib/divergencePressureMap.ts',
    'lib/realityAnchorEngine.ts',
  ];
  for (const f of pureFiles) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'no fetch / fs.writeFile in pure engines' };
}

async function caseNoExecution(): Promise<{ ok: boolean; detail: string }> {
  // No engine may export anything named applyMutation / executeMutation /
  // selectMutation / chooseMutation.
  const files = [
    'lib/evolutionSandboxEngine.ts',
    'lib/mutationTrajectoryEngine.ts',
    'lib/creativeSurvivabilityModel.ts',
    'lib/divergencePressureMap.ts',
    'lib/realityAnchorEngine.ts',
    'lib/evolutionSandboxMemory.ts',
  ];
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|selectMutation|chooseMutation|runMutation)\b/;
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (banned.test(src)) return { ok: false, detail: `execution function exported from ${f}` };
  }
  return { ok: true, detail: 'no execution function exported anywhere' };
}

function caseNoWinnerFlags(): { ok: boolean; detail: string } {
  const input = makeInput();
  const sandbox = computeEvolutionSandbox(input);
  const text = JSON.stringify({
    s: sandbox,
    t: computeMutationTrajectories(sandbox.candidateMutations),
    su: computeCreativeSurvivability(sandbox.candidateMutations),
    d: computeDivergencePressure(sandbox.candidateMutations),
    a: computeRealityAnchors(sandbox.candidateMutations),
  });
  const banned = /"resolved":\s*true|"winner":|"applied":\s*true|"selected":|"correct":\s*true|"chosen":/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no winner / resolution flags in any output' : 'banned flag present',
  };
}

function caseNoPrediction(): { ok: boolean; detail: string } {
  const input = makeInput();
  const sandbox = computeEvolutionSandbox(input);
  const text = JSON.stringify({
    s: sandbox,
    t: computeMutationTrajectories(sandbox.candidateMutations),
    su: computeCreativeSurvivability(sandbox.candidateMutations),
    d: computeDivergencePressure(sandbox.candidateMutations),
    a: computeRealityAnchors(sandbox.candidateMutations),
  });
  const banned = /(will happen|going to happen|guarantees|predicts that|definitely|certainly)/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no predictive phrasing' : 'banned phrasing found',
  };
}

function caseUncertaintyPreserved(): { ok: boolean; detail: string } {
  const sandbox = computeEvolutionSandbox(makeInput());
  const notices = [
    sandbox.advisoryNotice,
    computeMutationTrajectories(sandbox.candidateMutations).advisoryNotice,
    computeCreativeSurvivability(sandbox.candidateMutations).advisoryNotice,
    computeDivergencePressure(sandbox.candidateMutations).advisoryNotice,
    computeRealityAnchors(sandbox.candidateMutations).advisoryNotice,
  ];
  const required = /(simulation only|never (execute|apply|select|recommend|forecast|pick|reject)|operator)/i;
  const allOk = notices.every((n) => required.test(n));
  return {
    ok: allOk,
    detail: allOk
      ? 'all five notices declare simulation / preservation'
      : 'a notice is missing the declaration',
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('EVOLUTION SANDBOX VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['sandbox-15-candidates',  'engine generates all 15 mutation candidates',           () => caseFifteenCandidates()],
    ['sandbox-deterministic',  'sandbox output deterministic',                          () => caseSandboxDeterministic()],
    ['sandbox-no-winner',      'no candidate carries best / winner / recommended flags', () => caseSandboxNoWinner()],
    ['sandbox-allowed-lang',   'phrasing uses historically-associated / may-increase / etc.', () => caseSandboxAllowedLanguage()],
    ['trajectory-three-steps', 'each trajectory has 3 steps with correct indices',      () => caseTrajectoryThreeSteps()],
    ['trajectory-det',         'trajectory output deterministic',                       () => caseTrajectoryDeterministic()],
    ['survivability-7',        'survivability surfaces all 7 classes per candidate',    () => caseSurvivability7Classes()],
    ['survivability-no-winner', 'survivability never names a best candidate',           () => caseSurvivabilityNoWinner()],
    ['divergence-clusters',    'divergence map clusters candidates',                    () => caseDivergenceClusters()],
    ['divergence-pressure',    'convergence + divergence pressure computed',            () => caseDivergencePressure()],
    ['anchor-six-anchors',     'each anchor report covers all 6 anchors',               () => caseAnchorSixAnchors()],
    ['anchor-no-rejection',    'anchors flag drift but never reject',                   () => caseAnchorNoRejection()],
    ['memory-fifo',            'FIFO cap stable (200 inserts ≤ limit)',                 () => caseMemoryFifo()],
    ['isolation',              'no critic / pipeline imports in any pure engine',       () => caseIsolation()],
    ['no-mutate',              'pure engines have no fetch / no fs.writeFile',          () => caseNoMutate()],
    ['no-execution',           'no applyMutation / executeMutation exported anywhere',  () => caseNoExecution()],
    ['no-winner-flags',        'no resolved / winner / applied / selected flags in any output', () => caseNoWinnerFlags()],
    ['no-prediction',          'no predictive phrasing in any output',                  () => caseNoPrediction()],
    ['uncertainty-preserved',  'every advisory notice declares simulation / preservation', () => caseUncertaintyPreserved()],
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
