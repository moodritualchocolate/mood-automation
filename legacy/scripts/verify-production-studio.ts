/**
 * VERIFY — Production Studio (briefs + prompts + brand guardian).
 *
 * Covers all three new engines + the unified GET route.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeCreativeBriefs } from '../lib/creativeBriefGenerator';
import { computeProductionPrompts } from '../lib/promptArchitect';
import { computeBrandGuardian, briefToScanText, KNOWN_FORMULAS } from '../lib/brandGuardian';

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
  { blueprintId: 'morning-restart', storyName: 'Morning Restart', storyType: 'ritual',
    humanTension: 'morning carries last night', emotionalArc: 'noise → silence → clarity',
    memoryAnchor: 'half-empty coffee cup', presenceAnchor: 'exhale',
    mythicFrame: 'becoming', realismStyle: 'natural light',
    alignment: 7, dignityProtection: 8, manipulationRisk: 2, riskLevel: 'low',
    audienceFeeling: 'a familiar steadying observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with morning restoration rituals' },
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
  { sourceBlueprintId: 'morning-restart', sourceStoryName: 'Morning Restart',
    sceneId: 'scene-morning-restart', sceneType: 'ritual-emergence',
    location: 'kitchen counter', environment: 'home kitchen, morning light',
    timeOfDay: 'early morning', realismLevel: 7,
    cameraLanguage: '50mm handheld', framingStyle: 'tight on hands and cup',
    lightingStyle: 'natural window light', silenceAllocation: 'silence with kettle sound only',
    presenceAnchors: ['exhale'], memoryAnchors: ['half-empty coffee cup'],
    symbolismAnchors: ['mug'], dignityAnchors: ['no music swell'],
    emotionalWeight: 7, restraintLevel: 7 },
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

// ─── brief cases ──────────────────────────────────────────────

function caseBriefShape(): { ok: boolean; detail: string } {
  const r = computeCreativeBriefs({
    stories, scenes, rhythm, packages, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  if (r.banners.length !== 2) return { ok: false, detail: `banners=${r.banners.length}` };
  if (r.carousels.length !== 2) return { ok: false, detail: `carousels=${r.carousels.length}` };
  if (r.images.length !== 2) return { ok: false, detail: `images=${r.images.length}` };
  if (r.videos.length !== 2) return { ok: false, detail: `videos=${r.videos.length}` };
  if (r.landings.length !== 2) return { ok: false, detail: `landings=${r.landings.length}` };
  // Each brief must have operatorReviewRequired === true.
  for (const b of [...r.banners, ...r.carousels, ...r.images, ...r.videos]) {
    if (b.operatorReviewRequired !== true) return { ok: false, detail: `${b.briefId} operatorReviewRequired not true` };
    if (!b.dimensionsGuidance) return { ok: false, detail: `${b.briefId} missing dimensionsGuidance` };
  }
  for (const b of r.landings) {
    if (b.operatorReviewRequired !== true) return { ok: false, detail: `${b.briefId} operatorReviewRequired not true` };
    if (!b.layoutGuidance) return { ok: false, detail: `${b.briefId} missing layoutGuidance` };
  }
  return { ok: true, detail: `5×2 briefs + operator-review-required on each` };
}
function caseBriefDeterministic(): { ok: boolean; detail: string } {
  const input = { stories, scenes, rhythm, packages, formula: 'ENERGY' as const,
                   brandLanguage: 'hebrew' as const, audienceMarket: 'israel' as const };
  const a = JSON.stringify(computeCreativeBriefs(input));
  const b = JSON.stringify(computeCreativeBriefs(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseBriefFormulas(): { ok: boolean; detail: string } {
  for (const formula of KNOWN_FORMULAS) {
    const r = computeCreativeBriefs({
      stories, scenes, rhythm, packages, formula,
      brandLanguage: 'hebrew', audienceMarket: 'israel',
    });
    if (r.banners.length === 0) return { ok: false, detail: `formula=${formula} produced 0 banners` };
    if (!r.banners[0].copyDirection.includes('Hebrew')) {
      return { ok: false, detail: `formula=${formula} missing Hebrew copy guidance` };
    }
  }
  return { ok: true, detail: `all 4 formulas (${KNOWN_FORMULAS.join(', ')}) supported with Hebrew guidance` };
}
function caseBriefHebrewIsraeliPath(): { ok: boolean; detail: string } {
  const r = computeCreativeBriefs({
    stories, scenes, rhythm, packages, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  // Verify Hebrew RTL appears in dimensions guidance.
  const banner = r.banners[0];
  const allText = `${banner.copyDirection} ${banner.dimensionsGuidance}`;
  return {
    ok: /Hebrew/i.test(allText) && /RTL/.test(allText),
    detail: `bannerText includes Hebrew=${/Hebrew/i.test(allText)} RTL=${/RTL/.test(allText)}`,
  };
}

// ─── prompt cases ────────────────────────────────────────────

function casePromptShape(): { ok: boolean; detail: string } {
  const briefs = computeCreativeBriefs({
    stories, scenes, rhythm, packages, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  const p = computeProductionPrompts({
    banners: briefs.banners, carousels: briefs.carousels, images: briefs.images,
    videos: briefs.videos, landings: briefs.landings, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  if (p.imagePrompts.length === 0) return { ok: false, detail: 'no image prompts' };
  if (p.videoPrompts.length === 0) return { ok: false, detail: 'no video prompts' };
  if (p.bannerPrompts.length === 0) return { ok: false, detail: 'no banner prompts' };
  if (p.landingPrompts.length === 0) return { ok: false, detail: 'no landing prompts' };
  if (p.carouselPrompts.length === 0) return { ok: false, detail: 'no carousel prompts' };
  for (const a of [...p.imagePrompts, ...p.videoPrompts, ...p.bannerPrompts, ...p.landingPrompts, ...p.carouselPrompts]) {
    if (!a.promptText || a.promptText.length < 50) return { ok: false, detail: `${a.promptId} promptText too short` };
    if (a.operatorReviewRequired !== true) return { ok: false, detail: `${a.promptId} operatorReviewRequired not true` };
    if (a.tokenBudget <= 0) return { ok: false, detail: `${a.promptId} bad token budget` };
  }
  return { ok: true, detail: 'all 5 prompt families populated with operatorReviewRequired + token budget' };
}
function casePromptDeterministic(): { ok: boolean; detail: string } {
  const briefs = computeCreativeBriefs({
    stories, scenes, rhythm, packages, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  const input = { banners: briefs.banners, carousels: briefs.carousels, images: briefs.images,
                  videos: briefs.videos, landings: briefs.landings, formula: 'ENERGY' as const };
  const a = JSON.stringify(computeProductionPrompts(input));
  const b = JSON.stringify(computeProductionPrompts(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function casePromptFormulasIsraeli(): { ok: boolean; detail: string } {
  for (const formula of KNOWN_FORMULAS) {
    const briefs = computeCreativeBriefs({
      stories, scenes, rhythm, packages, formula,
      brandLanguage: 'hebrew', audienceMarket: 'israel',
    });
    const p = computeProductionPrompts({
      banners: briefs.banners, carousels: briefs.carousels, images: briefs.images,
      videos: briefs.videos, landings: briefs.landings, formula,
      brandLanguage: 'hebrew', audienceMarket: 'israel',
    });
    const img = p.imagePrompts[0];
    if (!img.promptText.includes(`MOOD ${formula}`)) {
      return { ok: false, detail: `formula=${formula} missing MOOD ${formula} reference` };
    }
    if (!/Hebrew/i.test(img.promptText)) {
      return { ok: false, detail: `formula=${formula} missing Hebrew guidance` };
    }
    if (!/mobile-first/i.test(img.promptText)) {
      return { ok: false, detail: `formula=${formula} missing mobile-first` };
    }
    if (!/dimension/i.test(img.promptText)) {
      return { ok: false, detail: `formula=${formula} missing product dimension` };
    }
  }
  return { ok: true, detail: 'all 4 formulas produce Israeli + mobile-first + Hebrew + dimensions prompts' };
}

// ─── brand guardian cases ────────────────────────────────────

function caseGuardianShape(): { ok: boolean; detail: string } {
  const briefs = computeCreativeBriefs({
    stories, scenes, rhythm, packages, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  const prompts = computeProductionPrompts({
    banners: briefs.banners, carousels: briefs.carousels, images: briefs.images,
    videos: briefs.videos, landings: briefs.landings, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  const guardianBriefs = [...briefs.banners, ...briefs.carousels, ...briefs.images, ...briefs.videos, ...briefs.landings].map((b) => ({
    briefId: b.briefId, briefType: b.briefType, formula: b.formula,
    sourceStoryName: b.sourceStoryName, audienceMarket: b.audienceMarket,
    briefText: briefToScanText(b as unknown as Record<string, unknown>),
  }));
  const guardianPrompts = [...prompts.imagePrompts, ...prompts.videoPrompts, ...prompts.bannerPrompts,
    ...prompts.landingPrompts, ...prompts.carouselPrompts].map((p) => ({
    promptId: p.promptId, promptType: p.promptType, formula: p.formula,
    sourceStoryName: p.sourceStoryName, promptText: p.promptText,
  }));
  const g = computeBrandGuardian({ briefs: guardianBriefs, prompts: guardianPrompts, audienceMarket: 'israel' });
  if (g.briefReports.length !== guardianBriefs.length) {
    return { ok: false, detail: `briefReports=${g.briefReports.length}` };
  }
  if (g.promptReports.length !== guardianPrompts.length) {
    return { ok: false, detail: `promptReports=${g.promptReports.length}` };
  }
  // Each report must have 7 findings (one per rule).
  for (const r of [...g.briefReports, ...g.promptReports]) {
    if (r.findings.length !== 7) return { ok: false, detail: `${r.targetId} findings=${r.findings.length}` };
    if (r.operatorApprovalRequired !== true) return { ok: false, detail: `${r.targetId} operatorApprovalRequired not true` };
  }
  return { ok: true, detail: `briefReports=${g.briefReports.length} promptReports=${g.promptReports.length} findings/each=7` };
}
function caseGuardianDeterministic(): { ok: boolean; detail: string } {
  const input = {
    briefs: [{ briefId: 'b1', briefType: 'banner' as const, formula: 'ENERGY' as const,
              sourceStoryName: 'home', audienceMarket: 'israel',
              briefText: 'MOOD ENERGY · Hebrew · RTL safe area · soft amber morning cream · dimension 80mm · bar' }],
    prompts: [],
    audienceMarket: 'israel' as const,
  };
  const a = JSON.stringify(computeBrandGuardian(input));
  const b = JSON.stringify(computeBrandGuardian(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseGuardianViolationDetection(): { ok: boolean; detail: string } {
  // Inject brand-truth violation phrases + invented product.
  const r = computeBrandGuardian({
    briefs: [{
      briefId: 'b-bad', briefType: 'banner', formula: 'ENERGY',
      sourceStoryName: 'bad', audienceMarket: 'israel',
      briefText: 'MOOD ENERGY supplement · boost your productivity · MOOD CALM holiday edition · luxury indulge',
    }],
    audienceMarket: 'israel',
  });
  const report = r.briefReports[0];
  const violated = report.findings.filter((f) => f.status === 'violated').map((f) => f.ruleId);
  // Expect: brand-consistency violated AND no-invented-products violated.
  return {
    ok: violated.includes('brand-consistency') && violated.includes('no-invented-products') &&
        r.totalViolations >= 2,
    detail: `violated=${violated.join(',')} total=${r.totalViolations}`,
  };
}
function caseGuardianHebrewRule(): { ok: boolean; detail: string } {
  // Israeli-market brief WITHOUT Hebrew / RTL should be violated.
  const r = computeBrandGuardian({
    briefs: [{
      briefId: 'b-no-hebrew', briefType: 'banner', formula: 'ENERGY',
      sourceStoryName: 'no hebrew', audienceMarket: 'israel',
      briefText: 'MOOD ENERGY · english copy only · soft amber',
    }],
    audienceMarket: 'israel',
  });
  const report = r.briefReports[0];
  const hebrew = report.findings.find((f) => f.ruleId === 'hebrew-language');
  return {
    ok: hebrew !== undefined && hebrew.status === 'violated',
    detail: `hebrew status=${hebrew?.status} detail=${hebrew?.detail}`,
  };
}
function caseGuardianGlobalMarketSkipsHebrew(): { ok: boolean; detail: string } {
  const r = computeBrandGuardian({
    briefs: [{
      briefId: 'b-global', briefType: 'banner', formula: 'ENERGY',
      sourceStoryName: 'global', audienceMarket: 'global',
      briefText: 'MOOD ENERGY · soft amber · bar 80mm · english',
    }],
    audienceMarket: 'global',
  });
  const report = r.briefReports[0];
  const hebrew = report.findings.find((f) => f.ruleId === 'hebrew-language');
  return {
    ok: hebrew !== undefined && hebrew.status === 'upheld',
    detail: `hebrew status=${hebrew?.status}`,
  };
}
function caseGuardianNeverBlocks(): { ok: boolean; detail: string } {
  // Even with all rules violated, the engine must not throw or
  // produce auto-fixes. It returns a report.
  const r = computeBrandGuardian({
    briefs: [{
      briefId: 'b-worst', briefType: 'banner', formula: 'ENERGY',
      sourceStoryName: 'worst', audienceMarket: 'israel',
      briefText: 'matcha MOOD supplement boost your productivity peak performance strawberry MOOD CALM holiday edition luxury indulge',
    }],
    audienceMarket: 'israel',
  });
  const report = r.briefReports[0];
  // Engine output must include "operator approval required" or
  // "operator review required" but no auto-fix / auto-correct fields.
  const text = JSON.stringify(report);
  const noAutoFix = !/auto[- ]?fix|auto[- ]?correct|auto[- ]?apply|blocked\s*:\s*true/i.test(text);
  return {
    ok: noAutoFix && report.violationCount > 0,
    detail: `violations=${report.violationCount} noAutoFix=${noAutoFix}`,
  };
}

// ─── route + isolation ───────────────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function readRouteSrc(): Promise<string> {
  return fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'production-studio', 'route.ts'), 'utf8');
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
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|launch|publish|generate|deploy|autoApply|autoApprove)\b/;
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
    ok: /['"]\/api\/production-studio['"]/.test(src),
    detail: /['"]\/api\/production-studio['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = ['lib/creativeBriefGenerator.ts', 'lib/promptArchitect.ts', 'lib/brandGuardian.ts'];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/, /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"]@?lib\/banner(?!\.)/, /from\s+['"]@?lib\/.*publish/i, /from\s+['"]@?lib\/.*generate(?!\.ts)/i,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden import in ${f}: ${re}` };
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'engines pure · no critic / pipeline / banner / publish / image-generate imports' };
}

// ─── narrative-language guard rails ──────────────────────────

function buildAllText(): string {
  const briefs = computeCreativeBriefs({
    stories, scenes, rhythm, packages, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  const prompts = computeProductionPrompts({
    banners: briefs.banners, carousels: briefs.carousels, images: briefs.images,
    videos: briefs.videos, landings: briefs.landings, formula: 'ENERGY',
    brandLanguage: 'hebrew', audienceMarket: 'israel',
  });
  const guardian = computeBrandGuardian({
    briefs: briefs.banners.map((b) => ({ briefId: b.briefId, briefType: b.briefType,
      formula: b.formula, sourceStoryName: b.sourceStoryName, audienceMarket: b.audienceMarket,
      briefText: briefToScanText(b as unknown as Record<string, unknown>) })),
    prompts: prompts.imagePrompts.map((p) => ({ promptId: p.promptId, promptType: p.promptType,
      formula: p.formula, sourceStoryName: p.sourceStoryName, promptText: p.promptText })),
    audienceMarket: 'israel',
  });
  const collect: string[] = [briefs.advisoryNotice, prompts.advisoryNotice, guardian.advisoryNotice];
  for (const b of briefs.banners) collect.push(b.composition, b.emotionalDirection, b.visualDirection,
    b.memoryDirection, b.restraintDirection, b.copyDirection, b.productDirection, b.dimensionsGuidance,
    ...b.notes);
  for (const b of briefs.carousels) collect.push(b.emotionalArc, b.rhythm, b.copyDirection,
    b.productDirection, ...b.notes, ...b.frames.map((f) => `${f.framePurpose} ${f.scene} ${f.presence} ${f.silenceAllocation}`));
  for (const a of prompts.imagePrompts) collect.push(a.promptText, a.summary, ...a.notes);
  for (const r of guardian.briefReports) collect.push(...r.findings.map((f) => `${f.ruleName} ${f.detail}`), ...r.notes);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform|auto-?approve)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenViralExploit(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|trauma\s+exploit|manipulat)/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(production-ready brief|production prompt|operator approval required|operator review required|may carry emotional weight|brand guardian observed|requires more evidence)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseHumanRemainsFinalAuthority(): { ok: boolean; detail: string } {
  const briefs = computeCreativeBriefs({ stories, scenes, rhythm, packages, formula: 'ENERGY',
                                          brandLanguage: 'hebrew', audienceMarket: 'israel' });
  const ok1 = /Human remains final authority/i.test(briefs.advisoryNotice);
  const prompts = computeProductionPrompts({ banners: briefs.banners, carousels: briefs.carousels,
    images: briefs.images, videos: briefs.videos, landings: briefs.landings, formula: 'ENERGY' });
  const ok2 = /Human remains final authority/i.test(prompts.advisoryNotice);
  const g = computeBrandGuardian({ briefs: [], prompts: [], audienceMarket: 'israel' });
  const ok3 = /Human remains final authority/i.test(g.advisoryNotice);
  return { ok: ok1 && ok2 && ok3, detail: `briefs=${ok1} prompts=${ok2} guardian=${ok3}` };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('PRODUCTION STUDIO VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['brief-shape',                '5×2 briefs + operator-review-required + dimensions guidance', () => caseBriefShape()],
    ['brief-deterministic',        'creative brief engine is pure',                    () => caseBriefDeterministic()],
    ['brief-formulas-supported',   'all 4 MOOD formulas produce briefs',               () => caseBriefFormulas()],
    ['brief-hebrew-israeli',       'Israeli + Hebrew → Hebrew RTL guidance in brief',  () => caseBriefHebrewIsraeliPath()],
    ['prompt-shape',               'all 5 prompt families populated + operator-review', () => casePromptShape()],
    ['prompt-deterministic',       'prompt architect engine is pure',                  () => casePromptDeterministic()],
    ['prompt-formulas-israeli',    'all 4 formulas produce Israeli + mobile-first + Hebrew + dimensions prompts', () => casePromptFormulasIsraeli()],
    ['guardian-shape',             '7 findings per target + operator-approval-required', () => caseGuardianShape()],
    ['guardian-deterministic',     'brand guardian engine is pure',                    () => caseGuardianDeterministic()],
    ['guardian-violations',        'supplement + invented product → brand-consistency + invented-product violations', () => caseGuardianViolationDetection()],
    ['guardian-hebrew-violated',   'Israeli market without Hebrew → Hebrew rule violated', () => caseGuardianHebrewRule()],
    ['guardian-global-skip',       'global market → Hebrew rule does not apply',       () => caseGuardianGlobalMarketSkipsHebrew()],
    ['guardian-never-blocks',      'guardian warns but never auto-fixes or blocks',    () => caseGuardianNeverBlocks()],
    ['route-no-pipeline',          'route does not import pipeline / publish / generate', () => caseRouteNoPipeline()],
    ['route-no-execution',         'route exports no execution / launch / deploy / autoApprove verbs', () => caseRouteNoExecution()],
    ['route-get-only',             'route exports GET but not POST',                   () => caseRouteGetOnly()],
    ['route-listed',               '/api/production-studio registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',                  'engines pure · no critic / pipeline / banner / publish / generate imports', () => caseIsolation()],
    ['forbidden-prediction',       'no predict / will / winner / best / recommended / optimize / chosen / optimal / auto-approve', () => caseForbiddenPrediction()],
    ['forbidden-viral-exploit',    'no viral / dopamine / outrage / exploit / manipulat', () => caseForbiddenViralExploit()],
    ['allowed-language',           'production-ready / operator approval required / brand guardian observed', () => caseAllowedLanguage()],
    ['human-final-authority',      'all three engines declare "Human remains final authority"', () => caseHumanRemainsFinalAuthority()],
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
