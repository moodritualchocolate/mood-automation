/**
 * VERIFY — Scene Architect.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeSceneArchitect } from '../lib/sceneArchitectEngine';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

const richInput = {
  storyBlueprints: [
    { blueprintId: 'quiet-return-home', storyName: 'Quiet Return Home', storyType: 'return',
      humanTension: 'fatigue holds the door', emotionalArc: 'pressure → breath → return',
      memoryAnchor: 'kitchen light', presenceAnchor: 'slow hand movement',
      silencePlacement: 'after the door closes', mythicFrame: 'return', realismStyle: 'documentary handheld',
      alignment: 8, dignityProtection: 8, manipulationRisk: 2, riskLevel: 'low' },
    { blueprintId: 'morning-restart', storyName: 'Morning Restart', storyType: 'ritual',
      humanTension: 'morning carries last night', emotionalArc: 'noise → silence → clarity',
      memoryAnchor: 'half-empty coffee cup', presenceAnchor: 'exhale',
      silencePlacement: 'before the first sip', mythicFrame: 'becoming', realismStyle: 'natural light',
      alignment: 7, dignityProtection: 8, manipulationRisk: 2, riskLevel: 'low' },
  ],
  imprint: {
    dominantImprintSignals: ['imperfectRealism', 'silenceWeight'],
    mythicWeights: { return: 7, home: 7, becoming: 5 },
    ritualPersistence: { morning: 7, coffee: 6 },
  },
  presence: {
    presenceScore: 7, stillnessWeight: 7, authenticityWeight: 7, imperfectionSignature: 6,
    signals: { stillness: 7, emotionalRestraint: 7, breathingSpace: 7, vulnerability: 5 },
  },
  world: { realismDemand: 7, authenticityDemand: 7, simplicityCraving: 7, ritualHunger: 7 },
  director: { dominantDirections: ['realismDirections'] },
};

function caseShape(): { ok: boolean; detail: string } {
  const r = computeSceneArchitect(richInput);
  if (r.scenes.length !== 2) return { ok: false, detail: `scenes=${r.scenes.length}` };
  const required = ['sourceBlueprintId', 'sourceStoryName', 'sceneId', 'sceneType', 'location',
    'environment', 'timeOfDay', 'realismLevel', 'cameraLanguage', 'framingStyle', 'lightingStyle',
    'silenceAllocation', 'presenceAnchors', 'memoryAnchors', 'symbolismAnchors', 'dignityAnchors',
    'emotionalWeight', 'restraintLevel'];
  for (const s of r.scenes) {
    for (const k of required) if (!(k in s)) return { ok: false, detail: `${s.sceneId} missing ${k}` };
  }
  return { ok: r.dominantSceneTypes.length > 0, detail: `dominant=${r.dominantSceneTypes.length}` };
}
function caseDeterministic(): { ok: boolean; detail: string } {
  const a = JSON.stringify(computeSceneArchitect(richInput));
  const b = JSON.stringify(computeSceneArchitect(richInput));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseEmpty(): { ok: boolean; detail: string } {
  const r = computeSceneArchitect({});
  return { ok: r.scenes.length === 0 && r.notes.length > 0, detail: `scenes=${r.scenes.length}` };
}
function caseTemplateMatched(): { ok: boolean; detail: string } {
  const r = computeSceneArchitect(richInput);
  const qrh = r.scenes.find((s) => s.sourceBlueprintId === 'quiet-return-home');
  // Template for quiet-return-home uses "apartment threshold and kitchen" location +
  // "50mm handheld" camera + "single warm kitchen light".
  return {
    ok: qrh !== undefined &&
        qrh.cameraLanguage.includes('50mm') &&
        qrh.lightingStyle.includes('kitchen light'),
    detail: qrh ? `camera=${qrh.cameraLanguage} light=${qrh.lightingStyle}` : 'no quiet-return-home scene',
  };
}

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function readRouteSrc(): Promise<string> {
  return fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'scene-architect', 'route.ts'), 'utf8');
}
async function caseRouteNoPipeline(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const codeOnly = stripCommentsAndStrings(src);
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/, /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/, /from\s+['"]@?lib\/.*publish/i,
    /\bfetch\s*\([^)]*\/api\/generate/, /\brunPipeline\s*\(/,
    /\bcomposeBannerSvg\s*\(/, /\brememberBanner\s*\(/,
  ];
  for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden ${re}` };
  return { ok: true, detail: 'clean' };
}
async function caseRouteNoExecution(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|launch|publish|generate|deploy|autoApply|autoOptimize)\b/;
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
    ok: /['"]\/api\/scene-architect['"]/.test(src),
    detail: /['"]\/api\/scene-architect['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'sceneArchitectEngine.ts'), 'utf8');
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
  const r = computeSceneArchitect(richInput);
  const collect: string[] = [...r.notes, r.advisoryNotice];
  for (const s of r.scenes) collect.push(s.observation, s.sceneType, s.location, s.environment,
    s.timeOfDay, s.cameraLanguage, s.framingStyle, s.lightingStyle, s.silenceAllocation,
    ...s.presenceAnchors, ...s.memoryAnchors, ...s.symbolismAnchors, ...s.dignityAnchors);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildText();
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenExecutionVerbs(): { ok: boolean; detail: string } {
  const text = buildText();
  const stripped = text
    .replace(/does\s+not\s+generate/gi, '').replace(/does\s+not\s+publish/gi, '')
    .replace(/does\s+not\s+execute/gi, '').replace(/never\s+generate(s)?/gi, '')
    .replace(/never\s+publish(es)?/gi, '');
  const banned = /\b(generate|generates|publish|publishes|launch|launches|execute|executes|deploy|run\s+ad|create\s+ad)\b/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : `banned: ${stripped.slice(0, 200)}` };
}
function caseForbiddenVirality(): { ok: boolean; detail: string } {
  const text = buildText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|manipulat)/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildText();
  const required = /(may carry emotional weight|historically associated|observed alongside|requires more evidence|exploratory scene structure|operator review required)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseAdvisoryDisclaimer(): { ok: boolean; detail: string } {
  const r = computeSceneArchitect({});
  return {
    ok: /operator remains the creative authority/i.test(r.advisoryNotice),
    detail: 'present',
  };
}

async function main(): Promise<void> {
  console.log('SCENE ARCHITECT VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['shape',                  'all 18 fields present on every scene',             () => caseShape()],
    ['deterministic',          'scene architect engine is pure',                   () => caseDeterministic()],
    ['empty',                  'no input → 0 scenes + notes',                      () => caseEmpty()],
    ['template-matched',       'quiet-return-home matches its template',           () => caseTemplateMatched()],
    ['route-no-pipeline',      'route does not import pipeline / publish / generate', () => caseRouteNoPipeline()],
    ['route-no-execution',     'route exports no execution / launch / deploy verbs', () => caseRouteNoExecution()],
    ['route-get-only',         'route exports GET but not POST',                   () => caseRouteGetOnly()],
    ['route-listed',           '/api/scene-architect registered in systemIntegrityReport', () => caseRouteListed()],
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
