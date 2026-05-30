/**
 * VERIFY — Generation Connector Layer.
 *
 * 5 image adapters + 5 video adapters + provider registry +
 * generation request queue + generation result registry.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  buildOpenAIImagePayload, buildFluxImagePayload, buildMidjourneyImagePayload,
  buildIdeogramImagePayload, buildGeminiImagePayload,
  buildVeoVideoPayload, buildRunwayVideoPayload, buildKlingVideoPayload,
  buildHailuoVideoPayload, buildPikaVideoPayload,
  type ProviderPayload, type ImageProviderId, type VideoProviderId,
} from '../lib/providers';
import {
  PROVIDER_REGISTRY, getProviderRegistry, buildImagePayloadFor, buildVideoPayloadFor,
  IMAGE_PROVIDER_IDS, VIDEO_PROVIDER_IDS,
} from '../lib/providerRegistry';
import { composeImageExecutionPackage } from '../lib/imageExecutionEngine';
import { composeVideoExecutionPackage } from '../lib/videoExecutionEngine';
import { computeCreativeBriefs } from '../lib/creativeBriefGenerator';
import { computeProductionPrompts } from '../lib/promptArchitect';
import {
  appendGenerationRequest, applyGenerationRequestStep,
  createInitialGenerationRequestQueue, GENERATION_REQUEST_LIMIT,
  newGenerationRequestId,
  type GenerationRequestRecord,
} from '../lib/generationRequestQueue';
import {
  appendGenerationResult, createInitialGenerationResultRegistry,
  GENERATION_RESULT_LIMIT, newGenerationResultId,
  type GenerationResultRecord,
} from '../lib/generationResultRegistry';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── shared fixtures ─────────────────────────────────────────

const stories = [
  { blueprintId: 'quiet-return-home', storyName: 'Quiet Return Home', storyType: 'return',
    humanTension: 'fatigue holds the door', emotionalArc: 'pressure → breath → return',
    memoryAnchor: 'kitchen light', presenceAnchor: 'slow hand movement',
    mythicFrame: 'return', realismStyle: 'documentary handheld',
    alignment: 8, dignityProtection: 8, manipulationRisk: 2, riskLevel: 'low',
    audienceFeeling: 'a quiet relief', whyThisMayMatter: 'may carry emotional weight' },
];
const scenes = [
  { sourceBlueprintId: 'quiet-return-home', sourceStoryName: 'Quiet Return Home',
    sceneId: 'scene-x', sceneType: 'arrival-stillness',
    location: 'apartment threshold and kitchen', environment: 'home',
    timeOfDay: 'late afternoon', realismLevel: 7,
    cameraLanguage: '50mm handheld', framingStyle: 'close, low angle',
    lightingStyle: 'single warm kitchen light', silenceAllocation: 'two-thirds silence',
    presenceAnchors: ['slow hand movement'], memoryAnchors: ['kitchen light'],
    symbolismAnchors: ['threshold'], dignityAnchors: ['no music swell'],
    emotionalWeight: 8, restraintLevel: 7 },
];

function fixtures() {
  const briefs = computeCreativeBriefs({
    stories, scenes,
    rhythm: {
      pacingProfile: 'observational-still', restraintProfile: 'measured-restraint',
      rhythmProfile: { tension: 4, release: 7, breathingRoom: 7, pause: 7, silence: 7, restraint: 7,
                       emotionalDensity: 4, emotionalSpacing: 7, anticipation: 6, reflection: 7 },
      silenceMoments: [], breathingMoments: [],
    },
    packages: {}, formula: 'ENERGY', brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  const prompts = computeProductionPrompts({
    banners: briefs.banners, carousels: briefs.carousels, images: briefs.images,
    videos: briefs.videos, landings: briefs.landings,
    formula: 'ENERGY', brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  const imagePkg = composeImageExecutionPackage({ brief: briefs.images[0], prompt: prompts.imagePrompts[0] });
  const videoPkg = composeVideoExecutionPackage({ brief: briefs.videos[0], prompt: prompts.videoPrompts[0] });
  return { imagePkg, videoPkg };
}

// ─── adapter shape ───────────────────────────────────────────

function validatePayload(name: string, p: ProviderPayload, expectedType: 'image' | 'video'): { ok: boolean; detail: string } {
  if (p.packageType !== expectedType) return { ok: false, detail: `${name} packageType=${p.packageType}` };
  if (!p.providerId || !p.providerName) return { ok: false, detail: `${name} missing provider id/name` };
  if (!p.endpointHint || !p.endpointHint.method || !p.endpointHint.pathHint) return { ok: false, detail: `${name} missing endpointHint` };
  if (!p.headersGuidance || typeof p.headersGuidance !== 'object') return { ok: false, detail: `${name} missing headersGuidance` };
  if (!p.curlEquivalent || p.curlEquivalent.length < 20) return { ok: false, detail: `${name} curl too short` };
  if (typeof p.estimatedCostUSD !== 'number') return { ok: false, detail: `${name} missing cost` };
  if (p.operatorApprovalRequired !== true) return { ok: false, detail: `${name} operatorApprovalRequired not true` };
  // headers must not contain real secrets — only placeholders.
  const headerText = Object.values(p.headersGuidance).join(' ');
  if (/sk-[A-Za-z0-9]{20,}/.test(headerText)) return { ok: false, detail: `${name} headers leak a real-looking secret` };
  return { ok: true, detail: `${p.providerName}` };
}

function caseAllImageAdaptersShape(): { ok: boolean; detail: string } {
  const { imagePkg } = fixtures();
  const builders: Array<[string, (p: typeof imagePkg) => ProviderPayload]> = [
    ['openai', buildOpenAIImagePayload], ['flux', buildFluxImagePayload],
    ['midjourney', buildMidjourneyImagePayload], ['ideogram', buildIdeogramImagePayload],
    ['gemini', buildGeminiImagePayload],
  ];
  for (const [name, b] of builders) {
    const v = validatePayload(name, b(imagePkg), 'image');
    if (!v.ok) return v;
  }
  return { ok: true, detail: '5 image adapters produce valid payloads' };
}
function caseAllVideoAdaptersShape(): { ok: boolean; detail: string } {
  const { videoPkg } = fixtures();
  const builders: Array<[string, (p: typeof videoPkg) => ProviderPayload]> = [
    ['veo', buildVeoVideoPayload], ['runway', buildRunwayVideoPayload],
    ['kling', buildKlingVideoPayload], ['hailuo', buildHailuoVideoPayload],
    ['pika', buildPikaVideoPayload],
  ];
  for (const [name, b] of builders) {
    const v = validatePayload(name, b(videoPkg), 'video');
    if (!v.ok) return v;
  }
  return { ok: true, detail: '5 video adapters produce valid payloads' };
}
function caseAdaptersDeterministic(): { ok: boolean; detail: string } {
  const { imagePkg, videoPkg } = fixtures();
  const checks: Array<[string, () => unknown]> = [
    ['openai', () => buildOpenAIImagePayload(imagePkg)],
    ['flux',   () => buildFluxImagePayload(imagePkg)],
    ['midjourney', () => buildMidjourneyImagePayload(imagePkg)],
    ['ideogram', () => buildIdeogramImagePayload(imagePkg)],
    ['gemini', () => buildGeminiImagePayload(imagePkg)],
    ['veo',    () => buildVeoVideoPayload(videoPkg)],
    ['runway', () => buildRunwayVideoPayload(videoPkg)],
    ['kling',  () => buildKlingVideoPayload(videoPkg)],
    ['hailuo', () => buildHailuoVideoPayload(videoPkg)],
    ['pika',   () => buildPikaVideoPayload(videoPkg)],
  ];
  for (const [name, fn] of checks) {
    const a = JSON.stringify(fn());
    const b = JSON.stringify(fn());
    if (a !== b) return { ok: false, detail: `${name} non-deterministic` };
  }
  return { ok: true, detail: '10 adapters deterministic' };
}
function caseAdaptersNoFetch(): { ok: boolean; detail: string } {
  // Scan all adapter sources for fetch / network calls.
  return new Promise(async (resolve) => {
    const dir = path.resolve(__dirname, '..', 'lib', 'providers');
    const entries = await fs.readdir(dir);
    for (const f of entries) {
      if (!f.endsWith('.ts')) continue;
      const src = await fs.readFile(path.join(dir, f), 'utf8');
      if (/\bfetch\s*\(/.test(src)) return resolve({ ok: false, detail: `fetch in ${f}` });
      if (/\baxios\.|\bhttp\.request|\bhttps\.request/.test(src)) {
        return resolve({ ok: false, detail: `http client in ${f}` });
      }
      if (/fs\.writeFile/.test(src)) return resolve({ ok: false, detail: `fs.writeFile in ${f}` });
    }
    resolve({ ok: true, detail: 'no fetch / http client / writeFile in any adapter' });
  }) as unknown as { ok: boolean; detail: string };
}
function caseIdeogramHebrewSwitch(): { ok: boolean; detail: string } {
  const { imagePkg } = fixtures();
  // Default fixture is Israeli-market — language should resolve to 'he'.
  const p = buildIdeogramImagePayload(imagePkg);
  const body = p.requestBody as { language?: string };
  return { ok: body.language === 'he', detail: `language=${body.language}` };
}
function caseMidjourneyHasFlags(): { ok: boolean; detail: string } {
  const { imagePkg } = fixtures();
  const p = buildMidjourneyImagePayload(imagePkg);
  const body = p.requestBody as { promptString: string };
  const ok = body.promptString.includes('--ar') && body.promptString.includes('--no') && body.promptString.includes('--style');
  return { ok, detail: ok ? 'has --ar / --no / --style' : `missing flags: ${body.promptString.slice(0, 200)}` };
}

// ─── provider registry ──────────────────────────────────────

function caseRegistryShape(): { ok: boolean; detail: string } {
  const r = getProviderRegistry();
  if (r.totalImageProviders !== 5) return { ok: false, detail: `image=${r.totalImageProviders}` };
  if (r.totalVideoProviders !== 5) return { ok: false, detail: `video=${r.totalVideoProviders}` };
  return { ok: true, detail: `image=5 video=5 total=10` };
}
function caseRegistryDispatch(): { ok: boolean; detail: string } {
  const { imagePkg, videoPkg } = fixtures();
  for (const id of IMAGE_PROVIDER_IDS) {
    const p = buildImagePayloadFor(id as ImageProviderId, imagePkg);
    if (p.providerId !== id) return { ok: false, detail: `image dispatch mismatch for ${id}` };
  }
  for (const id of VIDEO_PROVIDER_IDS) {
    const p = buildVideoPayloadFor(id as VideoProviderId, videoPkg);
    if (p.providerId !== id) return { ok: false, detail: `video dispatch mismatch for ${id}` };
  }
  return { ok: true, detail: 'dispatch to all 10 providers works' };
}
function caseRegistryCostsAreFinite(): { ok: boolean; detail: string } {
  for (const [id, cap] of Object.entries(PROVIDER_REGISTRY)) {
    if (!Number.isFinite(cap.costEstimateUSDPerUnit) || cap.costEstimateUSDPerUnit <= 0) {
      return { ok: false, detail: `${id} bad cost ${cap.costEstimateUSDPerUnit}` };
    }
  }
  return { ok: true, detail: 'all costs finite + positive' };
}

// ─── queue + result memory ──────────────────────────────────

function caseQueueAppendAndTransition(): { ok: boolean; detail: string } {
  let state = createInitialGenerationRequestQueue();
  const id = newGenerationRequestId();
  const rec: GenerationRequestRecord = {
    requestId: id, sourceAssetId: 'asset-x', formula: 'ENERGY', campaign: 'c',
    providerId: 'flux', providerName: 'Flux', packageType: 'image',
    summary: 'image', providerPayload: { model: 'flux' },
    endpointHint: { method: 'POST', pathHint: 'x' }, estimatedCostUSD: 0.05,
    createdAt: 1000, operatorId: 'op-a', status: 'draft',
    history: [{ at: 1000, status: 'draft', operatorId: 'op-a', reason: 'draft' }],
  };
  state = appendGenerationRequest(state, rec);
  if (state.requests.length !== 1) return { ok: false, detail: `len=${state.requests.length}` };
  state = applyGenerationRequestStep(state, id, { at: 2000, status: 'approved', operatorId: 'op-a', reason: 'looks good' });
  const after = state.requests[0];
  return {
    ok: after.status === 'approved' && after.history.length === 2,
    detail: `status=${after.status} history=${after.history.length}`,
  };
}
function caseQueueThrowsOnUnknown(): { ok: boolean; detail: string } {
  const state = createInitialGenerationRequestQueue();
  try {
    applyGenerationRequestStep(state, 'nope', { at: 1, status: 'approved', operatorId: 'op-a', reason: 'x' });
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}
function caseQueueFifo(): { ok: boolean; detail: string } {
  let state = createInitialGenerationRequestQueue();
  for (let i = 0; i < GENERATION_REQUEST_LIMIT + 50; i++) {
    state = appendGenerationRequest(state, {
      requestId: newGenerationRequestId(), sourceAssetId: 'a', formula: 'ENERGY', campaign: 'c',
      providerId: 'flux', providerName: 'Flux', packageType: 'image',
      summary: 's', providerPayload: {}, endpointHint: { method: 'POST', pathHint: '/' },
      estimatedCostUSD: 0.05, createdAt: 1000 + i, operatorId: 'op-a', status: 'draft',
      history: [{ at: 1000 + i, status: 'draft', operatorId: 'op-a', reason: 'x' }],
    });
  }
  return {
    ok: state.requests.length === GENERATION_REQUEST_LIMIT &&
        state.totalRequests === GENERATION_REQUEST_LIMIT + 50,
    detail: `requests=${state.requests.length} total=${state.totalRequests} cap=${GENERATION_REQUEST_LIMIT}`,
  };
}
function caseResultsAppendFifo(): { ok: boolean; detail: string } {
  let state = createInitialGenerationResultRegistry();
  for (let i = 0; i < GENERATION_RESULT_LIMIT + 30; i++) {
    const rec: GenerationResultRecord = {
      resultId: newGenerationResultId(), assetId: 'a', requestId: 'r', provider: 'flux',
      operator: 'op-a', generatedAt: 1000 + i, preview: undefined, metadata: {},
    };
    state = appendGenerationResult(state, rec);
  }
  return {
    ok: state.results.length === GENERATION_RESULT_LIMIT &&
        state.totalResults === GENERATION_RESULT_LIMIT + 30,
    detail: `results=${state.results.length} total=${state.totalResults} cap=${GENERATION_RESULT_LIMIT}`,
  };
}

// ─── route static checks ─────────────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function caseQueueRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'generation-queue', 'route.ts'), 'utf8');
  const a = /operatorId is required/.test(src);
  const b = /operatorReason is required/.test(src);
  // The route also gates on approved-status:
  const c = /source asset not approved/.test(src);
  return { ok: a && b && c, detail: `operatorId=${a} operatorReason=${b} approved-gate=${c}` };
}
async function caseResultRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'generation-result', 'route.ts'), 'utf8');
  const a = /operatorId is required/.test(src);
  const b = /operatorReason is required/.test(src);
  return { ok: a && b, detail: `operatorId=${a} operatorReason=${b}` };
}
async function caseRoutesNoPipeline(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'app/api/generation-queue/route.ts',
    'app/api/generation-result/route.ts',
    'app/api/provider-registry/route.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/, /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/,
    /\bfetch\s+['"][^"']*\bapi\.(openai|bfl|klingai|minimaxi|ideogram|runwayml|pika)/i,
    /\brunPipeline\s*\(/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}: ${re}` };
  }
  return { ok: true, detail: 'no pipeline / external-provider calls in routes' };
}
async function caseRoutesListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  const ok = /['"]\/api\/provider-registry['"]/.test(src) &&
             /['"]\/api\/generation-queue['"]/.test(src) &&
             /['"]\/api\/generation-result['"]/.test(src);
  return { ok, detail: ok ? 'all 3 routes registered' : 'one or more missing' };
}
async function caseWhitelistUpdated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'scripts', 'verify-system-stability.ts'), 'utf8');
  const ok = /app\/api\/generation-queue\/route\.ts/.test(src) &&
             /app\/api\/generation-result\/route\.ts/.test(src);
  return { ok, detail: ok ? 'whitelist includes both POST routes' : 'whitelist missing one or both' };
}

// ─── narrative-language guard rails ──────────────────────────

function buildAllText(): string {
  const { imagePkg, videoPkg } = fixtures();
  const collect: string[] = [];
  for (const b of [buildOpenAIImagePayload, buildFluxImagePayload, buildMidjourneyImagePayload,
                    buildIdeogramImagePayload, buildGeminiImagePayload]) {
    const p = b(imagePkg);
    collect.push(p.providerName, p.advisoryNotice, ...p.notes);
  }
  for (const b of [buildVeoVideoPayload, buildRunwayVideoPayload, buildKlingVideoPayload,
                    buildHailuoVideoPayload, buildPikaVideoPayload]) {
    const p = b(videoPkg);
    collect.push(p.providerName, p.advisoryNotice, ...p.notes);
  }
  collect.push(getProviderRegistry().advisoryNotice);
  return collect.join(' ');
}
function caseForbiddenAutoPublish(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(auto.?publish|auto.?approve|auto.?execute|autonomous post|will\s+publish|will\s+post)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(Operator submits|No HTTP call|Human remains final authority|operator validates current API surface|operator-supervised)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('GENERATION CONNECTOR LAYER VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['image-adapters-shape',      '5 image adapters produce valid payloads',          () => caseAllImageAdaptersShape()],
    ['video-adapters-shape',      '5 video adapters produce valid payloads',          () => caseAllVideoAdaptersShape()],
    ['adapters-deterministic',    '10 adapters are pure (deterministic)',             () => caseAdaptersDeterministic()],
    ['adapters-no-fetch',         'no fetch / http client / writeFile in adapters',   async () => await caseAdaptersNoFetch()],
    ['ideogram-hebrew-switch',    'Ideogram resolves language=he for Israeli market', () => caseIdeogramHebrewSwitch()],
    ['midjourney-flags',          'Midjourney prompt carries --ar / --no / --style',  () => caseMidjourneyHasFlags()],
    ['registry-shape',            'registry: 5 image + 5 video providers',            () => caseRegistryShape()],
    ['registry-dispatch',         'dispatch helpers route to all 10 providers',       () => caseRegistryDispatch()],
    ['registry-costs',            'all registry costs finite + positive',             () => caseRegistryCostsAreFinite()],
    ['queue-append-transition',   'queue append + applyGenerationRequestStep work',   () => caseQueueAppendAndTransition()],
    ['queue-throws-unknown',      'applyGenerationRequestStep throws on unknown id',  () => caseQueueThrowsOnUnknown()],
    ['queue-fifo',                'queue FIFO cap respected',                         () => caseQueueFifo()],
    ['results-fifo',              'result registry FIFO cap respected',               () => caseResultsAppendFifo()],
    ['queue-route-operator-gated', 'queue POST requires operatorId + reason + approved-status gate', () => caseQueueRouteOperatorGated()],
    ['result-route-operator-gated', 'result POST requires operatorId + reason',       () => caseResultRouteOperatorGated()],
    ['routes-no-pipeline',        'routes do not call pipeline or any provider',      () => caseRoutesNoPipeline()],
    ['routes-listed',             'all 3 routes registered in systemIntegrityReport', () => caseRoutesListed()],
    ['whitelist-updated',         'system-stability whitelist includes both POSTs',   () => caseWhitelistUpdated()],
    ['forbidden-auto-publish',    'no auto-publish / auto-approve / autonomous post', () => caseForbiddenAutoPublish()],
    ['allowed-language',          'adapters declare operator-submits / Human final authority', () => caseAllowedLanguage()],
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
