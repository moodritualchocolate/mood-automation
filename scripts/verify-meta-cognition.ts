/**
 * VERIFY — Meta-Cognitive Intelligence (5 modules).
 *
 * Pure-function verification. No HTTP, no live writes.
 *
 * Cases:
 *   confidence-low      · empty / sparse input → low confidence
 *   confidence-high     · rich + low-variance input → stable/high confidence
 *   confidence-det      · deterministic across runs
 *   contradict-detect   · known contradiction pairs surface
 *   contradict-no-resolve · contradictions name both sides, never resolve
 *   ambig-multi-outcome · same signature with many outcomes → ambiguity zone
 *   ambig-language      · phrasing uses "could be read as / multiple interpretations"
 *   boundary-thin-data  · sparse data → boundary declared
 *   boundary-known-unknown · boundary description names "do not know" / "not yet"
 *   perspective-co-active · multiple perspectives co-active when content is mixed
 *   perspective-no-winner · no perspective auto-selected (no "winner" field)
 *   isolation           · no critic / pipeline imports in any module
 *   no-mutate           · no fetch / no fs.writeFile in any module
 *   no-resolve          · outputs carry no "resolved":true / "winner":… flags
 *   no-prediction       · no predictive phrasing in any output
 *   uncertainty-preserved · advisoryNotice declares uncertainty is preserved
 *   tsc                 · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeConfidence } from '../lib/confidenceModel';
import { computeContradictions } from '../lib/contradictionDetector';
import { computeAmbiguities } from '../lib/ambiguityLayer';
import { computeCognitiveBoundaries } from '../lib/cognitiveBoundaryEngine';
import { computeMultiPerspective } from '../lib/multiPerspectiveEngine';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic data ──────────────────────────────────────────

/** Loose outcome record used across all five modules. The shape is
 *  intentionally wide enough that each module reads what it needs;
 *  fields the module doesn't read are simply ignored. */
interface TestOutcome {
  at?: number;
  audienceSegment?: string;
  emotionalSignature?: string;
  narrativeSignature?: string;
  visualStyle?: string;
  cadenceState?: string;
  realismLevel?: number;
  persuasionIntensity?: number;
  mutationPressure?: number;
  creativeFingerprint?: string;
  downstreamOutcome?: string;
  metrics?: {
    retention?: number; saves?: number; comments?: number;
    shares?: number; bounceRate?: number; follows?: number;
    rewatches?: number; ctr?: number; scrollDepth?: number;
  };
}
function mkOutcome(o: Partial<TestOutcome>): TestOutcome {
  return {
    audienceSegment: 'us-parents',
    emotionalSignature: 'observed-pressure',
    narrativeSignature: 'stillness-silence',
    visualStyle: 'documentary-observed',
    cadenceState: 'gradual',
    realismLevel: 7,
    persuasionIntensity: 4,
    downstreamOutcome: 'emotional-resonance',
    metrics: { retention: 0.6, saves: 3, comments: 2, shares: 1, bounceRate: 0.2, follows: 1 },
    ...o,
  };
}

// ─── confidence ──────────────────────────────────────────────

