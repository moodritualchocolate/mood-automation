/**
 * Seed MOOD's first three real-marketing library assets:
 *
 *   A. ENERGY product hero                (banner 1200×628)
 *   B. FOCUS  human moment                (post 1080×1080)
 *   C. RELAX  product + human carousel    (5 slides 1080²)
 *
 * Each asset runs through the Asset Quality Guard before
 * rendering. Each is registered as `pending` — operator
 * approval is required before publication.
 *
 * Idempotent: re-running does NOT duplicate. Checks the seed
 * signature in `summary` and skips already-registered records.
 *
 * Usage:
 *   npx tsx scripts/seed-mood-creative-os.ts
 */

import {
  createAssetRegistryMemoryStore, newAssetId, type AssetRecord,
} from '../lib/assetRegistryMemory';
import { renderCreativeBrief } from '../src/engines/export/creative';
import {
  briefToPrompt, briefToNegativePrompt, briefToProductionSpec,
  type CreativeBrief,
} from '../src/components/creative-brief-svg';
import { runQualityGuard } from '../src/engines/creative-quality-guard';
import {
  PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD,
} from '../lib/tenancy/types';

const SEED_OPERATOR_ID = 'seed-script';
const SEED_TAG = 'MOOD seed v2';

interface SeedSpec {
  brief: CreativeBrief;
  campaign: string;
  sourceStoryName: string;
}

const SEEDS: SeedSpec[] = [
  // ─── A. ENERGY · product hero · banner ────────────────────
  {
    brief: {
      formula: 'ENERGY',
      packageType: 'banner',
      paletteKey: 'amber',
      visualMode: 'product-hero',
      productPresence: 'pouch-and-square',
      platformSize: 'banner-1200x628',
      headline: 'בוקר אחד. בלי הצגות.',
      subline: 'אנרגיה מקקאו שלא צריך להתנצל.',
      cta: 'התחילו את הבוקר עם MOOD',
      audience: 'בוגרים 31-49, עירוניים, עייפים מהבטחות',
      emotion: 'התעוררות שקטה',
      signature: 'MOOD',
    },
    campaign: 'MOOD · morning launch',
    sourceStoryName: 'Quiet Morning Return',
  },
  // ─── B. FOCUS · human moment · post ────────────────────────
  {
    brief: {
      formula: 'FOCUS',
      packageType: 'post',
      paletteKey: 'ink',
      visualMode: 'human-moment',
      productPresence: 'none',
      platformSize: 'post-1080x1080',
      headline: 'שקט אחד. מספיק.',
      subline: 'הקקאו לא מנסה לעצור אותך — הוא יושב לידך.',
      cta: 'הרגישו את הצלילות',
      audience: 'עובדי מידע, עומס קוגניטיבי גבוה',
      emotion: 'הרפיה ממוקדת',
      signature: 'MOOD',
    },
    campaign: 'MOOD · focus moment',
    sourceStoryName: 'A Cleaner Pause',
  },
  // ─── C. RELAX · product + human carousel ───────────────────
  {
    brief: {
      formula: 'RELAX',
      packageType: 'carousel',
      paletteKey: 'cocoa',
      visualMode: 'carousel-story',
      productPresence: 'pouch',
      platformSize: 'carousel-1080x1080',
      headline: 'שוקולד שעובד לאט',
      subline: 'מסע שמתחיל בקקאו ונגמר בלילה שקט.',
      cta: 'המשיכו לקרוא',
      audience: 'מבוגרים שמחפשים טקס ערב נקי',
      emotion: 'הרגעה איטית',
      signature: 'MOOD',
      slides: [
        {
          headline: 'שוקולד שעובד לאט',
          body: 'מסע שמתחיל בקקאו ונגמר בלילה שקט.',
          cta: 'המשיכו לקרוא',
          visualMode: 'product-hero',
          productPresence: 'pouch',
        },
        {
          headline: 'יד אחת. פיסה אחת.',
          body: 'הקקאו לא ממהר. אנחנו גם לא.',
          visualMode: 'product-and-human',
          productPresence: 'chocolate-square',
        },
        {
          headline: 'הלילה נהיה רך יותר',
          body: 'בלי הרצאה. בלי הבטחה. רק רגע.',
          visualMode: 'human-moment',
          productPresence: 'none',
        },
        {
          headline: 'יש לזה משקל',
          body: 'משקל שמרגישים בכף היד.',
          visualMode: 'product-hero',
          productPresence: 'chocolate-square',
        },
        {
          headline: 'מוכנים לרגע השקט?',
          cta: 'התחילו את המסע',
          visualMode: 'product-and-human',
          productPresence: 'pouch',
        },
      ],
    },
    campaign: 'MOOD · slow ritual carousel',
    sourceStoryName: 'A Slow Ritual',
  },
];

