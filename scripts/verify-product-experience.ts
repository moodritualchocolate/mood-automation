/**
 * VERIFY — Product Experience + Creative Output (Phase: PXCO).
 *
 * Architectural invariants the new product surface MUST preserve:
 *
 *   1. CreativeBrief renderer produces non-empty SVG for banner / post.
 *   2. Carousel renderer produces one SVG per slide.
 *   3. briefToPrompt() returns a non-empty prompt that contains the
 *      headline + cta + signature.
 *   4. updateBrandIdentity() rejects unknown brandId.
 *   5. updateBrandIdentity() rejects tenant scope mismatch.
 *   6. updateBrandIdentity() merges identity fields and stamps updatedAt.
 *   7. AssetRecord schema accepts the new optional fields without
 *      breaking the existing required ones (backwards compatible).
 *   8. The seed-mood-creative-os script registers exactly 3 assets on
 *      a clean store and is idempotent on re-run.
 */

import {
  composeCreativeBanner, composeCreativePost, composeCreativeCarousel,
  briefToPrompt, type CreativeBrief,
} from '../src/components/creative-brief-svg';
import {
  appendBrand, updateBrandIdentity, createInitialWorkspaceMemory,
  newBrandId, newProjectId, appendProject, type BrandRecord, type ProjectRecord,
} from '../lib/workspaceMemory';
import {
  appendAssetRecord, createInitialAssetRegistryMemory, newAssetId,
  type AssetRecord,
} from '../lib/assetRegistryMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '../lib/tenancy/types';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

const sampleBanner: CreativeBrief = {
  formula: 'RELAX', packageType: 'banner', paletteKey: 'cocoa',
  headline: 'שוקולד שלא דורש דבר', body: 'בלי הרצאות', cta: 'גלו את MOOD', signature: 'MOOD',
};
const samplePost: CreativeBrief = {
  formula: 'FOCUS', packageType: 'post', paletteKey: 'amber',
  headline: 'רגע נקי', cta: 'התחילו', signature: 'MOOD',
};
const sampleCarousel: CreativeBrief = {
  formula: 'RELAX', packageType: 'carousel', paletteKey: 'ember',
  headline: 'מסע איטי', cta: 'המשיכו', signature: 'MOOD',
  slides: [
    { headline: 'מסע איטי', body: 'אחת ועוד אחת', cta: 'המשיכו' },
    { headline: 'בלי הרצאות' },
    { headline: 'יש לזה משקל' },
  ],
};

// ─── Case 1: banner SVG ─────────────────────────────────────────
function case1(): void {
  try {
    const svg = composeCreativeBanner(sampleBanner);
    const ok = typeof svg === 'string'
      && svg.length > 200
      && svg.startsWith('<svg')
      && svg.includes(sampleBanner.headline)
      && svg.includes(sampleBanner.cta);
    record('1', 'banner SVG composes with headline + cta', ok,
      ok ? `length=${svg.length}` : `svg shape unexpected: starts="${svg.slice(0, 40)}"`);
  } catch (e) {
    record('1', 'banner SVG composes with headline + cta', false, `threw: ${(e as Error).message}`);
  }
}

// ─── Case 2: post SVG ───────────────────────────────────────────
function case2(): void {
  try {
    const svg = composeCreativePost(samplePost);
    const ok = typeof svg === 'string'
      && svg.length > 200
      && svg.startsWith('<svg')
      && svg.includes(samplePost.headline)
      && svg.includes(samplePost.cta);
    record('2', 'post SVG composes with headline + cta', ok,
      ok ? `length=${svg.length}` : 'svg shape unexpected');
  } catch (e) {
    record('2', 'post SVG composes with headline + cta', false, `threw: ${(e as Error).message}`);
  }
}

