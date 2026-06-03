/**
 * Seed MOOD's first three library assets — banner, post, carousel.
 *
 * Idempotent: re-running does NOT duplicate. The script checks the
 * asset registry for the seed signature in `summary` and skips
 * records that already exist. Operator approval is left at
 * `pending` so the human still authorizes publication.
 *
 * Usage:
 *   npx tsx scripts/seed-mood-creative-os.ts
 *   (or: node --import tsx ...)
 *
 * Strict contract:
 *   - no HTTP calls; writes through the store directly
 *   - never auto-approves
 *   - never publishes
 */

import {
  createAssetRegistryMemoryStore, newAssetId, type AssetRecord,
} from '../lib/assetRegistryMemory';
import {
  renderCreativeBrief,
} from '../src/engines/export/creative';
import {
  briefToPrompt, type CreativeBrief,
} from '../src/components/creative-brief-svg';
import {
  PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD,
} from '../lib/tenancy/types';

const SEED_OPERATOR_ID = 'seed-script';
const SEED_TAG = 'MOOD seed v1';

interface SeedSpec {
  brief: CreativeBrief;
  campaign: string;
  sourceStoryName: string;
}

const SEEDS: SeedSpec[] = [
  {
    brief: {
      formula: 'RELAX',
      packageType: 'banner',
      paletteKey: 'cocoa',
      headline: 'שוקולד שלא דורש דבר',
      body: 'בלי הרצאות. בלי קמפיין. בלי תוסף.',
      cta: 'גלו את MOOD',
      signature: 'MOOD',
    },
    campaign: 'MOOD · quiet launch',
    sourceStoryName: 'Quiet Return Home',
  },
  {
    brief: {
      formula: 'FOCUS',
      packageType: 'post',
      paletteKey: 'amber',
      headline: 'רגע אחד. נקי.',
      body: 'הקקאו לא מנסה לעצור אותך. הוא רק יושב לידך.',
      cta: 'התחילו בלילה אחד',
      signature: 'MOOD',
    },
    campaign: 'MOOD · everyday ritual',
    sourceStoryName: 'A Cleaner Pause',
  },
  {
    brief: {
      formula: 'RELAX',
      packageType: 'carousel',
      paletteKey: 'ember',
      headline: 'שוקולד שעובד לאט',
      body: 'מסע שמתחיל בקקאו ונגמר בלילה שקט.',
      cta: 'המשיכו לקרוא',
      signature: 'MOOD',
      slides: [
        { headline: 'שוקולד שעובד לאט',           body: 'מסע שמתחיל בקקאו ונגמר בלילה שקט.',         cta: 'המשיכו לקרוא' },
        { headline: 'אנחנו לא מבטיחים יותר מדי',  body: 'רק קקאו אמיתי. רק הרגע שבו הוא יושב נכון.' },
        { headline: 'בלי הרצאות.',                body: 'בלי “תופעת לוואי”. בלי “חוויית טעם”.'    },
        { headline: 'יש לזה משקל',                body: 'משקל שמרגישים בכף היד, לא בהכרזה.'         },
        { headline: 'מוכנים לרגע השקט?',          cta: 'התחילו את המסע'                              },
      ],
    },
    campaign: 'MOOD · slow ritual carousel',
    sourceStoryName: 'A Slow Ritual',
  },
];

function summaryFor(s: SeedSpec): string {
  return `${SEED_TAG} · ${s.brief.formula} · ${s.brief.packageType} · ${s.brief.headline.slice(0, 64)}`;
}

async function main(): Promise<void> {
  const store = createAssetRegistryMemoryStore();
  const state = await store.read();
  const existingSummaries = new Set(state.assets.map((a) => a.summary));

  let registered = 0;
  let skipped = 0;

  for (const seed of SEEDS) {
    const summary = summaryFor(seed);
    if (existingSummaries.has(summary)) {
      console.log(`[skip] ${seed.brief.packageType} — already seeded`);
      skipped += 1;
      continue;
    }

    console.log(`[render] ${seed.brief.packageType} (${seed.brief.formula} · ${seed.brief.paletteKey})…`);
    const rendered = await renderCreativeBrief(seed.brief);
    const prompt = briefToPrompt(seed.brief);
    const previewDataUrl = `data:image/png;base64,${rendered.slides[0].pngBase64}`;
    const storedPackageType =
      seed.brief.packageType === 'carousel' ? 'carousel' : 'image';

    const at = Date.now();
    const record: AssetRecord = {
      assetId: newAssetId(),
      formula: seed.brief.formula,
      campaign: seed.campaign,
      packageType: storedPackageType,
      sourceStoryName: `${seed.sourceStoryName} · ${seed.brief.packageType}`,
      sourceBriefId: `seed-brief-${seed.brief.packageType}-${at.toString(36)}`,
      sourcePromptId: `seed-prompt-${seed.brief.packageType}-${at.toString(36)}`,
      prompt,
      summary,
      createdAt: at,
      operatorId: SEED_OPERATOR_ID,
      approvalStatus: 'pending',
      approvalHistory: [{
        at, status: 'pending', operatorId: SEED_OPERATOR_ID,
        reason: 'Seeded by scripts/seed-mood-creative-os.ts — operator approval required before publication.',
      }],
      operatorNote: 'Seeded MOOD launch asset. Operator may approve when ready.',
      organizationId: PLATFORM_TENANT_ID_MOOD,
      workspaceId: PLATFORM_WORKSPACE_ID_MOOD,
      previewDataUrl,
      copy: {
        headline: seed.brief.headline,
        body: seed.brief.body,
        cta: seed.brief.cta,
        paletteKey: seed.brief.paletteKey,
      },
    };

    await store.append(record);
    registered += 1;
    console.log(`[register] ${seed.brief.packageType} → ${record.assetId} · pending`);
  }

  console.log('');
  console.log(`Done — registered: ${registered}, skipped: ${skipped}.`);
  console.log('Operator approval required before any of these are published. Human remains final authority.');
}

main().catch((err) => {
  console.error('[seed-mood-creative-os] failed:', err);
  process.exit(1);
});
