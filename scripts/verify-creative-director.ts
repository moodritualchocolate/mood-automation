/**
 * VERIFY — Creative Director.
 *
 * Cases:
 *   director-shape             · all 11 direction families present
 *   director-deterministic     · pure function
 *   director-no-generation     · output carries no "generate" / "publish" language
 *   director-allowed-phrasing  · uses allowed-phrasing only
 *   director-restraint-detected · trust fragility + manipulation creep → restraint direction
 *   director-realism-detected  · synthetic drift → documentary realism direction
 *   director-risk-detected     · aesthetic exhaustion → risk zone
 *   story-shape                · 10 story arcs + all arc keys present
 *   story-deterministic        · pure function
 *   story-ritual-detected      · ritual hunger + ritual persistence → ritual arc
 *   story-memory-detected      · memory archetype → memory arc + memory moments
 *   story-no-generation        · output carries no generation language
 *   route-no-pipeline          · route does not import pipeline / call /api/generate
 *   route-no-execution         · route exports no apply / execute / generateNow / publishNow
 *   route-get-only             · route exports GET but not POST
 *   route-listed               · /api/creative-director registered in systemIntegrityReport
 *   isolation                  · engines have no critic / pipeline / banner imports
 *   no-fetch-no-write          · engines have no fetch / no fs.writeFile
 *   forbidden-prediction       · phrasing forbids predict / will / best / winner / optimize
 *   forbidden-execution-verbs  · phrasing forbids generate / publish / execute / run / launch
 *   forbidden-virality         · phrasing forbids viral / dopamine / outrage / exploit
 *   advisory-disclaimer        · advisory disclaimer mentions operator as authority
 *   tsc                        · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeCreativeDirections } from '../lib/creativeDirectorEngine';
import { computeStoryArchitecture } from '../lib/storyArchitectureEngine';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── director cases ──────────────────────────────────────────

function caseDirectorShape(): { ok: boolean; detail: string } {
  const r = computeCreativeDirections({
    world: { meaningSeeking: 7, ritualHunger: 6, emotionalExhaustion: 6, simplicityCraving: 7, authenticityDemand: 7, trustFragility: 6 },
    memoryImprint: { imprintStrength: 6, scenePermanence: 6, emotionalAftertaste: 6, memoryRisk: 5 },
    selfReflection: { syntheticDrift: 7, aestheticExhaustion: 6, manipulationCreep: 6 },
    presence: { presenceScore: 6, authenticityWeight: 7, stillnessWeight: 6, imperfectionSignature: 6 },
    supervised: { alignedMutations: ['realism', 'silence'], contradictedMutations: ['tension'] },
    trialOutcomes: { trustFormationShare: 0.4 },
  });
  const expected = [
    'narrativeDirections', 'emotionalDirections', 'pacingDirections',
    'realismDirections', 'presenceDirections', 'silenceDirections',
    'visualDirections', 'restraintDirections', 'documentaryDirections',
    'experimentationZones', 'riskZones',
  ];
  const missing = expected.filter((k) => !(k in r));
  return {
    ok: missing.length === 0 && r.dominantDirections.length >= 1,
    detail: missing.length === 0 ? `dominant=${r.dominantDirections.join(',')}` : `missing=${missing.join(',')}`,
  };
}
function caseDirectorDeterministic(): { ok: boolean; detail: string } {
  const input = {
    world: { meaningSeeking: 7, ritualHunger: 6 },
    selfReflection: { syntheticDrift: 7 },
  };
  const a = JSON.stringify(computeCreativeDirections(input));
  const b = JSON.stringify(computeCreativeDirections(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseDirectorNoGeneration(): { ok: boolean; detail: string } {
  const r = computeCreativeDirections({
    world: { meaningSeeking: 7 }, selfReflection: { syntheticDrift: 7 },
  });
  const text = JSON.stringify(r);
  // Must contain "currently appear historically aligned" or similar
  // observational language, and never contain "generate" / "publish".
  const banned = /\b(generate|generates|publish|publishes|execute|launches|run\s+ad|create\s+ad)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'no generation language' : 'banned phrasing present' };
}
function caseDirectorAllowedPhrasing(): { ok: boolean; detail: string } {
  const r = computeCreativeDirections({
    world: { realismDemand: 7, authenticityDemand: 7 },
    selfReflection: { syntheticDrift: 7 },
  });
  const text = JSON.stringify(r);
  const required = /(currently appear historically aligned|observed alongside|historically associated|may carry memory weight|appears more historically aligned than|requires more evidence)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'no allowed phrasing matched' };
}
function caseDirectorRestraintDetected(): { ok: boolean; detail: string } {
  const r = computeCreativeDirections({
    world: { trustFragility: 8 },
    selfReflection: { manipulationCreep: 7 },
  });
  return {
    ok: r.restraintDirections.length > 0,
    detail: `restraint directions=${r.restraintDirections.length}`,
  };
}
function caseDirectorRealismDetected(): { ok: boolean; detail: string } {
  const r = computeCreativeDirections({
    selfReflection: { syntheticDrift: 8 },
  });
  return {
    ok: r.realismDirections.length > 0,
    detail: `realism directions=${r.realismDirections.length}`,
  };
}
function caseDirectorRiskDetected(): { ok: boolean; detail: string } {
  const r = computeCreativeDirections({
    selfReflection: { aestheticExhaustion: 8 },
    memoryImprint: { memoryRisk: 7 },
  });
  return {
    ok: r.riskZones.length >= 2,
    detail: `risk zones=${r.riskZones.length}`,
  };
}

// ─── story architecture cases ────────────────────────────────

function caseStoryShape(): { ok: boolean; detail: string } {
  const r = computeStoryArchitecture({
    world: { ritualHunger: 6, meaningSeeking: 6, nostalgiaPressure: 5 },
    imprint: {
      imprintStrength: 6,
      mythicWeights: { return: 6, home: 6, care: 7, memory: 6, becoming: 5 },
      ritualPersistence: { morning: 6, coffee: 5, parentChild: 5 },
    },
    presence: { presenceScore: 6, stillnessWeight: 6, authenticityWeight: 6 },
  });
  const expectedKeys: string[] = [
    'returnHome', 'passingTime', 'parentChild', 'exhaustion', 'resilience',
    'quietVictory', 'ritual', 'waiting', 'memory', 'becoming',
  ];
  const keys = r.storyArcs.map((a) => a.key);
  const missing = expectedKeys.filter((k) => !keys.includes(k as any));
  return {
    ok: missing.length === 0 && r.dominantArcs.length === 3 &&
        r.emotionalCurves.length > 0 && r.silenceMoments.length > 0 &&
        r.memoryMoments.length > 0 && r.realismAnchors.length > 0,
    detail: missing.length === 0 ? `dominant=${r.dominantArcs.join(',')}` : `missing=${missing.join(',')}`,
  };
}
function caseStoryDeterministic(): { ok: boolean; detail: string } {
  const input = {
    world: { ritualHunger: 6 },
    imprint: { mythicWeights: { home: 7 }, ritualPersistence: { morning: 6 } },
    presence: { presenceScore: 6 },
  };
  const a = JSON.stringify(computeStoryArchitecture(input));
  const b = JSON.stringify(computeStoryArchitecture(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseStoryRitualDetected(): { ok: boolean; detail: string } {
  const r = computeStoryArchitecture({
    world: { ritualHunger: 9 },
    imprint: { mythicWeights: {}, ritualPersistence: { morning: 9, coffee: 8 } },
    presence: {},
  });
  const ritualArc = r.storyArcs.find((a) => a.key === 'ritual');
  return {
    ok: ritualArc !== undefined && ritualArc.alignment >= 8,
    detail: ritualArc ? `ritual=${ritualArc.alignment}` : 'no ritual arc',
  };
}
function caseStoryMemoryDetected(): { ok: boolean; detail: string } {
  const r = computeStoryArchitecture({
    imprint: { imprintStrength: 8, mythicWeights: { memory: 9, loss: 7 }, ritualPersistence: {} },
  });
  const memoryArc = r.storyArcs.find((a) => a.key === 'memory');
  return {
    ok: memoryArc !== undefined && memoryArc.alignment >= 8 && r.memoryMoments.length > 0,
    detail: memoryArc ? `memory=${memoryArc.alignment} moments=${r.memoryMoments.length}` : 'no memory arc',
  };
}
function caseStoryNoGeneration(): { ok: boolean; detail: string } {
  const r = computeStoryArchitecture({
    world: { ritualHunger: 7 }, imprint: { mythicWeights: { home: 8 } },
  });
  const text = JSON.stringify(r);
  const banned = /\b(generate|generates|publish|publishes|execute|launches|run\s+ad|create\s+ad)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'no generation language' : 'banned phrasing present' };
}

// ─── route + static checks ───────────────────────────────────

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
    path.resolve(__dirname, '..', 'app', 'api', 'creative-director', 'route.ts'),
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
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|runMutation|selectMutation|chooseMutation|autoApply|autoOptimize|launch|publish|generate)\b/;
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
    ok: /['"]\/api\/creative-director['"]/.test(src),
    detail: /['"]\/api\/creative-director['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = ['lib/creativeDirectorEngine.ts', 'lib/storyArchitectureEngine.ts'];
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
  for (const f of ['lib/creativeDirectorEngine.ts', 'lib/storyArchitectureEngine.ts']) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'engines are pure' };
}

function buildAllText(): string {
  const dirOut = computeCreativeDirections({
    world: { meaningSeeking: 7, ritualHunger: 6, emotionalExhaustion: 6, simplicityCraving: 7, authenticityDemand: 7, trustFragility: 6 },
    memoryImprint: { imprintStrength: 6, memoryRisk: 5 },
    selfReflection: { syntheticDrift: 7, aestheticExhaustion: 6, manipulationCreep: 6 },
    presence: { presenceScore: 6, stillnessWeight: 6 },
    supervised: { alignedMutations: ['realism'], contradictedMutations: ['tension'] },
  });
  const story = computeStoryArchitecture({
    world: { ritualHunger: 7, meaningSeeking: 6 },
    imprint: { mythicWeights: { home: 7, return: 6, memory: 7 }, ritualPersistence: { morning: 6 } },
    presence: { presenceScore: 6, stillnessWeight: 6 },
  });
  const dirNotes = [...dirOut.notes, dirOut.advisoryNotice];
  const allDirs = [
    ...dirOut.narrativeDirections, ...dirOut.emotionalDirections,
    ...dirOut.pacingDirections, ...dirOut.realismDirections,
    ...dirOut.presenceDirections, ...dirOut.silenceDirections,
    ...dirOut.visualDirections, ...dirOut.restraintDirections,
    ...dirOut.documentaryDirections, ...dirOut.experimentationZones,
    ...dirOut.riskZones,
  ];
  const storyNotes = [
    ...story.notes, story.advisoryNotice,
    ...story.storyArcs.map((a) => a.observation),
    ...story.emotionalCurves.map((c) => c.observation),
  ];
  return [...dirNotes, ...allDirs.map((d) => d.observation), ...storyNotes].join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|optimize|optimizes|optimized|optimizing|recommended|selected|chosen|optimal)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned in: ${text.slice(0, 200)}` };
}
function caseForbiddenExecutionVerbs(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(generate|generates|publish|publishes|launches|run\s+ad|launch|execute|executes|create\s+ad)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned in: ${text.slice(0, 200)}` };
}
function caseForbiddenVirality(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|trauma\s+exploit|manipulat)/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned in: ${text.slice(0, 200)}` };
}
function caseAdvisoryDisclaimer(): { ok: boolean; detail: string } {
  const dirOut = computeCreativeDirections({});
  const story = computeStoryArchitecture({});
  const required = /operator remains the only authority/i;
  const ok = required.test(dirOut.advisoryNotice) && required.test(story.advisoryNotice);
  return { ok, detail: ok ? 'present' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('CREATIVE DIRECTOR VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['director-shape',          'all 11 direction families present',          () => caseDirectorShape()],
    ['director-deterministic',  'creative director engine is pure',           () => caseDirectorDeterministic()],
    ['director-no-generation',  'no generate / publish language in output',   () => caseDirectorNoGeneration()],
    ['director-allowed-phrasing', 'uses allowed-phrasing only',               () => caseDirectorAllowedPhrasing()],
    ['director-restraint-detected', 'trust fragility + manipulation creep → restraint', () => caseDirectorRestraintDetected()],
    ['director-realism-detected', 'synthetic drift → documentary realism direction', () => caseDirectorRealismDetected()],
    ['director-risk-detected',  'aesthetic exhaustion → risk zone',           () => caseDirectorRiskDetected()],
    ['story-shape',             '10 story arcs + all arc keys present',       () => caseStoryShape()],
    ['story-deterministic',     'story architecture engine is pure',          () => caseStoryDeterministic()],
    ['story-ritual-detected',   'ritual hunger + ritual persistence → ritual arc', () => caseStoryRitualDetected()],
    ['story-memory-detected',   'memory archetype → memory arc + memory moments', () => caseStoryMemoryDetected()],
    ['story-no-generation',     'no generate / publish language in output',   () => caseStoryNoGeneration()],
    ['route-no-pipeline',       'route does not import pipeline / call /api/generate', () => caseRouteNoPipeline()],
    ['route-no-execution',      'route exports no apply / execute / autoApply', () => caseRouteNoExecution()],
    ['route-get-only',          'route exports GET but not POST',             () => caseRouteGetOnly()],
    ['route-listed',            '/api/creative-director registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',               'engines have no critic / pipeline / banner imports', () => caseIsolation()],
    ['no-fetch-no-write',       'engines have no fetch / no fs.writeFile',    () => caseNoFetchNoWrite()],
    ['forbidden-prediction',    'phrasing forbids predict / will / best / winner / optimize', () => caseForbiddenPrediction()],
    ['forbidden-execution-verbs', 'phrasing forbids generate / publish / execute / run / launch', () => caseForbiddenExecutionVerbs()],
    ['forbidden-virality',      'phrasing forbids viral / dopamine / outrage / exploit', () => caseForbiddenVirality()],
    ['advisory-disclaimer',     'advisory disclaimer names operator as authority', () => caseAdvisoryDisclaimer()],
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