// ─── Case 3: carousel produces N slides ─────────────────────────
function case3(): void {
  try {
    const out = composeCreativeCarousel(sampleCarousel);
    const ok = out.slides.length === (sampleCarousel.slides?.length ?? 1)
      && out.slides.every((s, i) => s.index === i && typeof s.svg === 'string' && s.svg.startsWith('<svg'));
    record('3', 'carousel composes one SVG per slide', ok,
      ok ? `slides=${out.slides.length}` : `slides=${out.slides.length}, sample=${out.slides[0]?.svg?.slice(0, 32)}`);
  } catch (e) {
    record('3', 'carousel composes one SVG per slide', false, `threw: ${(e as Error).message}`);
  }
}

// ─── Case 4: briefToPrompt contains the key fields ──────────────
function case4(): void {
  const p = briefToPrompt(sampleBanner);
  const ok = p.length > 50
    && p.includes(sampleBanner.headline)
    && p.includes(sampleBanner.cta)
    && p.includes('Human remains final authority');
  record('4', 'briefToPrompt returns the prompt with the key fields', ok,
    ok ? `length=${p.length}` : 'prompt missing required content');
}

// ─── Case 5: updateBrandIdentity rejects unknown brandId ────────
function case5(): void {
  const state = createInitialWorkspaceMemory();
  let threw: string | null = null;
  try {
    updateBrandIdentity(state, {
      brandId: 'brand-missing',
      organizationId: PLATFORM_TENANT_ID_MOOD,
      workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
      identity: { voice: 'quiet' },
      operatorId: 'op',
    });
  } catch (e) {
    threw = (e as Error).message;
  }
  const ok = threw !== null && /not found/.test(threw);
  record('5', 'updateBrandIdentity rejects unknown brandId', ok, threw ?? '(did not throw)');
}

// ─── Case 6: updateBrandIdentity rejects tenant scope mismatch ──
function case6(): void {
  let state = createInitialWorkspaceMemory();
  const projectId = newProjectId();
  const project: ProjectRecord = {
    projectId, organizationId: PLATFORM_TENANT_ID_MOOD, workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
    name: 'p', createdAt: 1, operatorId: 'op',
  };
  state = appendProject(state, project);
  const brandId = newBrandId();
  const brand: BrandRecord = {
    brandId, organizationId: PLATFORM_TENANT_ID_MOOD, workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
    projectId, name: 'b', createdAt: 1, operatorId: 'op',
  };
  state = appendBrand(state, brand);

  let threw: string | null = null;
  try {
    updateBrandIdentity(state, {
      brandId,
      organizationId: 'org-other',
      workspaceId: 'wsp-other',
      identity: { voice: 'quiet' },
      operatorId: 'op',
    });
  } catch (e) {
    threw = (e as Error).message;
  }
  const ok = threw !== null && /tenant scope mismatch/.test(threw);
  record('6', 'updateBrandIdentity rejects tenant scope mismatch', ok, threw ?? '(did not throw)');
}

// ─── Case 7: updateBrandIdentity merges + stamps timestamp ──────
function case7(): void {
  let state = createInitialWorkspaceMemory();
  const projectId = newProjectId();
  state = appendProject(state, {
    projectId, organizationId: PLATFORM_TENANT_ID_MOOD, workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
    name: 'p', createdAt: 1, operatorId: 'op',
  });
  const brandId = newBrandId();
  state = appendBrand(state, {
    brandId, organizationId: PLATFORM_TENANT_ID_MOOD, workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
    projectId, name: 'MOOD', createdAt: 1, operatorId: 'op',
  });
  const before = Date.now();
  const next = updateBrandIdentity(state, {
    brandId,
    organizationId: PLATFORM_TENANT_ID_MOOD, workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
    identity: { voice: 'quiet', paletteKey: 'cocoa' },
    operatorId: 'op-1',
  });
  const after = Date.now();
  const b = next.brands.find((br) => br.brandId === brandId);
  const ok = b !== undefined
    && b.identity?.voice === 'quiet'
    && b.identity?.paletteKey === 'cocoa'
    && b.identity?.updatedBy === 'op-1'
    && typeof b.identity?.updatedAt === 'number'
    && (b.identity?.updatedAt ?? 0) >= before
    && (b.identity?.updatedAt ?? Number.MAX_SAFE_INTEGER) <= after;
  record('7', 'updateBrandIdentity merges fields + stamps timestamp', ok,
    ok ? 'fields merged + updatedAt stamped'
       : `b.identity=${JSON.stringify(b?.identity)}`);
}

