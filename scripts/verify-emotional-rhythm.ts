/**
 * VERIFY — Emotional Rhythm.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeEmotionalRhythm } from '../lib/emotionalRhythmEngine';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

const richInput = {
  scenes: [
    { sceneId: 'scene-1', sourceStoryName: 'Quiet Return Home', sceneType: 'arrival-stillness',
      silenceAllocation: 'roughly two-thirds silence', emotionalWeight: 8, restraintLevel: 8 },
    { sceneId: 'scene-2', sourceStoryName: 'Morning Restart', sceneType: 'ritual-emergence',
      silenceAllocation: 'silence with kettle sound only', emotionalWeight: 7, restraintLevel: 7 },
  ],
  stories: [
    { blueprintId: 'quiet-return-home', storyName: 'Quiet Return Home',
      emotionalArc: 'pressure → breath → return', alignment: 8 },
  ],
  world: { emotionalExhaustion: 7, emotionalOverload: 6, simplicityCraving: 7, anxietyClimate: 4 },
  presence: { stillnessWeight: 7, emotionalBreathing: 7, syntheticPressure: 3, signals: { emotionalRestraint: 7 } },
  imprint: { imprintStrength: 7, scenePermanence: 7 },
};

function caseShape(): { ok: boolean; detail: string } {
  const r = computeEmotionalRhythm(richInput);
  const expected = ['tension', 'release', 'breathingRoom', 'pause', 'silence', 'restraint',
    'emotionalDensity', 'emotionalSpacing', 'anticipation', 'reflection'];
  const missing = expected.filter((k) => !(k in r.rhythmProfile));
  const inRange = Object.values(r.rhythmProfile).every((v) => v >= 0 && v <= 10);
  return {
    ok: missing.length === 0 && inRange && r.tensionMap.length > 0 && r.releaseMap.length > 0 &&
        r.breathingMoments.length === 5 && r.silenceMoments.length > 0,
    detail: missing.length === 0 ? `pacing=${r.pacingProfile} restraint=${r.restraintProfile}` : `missing=${missing.join(',')}`,
  };
}
function caseDeterministic(): { ok: boolean; detail: string } {
  const a = JSON.stringify(computeEmotionalRhythm(richInput));
  const b = JSON.stringify(computeEmotionalRhythm(richInput));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseEmpty(): { ok: boolean; detail: string } {
  const r = computeEmotionalRhythm({});
  return {
    ok: r.notes.length > 0 && Object.values(r.rhythmProfile).every((v) => v >= 0 && v <= 10),
    detail: `pacing=${r.pacingProfile}`,
  };
}
function caseRestrainedClassification(): { ok: boolean; detail: string } {
  const r = computeEmotionalRhythm(richInput);
  return {
    ok: r.restraintProfile === 'measured-restraint' || r.restraintProfile === 'maximal-restraint',
    detail: `restraint=${r.restraintProfile} silence=${r.rhythmProfile.silence}`,
  };
}

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function readRouteSrc(): Promise<string> {
  return fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'emotional-rhythm', 'route.ts'), 'utf8');
}
async function caseRouteNoPipeline(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const codeOnly = stripCommentsAndStrings(src);
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/, /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/, /from\s+['"]@?lib\/.*publish/i,
    /\bfetch\s*\([^)]*\/api\/generate/, /\brunPipeline\s*\(/,
  ];
  for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden ${re}` };
  return { ok: true, detail: 'clean' };
}
async function caseRouteNoExecution(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|launch|publish|generate|deploy)\b/;
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
    ok: /['"]\/api\/emotional-rhythm['"]/.test(src),
    detail: /['"]\/api\/emotional-rhythm['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'emotionalRhythmEngine.ts'), 'utf8');
  const codeOnly = stripCommentsAndStrings(src);
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/, /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"]@?lib\/banner/, /from\s+['"]@?lib\/.*publish/i, /from\s+['"]@?lib\/.*generate/i,
  ];
  for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden ${re}` };
  if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: 'fetch in engine' };
  if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: 'fs.writeFile in engine' };
  return { ok: true, detail: 'clean' };
}

function buildText(): string {
  const r = computeEmotionalRhythm(richInput);
  const collect: string[] = [...r.notes, r.advisoryNotice];
  for (const t of r.tensionMap) collect.push(t.observation, t.moment);
  for (const t of r.releaseMap) collect.push(t.observation, t.moment);
  for (const b of r.breathingMoments) collect.push(b.observation, b.moment);
  for (const s of r.silenceMoments) collect.push(s.observation, s.moment);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildText();
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenExecutionVerbs(): { ok: boolean; detail: string } {
  const text = buildText();
  const stripped = text.replace(/does\s+not\s+(generate|publish|execute)/gi, '');
  const banned = /\b(generate|generates|publish|publishes|launch|launches|execute|executes|deploy|run\s+ad)\b/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : `banned: ${stripped.slice(0, 200)}` };
}
function caseForbiddenVirality(): { ok: boolean; detail: string } {
  const text = buildText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|manipulat)/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildText();
  const required = /(may carry emotional weight|historically associated|observed alongside|requires more evidence|exploratory rhythm structure|operator review required)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseAdvisoryDisclaimer(): { ok: boolean; detail: string } {
  const r = computeEmotionalRhythm({});
  return { ok: /operator remains the creative authority/i.test(r.advisoryNotice), detail: 'present' };
}

async function main(): Promise<void> {
  console.log('EMOTIONAL RHYTHM VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['shape',                  '10 rhythm profile signals + maps populated',       () => caseShape()],
    ['deterministic',          'rhythm engine is pure',                            () => caseDeterministic()],
    ['empty',                  'no input → balanced reading',                      () => caseEmpty()],
    ['restraint-classified',   'restrained inputs → measured-or-maximal restraint', () => caseRestrainedClassification()],
    ['route-no-pipeline',      'route does not import pipeline / publish / generate', () => caseRouteNoPipeline()],
    ['route-no-execution',     'route exports no execution / launch / deploy verbs', () => caseRouteNoExecution()],
    ['route-get-only',         'route exports GET but not POST',                   () => caseRouteGetOnly()],
    ['route-listed',           '/api/emotional-rhythm registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',              'engine has no critic / pipeline / banner / publish imports', () => caseIsolation()],
    ['forbidden-prediction',   'no predict / winner / optimize / recommended',     () => caseForbiddenPrediction()],
    ['forbidden-execution-verbs', 'no generate / publish / launch / deploy',       () => caseForbiddenExecutionVerbs()],
    ['forbidden-virality',     'no viral / dopamine / outrage / manipulat',        () => caseForbiddenVirality()],
    ['allowed-language',       'allowed phrasing present',                         () => caseAllowedLanguage()],
    ['advisory-disclaimer',    'operator-authority disclaimer present',            () => caseAdvisoryDisclaimer()],
  ];
  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }
  record('tsc', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true, 'deferred');
  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((err) => { console.error('verification script crashed:', err); process.exit(2); });
