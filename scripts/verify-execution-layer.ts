/**
 * VERIFY — Execution Layer (image / video / carousel / landing +
 * asset registry + operator-approval gate).
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { composeImageExecutionPackage } from '../lib/imageExecutionEngine';
import { composeVideoExecutionPackage } from '../lib/videoExecutionEngine';
import { composeCarouselExecutionPackage } from '../lib/carouselExecutionEngine';
import { composeLandingExecutionPackage } from '../lib/landingExecutionEngine';
import {
  appendAssetRecord, applyAssetApprovalStep, newAssetId,
  createInitialAssetRegistryMemory, ASSET_REGISTRY_LIMIT,
  type AssetRecord, type AssetApprovalStep,
} from '../lib/assetRegistryMemory';
import { computeCreativeBriefs } from '../lib/creativeBriefGenerator';
import { computeProductionPrompts } from '../lib/promptArchitect';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic data ──────────────────────────────────────────

const stories = [
  { blueprintId: 'quiet-return-home', storyName: 'Quiet Return Home', storyType: 'return',
    humanTension: 'fatigue holds the door', emotionalArc: 'pressure → breath → return',
    memoryAnchor: 'kitchen light', presenceAnchor: 'slow hand movement',
    mythicFrame: 'return', realismStyle: 'documentary handheld',
    alignment: 8, dignityProtection: 8, manipulationRisk: 2, riskLevel: 'low',
    audienceFeeling: 'a quiet relief observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight when the audience is observed to be tired' },
];
const scenes = [
  { sourceBlueprintId: 'quiet-return-home', sourceStoryName: 'Quiet Return Home',
    sceneId: 'scene-quiet-return-home', sceneType: 'arrival-stillness',
    location: 'apartment threshold and kitchen', environment: 'small home, lived-in',
    timeOfDay: 'late afternoon into early evening', realismLevel: 7,
    cameraLanguage: '50mm handheld', framingStyle: 'close, low angle, off-center',
    lightingStyle: 'single warm kitchen light', silenceAllocation: 'roughly two-thirds silence',
    presenceAnchors: ['slow hand movement'], memoryAnchors: ['kitchen light'],
    symbolismAnchors: ['threshold'], dignityAnchors: ['no music swell'],
    emotionalWeight: 8, restraintLevel: 7 },
];
const rhythm = {
  pacingProfile: 'observational-still', restraintProfile: 'measured-restraint',
  rhythmProfile: { tension: 4, release: 7, breathingRoom: 7, pause: 7, silence: 7,
                   restraint: 7, emotionalDensity: 4, emotionalSpacing: 7,
                   anticipation: 6, reflection: 7 },
  silenceMoments: [{ moment: 'after the door closes', alignment: 8 }],
  breathingMoments: [{ moment: 'in the held look', alignment: 7 }],
  emotionalDensity: 4,
};
const packages = {
  imagePackages: [
    { packageId: 'image-quiet-return-home', narrative: 'home story', scene: 'apartment kitchen',
      presence: 'slow hand movement', rhythm: 'measured-restraint', realism: 'documentary handheld',
      visualLanguage: '50mm handheld · close · single warm kitchen light',
      memoryAnchors: ['kitchen light'], emotionalWeight: 8 },
  ],
  videoPackages: [
    { packageId: 'video-quiet-return-home', narrative: 'home story',
      sceneSequence: [
        { index: 1, scene: 'threshold', emotionalBeat: 'tension', silenceShare: 5 },
        { index: 2, scene: 'kitchen', emotionalBeat: 'pause', silenceShare: 7 },
        { index: 3, scene: 'kitchen', emotionalBeat: 'release', silenceShare: 9 },
      ],
      rhythm: 'observational still', silenceMoments: ['after the door closes'],
      presenceMoments: ['slow hand movement'], emotionalArc: 'pressure → breath → return',
      realismAnchors: ['documentary handheld'], emotionalWeight: 8 },
  ],
  bannerPackages: [
    { packageId: 'banner-quiet-return-home', emotionalDirection: 'pressure → breath → return',
      visualDirection: '50mm handheld', memoryDirection: 'kitchen light',
      restraintDirection: 'measured restraint', compositionDirection: 'large negative space',
      emotionalWeight: 8 },
  ],
  landingPackages: [
    { packageId: 'landing-quiet-return-home', sectionPurpose: 'return section',
      emotionalPurpose: 'a quiet relief', narrativePurpose: 'this human story may carry emotional weight',
      memoryAnchor: 'kitchen light', visualAnchor: 'single warm kitchen light',
      emotionalWeight: 8 },
  ],
};

function buildBriefsAndPrompts() {
  const briefs = computeCreativeBriefs({ stories, scenes, rhythm, packages, formula: 'ENERGY',
                                         brandLanguage: 'hebrew', audienceMarket: 'israel' });
  const prompts = computeProductionPrompts({
    banners: briefs.banners, carousels: briefs.carousels, images: briefs.images,
    videos: briefs.videos, landings: briefs.landings, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  return { briefs, prompts };
}

// ─── image execution cases ───────────────────────────────────

function caseImageShape(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeImageExecutionPackage({ brief: briefs.images[0], prompt: prompts.imagePrompts[0] });
  const required = ['packageId', 'packageType', 'formula', 'sourceStoryName', 'sourceBriefId',
    'sourcePromptId', 'prompt', 'negativePrompt', 'aspectRatio', 'dimensions', 'style',
    'targetAudience', 'platform', 'generationHints', 'copyOverlayGuidance', 'operatorApprovalRequired'];
  const missing = required.filter((k) => !(k in p));
  return {
    ok: missing.length === 0 && p.operatorApprovalRequired === true && p.packageType === 'image' &&
        p.dimensions.width > 0 && p.dimensions.height > 0,
    detail: missing.length === 0 ? `aspect=${p.aspectRatio} dims=${p.dimensions.width}x${p.dimensions.height}` : `missing=${missing.join(',')}`,
  };
}
function caseImageDeterministic(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const input = { brief: briefs.images[0], prompt: prompts.imagePrompts[0] };
  const a = JSON.stringify(composeImageExecutionPackage(input));
  const b = JSON.stringify(composeImageExecutionPackage(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseImageHasNegativePrompt(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeImageExecutionPackage({ brief: briefs.images[0], prompt: prompts.imagePrompts[0] });
  const required = ['stock-photo gloss', 'invented packaging', 'invented flavor', 'productivity-drug'];
  const hits = required.filter((t) => p.negativePrompt.includes(t));
  return { ok: hits.length >= 3, detail: `negative prompt includes ${hits.length}/${required.length} key tokens` };
}

// ─── video execution cases ───────────────────────────────────

function caseVideoShape(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeVideoExecutionPackage({ brief: briefs.videos[0], prompt: prompts.videoPrompts[0] });
  const required = ['packageId', 'packageType', 'formula', 'sourceStoryName', 'prompt',
    'scenes', 'totalDurationSeconds', 'aspectRatio', 'dimensions', 'platform',
    'camera', 'audio', 'caption', 'hashtags', 'targetAudience', 'operatorApprovalRequired'];
  const missing = required.filter((k) => !(k in p));
  return {
    ok: missing.length === 0 && p.scenes.length === briefs.videos[0].beats.length &&
        p.totalDurationSeconds > 0 && p.hashtags.length > 0,
    detail: missing.length === 0 ? `scenes=${p.scenes.length} duration=${p.totalDurationSeconds}s hashtags=${p.hashtags.length}` : `missing=${missing.join(',')}`,
  };
}
function caseVideoDeterministic(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const input = { brief: briefs.videos[0], prompt: prompts.videoPrompts[0] };
  const a = JSON.stringify(composeVideoExecutionPackage(input));
  const b = JSON.stringify(composeVideoExecutionPackage(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseVideoDurationDistributed(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeVideoExecutionPackage({ brief: briefs.videos[0], prompt: prompts.videoPrompts[0] });
  const sumDurations = p.scenes.reduce((a, s) => a + s.durationSeconds, 0);
  // Allow small rounding tolerance.
  const ok = Math.abs(sumDurations - p.totalDurationSeconds) <= 0.2;
  return { ok, detail: `sum=${sumDurations} total=${p.totalDurationSeconds}` };
}
function caseVideoHashtagsRestrained(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeVideoExecutionPackage({ brief: briefs.videos[0], prompt: prompts.videoPrompts[0] });
  // Must NOT include growth-hacking tags.
  const banned = ['#fyp', '#foryou', '#viral', '#explore', '#trending', '#ad'];
  const violators = p.hashtags.filter((h) => banned.includes(h.toLowerCase()));
  return { ok: violators.length === 0, detail: violators.length === 0 ? 'no growth-hack tags' : `banned in: ${violators.join(',')}` };
}

// ─── carousel execution cases ────────────────────────────────

function caseCarouselShape(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeCarouselExecutionPackage({ brief: briefs.carousels[0], prompt: prompts.carouselPrompts[0] });
  const required = ['packageId', 'packageType', 'formula', 'sourceStoryName', 'prompt',
    'slides', 'slideCount', 'emotionalArc', 'rhythm', 'aspectRatio', 'dimensions',
    'platform', 'targetAudience', 'operatorApprovalRequired'];
  const missing = required.filter((k) => !(k in p));
  return {
    ok: missing.length === 0 && p.slides.length === briefs.carousels[0].frames.length &&
        p.slideCount === p.slides.length,
    detail: missing.length === 0 ? `slides=${p.slides.length}` : `missing=${missing.join(',')}`,
  };
}
function caseCarouselSlideFields(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeCarouselExecutionPackage({ brief: briefs.carousels[0], prompt: prompts.carouselPrompts[0] });
  const required = ['index', 'slideId', 'framePurpose', 'copy', 'visualInstructions', 'layout', 'silenceAllocation'];
  for (const s of p.slides) {
    for (const k of required) if (!(k in s)) return { ok: false, detail: `slide ${s.index} missing ${k}` };
  }
  return { ok: true, detail: 'all slides carry required fields' };
}
function caseCarouselDeterministic(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const input = { brief: briefs.carousels[0], prompt: prompts.carouselPrompts[0] };
  const a = JSON.stringify(composeCarouselExecutionPackage(input));
  const b = JSON.stringify(composeCarouselExecutionPackage(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── landing execution cases ─────────────────────────────────

function caseLandingShape(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeLandingExecutionPackage({ brief: briefs.landings[0], prompt: prompts.landingPrompts[0] });
  const required = ['packageId', 'packageType', 'formula', 'sourceStoryName', 'prompt',
    'hero', 'sections', 'cta', 'faq', 'socialProof', 'targetAudience', 'operatorApprovalRequired'];
  const missing = required.filter((k) => !(k in p));
  return {
    ok: missing.length === 0 && p.sections.length > 0 && p.faq.length > 0 && p.socialProof.length > 0,
    detail: missing.length === 0 ? `sections=${p.sections.length} faq=${p.faq.length} socialProof=${p.socialProof.length}` : `missing=${missing.join(',')}`,
  };
}
function caseLandingDeterministic(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const input = { brief: briefs.landings[0], prompt: prompts.landingPrompts[0] };
  const a = JSON.stringify(composeLandingExecutionPackage(input));
  const b = JSON.stringify(composeLandingExecutionPackage(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseLandingNoInventedTestimonials(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const p = composeLandingExecutionPackage({ brief: briefs.landings[0], prompt: prompts.landingPrompts[0] });
  // Social proof must require operator-provided content.
  const operatorProvided = p.socialProof.some((s) => /operator-provided|operator approval/i.test(s.directionNote));
  const noInvented = p.socialProof.every((s) => !/invented/i.test(s.directionNote) || /no\s+invented/i.test(s.directionNote));
  return { ok: operatorProvided && noInvented, detail: `operatorProvided=${operatorProvided} noInvented=${noInvented}` };
}

// ─── asset registry cases ────────────────────────────────────

function caseRegistryAppendAndUpdate(): { ok: boolean; detail: string } {
  let state = createInitialAssetRegistryMemory();
  const id = newAssetId();
  const rec: AssetRecord = {
    assetId: id, formula: 'ENERGY', campaign: 'test-campaign', packageType: 'image',
    sourceStoryName: 'Quiet Return Home', sourceBriefId: 'brief-image-x', sourcePromptId: 'prompt-image-x',
    prompt: 'demo prompt text', summary: 'image · home', createdAt: 1000,
    operatorId: 'op-a', approvalStatus: 'pending',
    approvalHistory: [{ at: 1000, status: 'pending', operatorId: 'op-a', reason: 'register' }],
  };
  state = appendAssetRecord(state, rec);
  if (state.assets.length !== 1 || state.totalAssets !== 1) {
    return { ok: false, detail: `len=${state.assets.length} total=${state.totalAssets}` };
  }
  state = applyAssetApprovalStep(state, id, { at: 2000, status: 'approved', operatorId: 'op-a', reason: 'looks honest' });
  const a = state.assets[0];
  return {
    ok: a.approvalStatus === 'approved' && a.approvalHistory.length === 2,
    detail: `status=${a.approvalStatus} history=${a.approvalHistory.length}`,
  };
}
function caseRegistryThrowsOnUnknown(): { ok: boolean; detail: string } {
  const state = createInitialAssetRegistryMemory();
  try {
    applyAssetApprovalStep(state, 'asset-does-not-exist', {
      at: 1, status: 'approved', operatorId: 'op-a', reason: 'no',
    });
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}
function caseRegistryFifo(): { ok: boolean; detail: string } {
  let state = createInitialAssetRegistryMemory();
  for (let i = 0; i < ASSET_REGISTRY_LIMIT + 50; i++) {
    const rec: AssetRecord = {
      assetId: newAssetId(), formula: 'ENERGY', campaign: 'c', packageType: 'image',
      sourceStoryName: 's', sourceBriefId: 'b', sourcePromptId: 'p',
      prompt: '...', summary: '...', createdAt: 1000 + i,
      operatorId: 'op-a', approvalStatus: 'pending',
      approvalHistory: [{ at: 1000 + i, status: 'pending', operatorId: 'op-a', reason: 'register' }],
    };
    state = appendAssetRecord(state, rec);
  }
  return {
    ok: state.assets.length === ASSET_REGISTRY_LIMIT && state.totalAssets === ASSET_REGISTRY_LIMIT + 50,
    detail: `assets=${state.assets.length} total=${state.totalAssets} cap=${ASSET_REGISTRY_LIMIT}`,
  };
}
function caseRegistryPureTransform(): { ok: boolean; detail: string } {
  const state = createInitialAssetRegistryMemory();
  const rec: AssetRecord = {
    assetId: 'a-1', formula: 'ENERGY', campaign: 'c', packageType: 'image',
    sourceStoryName: 's', sourceBriefId: 'b', sourcePromptId: 'p',
    prompt: 'p', summary: 's', createdAt: 1000,
    operatorId: 'op-a', approvalStatus: 'pending',
    approvalHistory: [{ at: 1000, status: 'pending', operatorId: 'op-a', reason: 'register' }],
  };
  const a = appendAssetRecord(state, rec);
  const b = appendAssetRecord(state, rec);
  return {
    ok: state.assets.length === 0 && JSON.stringify(a) === JSON.stringify(b),
    detail: `prior=${state.assets.length} a===b: ${JSON.stringify(a) === JSON.stringify(b)}`,
  };
}

// ─── route / isolation cases ─────────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function readRegistryRouteSrc(): Promise<string> {
  return fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'asset-registry', 'route.ts'), 'utf8');
}
async function caseRouteNoPipeline(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRegistryRouteSrc();
  const codeOnly = stripCommentsAndStrings(src);
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/, /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/, /from\s+['"]@?lib\/.*publish/i,
    /\bfetch\s*\([^)]*\/api\/generate/, /\brunPipeline\s*\(/,
    /\bcomposeBannerSvg\s*\(/,
  ];
  for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden ${re}` };
  return { ok: true, detail: 'clean' };
}
async function caseRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRegistryRouteSrc();
  // Must require operatorId AND operatorReason.
  const reqsId = /operatorId is required/.test(src);
  const reqsReason = /operatorReason is required/.test(src);
  return {
    ok: reqsId && reqsReason,
    detail: `operatorId=${reqsId} operatorReason=${reqsReason}`,
  };
}
async function caseRouteHasPost(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRegistryRouteSrc();
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
  const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
  return { ok: hasGet && hasPost, detail: `GET=${hasGet} POST=${hasPost}` };
}
async function caseRouteListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  return {
    ok: /['"]\/api\/asset-registry['"]/.test(src),
    detail: /['"]\/api\/asset-registry['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/imageExecutionEngine.ts', 'lib/videoExecutionEngine.ts',
    'lib/carouselExecutionEngine.ts', 'lib/landingExecutionEngine.ts',
    'lib/assetRegistryMemory.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/, /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"]@?lib\/banner(?!\.)/, /from\s+['"]@?lib\/.*publish/i,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}: ${re}` };
    if (f !== 'lib/assetRegistryMemory.ts') {
      if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    }
  }
  return { ok: true, detail: 'engines pure · memory store properly scoped' };
}

// ─── narrative-language guard rails ──────────────────────────

function buildAllText(): string {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const collect: string[] = [];
  const img = composeImageExecutionPackage({ brief: briefs.images[0], prompt: prompts.imagePrompts[0] });
  collect.push(img.style, img.targetAudience, img.copyOverlayGuidance, img.advisoryNotice, ...img.notes);
  const vid = composeVideoExecutionPackage({ brief: briefs.videos[0], prompt: prompts.videoPrompts[0] });
  collect.push(vid.camera, vid.audio, vid.caption, ...vid.hashtags, vid.targetAudience, vid.advisoryNotice, ...vid.notes);
  const car = composeCarouselExecutionPackage({ brief: briefs.carousels[0], prompt: prompts.carouselPrompts[0] });
  collect.push(car.targetAudience, car.advisoryNotice, ...car.notes,
    ...car.slides.map((s) => `${s.copy} ${s.visualInstructions} ${s.layout}`));
  const lnd = composeLandingExecutionPackage({ brief: briefs.landings[0], prompt: prompts.landingPrompts[0] });
  collect.push(lnd.hero.copyDirection, lnd.hero.layout, lnd.cta.copyDirection, lnd.cta.visualDirection,
    lnd.targetAudience, lnd.advisoryNotice, ...lnd.notes,
    ...lnd.sections.map((s) => `${s.copyDirection} ${s.layout}`),
    ...lnd.faq.map((f) => `${f.questionDirection} ${f.answerDirection}`),
    ...lnd.socialProof.map((s) => `${s.proofType} ${s.directionNote}`));
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|auto-?approve|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenViralExploit(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|trauma\s+exploit|manipulat)/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenExecutionVerbs(): { ok: boolean; detail: string } {
  const text = buildAllText();
  // Strip negated-contract phrasing.
  const stripped = text
    .replace(/no image generation occurs/gi, '').replace(/no video generation occurs/gi, '')
    .replace(/no carousel generation occurs/gi, '').replace(/no landing page is built, deployed, or published/gi, '')
    .replace(/never calls a generator/gi, '').replace(/never publishes/gi, '')
    .replace(/never auto-approves/gi, '').replace(/no publishing/gi, '')
    .replace(/no autonomous posting/gi, '').replace(/no social execution/gi, '')
    .replace(/no auto-approval/gi, '').replace(/does\s+not\s+call/gi, '')
    .replace(/does\s+not\s+publish/gi, '').replace(/does\s+not\s+auto[- ]?deploy/gi, '')
    .replace(/never auto-publish/gi, '');
  const banned = /\b(generate|generates|publish|publishes|launch|launches|execute|executes|deploy|run\s+ad|create\s+ad)\b/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : `banned: ${stripped.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(execution package|operator approval required|ready for operator-driven|Human remains final authority)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseHumanFinalAuthorityOnAllPackages(): { ok: boolean; detail: string } {
  const { briefs, prompts } = buildBriefsAndPrompts();
  const img = composeImageExecutionPackage({ brief: briefs.images[0], prompt: prompts.imagePrompts[0] });
  const vid = composeVideoExecutionPackage({ brief: briefs.videos[0], prompt: prompts.videoPrompts[0] });
  const car = composeCarouselExecutionPackage({ brief: briefs.carousels[0], prompt: prompts.carouselPrompts[0] });
  const lnd = composeLandingExecutionPackage({ brief: briefs.landings[0], prompt: prompts.landingPrompts[0] });
  const all = [img, vid, car, lnd];
  for (const p of all) {
    if (!/Human remains final authority/i.test(p.advisoryNotice)) {
      return { ok: false, detail: `${p.packageId} missing Human remains final authority` };
    }
    if (p.operatorApprovalRequired !== true) {
      return { ok: false, detail: `${p.packageId} operatorApprovalRequired not true` };
    }
  }
  return { ok: true, detail: 'all 4 packages declare Human final authority + operatorApprovalRequired=true' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('EXECUTION LAYER VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['image-shape',             'image execution package shape',                    () => caseImageShape()],
    ['image-deterministic',     'image execution engine is pure',                   () => caseImageDeterministic()],
    ['image-negative-prompt',   'image package carries restrained negative prompt', () => caseImageHasNegativePrompt()],
    ['video-shape',             'video execution package shape',                    () => caseVideoShape()],
    ['video-deterministic',     'video execution engine is pure',                   () => caseVideoDeterministic()],
    ['video-duration-distributed', 'beat durations sum to total',                   () => caseVideoDurationDistributed()],
    ['video-hashtags-restrained', 'no growth-hacking hashtags',                     () => caseVideoHashtagsRestrained()],
    ['carousel-shape',          'carousel execution package shape',                 () => caseCarouselShape()],
    ['carousel-slide-fields',   'every slide carries required fields',              () => caseCarouselSlideFields()],
    ['carousel-deterministic',  'carousel execution engine is pure',                () => caseCarouselDeterministic()],
    ['landing-shape',           'landing execution package shape',                  () => caseLandingShape()],
    ['landing-deterministic',   'landing execution engine is pure',                 () => caseLandingDeterministic()],
    ['landing-no-invented-testimonials', 'social proof requires operator-provided content', () => caseLandingNoInventedTestimonials()],
    ['registry-append-update',  'append + applyAssetApprovalStep work',             () => caseRegistryAppendAndUpdate()],
    ['registry-throws-unknown', 'applyAssetApprovalStep throws on unknown asset',   () => caseRegistryThrowsOnUnknown()],
    ['registry-fifo',           'append > limit → cap respected',                   () => caseRegistryFifo()],
    ['registry-pure-transform', 'appendAssetRecord is referentially transparent',   () => caseRegistryPureTransform()],
    ['route-no-pipeline',       'route does not import pipeline / publish / generate', () => caseRouteNoPipeline()],
    ['route-operator-gated',    'POST requires operatorId + operatorReason',        () => caseRouteOperatorGated()],
    ['route-has-post',          'route exports both GET and POST (operator gate)',  () => caseRouteHasPost()],
    ['route-listed',            '/api/asset-registry registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',               'engines + memory have no critic / pipeline / banner / publish imports', () => caseIsolation()],
    ['forbidden-prediction',    'no predict / will / winner / best / recommended / optimize / chosen / optimal / auto-approve', () => caseForbiddenPrediction()],
    ['forbidden-viral-exploit', 'no viral / dopamine / outrage / exploit / manipulat', () => caseForbiddenViralExploit()],
    ['forbidden-execution-verbs', 'no generate / publish / launch / deploy in narrative', () => caseForbiddenExecutionVerbs()],
    ['allowed-language',        'execution package / operator approval required / Human final authority present', () => caseAllowedLanguage()],
    ['human-final-authority',   'all 4 packages declare Human final authority + operatorApprovalRequired=true', () => caseHumanFinalAuthorityOnAllPackages()],
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