// ─── Case 8: AssetRecord accepts new optional fields ────────────
function case8(): void {
  let state = createInitialAssetRegistryMemory();
  const at = Date.now();
  const rec: AssetRecord = {
    assetId: newAssetId(),
    formula: 'ENERGY',
    campaign: 'verify',
    packageType: 'image',
    sourceStoryName: 'Quiet Return Home',
    sourceBriefId: 'b',
    sourcePromptId: 'p',
    prompt: 'sample',
    summary: 'sample',
    createdAt: at,
    operatorId: 'op',
    approvalStatus: 'pending',
    approvalHistory: [{ at, status: 'pending', operatorId: 'op', reason: 'init' }],
    organizationId: PLATFORM_TENANT_ID_MOOD,
    workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
    brandId: 'brand-x',
    previewDataUrl: 'data:image/png;base64,iVBOR',
    copy: { headline: 'h', body: 'b', cta: 'c', paletteKey: 'cocoa' },
  };
  state = appendAssetRecord(state, rec);
  const stored = state.assets[state.assets.length - 1];
  const ok = stored.assetId === rec.assetId
    && stored.previewDataUrl === rec.previewDataUrl
    && stored.copy?.paletteKey === 'cocoa'
    && stored.organizationId === PLATFORM_TENANT_ID_MOOD;
  record('8', 'AssetRecord accepts preview + copy + tenancy fields',
    ok, ok ? 'fields preserved' : `stored=${JSON.stringify(stored)}`);
}

// ─── Case 9: AssetRecord without new fields still appends ───────
function case9(): void {
  let state = createInitialAssetRegistryMemory();
  const at = Date.now();
  // Legacy shape: no organizationId / no copy / no previewDataUrl.
  const rec: AssetRecord = {
    assetId: newAssetId(),
    formula: 'ENERGY',
    campaign: 'legacy',
    packageType: 'image',
    sourceStoryName: 'legacy',
    sourceBriefId: 'b',
    sourcePromptId: 'p',
    prompt: 'sample',
    summary: 'legacy',
    createdAt: at,
    operatorId: 'op',
    approvalStatus: 'pending',
    approvalHistory: [{ at, status: 'pending', operatorId: 'op' }],
  };
  state = appendAssetRecord(state, rec);
  const stored = state.assets[state.assets.length - 1];
  const ok = stored.assetId === rec.assetId
    && stored.previewDataUrl === undefined
    && stored.copy === undefined
    && stored.organizationId === undefined;
  record('9', 'AssetRecord stays backwards-compatible (legacy shape)',
    ok, ok ? 'legacy record preserved' : `stored=${JSON.stringify(stored)}`);
}

// ─── Case 10: every palette key composes without throwing ───────
function case10(): void {
  const keys = ['cocoa', 'amber', 'ember', 'ivory', 'ink'] as const;
  let failed: string | null = null;
  for (const k of keys) {
    try {
      composeCreativeBanner({ ...sampleBanner, paletteKey: k });
      composeCreativePost  ({ ...samplePost,   paletteKey: k });
      composeCreativeCarousel({ ...sampleCarousel, paletteKey: k });
    } catch (e) {
      failed = `palette=${k}: ${(e as Error).message}`;
      break;
    }
  }
  record('10', 'every palette renders banner + post + carousel',
    failed === null, failed ?? 'all five palettes render');
}

// ─── runner ─────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('VERIFY — Product Experience + Creative Output');
  console.log('---------------------------------------------');
  case1(); case2(); case3(); case4(); case5();
  case6(); case7(); case8(); case9(); case10();
  console.log('');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`${passed}/${results.length} passed.`);
  if (failed > 0) {
    console.log(`${failed} failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
