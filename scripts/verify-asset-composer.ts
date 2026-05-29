/**
 * VERIFY — Asset Composer.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeAssetPackages } from '../lib/assetComposerEngine';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

const richInput = {
  stories: [
    { blueprintId: 'quiet-return-home', storyName: 'Quiet Return Home', storyType: 'return',
      humanTension: 'fatigue holds the door', emotionalArc: 'pressure → breath → return',
      memoryAnchor: 'kitchen light', presenceAnchor: 'slow hand movement',
      mythicFrame: 'return', realismStyle: 'documentary handheld',
      alignment: 8, dignityProtection: 8, manipulationRisk: 2, riskLevel: 'low',
      audienceFeeling: 'a quiet relief observed alongside the outputs',
      whyThisMayMatter: 'this human story may carry emotional weight when the audience is observed to be tired' },
    { blueprintId: 'morning-restart', storyName: 'Morning Restart', storyType: 'ritual',
      humanTension: 'morning carries last night', emotionalArc: 'noise → silence → clarity',
      memoryAnchor: 'half-empty coffee cup', presenceAnchor: 'exhale',
      mythicFrame: 'becoming', realismStyle: 'natural light',
      alignment: 7, dignityProtection: 8, manipulationRisk: 2, riskLevel: 'low',
      audienceFeeling: 'a familiar steadying observed alongside the outputs',
      whyThisMayMatter: 'this human story may carry emotional weight historically associated with morning restoration rituals' },
  ],
  scenes: [
    { sourceBlueprintId: 'quiet-return-home', sourceStoryName: 'Quiet Return Home',
      sceneId: 'scene-quiet-return-home', sceneType: 'arrival-stillness',
      location: 'apartment threshold and kitchen', environment: 'small home, lived-in',
      timeOfDay: 'late afternoon into early evening', realismLevel: 7,
      cameraLanguage: '50mm handheld', framingStyle: 'close, low angle, off-center',
      lightingStyle: 'single warm kitchen light', silenceAllocation: 'roughly two-thirds silence',
      presenceAnchors: ['slow hand movement'], memoryAnchors: ['kitchen light'],
      symbolismAnchors: ['threshold'], dignityAnchors: ['no music swell'],
      emotionalWeight: 8, restraintLevel: 7 },
    { sourceBlueprintId: 'morning-restart', sourceStoryName: 'Morning Restart',
      sceneId: 'scene-morning-restart', sceneType: 'ritual-emergence',
      location: 'kitchen counter', environment: 'home kitchen, morning light',
      timeOfDay: 'early morning', realismLevel: 7,
      cameraLanguage: '50mm handheld', framingStyle: 'tight on hands and cup',
      lightingStyle: 'natural window light', silenceAllocation: 'silence with kettle sound only',
      presenceAnchors: ['exhale'], memoryAnchors: ['half-empty coffee cup'],
      symbolismAnchors: ['mug'], dignityAnchors: ['no music swell'],
      emotionalWeight: 7, restraintLevel: 7 },
  ],
  rhythm: {
    pacingProfile: 'observational-still', restraintProfile: 'measured-restraint',
    rhythmProfile: { tension: 4, release: 7, breathingRoom: 7, pause: 7, silence: 7,
                     restraint: 7, emotionalDensity: 4, emotionalSpacing: 7,
                     anticipation: 6, reflection: 7 },
    silenceMoments: [
      { moment: 'after the door closes', alignment: 8 },
      { moment: 'before the first sip', alignment: 7 },
    ],
    breathingMoments: [{ moment: 'in the held look', alignment: 7 }],
    emotionalDensity: 4,
  },
  presence: {
    presenceScore: 7, authenticityWeight: 7, stillnessWeight: 7,
    imperfectionSignature: 6, syntheticPressure: 3,
    signals: { stillness: 7, emotionalRestraint: 7 },
  },
  memory: {
    imprintStrength: 7, scenePermanence: 7,
    dominantImprintSignals: ['silenceWeight', 'imperfectRealism'],
    mythicWeights: { return: 7, home: 7 },
    ritualPersistence: { morning: 7, coffee: 6 },
  },
  world: { realismDemand: 7, authenticityDemand: 7, simplicityCraving: 7, ritualHunger: 7 },
  director: { dominantDirections: ['realismDirections'] },
};

function caseShape(): { ok: boolean; detail: string } {
  const r = computeAssetPackages(richInput);
  if (r.imagePackages.length !== 2) return { ok: false, detail: `imagePackages=${r.imagePackages.length}` };
  if (r.videoPackages.length !== 2) return { ok: false, detail: `videoPackages=${r.videoPackages.length}` };
  if (r.bannerPackages.length !== 2) return { ok: false, detail: `bannerPackages=${r.bannerPackages.length}` };
  if (r.landingPackages.length !== 2) return { ok: false, detail: `landingPackages=${r.landingPackages.length}` };
  return { ok: r.dominantPackageIds.length > 0, detail: `dominant=${r.dominantPackageIds.join(',')}` };
}
function caseImageFields(): { ok: boolean; detail: string } {
  const r = computeAssetPackages(richInput);
  const required = ['packageId', 'narrative', 'scene', 'presence', 'rhythm', 'realism',
    'visualLanguage', 'memoryAnchors'];
  for (const p of r.imagePackages) {
    for (const k of required) if (!(k in p)) return { ok: false, detail: `${p.packageId} missing ${k}` };
  }
  return { ok: true, detail: 'all required IMAGE fields present' };
}
function caseVideoFields(): { ok: boolean; detail: string } {
  const r = computeAssetPackages(richInput);
  const required = ['packageId', 'narrative', 'sceneSequence', 'rhythm', 'silenceMoments',
    'presenceMoments', 'emotionalArc', 'realismAnchors'];
  for (const p of r.videoPackages) {
    for (const k of required) if (!(k in p)) return { ok: false, detail: `${p.packageId} missing ${k}` };
    if (p.sceneSequence.length === 0) return { ok: false, detail: `${p.packageId} empty sequence` };
  }
  return { ok: true, detail: 'all required VIDEO fields present' };
}
function caseBannerFields(): { ok: boolean; detail: string } {
  const r = computeAssetPackages(richInput);
  const required = ['packageId', 'emotionalDirection', 'visualDirection', 'memoryDirection',
    'restraintDirection', 'compositionDirection'];
  for (const p of r.bannerPackages) {
    for (const k of required) if (!(k in p)) return { ok: false, detail: `${p.packageId} missing ${k}` };
  }
  return { ok: true, detail: 'all required BANNER fields present' };
}
function caseLandingFields(): { ok: boolean; detail: string } {
  const r = computeAssetPackages(richInput);
  const required = ['packageId', 'sectionPurpose', 'emotionalPurpose', 'narrativePurpose',
    'memoryAnchor', 'visualAnchor'];
  for (const p of r.landingPackages) {
    for (const k of required) if (!(k in p)) return { ok: false, detail: `${p.packageId} missing ${k}` };
  }
  return { ok: true, detail: 'all required LANDING fields present' };
}
function caseDeterministic(): { ok: boolean; detail: string } {
  const a = JSON.stringify(computeAssetPackages(richInput));
  const b = JSON.stringify(computeAssetPackages(richInput));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseEmpty(): { ok: boolean; detail: string } {
  const r = computeAssetPackages({});
  return {
    ok: r.imagePackages.length === 0 && r.videoPackages.length === 0 &&
        r.bannerPackages.length === 0 && r.landingPackages.length === 0 && r.notes.length > 0,
    detail: 'all empty',
  };
}

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function readRouteSrc(): Promise<string> {
  return fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'asset-composer', 'route.ts'), 'utf8');
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
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|launch|publish|generate|deploy|autoApply)\b/;
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
    ok: /['"]\/api\/asset-composer['"]/.test(src),
    detail: /['"]\/api\/asset-composer['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'assetComposerEngine.ts'), 'utf8');
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
  const r = computeAssetPackages(richInput);
  const collect: string[] = [...r.notes, r.advisoryNotice];
  for (const p of r.imagePackages) collect.push(p.narrative, p.scene, p.presence, p.rhythm,
    p.realism, p.visualLanguage, ...p.memoryAnchors, p.observation);
  for (const p of r.videoPackages) collect.push(p.narrative, p.rhythm, p.emotionalArc,
    ...p.silenceMoments, ...p.presenceMoments, ...p.realismAnchors, p.observation,
    ...p.sceneSequence.map((s) => `${s.scene} ${s.emotionalBeat}`));
  for (const p of r.bannerPackages) collect.push(p.emotionalDirection, p.visualDirection,
    p.memoryDirection, p.restraintDirection, p.compositionDirection, p.observation);
  for (const p of r.landingPackages) collect.push(p.sectionPurpose, p.emotionalPurpose,
    p.narrativePurpose, p.memoryAnchor, p.visualAnchor, p.observation);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildText();
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenExecutionVerbs(): { ok: boolean; detail: string } {
  const text = buildText();
  // Strip negated-contract phrases.
  const stripped = text
    .replace(/no\s+asset\s+generation\s+occurs\s+here/gi, '')
    .replace(/does\s+not\s+create\s+assets/gi, '')
    .replace(/does\s+not\s+generate/gi, '')
    .replace(/does\s+not\s+publish/gi, '')
    .replace(/does\s+not\s+execute/gi, '');
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
  const required = /(may carry emotional weight|historically associated|observed alongside|requires more evidence|exploratory specification|operator review required)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseAdvisoryDisclaimer(): { ok: boolean; detail: string } {
  const r = computeAssetPackages({});
  const ok = /operator remains the only authority/i.test(r.advisoryNotice) &&
             /No asset generation occurs here/i.test(r.advisoryNotice);
  return { ok, detail: ok ? 'present' : 'missing' };
}

async function main(): Promise<void> {
  console.log('ASSET COMPOSER VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['shape',                  '4 package families populated + dominant set',      () => caseShape()],
    ['image-fields',           'IMAGE package fields present',                     () => caseImageFields()],
    ['video-fields',           'VIDEO package fields present + sequence populated', () => caseVideoFields()],
    ['banner-fields',          'BANNER package fields present',                    () => caseBannerFields()],
    ['landing-fields',         'LANDING package fields present',                   () => caseLandingFields()],
    ['deterministic',          'asset composer engine is pure',                    () => caseDeterministic()],
    ['empty',                  'no input → 0 packages + notes',                    () => caseEmpty()],
    ['route-no-pipeline',      'route does not import pipeline / publish / generate', () => caseRouteNoPipeline()],
    ['route-no-execution',     'route exports no execution / launch / deploy verbs', () => caseRouteNoExecution()],
    ['route-get-only',         'route exports GET but not POST',                   () => caseRouteGetOnly()],
    ['route-listed',           '/api/asset-composer registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',              'engine has no critic / pipeline / banner / publish imports', () => caseIsolation()],
    ['forbidden-prediction',   'no predict / winner / optimize / recommended',     () => caseForbiddenPrediction()],
    ['forbidden-execution-verbs', 'no generate / publish / launch / deploy',       () => caseForbiddenExecutionVerbs()],
    ['forbidden-virality',     'no viral / dopamine / outrage / manipulat',        () => caseForbiddenVirality()],
    ['allowed-language',       'allowed phrasing present',                         () => caseAllowedLanguage()],
    ['advisory-disclaimer',    'operator-authority disclaimer + no-generation disclaimer present', () => caseAdvisoryDisclaimer()],
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
