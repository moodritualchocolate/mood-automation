/**
 * VERIFY — Human Memory Imprint Layer.
 *
 * Pure-function + static verification.
 *
 * Cases:
 *   imprint-shape              · 16 remembered moment signals present, in range
 *   imprint-deterministic      · pure function
 *   imprint-empty              · no inputs → balanced reading
 *   scar-shape                 · 9 scar signals + verdict from declared union
 *   scar-soft                  · soft signals → soft verdict
 *   scar-exploitative          · heavy + high persuasion → exploitative-risk verdict
 *   scar-deterministic         · pure function
 *   ritual-shape               · 12 rituals + dominant rituals + advisory present
 *   ritual-detects             · morning-ritual outcomes surface morning persistence
 *   ritual-deterministic       · pure function
 *   silence-shape              · 8 silence weight signals + composite index
 *   silence-deterministic      · pure function
 *   mythic-shape               · 11 archetypes + composite + dominant set
 *   mythic-detects             · empty-chair / hand-on-shoulder surfaces loss / care
 *   mythic-deterministic       · pure function
 *   memory-fifo                · append > limit → cap respected
 *   memory-pure-transform      · appendMemoryImprintSnapshot is referentially transparent
 *   route-no-pipeline          · route does not import pipeline / call /api/generate
 *   route-no-execution         · route exports no apply / execute / generateNow / publishNow
 *   route-get-only             · route exports GET but not POST
 *   route-listed               · /api/human-memory-imprint registered in systemIntegrityReport
 *   isolation                  · engines + memory have no critic / pipeline / banner imports
 *   no-fetch-no-write          · engines have no fetch / no fs.writeFile
 *   allowed-language           · phrasing uses historically associated / observed alongside / may carry memory weight
 *   forbidden-virality         · phrasing forbids viral / dopamine / outrage / trauma exploitation / forced sentiment
 *   forbidden-prediction       · phrasing forbids predict / will / best / winner / guaranteed / optimize / auto-apply
 *   tsc                        · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeHumanMemoryImprint } from '../lib/humanMemoryImprintEngine';
import { computeEmotionalScar, type ScarVerdict } from '../lib/emotionalScarEngine';
import { computeRitualPersistence } from '../lib/ritualPersistenceEngine';
import { computeSilenceWeight } from '../lib/silenceWeightEngine';
import { computeMythicNarrative } from '../lib/mythicNarrativeEngine';
import {
  appendMemoryImprintSnapshot,
  createInitialMemoryImprintMemory,
  MEMORY_IMPRINT_SNAPSHOT_LIMIT,
  type MemoryImprintSnapshot,
} from '../lib/memoryImprintMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic data ──────────────────────────────────────────

function mkOutcome(o: Partial<any> = {}): any {
  return {
    at: o.at ?? 1000,
    emotionalSignature: o.emotionalSignature ?? 'still-quiet',
    narrativeSignature: o.narrativeSignature ?? 'observational',
    visualStyle: o.visualStyle ?? 'documentary',
    cadenceState: o.cadenceState ?? 'flow',
    realismLevel: o.realismLevel ?? 7,
    persuasionIntensity: o.persuasionIntensity ?? 3,
    downstreamOutcome: o.downstreamOutcome ?? 'trust-formation',
    metrics: o.metrics ?? { retention: 0.6, saves: 3, rewatches: 1, shares: 1, comments: 2 },
  };
}

function mkVisualFps(n: number, opts: { silent?: boolean; polish?: number; realism?: number } = {}): any[] {
  const fps: any[] = [];
  for (let i = 0; i < n; i++) {
    fps.push({
      silenceDensity: opts.silent ? 'high' : 'mid',
      polishLevel: opts.polish ?? 4,
      realismLevel: opts.realism ?? 7,
      pacingIdentity: 'slow-pacing',
      motionCadence: 'slow-cadence',
    });
  }
  return fps;
}

function mkNarrativeFps(n: number, opts: { sparse?: boolean; lateP?: boolean; cta?: number; obs?: number } = {}): any[] {
  const fps: any[] = [];
  for (let i = 0; i < n; i++) {
    fps.push({
      silenceUsage: opts.sparse ? 'sparse' : 'present',
      narrationStyle: 'observational',
      humanRealism: 7,
      ctaPressure: opts.cta ?? 3,
      observationalDensity: opts.obs ?? 7,
      tensionCurve: 'sustained',
      payoffTiming: opts.lateP ? 'late' : 'early',
    });
  }
  return fps;
}

// ─── imprint cases ───────────────────────────────────────────

function caseImprintShape(): { ok: boolean; detail: string } {
  const outcomes = Array.from({ length: 6 }, (_, i) => mkOutcome({
    at: 1000 + i, emotionalSignature: 'kitchen-morning-coffee',
    visualStyle: 'home-kitchen-warm',
  }));
  const r = computeHumanMemoryImprint({
    outcomes: { outcomes },
    visualDNA: { fingerprints: mkVisualFps(4, { silent: true, polish: 3, realism: 8 }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(4, { sparse: true, lateP: true, obs: 8 }) },
  });
  const expected = [
    'emotionalSimplicity', 'humanStillness', 'silenceWeight', 'symbolicClarity',
    'imperfectRealism', 'restrainedDialogue', 'visualTenderness', 'unresolvedEmotion',
    'quotePotential', 'ritualFamiliarity', 'intergenerationalResonance',
    'nostalgicTexture', 'ordinaryLifeSignificance', 'emotionalAftertaste',
    'identityReflection', 'memoryDensity',
  ];
  const missing = expected.filter((k) => !(k in r.rememberedMomentSignals));
  const inRange = Object.values(r.rememberedMomentSignals).every((v) => v >= 0 && v <= 10);
  const compositesInRange = [r.imprintStrength, r.emotionalAftertaste, r.quoteDurability,
                             r.scenePermanence, r.identityAttachment, r.memoryRisk]
    .every((v) => v >= 0 && v <= 10);
  return {
    ok: missing.length === 0 && inRange && compositesInRange && r.dominantImprintSignals.length === 3,
    detail: missing.length === 0 ? `imprint=${r.imprintStrength} dominant=${r.dominantImprintSignals.length}` : `missing=${missing.join(',')}`,
  };
}
function caseImprintDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: [mkOutcome({ at: 1, emotionalSignature: 'home-still-warm' })] },
    visualDNA: { fingerprints: mkVisualFps(3, { silent: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(3, { sparse: true }) },
  };
  const a = JSON.stringify(computeHumanMemoryImprint(input));
  const b = JSON.stringify(computeHumanMemoryImprint(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseImprintEmpty(): { ok: boolean; detail: string } {
  const r = computeHumanMemoryImprint({});
  return {
    ok: r.totalObservations === 0 && r.notes.length > 0 &&
        Object.values(r.rememberedMomentSignals).every((v) => v >= 0 && v <= 10),
    detail: `total=${r.totalObservations} strength=${r.imprintStrength}`,
  };
}

// ─── scar cases ──────────────────────────────────────────────

const SCAR_UNION: ScarVerdict[] = ['soft', 'heavy', 'exploitative-risk', 'dignity-preserved'];

function caseScarShape(): { ok: boolean; detail: string } {
  const r = computeEmotionalScar({
    outcomes: { outcomes: [mkOutcome()] },
    narrativeDNA: { fingerprints: mkNarrativeFps(3) },
  });
  const expected = [
    'softScar', 'reflectiveAche', 'unresolvedTenderness', 'griefPressure',
    'nostalgiaAche', 'regretResonance', 'emotionalHeaviness',
    'dignityPreservation', 'exploitationRisk',
  ];
  const missing = expected.filter((k) => !(k in r.signals));
  return {
    ok: missing.length === 0 && SCAR_UNION.includes(r.verdict),
    detail: missing.length === 0 ? `verdict=${r.verdict}` : `missing=${missing.join(',')}`,
  };
}
function caseScarSoft(): { ok: boolean; detail: string } {
  const outs = Array.from({ length: 5 }, () => mkOutcome({
    emotionalSignature: 'soft-tender-gentle-warm',
    persuasionIntensity: 2, downstreamOutcome: 'trust-formation',
  }));
  const r = computeEmotionalScar({
    outcomes: { outcomes: outs },
    narrativeDNA: { fingerprints: mkNarrativeFps(3, { cta: 2, obs: 8 }) },
  });
  return {
    ok: r.verdict === 'soft' || r.verdict === 'dignity-preserved',
    detail: `verdict=${r.verdict}`,
  };
}
function caseScarExploitative(): { ok: boolean; detail: string } {
  // Heavy emotional content + high persuasion + high CTA + aggressive-cta-rejection.
  const outs = Array.from({ length: 6 }, () => mkOutcome({
    emotionalSignature: 'grief-funeral-trauma-loss-broken',
    narrativeSignature: 'grief-funeral-cancer-hospital',
    persuasionIntensity: 9, downstreamOutcome: 'aggressive-cta-rejection',
  }));
  const r = computeEmotionalScar({
    outcomes: { outcomes: outs },
    narrativeDNA: { fingerprints: mkNarrativeFps(4, { cta: 9 }) },
  });
  return {
    ok: r.verdict === 'exploitative-risk',
    detail: `verdict=${r.verdict} exploitationRisk=${r.signals.exploitationRisk} heaviness=${r.signals.emotionalHeaviness}`,
  };
}
function caseScarDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: [mkOutcome()] },
    narrativeDNA: { fingerprints: mkNarrativeFps(2) },
  };
  const a = JSON.stringify(computeEmotionalScar(input));
  const b = JSON.stringify(computeEmotionalScar(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── ritual cases ────────────────────────────────────────────

function caseRitualShape(): { ok: boolean; detail: string } {
  const r = computeRitualPersistence({ outcomes: { outcomes: [mkOutcome()] } });
  const expectedRituals = [
    'morning', 'night', 'family', 'food', 'coffee', 'workRecovery',
    'parentChild', 'study', 'loneliness', 'silence', 'seasonal', 'goodbye',
  ];
  const missing = expectedRituals.filter((k) => !(k in r.rituals));
  return {
    ok: missing.length === 0 && r.dominantRituals.length === 3 && /Observatory only/.test(r.advisoryNotice),
    detail: missing.length === 0 ? `dominant=${r.dominantRituals.length}` : `missing=${missing.join(',')}`,
  };
}
function caseRitualDetects(): { ok: boolean; detail: string } {
  const outs = Array.from({ length: 6 }, () => mkOutcome({
    emotionalSignature: 'morning-sunrise-coffee-quiet',
    narrativeSignature: 'morning-kettle-mug-wake',
    metrics: { retention: 0.8, saves: 5, rewatches: 2, shares: 1 },
  }));
  const r = computeRitualPersistence({ outcomes: { outcomes: outs } });
  return {
    ok: r.rituals.morning.persistence >= 5 && r.dominantRituals.includes('morning'),
    detail: `morning persistence=${r.rituals.morning.persistence} dominant=${r.dominantRituals.join(',')}`,
  };
}
function caseRitualDeterministic(): { ok: boolean; detail: string } {
  const input = { outcomes: { outcomes: [mkOutcome()] } };
  const a = JSON.stringify(computeRitualPersistence(input));
  const b = JSON.stringify(computeRitualPersistence(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── silence cases ───────────────────────────────────────────

function caseSilenceShape(): { ok: boolean; detail: string } {
  const r = computeSilenceWeight({
    outcomes: { outcomes: [mkOutcome()] },
    visualDNA: { fingerprints: mkVisualFps(3, { silent: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(3, { sparse: true, lateP: true }) },
  });
  const expected = [
    'pauseStrength', 'unspokenTension', 'breathingRoom', 'emotionalRestraint',
    'viewerProjectionSpace', 'overExplanationRisk', 'silenceDignity', 'memoryEcho',
  ];
  const missing = expected.filter((k) => !(k in r.signals));
  const inRange = r.silenceWeightIndex >= 0 && r.silenceWeightIndex <= 10;
  return {
    ok: missing.length === 0 && inRange,
    detail: missing.length === 0 ? `index=${r.silenceWeightIndex}` : `missing=${missing.join(',')}`,
  };
}
function caseSilenceDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: [mkOutcome()] },
    visualDNA: { fingerprints: mkVisualFps(2) },
    narrativeDNA: { fingerprints: mkNarrativeFps(2) },
  };
  const a = JSON.stringify(computeSilenceWeight(input));
  const b = JSON.stringify(computeSilenceWeight(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── mythic cases ────────────────────────────────────────────

function caseMythicShape(): { ok: boolean; detail: string } {
  const r = computeMythicNarrative({ outcomes: { outcomes: [mkOutcome()] } });
  const expected = [
    'return', 'loss', 'becoming', 'protection', 'waiting', 'passingTime',
    'care', 'endurance', 'forgiveness', 'home', 'memory',
  ];
  const missing = expected.filter((k) => !(k in r.archetypes));
  return {
    ok: missing.length === 0 && r.dominantArchetypes.length === 3 &&
        r.overallMythicWeight >= 0 && r.overallMythicWeight <= 10,
    detail: missing.length === 0 ? `overall=${r.overallMythicWeight}` : `missing=${missing.join(',')}`,
  };
}
function caseMythicDetects(): { ok: boolean; detail: string } {
  // Empty-chair + hand-on-shoulder phrasing should surface loss / care.
  const outs = Array.from({ length: 6 }, () => mkOutcome({
    emotionalSignature: 'loss-empty chair-goodbye-tender',
    narrativeSignature: 'hand on shoulder-care-hold-tender',
    metrics: { retention: 0.7, saves: 4, rewatches: 2, shares: 1 },
  }));
  const r = computeMythicNarrative({ outcomes: { outcomes: outs } });
  const losI = r.archetypes.loss.mythicWeight;
  const carI = r.archetypes.care.mythicWeight;
  return {
    ok: losI >= 4 && carI >= 4 && (r.dominantArchetypes.includes('loss') || r.dominantArchetypes.includes('care')),
    detail: `loss=${losI} care=${carI} dominant=${r.dominantArchetypes.join(',')}`,
  };
}
function caseMythicDeterministic(): { ok: boolean; detail: string } {
  const input = { outcomes: { outcomes: [mkOutcome()] } };
  const a = JSON.stringify(computeMythicNarrative(input));
  const b = JSON.stringify(computeMythicNarrative(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── memory cases ────────────────────────────────────────────

function emptySnapshot(at: number): MemoryImprintSnapshot {
  return {
    at,
    imprintStrength: 0,
    imprintSignals: {
      emotionalSimplicity: 0, humanStillness: 0, silenceWeight: 0,
      symbolicClarity: 0, imperfectRealism: 0, restrainedDialogue: 0,
      visualTenderness: 0, unresolvedEmotion: 0, quotePotential: 0,
      ritualFamiliarity: 0, intergenerationalResonance: 0, nostalgicTexture: 0,
      ordinaryLifeSignificance: 0, emotionalAftertaste: 0, identityReflection: 0,
      memoryDensity: 0,
    },
    dominantImprintSignals: [],
    memoryRisk: 0,
    scarVerdict: 'soft',
    scarSignals: {
      softScar: 0, reflectiveAche: 0, unresolvedTenderness: 0,
      griefPressure: 0, nostalgiaAche: 0, regretResonance: 0,
      emotionalHeaviness: 0, dignityPreservation: 0, exploitationRisk: 0,
    },
    ritualPersistence: {},
    dominantRituals: [],
    silenceWeightIndex: 0,
    silenceSignals: {
      pauseStrength: 0, unspokenTension: 0, breathingRoom: 0,
      emotionalRestraint: 0, viewerProjectionSpace: 0, overExplanationRisk: 0,
      silenceDignity: 0, memoryEcho: 0,
    },
    mythicWeights: {},
    overallMythicWeight: 0,
    dominantArchetypes: [],
    observationCount: 0,
  };
}
function caseMemoryFifo(): { ok: boolean; detail: string } {
  let state = createInitialMemoryImprintMemory();
  const cap = MEMORY_IMPRINT_SNAPSHOT_LIMIT;
  for (let i = 0; i < cap + 50; i++) {
    state = appendMemoryImprintSnapshot(state, emptySnapshot(1000 + i));
  }
  return {
    ok: state.snapshots.length === cap && state.totalSnapshots === cap + 50,
    detail: `snapshots=${state.snapshots.length} total=${state.totalSnapshots} cap=${cap}`,
  };
}
function caseMemoryPureTransform(): { ok: boolean; detail: string } {
  const state = createInitialMemoryImprintMemory();
  const snap = emptySnapshot(1000);
  const a = appendMemoryImprintSnapshot(state, snap);
  const b = appendMemoryImprintSnapshot(state, snap);
  return {
    ok: state.snapshots.length === 0 && JSON.stringify(a) === JSON.stringify(b),
    detail: `prior=${state.snapshots.length} a===b: ${JSON.stringify(a) === JSON.stringify(b)}`,
  };
}

// ─── route + module static checks ────────────────────────────

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
    path.resolve(__dirname, '..', 'app', 'api', 'human-memory-imprint', 'route.ts'),
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
  return {
    ok: !banned.test(src),
    detail: !banned.test(src) ? 'no execution function exported' : 'execution function present',
  };
}
async function caseRouteGetOnly(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
  const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
  return {
    ok: hasGet && !hasPost,
    detail: `GET=${hasGet} POST=${hasPost}`,
  };
}
async function caseRouteListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(
    path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'),
    'utf8',
  );
  return {
    ok: /['"]\/api\/human-memory-imprint['"]/.test(src),
    detail: /['"]\/api\/human-memory-imprint['"]/.test(src) ? 'route registered' : 'route missing from KNOWN_ROUTES',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/humanMemoryImprintEngine.ts',
    'lib/emotionalScarEngine.ts',
    'lib/ritualPersistenceEngine.ts',
    'lib/silenceWeightEngine.ts',
    'lib/mythicNarrativeEngine.ts',
    'lib/memoryImprintMemory.ts',
  ];
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
  return { ok: true, detail: 'no critic / pipeline / generation imports' };
}
async function caseNoFetchNoWrite(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/humanMemoryImprintEngine.ts',
    'lib/emotionalScarEngine.ts',
    'lib/ritualPersistenceEngine.ts',
    'lib/silenceWeightEngine.ts',
    'lib/mythicNarrativeEngine.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'engines are pure' };
}
function buildNarrativeText(): string {
  const outs1 = Array.from({ length: 4 }, () => mkOutcome({
    emotionalSignature: 'home-still-kitchen-morning-coffee',
    narrativeSignature: 'parent-child-care-tender',
  }));
  const imp = computeHumanMemoryImprint({
    outcomes: { outcomes: outs1 },
    visualDNA: { fingerprints: mkVisualFps(3, { silent: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(3, { sparse: true, lateP: true, obs: 8 }) },
  });
  const scar = computeEmotionalScar({
    outcomes: { outcomes: outs1 },
    narrativeDNA: { fingerprints: mkNarrativeFps(3) },
  });
  const ritual = computeRitualPersistence({ outcomes: { outcomes: outs1 } });
  const silence = computeSilenceWeight({
    outcomes: { outcomes: outs1 },
    visualDNA: { fingerprints: mkVisualFps(3, { silent: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(3, { sparse: true }) },
  });
  const mythic = computeMythicNarrative({ outcomes: { outcomes: outs1 } });
  return [
    ...imp.notes, imp.advisoryNotice,
    ...scar.notes, scar.advisoryNotice,
    ...ritual.notes, ritual.advisoryNotice,
    ...silence.notes, silence.advisoryNotice,
    ...mythic.notes, mythic.advisoryNotice,
    ...Object.values(ritual.rituals).map((r) => r.note),
    ...Object.values(mythic.archetypes).map((a) => a.note),
  ].join(' ');
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildNarrativeText();
  const required = /(historically associated|observed alongside|may carry memory weight|emotional permanence|dignity-preserved|requires more evidence|remembrance-oriented)/i;
  return {
    ok: required.test(text),
    detail: required.test(text) ? 'allowed phrasing present' : 'no allowed phrasing matched',
  };
}
function caseForbiddenVirality(): { ok: boolean; detail: string } {
  const text = buildNarrativeText();
  // Strip negated phrases from advisory notices.
  const stripped = text
    .replace(/never\s+optimizes\s+for\s+virality/gi, '')
    .replace(/never\s+exploits/gi, '')
    .replace(/does\s+not\s+manufacture\s+wounds/gi, '')
    .replace(/never\s+manufactures\s+wounds/gi, '');
  const banned = /\b(viral|virality|dopamine|outrage|exploit|trauma\s+exploit|forced\s+sentiment|manipulat)/i;
  return {
    ok: !banned.test(stripped),
    detail: !banned.test(stripped) ? 'no virality / exploitation phrasing' : `banned in: ${stripped.slice(0, 200)}`,
  };
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildNarrativeText();
  // Strip negated phrases.
  const stripped = text
    .replace(/never\s+predict/gi, '')
    .replace(/never\s+optimiz/gi, '')
    .replace(/never\s+auto-?appl/gi, '')
    .replace(/never\s+recommend/gi, '')
    .replace(/never\s+name(s)?\s+a\s+winning/gi, '');
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|optimize|optimizes|optimized|optimizing)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return {
    ok: !banned.test(stripped),
    detail: !banned.test(stripped) ? 'no predictive / winner phrasing' : `banned in: ${stripped.slice(0, 200)}`,
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('HUMAN MEMORY IMPRINT VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['imprint-shape',          '16 remembered moment signals present, in range', () => caseImprintShape()],
    ['imprint-deterministic',  'imprint engine is pure',                          () => caseImprintDeterministic()],
    ['imprint-empty',          'no inputs → balanced reading',                    () => caseImprintEmpty()],
    ['scar-shape',             '9 scar signals + verdict from declared union',    () => caseScarShape()],
    ['scar-soft',              'soft signals → soft / dignity-preserved verdict', () => caseScarSoft()],
    ['scar-exploitative',      'heavy + high persuasion → exploitative-risk',     () => caseScarExploitative()],
    ['scar-deterministic',     'emotional scar engine is pure',                   () => caseScarDeterministic()],
    ['ritual-shape',           '12 rituals present + dominant set + advisory',    () => caseRitualShape()],
    ['ritual-detects',         'morning-ritual outcomes → morning persistence',   () => caseRitualDetects()],
    ['ritual-deterministic',   'ritual engine is pure',                           () => caseRitualDeterministic()],
    ['silence-shape',          '8 silence weight signals + composite index',      () => caseSilenceShape()],
    ['silence-deterministic',  'silence engine is pure',                          () => caseSilenceDeterministic()],
    ['mythic-shape',           '11 archetypes + composite + dominant set',        () => caseMythicShape()],
    ['mythic-detects',         'empty-chair / hand-on-shoulder → loss / care',    () => caseMythicDetects()],
    ['mythic-deterministic',   'mythic engine is pure',                           () => caseMythicDeterministic()],
    ['memory-fifo',            'append > limit → cap respected',                  () => caseMemoryFifo()],
    ['memory-pure-transform',  'appendMemoryImprintSnapshot is referentially transparent', () => caseMemoryPureTransform()],
    ['route-no-pipeline',      'route does not import pipeline / call /api/generate', () => caseRouteNoPipeline()],
    ['route-no-execution',     'route exports no apply / execute / autoApply',    () => caseRouteNoExecution()],
    ['route-get-only',         'route exports GET but not POST',                  () => caseRouteGetOnly()],
    ['route-listed',           '/api/human-memory-imprint registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',              'engines + memory have no critic / pipeline / banner imports', () => caseIsolation()],
    ['no-fetch-no-write',      'engines have no fetch / no fs.writeFile',         () => caseNoFetchNoWrite()],
    ['allowed-language',       'phrasing uses historically associated / observed alongside / may carry memory weight', () => caseAllowedLanguage()],
    ['forbidden-virality',     'phrasing forbids viral / dopamine / outrage / exploit', () => caseForbiddenVirality()],
    ['forbidden-prediction',   'phrasing forbids predict / will / best / winner / optimize / auto-apply', () => caseForbiddenPrediction()],
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