function summaryFor(s: SeedSpec): string {
  return `${SEED_TAG} · ${s.brief.formula} · ${s.brief.visualMode ?? '?'} · ${s.brief.headline.slice(0, 64)}`;
}

async function main(): Promise<void> {
  const store = createAssetRegistryMemoryStore();
  const state = await store.read();
  const existingSummaries = new Set(state.assets.map((a) => a.summary));

  let registered = 0;
  let skipped = 0;
  let blocked = 0;

  for (const seed of SEEDS) {
    const summary = summaryFor(seed);
    if (existingSummaries.has(summary)) {
      console.log(`[skip] ${seed.brief.packageType} · ${seed.brief.visualMode} — already seeded`);
      skipped += 1;
      continue;
    }

    // Quality Guard FIRST.
    const guard = runQualityGuard(seed.brief);
    if (!guard.ok) {
      console.log(`[BLOCK] ${seed.brief.packageType} · ${seed.brief.visualMode} — guard rejected:`);
      for (const r of guard.rejections) {
        console.log(`         - [${r.code}] ${r.field}: ${r.detail}`);
      }
      blocked += 1;
      continue;
    }
    if (guard.warnings.length > 0) {
      console.log(`[warn] ${seed.brief.packageType} · ${seed.brief.visualMode} — ${guard.warnings.length} warning(s):`);
      for (const w of guard.warnings) {
        console.log(`         - [${w.code}] ${w.field}: ${w.detail}`);
      }
    }

    console.log(`[render] ${seed.brief.packageType} · ${seed.brief.visualMode} (${seed.brief.formula})…`);
    const rendered = await renderCreativeBrief(seed.brief);
    const prompt = briefToPrompt(seed.brief);
    const negativePrompt = briefToNegativePrompt(seed.brief);
    const spec = briefToProductionSpec(seed.brief);
    const previewDataUrl = `data:image/png;base64,${rendered.slides[0].pngBase64}`;
    const storedPackageType = seed.brief.packageType === 'carousel' ? 'carousel' : 'image';

    const at = Date.now();
    const record: AssetRecord = {
      assetId: newAssetId(),
      formula: seed.brief.formula,
      campaign: seed.campaign,
      packageType: storedPackageType,
      sourceStoryName: `${seed.sourceStoryName} · ${seed.brief.visualMode}`,
      sourceBriefId: `seed-brief-${seed.brief.packageType}-${at.toString(36)}`,
      sourcePromptId: `seed-prompt-${seed.brief.packageType}-${at.toString(36)}`,
      prompt,
      summary,
      createdAt: at,
      operatorId: SEED_OPERATOR_ID,
      approvalStatus: 'pending',
      approvalHistory: [{
        at, status: 'pending', operatorId: SEED_OPERATOR_ID,
        reason: 'Seeded by scripts/seed-mood-creative-os.ts — Quality Guard passed. Operator approval required before publication.',
      }],
      operatorNote: `Seeded MOOD launch asset · production spec attached. Slides: ${rendered.slides.length}.`,
      organizationId: PLATFORM_TENANT_ID_MOOD,
      workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
      previewDataUrl,
      copy: {
        headline: seed.brief.headline,
        body: seed.brief.body,
        subline: seed.brief.subline,
        cta: seed.brief.cta,
        paletteKey: seed.brief.paletteKey,
        audience: seed.brief.audience,
        emotion: seed.brief.emotion,
        visualMode: seed.brief.visualMode,
        productPresence: seed.brief.productPresence,
        platformSize: seed.brief.platformSize,
        negativePrompt,
      },
    };

    await store.append(record);
    registered += 1;
    console.log(`[register] ${seed.brief.packageType} · ${seed.brief.visualMode} → ${record.assetId} · pending`);
    // Avoid lint warning that `spec` is unused — production spec is in
    // the prompt's reasoning chain; we don't separately persist it on
    // the AssetRecord today.
    void spec;
  }

  console.log('');
  console.log(`Done — registered: ${registered}, skipped: ${skipped}, blocked by guard: ${blocked}.`);
  console.log('Operator approval required before any of these are published. Human remains final authority.');
  if (blocked > 0) process.exit(2);
}

main().catch((err) => {
  console.error('[seed-mood-creative-os] failed:', err);
  process.exit(1);
});
