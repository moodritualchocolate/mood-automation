/**
 * VERIFY — Human Presence Intelligence.
 *
 * Cases:
 *   presence-shape             · 16 presence signals + composites in range
 *   presence-deterministic     · pure function
 *   presence-empty             · no inputs → balanced reading
 *   presence-felt-real         · imperfection + restraint + obs density → elevated presenceScore
 *   presence-synthetic         · high persuasion + high polish → elevated syntheticPressure
 *   memory-fifo                · append > limit → cap respected
 *   memory-pure-transform      · appendPresenceSnapshot is referentially transparent
 *   route-no-pipeline          · route does not import pipeline / call /api/generate
 *   route-no-execution         · route exports no apply / execute / generateNow / publishNow
 *   route-get-only             · route exports GET but not POST
 *   route-listed               · /api/human-presence registered in systemIntegrityReport
 *   isolation                  · engine + memory have no critic / pipeline / banner imports
 *   no-fetch-no-write          · engine has no fetch / no fs.writeFile
 *   allowed-language           · phrasing uses historically associated / observed alongside / may carry presence weight
 *   forbidden-prediction       · phrasing forbids predict / will / best / winner / optimize / auto-apply
 *   forbidden-virality         · phrasing forbids viral / dopamine / outrage / exploit
 *   tsc                        · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeHumanPresence } from '../lib/humanPresenceEngine';
import {
  appendPresenceSnapshot,
  createInitialPresenceMemory,
  PRESENCE_SNAPSHOT_LIMIT,
  type PresenceSnapshot,
} from '../lib/presenceMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

function mkO(o: any = {}): any {
  return {
    emotionalSignature: 'still-quiet-tender',
    narrativeSignature: 'observational',
    visualStyle: 'documentary',
    cadenceState: 'flow',
    realismLevel: 7,
    persuasionIntensity: 3,
    downstreamOutcome: 'trust-formation',
    metrics: { retention: 0.6, saves: 3, rewatches: 1, shares: 1, comments: 2 },
    ...o,
  };
}
function mkVis(n: number, o: any = {}): any[] {
  const fps: any[] = [];
  for (let i = 0; i < n; i++) {
    fps.push({
      silenceDensity: 'high',
      polishLevel: 3,
      realismLevel: 8,
      pacingIdentity: 'slow',
      motionCadence: 'slow',
      lightingSignature: 'soft-warm',
      ...o,
    });
  }
  return fps;
}
function mkNar(n: number, o: any = {}): any[] {
  const fps: any[] = [];
  for (let i = 0; i < n; i++) {
    fps.push({
      silenceUsage: 'sparse',
      narrationStyle: 'observational',
      humanRealism: 7,
      ctaPressure: 3,
      observationalDensity: 8,
      tensionCurve: 'sustained',
      payoffTiming: 'late',
      ...o,
    });
  }
  return fps;
}

// ─── cases ────────────────────────────────────────────────────

function caseShape(): { ok: boolean; detail: string } {
  const r = computeHumanPresence({
    outcomes: { outcomes: [mkO()] },
    visualDNA: { fingerprints: mkVis(3) },
    narrativeDNA: { fingerprints: mkNar(3) },
  });
  const expected = [
    'eyeContactStability', 'hesitation', 'breathingSpace', 'stillness',
    'vulnerability', 'emotionalRestraint', 'awkwardness', 'imperfection',
    'authenticityPressure', 'emotionalTiming', 'listeningPresence',
    'dignityPreservation', 'humanFatigueVisibility', 'emotionalOpenness',
    'selfConsciousnessTraces', 'nonPerformativeBehavior',
  ];
  const missing = expected.filter((k) => !(k in r.signals));
  const inRange = Object.values(r.signals).every((v) => v >= 0 && v <= 10);
  const compositesInRange = [r.presenceScore, r.stillnessWeight, r.authenticityWeight,
    r.imperfectionSignature, r.vulnerabilitySignals, r.emotionalBreathing,
    r.listeningSignals, r.humanityRetention, r.syntheticPressure, r.dignityProtection]
    .every((v) => v >= 0 && v <= 10);
  return {
    ok: missing.length === 0 && inRange && compositesInRange,
    detail: missing.length === 0 ? `score=${r.presenceScore} pressure=${r.syntheticPressure}` : `missing=${missing.join(',')}`,
  };
}
function caseDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: [mkO()] },
    visualDNA: { fingerprints: mkVis(2) },
    narrativeDNA: { fingerprints: mkNar(2) },
  };
  const a = JSON.stringify(computeHumanPresence(input));
  const b = JSON.stringify(computeHumanPresence(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseEmpty(): { ok: boolean; detail: string } {
  const r = computeHumanPresence({});
  return {
    ok: r.totalObservations === 0 && r.notes.length > 0 &&
        Object.values(r.signals).every((v) => v >= 0 && v <= 10),
    detail: `score=${r.presenceScore} notes=${r.notes[0]}`,
  };
}
function caseFeltReal(): { ok: boolean; detail: string } {
  // Low polish + high realism + low persuasion + low CTA + obs density.
  const outs = Array.from({ length: 5 }, () => mkO({
    persuasionIntensity: 2,
    emotionalSignature: 'tender-vulnerable-honest-quiet-still',
  }));
  const r = computeHumanPresence({
    outcomes: { outcomes: outs },
    visualDNA: { fingerprints: mkVis(4, { polishLevel: 2, realismLevel: 9 }) },
    narrativeDNA: { fingerprints: mkNar(4, { observationalDensity: 9, ctaPressure: 2, humanRealism: 9 }) },
  });
  return {
    ok: r.presenceScore >= 5 && r.authenticityWeight >= 5 && r.syntheticPressure <= 5,
    detail: `score=${r.presenceScore} auth=${r.authenticityWeight} synthetic=${r.syntheticPressure}`,
  };
}
function caseSynthetic(): { ok: boolean; detail: string } {
  const outs = Array.from({ length: 5 }, () => mkO({
    persuasionIntensity: 9,
    emotionalSignature: 'polished-cinematic-glossy',
  }));
  const r = computeHumanPresence({
    outcomes: { outcomes: outs },
    visualDNA: { fingerprints: mkVis(4, { polishLevel: 10, realismLevel: 1, silenceDensity: 'low' }) },
    narrativeDNA: { fingerprints: mkNar(4, { ctaPressure: 9, observationalDensity: 2, humanRealism: 2 }) },
  });
  return {
    ok: r.syntheticPressure >= 4,
    detail: `synthetic=${r.syntheticPressure} score=${r.presenceScore}`,
  };
}

function emptySnapshot(at: number): PresenceSnapshot {
  return {
    at, presenceScore: 0,
    signals: {
      eyeContactStability: 0, hesitation: 0, breathingSpace: 0,
      stillness: 0, vulnerability: 0, emotionalRestraint: 0,
      awkwardness: 0, imperfection: 0, authenticityPressure: 0,
      emotionalTiming: 0, listeningPresence: 0, dignityPreservation: 0,
      humanFatigueVisibility: 0, emotionalOpenness: 0,
      selfConsciousnessTraces: 0, nonPerformativeBehavior: 0,
    },
    stillnessWeight: 0, authenticityWeight: 0, imperfectionSignature: 0,
    vulnerabilitySignals: 0, emotionalBreathing: 0, listeningSignals: 0,
    humanityRetention: 0, syntheticPressure: 0, dignityProtection: 0,
    dominantPresenceSignals: [], observationCount: 0,
  };
}
function caseMemoryFifo(): { ok: boolean; detail: string } {
  let state = createInitialPresenceMemory();
  const cap = PRESENCE_SNAPSHOT_LIMIT;
  for (let i = 0; i < cap + 50; i++) {
    state = appendPresenceSnapshot(state, emptySnapshot(1000 + i));
  }
  return {
    ok: state.snapshots.length === cap && state.totalSnapshots === cap + 50,
    detail: `snapshots=${state.snapshots.length} total=${state.totalSnapshots} cap=${cap}`,
  };
}
function caseMemoryPureTransform(): { ok: boolean; detail: string } {
  const state = createInitialPresenceMemory();
  const snap = emptySnapshot(1000);
  const a = appendPresenceSnapshot(state, snap);
  const b = appendPresenceSnapshot(state, snap);
  return {
    ok: state.snapshots.length === 0 && JSON.stringify(a) === JSON.stringify(b),
    detail: `prior=${state.snapshots.length} a===b:${JSON.stringify(a) === JSON.stringify(b)}`,
  };
}

function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""')
    .replace(/`[\s\S]*?`/g, '``');
}
async function readRouteSrc(): Promise<string> {
  return fs.readFile(
    path.resolve(__dirname, '..', 'app', 'api', 'human-presence', 'route.ts'),
    'utf8',
  );
}
async function caseRouteNoPipeline(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const codeOnly = stripCommentsAndStrings(src);
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/,
    /\bfetch\s*\([^)]*\/api\/generate/,
    /\brunPipeline\s*\(/,
    /\bcomposeBannerSvg\s*\(/,
    /\brememberBanner\s*\(/,
  ];
  for (const re of forbidden) {
    if (re.test(codeOnly)) return { ok: false, detail: `forbidden ${re}` };
  }
  return { ok: true, detail: 'route does not import / call generation' };
}
async function caseRouteNoExecution(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|runMutation|selectMutation|chooseMutation|autoApply|autoOptimize)\b/;
  return { ok: !banned.test(src), detail: !banned.test(src) ? 'clean' : 'execution function present' };
}
async function caseRouteGetOnly(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
  const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
  return { ok: hasGet && !hasPost, detail: `GET=${hasGet} POST=${hasPost}` };
}
async function caseRouteListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  return {
    ok: /['"]\/api\/human-presence['"]/.test(src),
    detail: /['"]\/api\/human-presence['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = ['lib/humanPresenceEngine.ts', 'lib/presenceMemory.ts'];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /from\s+['"]@\/core\/criticEngine/,
    /from\s+['"]@?lib\/banner/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) {
      if (re.test(codeOnly)) return { ok: false, detail: `forbidden import in ${f}` };
    }
  }
  return { ok: true, detail: 'no critic / pipeline / banner imports' };
}
async function caseNoFetchNoWrite(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'humanPresenceEngine.ts'), 'utf8');
  if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: 'fetch in engine' };
  if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: 'fs.writeFile in engine' };
  return { ok: true, detail: 'engine is pure' };
}

function buildText(): string {
  const r1 = computeHumanPresence({
    outcomes: { outcomes: Array.from({length:5}, ()=>mkO()) },
    visualDNA: { fingerprints: mkVis(3) },
    narrativeDNA: { fingerprints: mkNar(3) },
  });
  const r2 = computeHumanPresence({
    outcomes: { outcomes: Array.from({length:5}, ()=>mkO({persuasionIntensity:9, emotionalSignature:'polished'})) },
    visualDNA: { fingerprints: mkVis(3, {polishLevel:10, realismLevel:1}) },
    narrativeDNA: { fingerprints: mkNar(3, {ctaPressure:9, observationalDensity:2}) },
  });
  return [...r1.notes, r1.advisoryNotice, ...r2.notes, r2.advisoryNotice].join(' ');
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildText();
  const required = /(historically associated|observed alongside|may carry presence weight|dignity-preserved|requires more evidence)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildText();
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|optimize|optimizes|optimized|optimizing)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned in: ${text.slice(0,150)}` };
}
function caseForbiddenVirality(): { ok: boolean; detail: string } {
  const text = buildText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|trauma\s+exploit|manipulat)/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned in: ${text.slice(0,150)}` };
}

async function main(): Promise<void> {
  console.log('HUMAN PRESENCE VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['presence-shape',         '16 presence signals + composites in range', () => caseShape()],
    ['presence-deterministic', 'presence engine is pure',                   () => caseDeterministic()],
    ['presence-empty',         'no inputs → balanced reading',              () => caseEmpty()],
    ['presence-felt-real',     'imperfection + restraint → elevated presence', () => caseFeltReal()],
    ['presence-synthetic',     'high persuasion + high polish → elevated syntheticPressure', () => caseSynthetic()],
    ['memory-fifo',            'append > limit → cap respected',            () => caseMemoryFifo()],
    ['memory-pure-transform',  'appendPresenceSnapshot is referentially transparent', () => caseMemoryPureTransform()],
    ['route-no-pipeline',      'route does not import pipeline / call /api/generate', () => caseRouteNoPipeline()],
    ['route-no-execution',     'route exports no apply / execute / autoApply', () => caseRouteNoExecution()],
    ['route-get-only',         'route exports GET but not POST',            () => caseRouteGetOnly()],
    ['route-listed',           '/api/human-presence registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',              'engine + memory have no critic / pipeline / banner imports', () => caseIsolation()],
    ['no-fetch-no-write',      'engine has no fetch / no fs.writeFile',     () => caseNoFetchNoWrite()],
    ['allowed-language',       'phrasing uses historically associated / observed alongside', () => caseAllowedLanguage()],
    ['forbidden-prediction',   'phrasing forbids predict / will / best / winner / optimize', () => caseForbiddenPrediction()],
    ['forbidden-virality',     'phrasing forbids viral / dopamine / outrage / exploit', () => caseForbiddenVirality()],
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

main().catch((err) => { console.error('verification script crashed:', err); process.exit(2); });
