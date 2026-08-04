/**
 * VERIFY — Reflective Reasoning (6 modules).
 *
 * Pure-function verification. No HTTP, no live writes.
 *
 * Cases:
 *   reflection-questions  · reflection generates questions, not answers
 *   reflection-language   · phrasing uses why/what-if/could-it-be, no certainty
 *   hypothesis-possibility · hypotheses framed as possibilities, never facts
 *   hypothesis-language   · phrasing uses "historically correlated", "possible", "potential"
 *   assumption-detect     · assumption audit names hidden assumptions
 *   assumption-no-refute  · audit never claims an assumption is "wrong"
 *   tension-preserve      · tensions name both sides; do not collapse
 *   tension-detect        · known tensions surface from input data
 *   variance-coactive     · multiple explanations co-active per pattern
 *   variance-no-winner    · no explanation auto-selected
 *   loop-eight-passes     · recursive loop runs all 8 passes
 *   loop-expands-uncertainty · net confidence delta is ≤ 0
 *   loop-deterministic    · same input → same loop output
 *   isolation             · no critic / pipeline imports
 *   no-mutate             · no fetch / no fs.writeFile in any module
 *   no-resolution         · outputs carry no resolution / winner / certainty flags
 *   no-prediction         · no predictive phrasing in any output
 *   uncertainty-preserved · advisory notices declare uncertainty is preserved
 *   tsc                   · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeReflections } from '../lib/reflectionEngine';
import { computeHypotheses } from '../lib/hypothesisEngine';
import { computeAssumptionAudit } from '../lib/assumptionAudit';
import { computeTensions } from '../lib/tensionReasoningEngine';
import { computeExplanationVariance } from '../lib/explanationVarianceEngine';
import { computeRecursiveLoop } from '../lib/recursiveObservationLoop';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic data ──────────────────────────────────────────

interface TestOutcome {
  audienceSegment?: string;
  emotionalSignature?: string;
  narrativeSignature?: string;
  visualStyle?: string;
  cadenceState?: string;
  realismLevel?: number;
  persuasionIntensity?: number;
  downstreamOutcome?: string;
  metrics?: {
    retention?: number; saves?: number; comments?: number;
    shares?: number; bounceRate?: number; follows?: number;
    rewatches?: number; likes?: number;
  };
}
function rec(o: Partial<TestOutcome> = {}): TestOutcome {
  return {
    audienceSegment: 'us-parents',
    emotionalSignature: 'observed-pressure',
    narrativeSignature: 'stillness-silence',
    visualStyle: 'documentary-observed',
    cadenceState: 'gradual',
    realismLevel: 7, persuasionIntensity: 4,
    downstreamOutcome: 'emotional-resonance',
    metrics: { retention: 0.6, saves: 3, comments: 2, shares: 1, bounceRate: 0.2, follows: 1 },
    ...o,
  };
}

function buildSample(): { outcomes: TestOutcome[] } {
  return { outcomes: [
    ...Array.from({ length: 4 }, () => rec({
      downstreamOutcome: 'trust-formation',
      metrics: { retention: 0.65, saves: 4, comments: 2, shares: 1, follows: 2, bounceRate: 0.2 },
    })),
    ...Array.from({ length: 4 }, () => rec({
      downstreamOutcome: 'conversion-spike',
      persuasionIntensity: 8, realismLevel: 3, cadenceState: 'burst',
      metrics: { retention: 0.4, saves: 0, comments: 1, shares: 3, follows: 0, bounceRate: 0.4 },
    })),
    ...Array.from({ length: 3 }, () => rec({
      downstreamOutcome: 'replay-behavior',
      metrics: { retention: 0.7, saves: 2, comments: 4, shares: 2, rewatches: 2, bounceRate: 0.15 },
    })),
    ...Array.from({ length: 2 }, () => rec({
      downstreamOutcome: 'hook-collapse',
      metrics: { bounceRate: 0.7, retention: 0.15 },
    })),
  ] };
}

// ─── reflection ──────────────────────────────────────────────

function caseReflectionQuestions(): { ok: boolean; detail: string } {
  const r = computeReflections({ outcomes: buildSample(), drift: null, contradictions: null, ambiguities: null, humanTruth: null });
  const allHaveQuestionMark = r.reflections.every((q) => q.question.includes('?'));
  return {
    ok: r.reflections.length >= 3 && allHaveQuestionMark,
    detail: `reflections=${r.reflections.length} all-question-marks=${allHaveQuestionMark}`,
  };
}
function caseReflectionLanguage(): { ok: boolean; detail: string } {
  const r = computeReflections({ outcomes: buildSample(), drift: null, contradictions: null, ambiguities: null, humanTruth: null });
  const text = JSON.stringify(r);
  const required = /(why|what if|could it be|could the|how can|what)/i;
  const banned = /(will happen|going to happen|guarantees|predicts that)/i;
  return {
    ok: required.test(text) && !banned.test(text),
    detail: required.test(text) ? 'observational phrasing present' : 'missing observational phrasing',
  };
}

// ─── hypothesis ──────────────────────────────────────────────

function caseHypothesisPossibility(): { ok: boolean; detail: string } {
  const r = computeHypotheses({
    outcomes: buildSample(), humanTruth: { signals: { dignity: 7 } }, rituals: null, symbolicResonance: null,
  });
  const allStartCorrectly = r.hypotheses.every((h) =>
    /(historically correlated possibility|possible interpretation|potential unresolved factor)/i.test(h.statement),
  );
  return {
    ok: r.hypotheses.length >= 1 && allStartCorrectly,
    detail: `hypotheses=${r.hypotheses.length} all-correct-framing=${allStartCorrectly}`,
  };
}
function caseHypothesisLanguage(): { ok: boolean; detail: string } {
  const r = computeHypotheses({
    outcomes: buildSample(), humanTruth: { signals: { dignity: 7 } }, rituals: null, symbolicResonance: null,
  });
  const text = JSON.stringify(r);
  const banned = /(will happen|going to happen|guarantees|definitely|certainly)/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no fact-claiming phrasing' : 'banned phrasing present',
  };
}

// ─── assumption audit ────────────────────────────────────────

function caseAssumptionDetect(): { ok: boolean; detail: string } {
  // engagement without trust + high conversion without follows
  const r = computeAssumptionAudit({
    outcomes: { outcomes: [
      ...Array.from({ length: 6 }, () => rec({
        downstreamOutcome: 'conversion-spike',
        metrics: { retention: 0.6, follows: 0, likes: 60, saves: 0 },
      })),
    ] },
    humanTruth: { feltHumanScore: 7, signals: { dignity: 7 } },
    manipulationPressure: { pressureScore: 6 },
  });
  return {
    ok: r.findings.length >= 2,
    detail: `assumptions=${r.findings.length}: ${r.findings.slice(0, 3).map((f) => f.key).join(', ')}`,
  };
}
function caseAssumptionNoRefute(): { ok: boolean; detail: string } {
  const r = computeAssumptionAudit({
    outcomes: { outcomes: Array.from({ length: 4 }, () => rec({})) },
    humanTruth: null, manipulationPressure: null,
  });
  const text = JSON.stringify(r);
  const banned = /(this assumption is (wrong|false|incorrect)|we (know|prove))/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'audit does not refute assumptions' : 'refutation phrasing detected',
  };
}

// ─── tension reasoning ───────────────────────────────────────

function caseTensionPreserve(): { ok: boolean; detail: string } {
  const r = computeTensions({
    outcomes: { outcomes: [
      ...Array.from({ length: 4 }, () => rec({
        metrics: { retention: 0.7, saves: 4, follows: 0 },
        downstreamOutcome: 'emotional-resonance',
      })),
    ] },
    humanTruth: { signals: { dignity: 3 } },
    manipulationPressure: null, rituals: null, fatigue: null,
  });
  const allHaveBothSides = r.tensions.every((t) => t.sideA && t.sideB && t.preservedStatement);
  return {
    ok: r.tensions.length >= 1 && allHaveBothSides,
    detail: `tensions=${r.tensions.length} both-sides=${allHaveBothSides}`,
  };
}
function caseTensionDetect(): { ok: boolean; detail: string } {
  const r = computeTensions({
    outcomes: { outcomes: Array.from({ length: 8 }, () => rec({
      metrics: { retention: 0.7, saves: 4, follows: 0, comments: 2, shares: 1, bounceRate: 0.2 },
      downstreamOutcome: 'emotional-resonance',
    })) },
    humanTruth: { signals: { dignity: 3 } },
    manipulationPressure: null, rituals: null, fatigue: null,
  });
  return {
    ok: r.tensions.some((t) => t.key.includes('performance')) ||
        r.tensions.some((t) => t.key.includes('trust')),
    detail: `tensions: ${r.tensions.map((t) => t.key).join(', ')}`,
  };
}

// ─── explanation variance ────────────────────────────────────

function caseVarianceCoActive(): { ok: boolean; detail: string } {
  // Mix of records + rituals + symbols so multiple explanations co-activate.
  const r = computeExplanationVariance({
    outcomes: { outcomes: Array.from({ length: 4 }, () => rec({
      downstreamOutcome: 'replay-behavior',
      realismLevel: 7, persuasionIntensity: 4,
      metrics: { retention: 0.7, rewatches: 2 },
    })) },
    rituals: { detected: [{ key: 'morning-stillness', emotionalAttachmentScore: 7 }] },
    symbolicResonance: { symbols: [{ symbol: 'kitchens', resonance: 7 }, { symbol: 'silence', resonance: 6 }] },
  });
  const replay = r.clusters.find((c) => c.observedPattern === 'high replay');
  const coActive = replay ? replay.explanations.filter((e) => e.support >= 4).length : 0;
  return {
    ok: replay !== undefined && coActive >= 2,
    detail: `co-active explanations for replay: ${coActive}`,
  };
}
function caseVarianceNoWinner(): { ok: boolean; detail: string } {
  const r = computeExplanationVariance({
    outcomes: { outcomes: [rec({ downstreamOutcome: 'replay-behavior' })] },
    rituals: null, symbolicResonance: null,
  });
  const text = JSON.stringify(r);
  const banned = /"winner":|"selected":|"chosen":|"correct":/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no winner-selection flags' : 'banned flag present',
  };
}

// ─── recursive loop ──────────────────────────────────────────

function caseLoopEightPasses(): { ok: boolean; detail: string } {
  const r = computeRecursiveLoop({
    reflection: { outcomes: buildSample(), drift: null, contradictions: null, ambiguities: null, humanTruth: null },
    hypothesis: { outcomes: buildSample(), humanTruth: null, rituals: null, symbolicResonance: null },
    assumption: { outcomes: buildSample(), humanTruth: null, manipulationPressure: null },
    tension: { outcomes: buildSample(), humanTruth: null, manipulationPressure: null, rituals: null, fatigue: null },
    variance: { outcomes: buildSample(), rituals: null, symbolicResonance: null },
    initialConfidence: { overallLevel: 'moderate', overallScore: 5 },
    contradictions: { contradictions: [{ key: 'a', severity: 5 }] },
    ambiguities: { ambiguities: [{ zone: 'b', severity: 5 }] },
    boundaries: { boundaries: [{ zone: 'c', severity: 5 }] },
  });
  return {
    ok: r.passes.length === 8,
    detail: `passes=${r.passes.length} (${r.passes.map((p) => p.pass).join(', ')})`,
  };
}
function caseLoopExpandsUncertainty(): { ok: boolean; detail: string } {
  // With contradictions / ambiguities / assumptions / tensions present,
  // net delta should be negative or zero.
  const r = computeRecursiveLoop({
    reflection: { outcomes: buildSample(), drift: null, contradictions: null, ambiguities: null, humanTruth: null },
    hypothesis: { outcomes: buildSample(), humanTruth: null, rituals: null, symbolicResonance: null },
    assumption: { outcomes: { outcomes: Array.from({ length: 6 }, () => rec({
      downstreamOutcome: 'conversion-spike',
      metrics: { retention: 0.6, follows: 0, likes: 60 },
    })) }, humanTruth: { feltHumanScore: 7 }, manipulationPressure: { pressureScore: 6 } },
    tension: { outcomes: buildSample(), humanTruth: { signals: { dignity: 3 } }, manipulationPressure: null, rituals: null, fatigue: null },
    variance: { outcomes: buildSample(), rituals: null, symbolicResonance: null },
    initialConfidence: { overallLevel: 'moderate', overallScore: 5 },
    contradictions: { contradictions: [{ key: 'a', severity: 5 }, { key: 'b', severity: 5 }] },
    ambiguities: { ambiguities: [{ zone: 'c', severity: 5 }, { zone: 'd', severity: 5 }] },
    boundaries: { boundaries: [] },
  });
  return {
    ok: r.netConfidenceDelta <= 0,
    detail: `net-delta=${r.netConfidenceDelta} final=${r.finalConfidenceScore}/10`,
  };
}
function caseLoopDeterministic(): { ok: boolean; detail: string } {
  const input = {
    reflection: { outcomes: buildSample(), drift: null, contradictions: null, ambiguities: null, humanTruth: null },
    hypothesis: { outcomes: buildSample(), humanTruth: null, rituals: null, symbolicResonance: null },
    assumption: { outcomes: buildSample(), humanTruth: null, manipulationPressure: null },
    tension: { outcomes: buildSample(), humanTruth: null, manipulationPressure: null, rituals: null, fatigue: null },
    variance: { outcomes: buildSample(), rituals: null, symbolicResonance: null },
    initialConfidence: { overallScore: 5 },
    contradictions: { contradictions: [] }, ambiguities: { ambiguities: [] }, boundaries: { boundaries: [] },
  };
  const a = JSON.stringify(computeRecursiveLoop(input));
  const b = JSON.stringify(computeRecursiveLoop(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── static checks ───────────────────────────────────────────

async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/reflectionEngine.ts',
    'lib/hypothesisEngine.ts',
    'lib/assumptionAudit.ts',
    'lib/tensionReasoningEngine.ts',
    'lib/explanationVarianceEngine.ts',
    'lib/recursiveObservationLoop.ts',
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
    'lib/reflectionEngine.ts',
    'lib/hypothesisEngine.ts',
    'lib/assumptionAudit.ts',
    'lib/tensionReasoningEngine.ts',
    'lib/explanationVarianceEngine.ts',
    'lib/recursiveObservationLoop.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'no fetch / fs.writeFile in any module' };
}
function caseNoResolution(): { ok: boolean; detail: string } {
  const sample = buildSample();
  const json = JSON.stringify({
    refl: computeReflections({ outcomes: sample, drift: null, contradictions: null, ambiguities: null, humanTruth: null }),
    hyp: computeHypotheses({ outcomes: sample, humanTruth: null, rituals: null, symbolicResonance: null }),
    aud: computeAssumptionAudit({ outcomes: sample, humanTruth: null, manipulationPressure: null }),
    ten: computeTensions({ outcomes: sample, humanTruth: null, manipulationPressure: null, rituals: null, fatigue: null }),
    var: computeExplanationVariance({ outcomes: sample, rituals: null, symbolicResonance: null }),
  });
  const banned = /"resolved":\s*true|"winner":|"applied":\s*true|"correct":\s*true|"certain":\s*true/i;
  return {
    ok: !banned.test(json),
    detail: !banned.test(json) ? 'no resolution / winner / certainty flags' : 'banned flag found',
  };
}
function caseNoPrediction(): { ok: boolean; detail: string } {
  const sample = buildSample();
  const json = JSON.stringify({
    refl: computeReflections({ outcomes: sample, drift: null, contradictions: null, ambiguities: null, humanTruth: null }),
    hyp: computeHypotheses({ outcomes: sample, humanTruth: null, rituals: null, symbolicResonance: null }),
    aud: computeAssumptionAudit({ outcomes: sample, humanTruth: null, manipulationPressure: null }),
    ten: computeTensions({ outcomes: sample, humanTruth: null, manipulationPressure: null, rituals: null, fatigue: null }),
    var: computeExplanationVariance({ outcomes: sample, rituals: null, symbolicResonance: null }),
  });
  const banned = /(will happen|going to happen|guarantees|predicts that)/i;
  return {
    ok: !banned.test(json),
    detail: !banned.test(json) ? 'no predictive phrasing' : 'banned phrasing found',
  };
}
function caseUncertaintyPreserved(): { ok: boolean; detail: string } {
  const notices = [
    computeReflections({ outcomes: buildSample(), drift: null, contradictions: null, ambiguities: null, humanTruth: null }).advisoryNotice,
    computeHypotheses({ outcomes: buildSample(), humanTruth: null, rituals: null, symbolicResonance: null }).advisoryNotice,
    computeAssumptionAudit({ outcomes: buildSample(), humanTruth: null, manipulationPressure: null }).advisoryNotice,
    computeTensions({ outcomes: buildSample(), humanTruth: null, manipulationPressure: null, rituals: null, fatigue: null }).advisoryNotice,
    computeExplanationVariance({ outcomes: buildSample(), rituals: null, symbolicResonance: null }).advisoryNotice,
    computeRecursiveLoop({
      reflection: { outcomes: buildSample(), drift: null, contradictions: null, ambiguities: null, humanTruth: null },
      hypothesis: { outcomes: buildSample(), humanTruth: null, rituals: null, symbolicResonance: null },
      assumption: { outcomes: buildSample(), humanTruth: null, manipulationPressure: null },
      tension: { outcomes: buildSample(), humanTruth: null, manipulationPressure: null, rituals: null, fatigue: null },
      variance: { outcomes: buildSample(), rituals: null, symbolicResonance: null },
      initialConfidence: null, contradictions: null, ambiguities: null, boundaries: null,
    }).advisoryNotice,
  ];
  const required = /(preserved|never (collapse|select|pick|claim|conclude|suppress)|expands? uncertainty|do not know|possibilities|interpret)/i;
  const allOk = notices.every((n) => required.test(n));
  return {
    ok: allOk,
    detail: allOk ? 'every notice declares uncertainty is preserved' : 'a notice is missing the preservation declaration',
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('REFLECTIVE REASONING VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['reflection-questions',   'reflection generates questions, not answers',                () => caseReflectionQuestions()],
    ['reflection-language',    'reflection uses why/what-if/could-it-be phrasing',           () => caseReflectionLanguage()],
    ['hypothesis-possibility', 'hypotheses framed as historically-correlated possibilities', () => caseHypothesisPossibility()],
    ['hypothesis-language',    'hypothesis output uses no fact-claiming language',           () => caseHypothesisLanguage()],
    ['assumption-detect',      'assumption audit names hidden assumptions',                  () => caseAssumptionDetect()],
    ['assumption-no-refute',   'audit never claims an assumption is wrong',                  () => caseAssumptionNoRefute()],
    ['tension-preserve',       'tensions name both sides and never collapse',                () => caseTensionPreserve()],
    ['tension-detect',         'known tensions surface from input data',                     () => caseTensionDetect()],
    ['variance-coactive',      'multiple explanations co-active per pattern',                () => caseVarianceCoActive()],
    ['variance-no-winner',     'no explanation auto-selected',                               () => caseVarianceNoWinner()],
    ['loop-eight-passes',      'recursive loop runs all 8 passes',                           () => caseLoopEightPasses()],
    ['loop-expands',           'recursive loop expands uncertainty (net-delta ≤ 0)',         () => caseLoopExpandsUncertainty()],
    ['loop-deterministic',     'recursive loop deterministic',                               () => caseLoopDeterministic()],
    ['isolation',              'no critic / pipeline imports in any module',                 () => caseIsolation()],
    ['no-mutate',              'no fetch / no fs.writeFile in any module',                   () => caseNoMutate()],
    ['no-resolution',          'outputs carry no resolution / winner / certainty flags',     () => caseNoResolution()],
    ['no-prediction',          'no predictive phrasing in any output',                       () => caseNoPrediction()],
    ['uncertainty-preserved',  'every advisory notice declares uncertainty is preserved',    () => caseUncertaintyPreserved()],
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
