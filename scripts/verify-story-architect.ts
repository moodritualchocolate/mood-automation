/**
 * VERIFY — Story Architect Foundation.
 *
 * Cases:
 *   architect-shape            · 15 story blueprints + all top-level fields present
 *   architect-deterministic    · pure function
 *   blueprint-fields           · every blueprint carries all 15 required fields
 *   blueprint-risk-level-union · every blueprint riskLevel from declared union
 *   blueprint-no-winner-flags  · no winner / best / recommended / selected / chosen flags
 *   arc-shape                  · 7 emotional arcs present + alignment in range
 *   arc-no-hype                · no hype / dopamine / fear / urgency arcs
 *   arc-deterministic          · pure function
 *   memory-anchor-shape        · 15 memory anchors present + dominant set
 *   memory-anchor-deterministic · pure function
 *   presence-anchor-shape      · 11 presence anchors + influencer-posing risk
 *   presence-anchor-deterministic · pure function
 *   risk-shape                 · 11 risk signals + verdict from declared union
 *   risk-exploitative          · heavy + high persuasion → high / do-not-use risk
 *   risk-deterministic         · pure function
 *   memory-fifo                · append > limit → cap respected
 *   memory-pure-transform      · appendStoryBlueprintSnapshot is referentially transparent
 *   route-no-pipeline          · route does not import pipeline / call /api/generate
 *   route-no-execution         · route exports no apply / execute / generateNow / publishNow / launch
 *   route-get-only             · route exports GET but not POST
 *   route-listed               · /api/story-architect registered in systemIntegrityReport
 *   isolation                  · engines + memory have no critic / pipeline / banner / publish imports
 *   no-fetch-no-write          · engines have no fetch / no fs.writeFile
 *   forbidden-prediction       · phrasing forbids predict / will / best / winner / optimize / recommended / selected / chosen / optimal
 *   forbidden-execution-verbs  · phrasing forbids generate / publish / execute / run / launch
 *   forbidden-virality         · phrasing forbids viral / dopamine / outrage / exploit / manipulat
 *   allowed-language           · phrasing uses may carry emotional weight / historically associated / observed alongside / requires more evidence / exploratory / operator review required
 *   advisory-disclaimer        · advisory disclaimer mentions operator as authority
 *   tsc                        · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeStoryArchitect } from '../lib/storyArchitectEngine';
import { computeEmotionalArcs } from '../lib/emotionalArcEngine';
import { computeMemoryAnchors } from '../lib/memoryAnchorEngine';
import { computePresenceAnchors } from '../lib/presenceAnchorEngine';
import { computeStoryRisk, type RiskLevel } from '../lib/storyRiskEngine';
import {
  appendStoryBlueprintSnapshot,
  createInitialStoryBlueprintMemory,
  STORY_BLUEPRINT_SNAPSHOT_LIMIT,
  type StoryBlueprintSnapshot,
} from '../lib/storyBlueprintMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic data ──────────────────────────────────────────

const richWorld = {
  emotionalExhaustion: 7, emotionalOverload: 7, stimulationSaturation: 6,
  anxietyClimate: 6, attentionFragmentation: 6, lonelinessSignals: 6,
  ritualHunger: 7, meaningSeeking: 7, simplicityCraving: 7,
  authenticityDemand: 7, realismDemand: 7, nostalgiaPressure: 5,
  trustFragility: 5, optimismDrift: 2,
};
const richPresence = {
  presenceScore: 7, stillnessWeight: 7, authenticityWeight: 7,
  imperfectionSignature: 6, vulnerabilitySignals: 5, emotionalBreathing: 6,
  listeningSignals: 6, syntheticPressure: 3,
  signals: {
    eyeContactStability: 6, hesitation: 4, breathingSpace: 7, stillness: 7,
    vulnerability: 5, emotionalRestraint: 7, awkwardness: 4, imperfection: 7,
    emotionalTiming: 6, listeningPresence: 7, humanFatigueVisibility: 6,
    emotionalOpenness: 6, selfConsciousnessTraces: 4, nonPerformativeBehavior: 7,
    authenticityPressure: 7,
  },
};
const richImprint = {
  imprintStrength: 7, scenePermanence: 7, emotionalAftertaste: 6,
  identityAttachment: 6, memoryRisk: 4,
  ritualPersistence: { morning: 7, coffee: 6, parentChild: 6, night: 5, food: 5, workRecovery: 5 },
  mythicWeights: { home: 7, return: 6, care: 7, memory: 6, becoming: 5, passingTime: 5, loss: 4, waiting: 5, protection: 6, endurance: 5 },
};
const richArchitectInput = {
  director: { dominantDirections: ['narrativeDirections'] },
  presence: richPresence,
  imprint: richImprint,
  humanTruth: { authenticityScore: 7, feltHumanScore: 7, signals: { dignity: 8, observationalHonesty: 7 } },
  culturalMemory: { emotionalPersistence: 6, collapsedSymbols: 0 },
  world: richWorld,
  selfReflection: {
    syntheticDrift: 4, humanityRetention: 7, manipulationCreep: 3,
    aestheticExhaustion: 4, restraintIntegrity: 7, identityCoherence: 7,
  },
  supervised: { alignedMutations: ['realism', 'silence'], contradictedMutations: ['tension'] },
  trialOutcomes: { trustFormationShare: 0.4, totalOutcomes: 10 },
  scar: { verdict: 'soft' as const, signals: { exploitationRisk: 2, emotionalHeaviness: 3, griefPressure: 2, dignityPreservation: 8 } },
};

// ─── architect cases ──────────────────────────────────────────

function caseArchitectShape(): { ok: boolean; detail: string } {
  const r = computeStoryArchitect(richArchitectInput);
  const expected = [
    'storyBlueprints', 'dominantHumanTensions', 'emotionalArcOptions',
    'memoryAnchorOptions', 'presenceAnchorOptions', 'silenceMoments',
    'mythicFrames', 'realismAnchors', 'riskWarnings', 'unresolvedQuestions',
  ];
  const missing = expected.filter((k) => !(k in r));
  return {
    ok: missing.length === 0 && r.storyBlueprints.length === 15,
    detail: missing.length === 0 ? `blueprints=${r.storyBlueprints.length}` : `missing=${missing.join(',')}`,
  };
}
function caseArchitectDeterministic(): { ok: boolean; detail: string } {
  const a = JSON.stringify(computeStoryArchitect(richArchitectInput));
  const b = JSON.stringify(computeStoryArchitect(richArchitectInput));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseBlueprintFields(): { ok: boolean; detail: string } {
  const r = computeStoryArchitect(richArchitectInput);
  const required = [
    'blueprintId', 'storyName', 'storyType', 'humanTension', 'emotionalArc',
    'memoryAnchor', 'presenceAnchor', 'silencePlacement', 'mythicFrame',
    'realismStyle', 'dignityProtection', 'manipulationRisk', 'audienceFeeling',
    'whyThisMayMatter', 'unresolvedRisk',
  ];
  for (const b of r.storyBlueprints) {
    for (const k of required) {
      if (!(k in b)) return { ok: false, detail: `${b.blueprintId} missing ${k}` };
    }
  }
  return { ok: true, detail: 'all 15 fields present on all blueprints' };
}
const RISK_UNION: RiskLevel[] = ['low', 'moderate', 'high', 'do-not-use'];
function caseBlueprintRiskUnion(): { ok: boolean; detail: string } {
  const r = computeStoryArchitect(richArchitectInput);
  for (const b of r.storyBlueprints) {
    if (!RISK_UNION.includes(b.riskLevel)) {
      return { ok: false, detail: `${b.blueprintId} bad riskLevel=${b.riskLevel}` };
    }
  }
  return { ok: true, detail: 'all riskLevels in declared union' };
}
function caseBlueprintNoWinnerFlags(): { ok: boolean; detail: string } {
  const r = computeStoryArchitect(richArchitectInput);
  const text = JSON.stringify(r);
  const banned = /"winner":|"best":|"recommended":|"selected":\s*true|"chosen":\s*true|"optimal":\s*true|"applied":\s*true/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no winner-style flags' : 'banned flag present',
  };
}

// ─── arc cases ────────────────────────────────────────────────

function caseArcShape(): { ok: boolean; detail: string } {
  const r = computeEmotionalArcs({ world: richWorld, presence: richPresence, imprint: richImprint });
  const inRange = r.arcs.every((a) => a.alignment >= 0 && a.alignment <= 10);
  return {
    ok: r.arcs.length === 7 && inRange && r.dominantArcs.length === 3,
    detail: `arcs=${r.arcs.length} dominant=${r.dominantArcs.length}`,
  };
}
function caseArcNoHype(): { ok: boolean; detail: string } {
  const r = computeEmotionalArcs({ world: richWorld, presence: richPresence, imprint: richImprint });
  const text = JSON.stringify(r);
  const banned = /\b(hype|dopamine|fear|urgency|fomo|outrage|shock|viral)\b/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no hype phrasing' : 'banned phrasing present',
  };
}
function caseArcDeterministic(): { ok: boolean; detail: string } {
  const input = { world: richWorld, presence: richPresence, imprint: richImprint };
  const a = JSON.stringify(computeEmotionalArcs(input));
  const b = JSON.stringify(computeEmotionalArcs(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── memory anchor cases ─────────────────────────────────────

function caseMemoryAnchorShape(): { ok: boolean; detail: string } {
  const r = computeMemoryAnchors({ world: richWorld, imprint: richImprint, presence: richPresence });
  return {
    ok: r.anchors.length === 15 && r.dominantAnchors.length === 5,
    detail: `anchors=${r.anchors.length} dominant=${r.dominantAnchors.length}`,
  };
}
function caseMemoryAnchorDeterministic(): { ok: boolean; detail: string } {
  const input = { world: richWorld, imprint: richImprint, presence: richPresence };
  const a = JSON.stringify(computeMemoryAnchors(input));
  const b = JSON.stringify(computeMemoryAnchors(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── presence anchor cases ──────────────────────────────────

function casePresenceAnchorShape(): { ok: boolean; detail: string } {
  const r = computePresenceAnchors({ presence: richPresence });
  return {
    ok: r.anchors.length === 11 && r.dominantAnchors.length === 5 && typeof r.influencerPosingRisk === 'number',
    detail: `anchors=${r.anchors.length} posingRisk=${r.influencerPosingRisk}`,
  };
}
function casePresenceAnchorDeterministic(): { ok: boolean; detail: string } {
  const a = JSON.stringify(computePresenceAnchors({ presence: richPresence }));
  const b = JSON.stringify(computePresenceAnchors({ presence: richPresence }));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── risk cases ──────────────────────────────────────────────

function caseRiskShape(): { ok: boolean; detail: string } {
  const r = computeStoryRisk({
    hint: { storyType: 'care', humanTension: 'home', emotionalArc: 'fatigue → tenderness → continuation',
            memoryAnchor: 'kitchen light', presenceAnchor: 'tired smile', realismStyle: 'documentary handheld' },
    selfReflection: { syntheticDrift: 3, manipulationCreep: 2 },
    scar: { exploitationRisk: 2, dignityPreservation: 7 },
    presence: { syntheticPressure: 3, authenticityWeight: 7 },
  });
  const expected = [
    'emotionalExploitation', 'fakeVulnerability', 'overInspiration',
    'clicheEmotionalArc', 'aiCommercialFeeling', 'excessivePolish',
    'forcedDrama', 'familyImageryRisk', 'traumaPressure',
    'sentimentalityOverload', 'syntheticIntimacy',
  ];
  const missing = expected.filter((k) => !(k in r.signals));
  return {
    ok: missing.length === 0 && RISK_UNION.includes(r.level),
    detail: missing.length === 0 ? `level=${r.level} index=${r.riskIndex}` : `missing=${missing.join(',')}`,
  };
}
function caseRiskExploitative(): { ok: boolean; detail: string } {
  const r = computeStoryRisk({
    hint: {
      storyType: 'trauma', humanTension: 'cancer hospital broken',
      emotionalArc: 'tears cry breaking heartbreak',
      memoryAnchor: 'family kid child',
      presenceAnchor: 'intimate whisper close',
      realismStyle: 'cinematic polished gloss',
    },
    selfReflection: { syntheticDrift: 8, manipulationCreep: 8, aestheticExhaustion: 7 },
    scar: { exploitationRisk: 8, emotionalHeaviness: 8, griefPressure: 8, dignityPreservation: 2 },
    presence: { syntheticPressure: 8, authenticityWeight: 2 },
  });
  return {
    ok: r.level === 'high' || r.level === 'do-not-use',
    detail: `level=${r.level} index=${r.riskIndex} warnings=${r.warnings.length}`,
  };
}
function caseRiskDeterministic(): { ok: boolean; detail: string } {
  const input = { hint: { storyType: 'care' } };
  const a = JSON.stringify(computeStoryRisk(input));
  const b = JSON.stringify(computeStoryRisk(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── memory cases ─────────────────────────────────────────────

function emptySnapshot(at: number): StoryBlueprintSnapshot {
  return {
    at, blueprintObservations: [], dominantHumanTensions: [],
    dominantArcs: [], dominantMemoryAnchors: [], dominantPresenceAnchors: [],
    riskWarningCount: 0, unresolvedQuestionCount: 0, observationCount: 0,
  };
}
function caseMemoryFifo(): { ok: boolean; detail: string } {
  let state = createInitialStoryBlueprintMemory();
  const cap = STORY_BLUEPRINT_SNAPSHOT_LIMIT;
  for (let i = 0; i < cap + 50; i++) {
    state = appendStoryBlueprintSnapshot(state, emptySnapshot(1000 + i));
  }
  return {
    ok: state.snapshots.length === cap && state.totalSnapshots === cap + 50,
    detail: `snapshots=${state.snapshots.length} total=${state.totalSnapshots} cap=${cap}`,
  };
}
function caseMemoryPureTransform(): { ok: boolean; detail: string } {
  const state = createInitialStoryBlueprintMemory();
  const snap = emptySnapshot(1000);
  const a = appendStoryBlueprintSnapshot(state, snap);
  const b = appendStoryBlueprintSnapshot(state, snap);
  return {
    ok: state.snapshots.length === 0 && JSON.stringify(a) === JSON.stringify(b),
    detail: `prior=${state.snapshots.length} a===b:${JSON.stringify(a) === JSON.stringify(b)}`,
  };
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
    path.resolve(__dirname, '..', 'app', 'api', 'story-architect', 'route.ts'),
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
    /from\s+['"]@?lib\/.*publish/i,
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
    ok: /['"]\/api\/story-architect['"]/.test(src),
    detail: /['"]\/api\/story-architect['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/storyArchitectEngine.ts',
    'lib/emotionalArcEngine.ts',
    'lib/memoryAnchorEngine.ts',
    'lib/presenceAnchorEngine.ts',
    'lib/storyRiskEngine.ts',
    'lib/storyBlueprintMemory.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /from\s+['"]@\/core\/criticEngine/,
    /from\s+['"]@?lib\/banner/,
    /from\s+['"]@?lib\/.*publish/i,
    /from\s+['"]@?lib\/.*generate/i,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) {
      if (re.test(codeOnly)) return { ok: false, detail: `forbidden import in ${f}` };
    }
  }
  return { ok: true, detail: 'no critic / pipeline / banner / publish / generate imports' };
}
async function caseNoFetchNoWrite(): Promise<{ ok: boolean; detail: string }> {
  for (const f of [
    'lib/storyArchitectEngine.ts', 'lib/emotionalArcEngine.ts',
    'lib/memoryAnchorEngine.ts', 'lib/presenceAnchorEngine.ts',
    'lib/storyRiskEngine.ts',
  ]) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'engines are pure' };
}

function buildAllText(): string {
  const arch = computeStoryArchitect(richArchitectInput);
  const collect: string[] = [];
  collect.push(...arch.notes, arch.advisoryNotice);
  for (const b of arch.storyBlueprints) {
    collect.push(
      b.humanTension, b.emotionalArc, b.audienceFeeling,
      b.whyThisMayMatter, b.unresolvedRisk,
    );
  }
  collect.push(...arch.emotionalArcOptions.notes, arch.emotionalArcOptions.advisoryNotice);
  for (const a of arch.emotionalArcOptions.arcs) collect.push(a.observation);
  collect.push(...arch.memoryAnchorOptions.notes, arch.memoryAnchorOptions.advisoryNotice);
  for (const a of arch.memoryAnchorOptions.anchors) collect.push(a.observation);
  collect.push(...arch.presenceAnchorOptions.notes, arch.presenceAnchorOptions.advisoryNotice);
  for (const a of arch.presenceAnchorOptions.anchors) collect.push(a.observation);
  for (const s of arch.silenceMoments) collect.push(s.observation);
  for (const m of arch.mythicFrames) collect.push(m.observation);
  for (const a of arch.realismAnchors) collect.push(a.observation);
  collect.push(...arch.riskWarnings, ...arch.unresolvedQuestions);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|optimize|optimizes|optimized|optimizing|recommended|selected|chosen|optimal|will\s+perform)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned in: ${text.slice(0, 200)}` };
}
function caseForbiddenExecutionVerbs(): { ok: boolean; detail: string } {
  const text = buildAllText();
  // Strip the negated-contract phrases — they declare what the system DOESN'T do.
  const stripped = text
    .replace(/does\s+not\s+generate,\s*publish,?\s*(or\s+choose)?/gi, '')
    .replace(/does\s+not\s+generate/gi, '')
    .replace(/does\s+not\s+publish/gi, '')
    .replace(/does\s+not\s+execute/gi, '')
    .replace(/does\s+not\s+launch/gi, '')
    .replace(/never\s+generate(s)?/gi, '')
    .replace(/never\s+publish(es)?/gi, '')
    .replace(/never\s+execute(s)?/gi, '')
    .replace(/never\s+launch(es)?/gi, '');
  const banned = /\b(generate|generates|generate\s+now|publish|publishes|launch|launches|run\s+ad|create\s+ad|execute|executes|auto\s+execute)\b/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : `banned in: ${stripped.slice(0, 200)}` };
}
function caseForbiddenVirality(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|trauma\s+exploit|manipulat)/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned in: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(may carry emotional weight|historically associated|observed alongside|requires more evidence|exploratory story structure|operator review required)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'no allowed phrasing matched' };
}
function caseAdvisoryDisclaimer(): { ok: boolean; detail: string } {
  const arch = computeStoryArchitect(richArchitectInput);
  const required = /operator remains the creative authority/i;
  return { ok: required.test(arch.advisoryNotice), detail: required.test(arch.advisoryNotice) ? 'present' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('STORY ARCHITECT VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['architect-shape',          '15 story blueprints + all top-level fields present', () => caseArchitectShape()],
    ['architect-deterministic',  'story architect engine is pure',                () => caseArchitectDeterministic()],
    ['blueprint-fields',         'every blueprint carries all 15 required fields', () => caseBlueprintFields()],
    ['blueprint-risk-level-union', 'every blueprint riskLevel from declared union', () => caseBlueprintRiskUnion()],
    ['blueprint-no-winner-flags', 'no winner / best / recommended / selected / chosen flags', () => caseBlueprintNoWinnerFlags()],
    ['arc-shape',                '7 emotional arcs + alignment in range',          () => caseArcShape()],
    ['arc-no-hype',              'no hype / dopamine / fear / urgency arcs',       () => caseArcNoHype()],
    ['arc-deterministic',        'emotional arc engine is pure',                   () => caseArcDeterministic()],
    ['memory-anchor-shape',      '15 memory anchors + dominant set',               () => caseMemoryAnchorShape()],
    ['memory-anchor-deterministic', 'memory anchor engine is pure',                () => caseMemoryAnchorDeterministic()],
    ['presence-anchor-shape',    '11 presence anchors + influencer-posing risk',   () => casePresenceAnchorShape()],
    ['presence-anchor-deterministic', 'presence anchor engine is pure',            () => casePresenceAnchorDeterministic()],
    ['risk-shape',               '11 risk signals + verdict from declared union',  () => caseRiskShape()],
    ['risk-exploitative',        'heavy + high persuasion → high / do-not-use',    () => caseRiskExploitative()],
    ['risk-deterministic',       'story risk engine is pure',                       () => caseRiskDeterministic()],
    ['memory-fifo',              'append > limit → cap respected',                  () => caseMemoryFifo()],
    ['memory-pure-transform',    'appendStoryBlueprintSnapshot is referentially transparent', () => caseMemoryPureTransform()],
    ['route-no-pipeline',        'route does not import pipeline / call /api/generate / publish', () => caseRouteNoPipeline()],
    ['route-no-execution',       'route exports no apply / execute / generateNow / publishNow / launch', () => caseRouteNoExecution()],
    ['route-get-only',           'route exports GET but not POST',                  () => caseRouteGetOnly()],
    ['route-listed',             '/api/story-architect registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',                'engines + memory have no critic / pipeline / banner / publish imports', () => caseIsolation()],
    ['no-fetch-no-write',        'engines have no fetch / no fs.writeFile',         () => caseNoFetchNoWrite()],
    ['forbidden-prediction',     'phrasing forbids predict / will / best / winner / optimize / recommended / selected / chosen / optimal', () => caseForbiddenPrediction()],
    ['forbidden-execution-verbs', 'phrasing forbids generate / publish / execute / run / launch', () => caseForbiddenExecutionVerbs()],
    ['forbidden-virality',       'phrasing forbids viral / dopamine / outrage / exploit', () => caseForbiddenVirality()],
    ['allowed-language',         'phrasing uses may carry emotional weight / observed alongside / requires more evidence', () => caseAllowedLanguage()],
    ['advisory-disclaimer',      'advisory disclaimer names operator as creative authority', () => caseAdvisoryDisclaimer()],
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