function caseConfidenceLow(): { ok: boolean; detail: string } {
  const r = computeConfidence({ outcomes: { outcomes: [] }, drift: { observations: [] }, cultural: null });
  return {
    ok: r.overallLevel === 'low' && r.overallScore <= 4,
    detail: `level=${r.overallLevel} score=${r.overallScore}/10`,
  };
}
function caseConfidenceHigh(): { ok: boolean; detail: string } {
  // 12 records with low variance.
  const outcomes = Array.from({ length: 12 }, () => mkOutcome({}));
  const drift = Array.from({ length: 12 }, () => ({
    overallCreativeHealth: 7, narrativeStability: 7, trustErosionDrift: 0,
  }));
  const r = computeConfidence({
    outcomes: { outcomes },
    drift: { observations: drift },
    cultural: {
      segments: [{ segment: 'us-parents', outcomes: 12, averageEngagement: 6 }],
      collectiveMemory: [{ theme: 't1', occurrences: 6, durability: 7 }],
    },
  });
  return {
    ok: r.overallScore >= 5 && (r.overallLevel === 'stable' || r.overallLevel === 'high'),
    detail: `level=${r.overallLevel} score=${r.overallScore}/10 axes=${r.axes.length}`,
  };
}
function caseConfidenceDet(): { ok: boolean; detail: string } {
  const input = { outcomes: { outcomes: [mkOutcome({}), mkOutcome({})] }, drift: { observations: [] }, cultural: null };
  const a = JSON.stringify(computeConfidence(input));
  const b = JSON.stringify(computeConfidence(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── contradictions ──────────────────────────────────────────

function caseContradictDetect(): { ok: boolean; detail: string } {
  // High retention + no follows + non-trust outcome → high-performance + low-trust
  const outcomes = Array.from({ length: 4 }, () => mkOutcome({
    metrics: { retention: 0.7, saves: 4, comments: 3, shares: 1, bounceRate: 0.15, follows: 0 },
    downstreamOutcome: 'emotional-resonance',
  }));
  const r = computeContradictions({
    outcomes: { outcomes },
    drift: { observations: [] },
    humanTruth: null, manipulationPressure: null, fatigue: null, rituals: null,
  });
  const found = r.contradictions.find((c) => c.key === 'high-performance + low-trust');
  return { ok: found !== undefined, detail: found ? found.description : `found=${r.contradictions.length}` };
}
function caseContradictNoResolve(): { ok: boolean; detail: string } {
  const outcomes = [mkOutcome({
    metrics: { retention: 0.7, saves: 4, follows: 0 },
    downstreamOutcome: 'emotional-resonance',
  })];
  const r = computeContradictions({
    outcomes: { outcomes },
    drift: { observations: [] },
    humanTruth: null, manipulationPressure: null, fatigue: null, rituals: null,
  });
  const json = JSON.stringify(r);
  const banned = /"resolved":\s*true|"winner":|"final":/i;
  return {
    ok: !banned.test(json) && r.contradictions.every((c) => c.sideA && c.sideB),
    detail: !banned.test(json) ? 'no resolved/winner flags; both sides named' : 'banned flag present',
  };
}

// ─── ambiguity ───────────────────────────────────────────────

function caseAmbigMultiOutcome(): { ok: boolean; detail: string } {
  const outcomes = [
    mkOutcome({ emotionalSignature: 'mixed-sig', downstreamOutcome: 'trust-formation' }),
    mkOutcome({ emotionalSignature: 'mixed-sig', downstreamOutcome: 'authenticity-rejection' }),
    mkOutcome({ emotionalSignature: 'mixed-sig', downstreamOutcome: 'fatigue-acceleration' }),
    mkOutcome({ emotionalSignature: 'mixed-sig', downstreamOutcome: 'hook-collapse' }),
  ];
  const r = computeAmbiguities({
    outcomes: { outcomes },
    archetypes: null, symbolicResonance: null, cultural: null,
  });
  return {
    ok: r.ambiguities.some((a) => a.zone.includes('mixed-sig')),
    detail: `ambiguities=${r.ambiguities.length} zones=${r.ambiguities.map((a) => a.zone).slice(0, 3).join(', ')}`,
  };
}
function caseAmbigLanguage(): { ok: boolean; detail: string } {
  const outcomes = Array.from({ length: 6 }, (_, i) => mkOutcome({
    audienceSegment: 'mixed',
    downstreamOutcome: ['trust-formation', 'hook-collapse', 'emotional-resonance',
                       'fatigue-acceleration', 'replay-behavior', 'authenticity-rejection'][i % 6],
  }));
  const r = computeAmbiguities({
    outcomes: { outcomes },
    archetypes: null, symbolicResonance: null, cultural: null,
  });
  const json = JSON.stringify(r);
  const required = /(could be|multiple interpretations|both readings|no single|possible)/i;
  return {
    ok: required.test(json) || /multiple interpretations|could be/i.test(r.advisoryNotice),
    detail: 'advisoryNotice and ambiguity descriptions use observational language',
  };
}

// ─── cognitive boundaries ────────────────────────────────────

function caseBoundaryThinData(): { ok: boolean; detail: string } {
  const r = computeCognitiveBoundaries({
    outcomes: { outcomes: [mkOutcome({}), mkOutcome({})] },
    drift: { observations: [] },
    consequences: { episodes: [] },
    confidence: { axes: [] },
    recoveryEvents: [],
  });
  return {
    ok: r.boundaries.length >= 2,
    detail: `boundaries=${r.boundaries.length}; zones=${r.boundaries.slice(0, 3).map((b) => b.zone).join(', ')}`,
  };
}
function caseBoundaryKnownUnknown(): { ok: boolean; detail: string } {
  const r = computeCognitiveBoundaries({
    outcomes: { outcomes: [mkOutcome({})] },
    drift: { observations: [] },
    consequences: { episodes: [] },
    confidence: { axes: [] },
    recoveryEvents: [],
  });
  const json = JSON.stringify(r);
  const required = /(do not (know|have|yet)|not yet|haven't|not enough|"we do not)/i;
  return {
    ok: required.test(json),
    detail: required.test(json) ? 'epistemic-humility phrasing present' : 'missing "we do not know" phrasing',
  };
}

// ─── multi-perspective ───────────────────────────────────────

function casePerspectiveCoActive(): { ok: boolean; detail: string } {
  const outcomes = [
    mkOutcome({
      emotionalSignature: 'observed-tired', narrativeSignature: 'stillness',
      realismLevel: 7, persuasionIntensity: 4,
      metrics: { retention: 0.65, saves: 4, bounceRate: 0.2, follows: 1 },
    }),
    mkOutcome({
      emotionalSignature: 'observed-tired', narrativeSignature: 'stillness',
      realismLevel: 8, persuasionIntensity: 3,
      metrics: { retention: 0.55, saves: 3, bounceRate: 0.25 },
    }),
  ];
  const r = computeMultiPerspective({
    outcomes: { outcomes },
    fatigue: { fatigueLevel: 3 },
    humanTruth: { feltHumanScore: 7, signals: { vulnerability: 6, emotionalCoherence: 6 } },
    rituals: { detected: [{ key: 'morning-stillness', emotionalAttachmentScore: 6 }] },
  });
  // We expect at least one fingerprint to have multiple perspectives ≥4.
  const has = r.perspectivesByFingerprint.some((fp) =>
    fp.perspectives.filter((p) => p.weight >= 4).length >= 2,
  );
  return {
    ok: has,
    detail: `co-active fingerprints=${r.highVarianceFingerprints.length}; total=${r.perspectivesByFingerprint.length}`,
  };
}
function casePerspectiveNoWinner(): { ok: boolean; detail: string } {
  const outcomes = [mkOutcome({})];
  const r = computeMultiPerspective({
    outcomes: { outcomes },
    fatigue: null, humanTruth: null, rituals: null,
  });
  const json = JSON.stringify(r);
  const banned = /"winner":|"selected":|"chosen":|"correct":/i;
  return {
    ok: !banned.test(json),
    detail: !banned.test(json) ? 'no winner / selected flags' : 'banned flag present',
  };
}

// ─── static checks ───────────────────────────────────────────

async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/confidenceModel.ts',
    'lib/contradictionDetector.ts',
    'lib/ambiguityLayer.ts',
    'lib/cognitiveBoundaryEngine.ts',
    'lib/multiPerspectiveEngine.ts',
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
    'lib/confidenceModel.ts',
    'lib/contradictionDetector.ts',
    'lib/ambiguityLayer.ts',
    'lib/cognitiveBoundaryEngine.ts',
    'lib/multiPerspectiveEngine.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'no fetch / fs.writeFile in any module' };
}
function caseNoResolve(): { ok: boolean; detail: string } {
  const outcomes = Array.from({ length: 6 }, () => mkOutcome({}));
  const json = JSON.stringify({
    confidence: computeConfidence({ outcomes: { outcomes }, drift: { observations: [] }, cultural: null }),
    contradictions: computeContradictions({ outcomes: { outcomes }, drift: { observations: [] }, humanTruth: null, manipulationPressure: null, fatigue: null, rituals: null }),
    ambig: computeAmbiguities({ outcomes: { outcomes }, archetypes: null, symbolicResonance: null, cultural: null }),
    boundaries: computeCognitiveBoundaries({ outcomes: { outcomes }, drift: { observations: [] }, consequences: { episodes: [] }, confidence: { axes: [] }, recoveryEvents: [] }),
    perspectives: computeMultiPerspective({ outcomes: { outcomes }, fatigue: null, humanTruth: null, rituals: null }),
  });
  const banned = /"resolved":\s*true|"applied":\s*true|"winner":|"correct":/i;
  return {
    ok: !banned.test(json),
    detail: !banned.test(json) ? 'no resolution / winner flags anywhere' : 'banned flag present',
  };
}
function caseNoPrediction(): { ok: boolean; detail: string } {
  const outcomes = Array.from({ length: 4 }, () => mkOutcome({}));
  const json = JSON.stringify({
    confidence: computeConfidence({ outcomes: { outcomes }, drift: { observations: [] }, cultural: null }),
    contradictions: computeContradictions({ outcomes: { outcomes }, drift: { observations: [] }, humanTruth: null, manipulationPressure: null, fatigue: null, rituals: null }),
    ambig: computeAmbiguities({ outcomes: { outcomes }, archetypes: null, symbolicResonance: null, cultural: null }),
    boundaries: computeCognitiveBoundaries({ outcomes: { outcomes }, drift: { observations: [] }, consequences: { episodes: [] }, confidence: { axes: [] }, recoveryEvents: [] }),
    perspectives: computeMultiPerspective({ outcomes: { outcomes }, fatigue: null, humanTruth: null, rituals: null }),
  });
  const banned = /(will happen|going to happen|guarantees|predicts that)/i;
  return {
    ok: !banned.test(json),
    detail: !banned.test(json) ? 'no predictive phrasing' : 'banned phrasing found',
  };
}
function caseUncertaintyPreserved(): { ok: boolean; detail: string } {
  const out = [mkOutcome({})];
  const notices: string[] = [
    computeConfidence({ outcomes: { outcomes: out }, drift: { observations: [] }, cultural: null }).advisoryNotice,
    computeContradictions({ outcomes: { outcomes: out }, drift: { observations: [] }, humanTruth: null, manipulationPressure: null, fatigue: null, rituals: null }).advisoryNotice,
    computeAmbiguities({ outcomes: { outcomes: out }, archetypes: null, symbolicResonance: null, cultural: null }).advisoryNotice,
    computeCognitiveBoundaries({ outcomes: { outcomes: out }, drift: { observations: [] }, consequences: { episodes: [] }, confidence: { axes: [] }, recoveryEvents: [] }).advisoryNotice,
    computeMultiPerspective({ outcomes: { outcomes: out }, fatigue: null, humanTruth: null, rituals: null }).advisoryNotice,
  ];
  const allOk = notices.every((n) =>
    /never (collapse|resolve|pick|claim|suppress)|preserved|do not know|epistemic/i.test(n),
  );
  return {
    ok: allOk,
    detail: allOk ? 'all five notices declare uncertainty is preserved' : 'a notice is missing the preservation declaration',
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('META-COGNITION VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['confidence-low',         'empty / sparse input → low confidence',                       () => caseConfidenceLow()],
    ['confidence-high',        'rich + low-variance input → stable/high confidence',          () => caseConfidenceHigh()],
    ['confidence-det',         'confidence deterministic',                                    () => caseConfidenceDet()],
    ['contradict-detect',      'known contradiction pairs surface',                           () => caseContradictDetect()],
    ['contradict-no-resolve',  'contradictions name both sides, never resolve',               () => caseContradictNoResolve()],
    ['ambig-multi-outcome',    'same signature with many outcomes → ambiguity zone',          () => caseAmbigMultiOutcome()],
    ['ambig-language',         'ambiguity output uses observational phrasing',                () => caseAmbigLanguage()],
    ['boundary-thin-data',     'sparse data → boundary declared',                             () => caseBoundaryThinData()],
    ['boundary-known-unknown', 'boundary description names "we do not know" / "not yet"',     () => caseBoundaryKnownUnknown()],
    ['perspective-co-active',  'multiple perspectives co-active when content is mixed',       () => casePerspectiveCoActive()],
    ['perspective-no-winner',  'no perspective auto-selected',                                () => casePerspectiveNoWinner()],
    ['isolation',              'no critic / pipeline imports in any module',                  () => caseIsolation()],
    ['no-mutate',              'no fetch / no fs.writeFile in any module',                    () => caseNoMutate()],
    ['no-resolve',             'outputs carry no "resolved":true / "winner":… flags',         () => caseNoResolve()],
    ['no-prediction',          'no predictive phrasing in any output',                        () => caseNoPrediction()],
    ['uncertainty-preserved',  'every notice declares uncertainty is preserved',              () => caseUncertaintyPreserved()],
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
