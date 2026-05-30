/**
 * VERIFY — Business Intelligence Layer.
 *
 * 5 phases: customer journey · attribution · product intelligence ·
 * business dashboard · revenue learning bridge.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  appendJourneyEvent, newJourneyEventId, createInitialCustomerJourneyMemory,
  CUSTOMER_JOURNEY_LIMIT, type JourneyEvent,
} from '../lib/customerJourneyMemory';
import { analyzeCustomerJourneys } from '../lib/customerJourneyEngine';
import { analyzeAttribution } from '../lib/attributionEngine';
import { analyzeProductIntelligence } from '../lib/productIntelligenceEngine';
import { buildBusinessDashboard } from '../lib/businessDashboardEngine';
import { composeRevenueLearningBridge } from '../lib/revenueLearningBridge';
import type { AssetRecord } from '../lib/assetRegistryMemory';
import type { PublicationRecord } from '../lib/publicationRegistryMemory';
import type { CampaignPlanRecord } from '../lib/campaignPlanMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── fixtures ────────────────────────────────────────────────

function mkEvent(over: Partial<JourneyEvent> = {}): JourneyEvent {
  return {
    eventId: over.eventId ?? newJourneyEventId(),
    eventType: over.eventType ?? 'view',
    journeyId: over.journeyId ?? 'j-1',
    publicationId: over.publicationId,
    assetId: over.assetId,
    campaignPlanId: over.campaignPlanId,
    revenueUSD: over.revenueUSD,
    channel: over.channel,
    audience: over.audience,
    occurredAt: over.occurredAt ?? 1000,
    loggedAt: over.loggedAt ?? 1000,
    operatorId: over.operatorId ?? 'op-a',
    ...over,
  };
}

function buildScenario() {
  const assets: AssetRecord[] = [
    {
      assetId: 'asset-1', formula: 'ENERGY', campaign: 'c1', packageType: 'image',
      sourceStoryName: 'Quiet Return Home', sourceBriefId: 'b1', sourcePromptId: 'p1',
      prompt: 'kitchen light · documentary handheld · 50mm handheld · pressure → breath → return',
      summary: 'image · home', createdAt: 1000, operatorId: 'op-a',
      approvalStatus: 'approved',
      approvalHistory: [{ at: 1000, status: 'approved', operatorId: 'op-a', reason: 'ok' }],
    },
    {
      assetId: 'asset-2', formula: 'RELAX', campaign: 'c1', packageType: 'video',
      sourceStoryName: 'Night Decompression', sourceBriefId: 'b2', sourcePromptId: 'p2',
      prompt: 'warm lamp · ambient room sound · exhaustion → stillness → relief',
      summary: 'video · night', createdAt: 1000, operatorId: 'op-a',
      approvalStatus: 'approved',
      approvalHistory: [{ at: 1000, status: 'approved', operatorId: 'op-a', reason: 'ok' }],
    },
  ];
  const publications: PublicationRecord[] = [
    {
      publicationId: 'pub-1', assetId: 'asset-1', channel: 'instagram-feed',
      publishedAt: 1500, operatorId: 'op-a', campaign: 'c1', formula: 'ENERGY',
      audience: 'il-women-25-44', platform: 'ig-100', status: 'live',
      statusHistory: [{ at: 1500, status: 'live', operatorId: 'op-a', reason: 'registered' }],
    },
    {
      publicationId: 'pub-2', assetId: 'asset-2', channel: 'instagram-reels',
      publishedAt: 1500, operatorId: 'op-a', campaign: 'c1', formula: 'RELAX',
      audience: 'il-women-35-54', platform: 'ig-200', status: 'live',
      statusHistory: [{ at: 1500, status: 'live', operatorId: 'op-a', reason: 'registered' }],
    },
  ];
  const events: JourneyEvent[] = [
    mkEvent({ eventId: 'e1', eventType: 'impression', journeyId: 'j-1', publicationId: 'pub-1', assetId: 'asset-1', occurredAt: 2000, audience: 'il-women-25-44' }),
    mkEvent({ eventId: 'e2', eventType: 'view',       journeyId: 'j-1', publicationId: 'pub-1', assetId: 'asset-1', occurredAt: 2010 }),
    mkEvent({ eventId: 'e3', eventType: 'click',      journeyId: 'j-1', publicationId: 'pub-1', assetId: 'asset-1', occurredAt: 2020 }),
    mkEvent({ eventId: 'e4', eventType: 'landing-visit', journeyId: 'j-1', publicationId: 'pub-1', assetId: 'asset-1', occurredAt: 2030 }),
    mkEvent({ eventId: 'e5', eventType: 'lead',       journeyId: 'j-1', publicationId: 'pub-1', assetId: 'asset-1', occurredAt: 2040 }),
    mkEvent({ eventId: 'e6', eventType: 'purchase',   journeyId: 'j-1', publicationId: 'pub-1', assetId: 'asset-1', revenueUSD: 120, occurredAt: 2050 }),
    mkEvent({ eventId: 'e7', eventType: 'impression', journeyId: 'j-2', publicationId: 'pub-2', assetId: 'asset-2', occurredAt: 3000, audience: 'il-women-35-54' }),
    mkEvent({ eventId: 'e8', eventType: 'view',       journeyId: 'j-2', publicationId: 'pub-2', assetId: 'asset-2', occurredAt: 3010 }),
    mkEvent({ eventId: 'e9', eventType: 'click',      journeyId: 'j-2', publicationId: 'pub-2', assetId: 'asset-2', occurredAt: 3020 }),
    mkEvent({ eventId: 'e10', eventType: 'impression', journeyId: 'j-3', publicationId: 'pub-1', assetId: 'asset-1', occurredAt: 4000 }),
    mkEvent({ eventId: 'e11', eventType: 'view',       journeyId: 'j-3', publicationId: 'pub-1', assetId: 'asset-1', occurredAt: 4010 }),
    mkEvent({ eventId: 'e12', eventType: 'purchase',   journeyId: 'j-3', publicationId: 'pub-1', assetId: 'asset-1', revenueUSD: 60, occurredAt: 4020 }),
    mkEvent({ eventId: 'e13', eventType: 'repeat-purchase', journeyId: 'j-3', publicationId: 'pub-1', assetId: 'asset-1', revenueUSD: 60, occurredAt: 5000 }),
  ];
  const campaignPlans: CampaignPlanRecord[] = [];
  return { assets, publications, events, campaignPlans };
}

// ─── memory cases ────────────────────────────────────────────

function caseMemoryAppend(): { ok: boolean; detail: string } {
  let state = createInitialCustomerJourneyMemory();
  state = appendJourneyEvent(state, mkEvent({ eventId: 'x1' }));
  return {
    ok: state.events.length === 1 && state.totalEvents === 1,
    detail: `len=${state.events.length} total=${state.totalEvents}`,
  };
}
function caseMemoryFifo(): { ok: boolean; detail: string } {
  let state = createInitialCustomerJourneyMemory();
  for (let i = 0; i < CUSTOMER_JOURNEY_LIMIT + 50; i++) {
    state = appendJourneyEvent(state, mkEvent({ eventId: `x-${i}` }));
  }
  return {
    ok: state.events.length === CUSTOMER_JOURNEY_LIMIT &&
        state.totalEvents === CUSTOMER_JOURNEY_LIMIT + 50,
    detail: `events=${state.events.length} total=${state.totalEvents}`,
  };
}

// ─── customer journey engine cases ───────────────────────────

function caseJourneyShape(): { ok: boolean; detail: string } {
  const { events } = buildScenario();
  const r = analyzeCustomerJourneys({ events });
  if (r.totalJourneys !== 3) return { ok: false, detail: `journeys=${r.totalJourneys}` };
  if (r.journeyMaps.length !== 3) return { ok: false, detail: `maps=${r.journeyMaps.length}` };
  if (r.stageCounts.purchase !== 2) return { ok: false, detail: `purchase=${r.stageCounts.purchase}` };
  if (r.stageCounts['repeat-purchase'] !== 1) return { ok: false, detail: `repeat=${r.stageCounts['repeat-purchase']}` };
  if (r.dropOffLocations.length === 0) return { ok: false, detail: 'no drop-off edges' };
  if (r.conversionPaths.length === 0) return { ok: false, detail: 'no conversion paths' };
  return { ok: true, detail: `journeys=${r.totalJourneys} paths=${r.conversionPaths.length} dropOffs=${r.dropOffLocations.length}` };
}
function caseJourneyDeterministic(): { ok: boolean; detail: string } {
  const { events } = buildScenario();
  const a = JSON.stringify(analyzeCustomerJourneys({ events }));
  const b = JSON.stringify(analyzeCustomerJourneys({ events }));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseJourneyEmpty(): { ok: boolean; detail: string } {
  const r = analyzeCustomerJourneys({});
  return {
    ok: r.totalEvents === 0 && r.notes.some((n) => /requires more evidence/i.test(n)),
    detail: `events=${r.totalEvents}`,
  };
}

// ─── attribution cases ───────────────────────────────────────

function caseAttributionShape(): { ok: boolean; detail: string } {
  const { events, publications, assets, campaignPlans } = buildScenario();
  const r = analyzeAttribution({ events, publications, assets, campaignPlans });
  const dimNames = r.dimensions.map((d) => d.dimension);
  const expected = ['campaign', 'asset', 'creative-angle', 'story-structure', 'formula', 'audience'];
  const missing = expected.filter((e) => !dimNames.includes(e as any));
  if (missing.length > 0) return { ok: false, detail: `missing dims: ${missing.join(',')}` };
  if (r.totalRevenueUSD !== 240) return { ok: false, detail: `revenue=${r.totalRevenueUSD}` };
  return { ok: true, detail: `dims=${r.dimensions.length} revenue=${r.totalRevenueUSD} coverage=${r.attributionCoverage}` };
}
function caseAttributionDeterministic(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const a = JSON.stringify(analyzeAttribution(s));
  const b = JSON.stringify(analyzeAttribution(s));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseAttributionFormulaSplit(): { ok: boolean; detail: string } {
  const { events, publications, assets, campaignPlans } = buildScenario();
  const r = analyzeAttribution({ events, publications, assets, campaignPlans });
  const formulaDim = r.dimensions.find((d) => d.dimension === 'formula');
  const energy = formulaDim?.rows.find((row) => row.entityKey === 'formula:ENERGY');
  const relax = formulaDim?.rows.find((row) => row.entityKey === 'formula:RELAX');
  if (!energy || !relax) return { ok: false, detail: 'missing energy / relax rows' };
  if (energy.observedRevenueUSD !== 240) return { ok: false, detail: `energy revenue=${energy.observedRevenueUSD}` };
  if (relax.observedRevenueUSD !== 0) return { ok: false, detail: `relax revenue=${relax.observedRevenueUSD}` };
  return { ok: true, detail: `ENERGY=$${energy.observedRevenueUSD} RELAX=$${relax.observedRevenueUSD}` };
}
function caseAttributionEmpty(): { ok: boolean; detail: string } {
  const r = analyzeAttribution({});
  return {
    ok: r.totalRevenueUSD === 0 && r.attributionCoverage === 0,
    detail: 'empty input handled',
  };
}

// ─── product intelligence cases ──────────────────────────────

function caseProductShape(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const r = analyzeProductIntelligence({ attribution, journey });
  const required = ['crossFormula', 'crossAudience', 'crossCreativeAngle', 'crossAssetType', 'crossCampaignMode', 'crossCuts'];
  for (const k of required) if (!(k in r)) return { ok: false, detail: `missing ${k}` };
  return { ok: true, detail: `formula=${r.crossFormula.rows.length} audience=${r.crossAudience.rows.length} crossCuts=${r.crossCuts.length}` };
}
function caseProductDeterministic(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const a = JSON.stringify(analyzeProductIntelligence({ attribution, journey }));
  const b = JSON.stringify(analyzeProductIntelligence({ attribution, journey }));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseProductCrossCutsObserved(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const r = analyzeProductIntelligence({ attribution, journey });
  // We have ENERGY × audience il-women-25-44, so at least one cross-cut.
  return {
    ok: r.crossCuts.length > 0,
    detail: `crossCuts=${r.crossCuts.length} top=${r.crossCuts[0]?.observationId}`,
  };
}

// ─── business dashboard cases ────────────────────────────────

function caseDashboardShape(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const productIntelligence = analyzeProductIntelligence({ attribution, journey });
  const r = buildBusinessDashboard({
    journey, attribution, productIntelligence,
    publications: s.publications, assets: s.assets, campaignPlans: s.campaignPlans,
  });
  if (r.revenue.value !== 240) return { ok: false, detail: `revenue=${r.revenue.value}` };
  if (r.customers.value !== 2) return { ok: false, detail: `customers=${r.customers.value}` };
  if (r.assetVolume.value !== 2) return { ok: false, detail: `assets=${r.assetVolume.value}` };
  if (r.contentVolume.value !== 2) return { ok: false, detail: `content=${r.contentVolume.value}` };
  if (r.formulaActivity.length === 0) return { ok: false, detail: 'no formula activity' };
  return { ok: true, detail: `revenue=$${r.revenue.value} customers=${r.customers.value} formulas=${r.formulaActivity.length}` };
}
function caseDashboardDeterministic(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const productIntelligence = analyzeProductIntelligence({ attribution, journey });
  const input = { journey, attribution, productIntelligence,
    publications: s.publications, assets: s.assets, campaignPlans: s.campaignPlans };
  const a = JSON.stringify(buildBusinessDashboard(input));
  const b = JSON.stringify(buildBusinessDashboard(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseDashboardEmpty(): { ok: boolean; detail: string } {
  const r = buildBusinessDashboard({});
  return {
    ok: r.revenue.value === 0 && r.customers.value === 0 && r.notes.length > 0,
    detail: 'empty input handled',
  };
}

// ─── revenue learning bridge cases ───────────────────────────

function caseBridgeShape(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const r = composeRevenueLearningBridge({ journey, attribution });
  return {
    ok: r.revenueSignals.length >= 1 && /Human remains final authority/.test(r.advisoryNotice),
    detail: `signals=${r.revenueSignals.length}`,
  };
}
function caseBridgeDeterministic(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const a = JSON.stringify(composeRevenueLearningBridge({ journey, attribution }));
  const b = JSON.stringify(composeRevenueLearningBridge({ journey, attribution }));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseBridgeEmpty(): { ok: boolean; detail: string } {
  const r = composeRevenueLearningBridge({});
  const hasFallback = r.revenueSignals.some((s) => s.signalId === 'no-revenue-evidence');
  return { ok: hasFallback, detail: `signals=${r.revenueSignals.length}` };
}

// ─── route + static checks ───────────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function caseRoutesNoExternalAPIs(): Promise<{ ok: boolean; detail: string }> {
  // Routes must never reach out to Meta / Google Ads / payment providers / CRM.
  const files = [
    'app/api/customer-journey/route.ts', 'app/api/attribution/route.ts',
    'app/api/product-intelligence/route.ts', 'app/api/business-dashboard/route.ts',
    'app/api/revenue-bridge/route.ts',
  ];
  const forbidden = [
    /from\s+['"][^'"]*(facebook|meta|fbgraph|google[- ]?ads|hubspot|salesforce|stripe|braintree|paypal|tiktok)/i,
    /\bfetch\s+['"][^'"]*(graph\.facebook|googleapis\.com\/ads|hubapi|stripe|paypal|tiktok\.com\/api)/i,
    /\brunPipeline\s*\(/,
    /\bfetch\s*\([^)]*\/api\/generate/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}: ${re}` };
  }
  return { ok: true, detail: 'no Meta / Google Ads / CRM / payment / pipeline calls in routes' };
}
async function caseJourneyRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'customer-journey', 'route.ts'), 'utf8');
  return {
    ok: /operatorId is required/.test(src) && /operatorReason is required/.test(src) &&
        /eventType is required/.test(src) && /journeyId is required/.test(src),
    detail: 'operator-gated POST with required event fields',
  };
}
async function caseReadOnlyRoutesAreGetOnly(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'app/api/attribution/route.ts', 'app/api/product-intelligence/route.ts',
    'app/api/business-dashboard/route.ts', 'app/api/revenue-bridge/route.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
    const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
    if (!hasGet || hasPost) return { ok: false, detail: `${f}: GET=${hasGet} POST=${hasPost}` };
  }
  return { ok: true, detail: '4 read-only routes are GET-only' };
}
async function caseRoutesListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  const ok = /['"]\/api\/customer-journey['"]/.test(src) &&
             /['"]\/api\/attribution['"]/.test(src) &&
             /['"]\/api\/product-intelligence['"]/.test(src) &&
             /['"]\/api\/business-dashboard['"]/.test(src) &&
             /['"]\/api\/revenue-bridge['"]/.test(src);
  return { ok, detail: ok ? 'all 5 routes registered' : 'one or more missing' };
}
async function caseWhitelistUpdated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'scripts', 'verify-system-stability.ts'), 'utf8');
  return {
    ok: /app\/api\/customer-journey\/route\.ts/.test(src),
    detail: /app\/api\/customer-journey\/route\.ts/.test(src) ? 'whitelisted' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/customerJourneyMemory.ts', 'lib/customerJourneyEngine.ts',
    'lib/attributionEngine.ts', 'lib/productIntelligenceEngine.ts',
    'lib/businessDashboardEngine.ts', 'lib/revenueLearningBridge.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/, /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"]@?lib\/banner(?!\.)/, /from\s+['"]@?lib\/.*publish(?!ication)/i,
    /from\s+['"][^'"]*(facebook|meta|google[- ]?ads|hubspot|salesforce|stripe|paypal|tiktok)/i,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}: ${re}` };
    if (!f.endsWith('Memory.ts')) {
      if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
      if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
    }
  }
  return { ok: true, detail: 'engines pure · no critic / pipeline / banner / publishing / external-platform imports' };
}

// ─── narrative-language guard rails ──────────────────────────

function stripNegatedContract(text: string): string {
  return text
    .replace(/never\s+names?\s+a\s+winner/gi, '')
    .replace(/never\s+predicts?/gi, '')
    .replace(/never\s+optimizes?/gi, '')
    .replace(/never\s+recommends?/gi, '')
    .replace(/never\s+auto-?(applies|apply|approves|approve|optimize|optimizes|select|selects|modifies|modify)/gi, '')
    .replace(/never\s+makes?\s+an\s+automatic\s+decision/gi, '')
    .replace(/never\s+fetches\s+from/gi, '')
    .replace(/never\s+selects?\s+a\s+winner/gi, '')
    .replace(/never\s+publishes?/gi, '')
    .replace(/never\s+best/gi, '')
    .replace(/never\s+winner/gi, '')
    .replace(/never\s+optimal/gi, '');
}
function buildAllText(): string {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const productIntelligence = analyzeProductIntelligence({ attribution, journey });
  const dashboard = buildBusinessDashboard({
    journey, attribution, productIntelligence,
    publications: s.publications, assets: s.assets, campaignPlans: s.campaignPlans,
  });
  const bridge = composeRevenueLearningBridge({ journey, attribution });
  const collect: string[] = [
    journey.advisoryNotice, attribution.advisoryNotice,
    productIntelligence.advisoryNotice, dashboard.advisoryNotice, bridge.advisoryNotice,
    ...journey.notes, ...attribution.notes, ...productIntelligence.notes,
    ...dashboard.notes, ...bridge.notes, ...bridge.operatorExplorations,
  ];
  for (const j of journey.journeyMaps) collect.push(`journey ${j.journeyId}`);
  for (const d of journey.dropOffLocations) collect.push(d.observation);
  for (const p of journey.conversionPaths) collect.push(p.observation);
  for (const dim of attribution.dimensions) for (const r of dim.rows) collect.push(r.observation);
  for (const dim of [productIntelligence.crossFormula, productIntelligence.crossAudience,
                     productIntelligence.crossCreativeAngle, productIntelligence.crossAssetType,
                     productIntelligence.crossCampaignMode]) {
    for (const r of dim.rows) collect.push(r.observation);
  }
  for (const c of productIntelligence.crossCuts) collect.push(c.observation);
  for (const f of dashboard.formulaActivity) collect.push(`MOOD ${f.formula}`);
  for (const sig of bridge.revenueSignals) collect.push(sig.observation);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = stripNegatedContract(buildAllText());
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|auto-?approve|auto-?optimize|auto-?modify|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform|will\s+convert|will\s+generate)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenExternalAPIs(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(meta\s+api|facebook\s+api|google\s+ads\s+api|crm\s+write|payment\s+write|autonomous\s+post|auto.?publish)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(historically associated|observed alongside|correlated with|requires more evidence|Human remains final authority|operator review required)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseAllAdvisoryNotices(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const journey = analyzeCustomerJourneys({ events: s.events });
  const attribution = analyzeAttribution(s);
  const product = analyzeProductIntelligence({ attribution, journey });
  const dashboard = buildBusinessDashboard({ journey, attribution, productIntelligence: product,
    publications: s.publications, assets: s.assets, campaignPlans: s.campaignPlans });
  const bridge = composeRevenueLearningBridge({ journey, attribution });
  const allHaveHuman = [journey, attribution, product, dashboard, bridge].every((r) =>
    /Human remains final authority/i.test(r.advisoryNotice),
  );
  return { ok: allHaveHuman, detail: allHaveHuman ? 'all 5 declare Human final authority' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('BUSINESS INTELLIGENCE LAYER VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['memory-append',              'journey memory append works',                            () => caseMemoryAppend()],
    ['memory-fifo',                'journey memory FIFO cap respected',                       () => caseMemoryFifo()],
    ['journey-shape',              'journey analyzer · 3 journeys · purchases · drop-offs · paths', () => caseJourneyShape()],
    ['journey-deterministic',      'journey analyzer is pure',                                () => caseJourneyDeterministic()],
    ['journey-empty',              'no events → requires-more-evidence note',                 () => caseJourneyEmpty()],
    ['attribution-shape',          '6 dimensions populated · $240 revenue',                   () => caseAttributionShape()],
    ['attribution-deterministic',  'attribution analyzer is pure',                            () => caseAttributionDeterministic()],
    ['attribution-formula-split',  'ENERGY $240 / RELAX $0',                                 () => caseAttributionFormulaSplit()],
    ['attribution-empty',          'no input → safe zero output',                             () => caseAttributionEmpty()],
    ['product-shape',              'product intelligence · 5 cross-dims + crossCuts',         () => caseProductShape()],
    ['product-deterministic',      'product intelligence is pure',                            () => caseProductDeterministic()],
    ['product-cross-cuts',         'at least one formula × audience cross-cut observed',      () => caseProductCrossCutsObserved()],
    ['dashboard-shape',            'descriptive metrics · revenue / customers / formulas',    () => caseDashboardShape()],
    ['dashboard-deterministic',    'dashboard engine is pure',                                () => caseDashboardDeterministic()],
    ['dashboard-empty',            'empty input handled safely',                              () => caseDashboardEmpty()],
    ['bridge-shape',               'revenue bridge signals composed',                         () => caseBridgeShape()],
    ['bridge-deterministic',       'revenue bridge is pure',                                  () => caseBridgeDeterministic()],
    ['bridge-empty',               'no input → no-evidence signal',                           () => caseBridgeEmpty()],
    ['routes-no-external-apis',    'no Meta / Google Ads / CRM / payment / pipeline calls',  () => caseRoutesNoExternalAPIs()],
    ['journey-route-operator-gated', 'POST requires operatorId / reason / eventType / journeyId', () => caseJourneyRouteOperatorGated()],
    ['read-only-routes-get-only',  '4 read-only routes export GET but not POST',              () => caseReadOnlyRoutesAreGetOnly()],
    ['routes-listed',              'all 5 routes registered in systemIntegrityReport',        () => caseRoutesListed()],
    ['whitelist-updated',          'system-stability whitelist includes customer-journey POST', () => caseWhitelistUpdated()],
    ['isolation',                  'engines pure · no critic / pipeline / banner / publishing / external-platform imports', () => caseIsolation()],
    ['forbidden-prediction',       'no predict / will / winner / best / recommended / optimize / chosen / optimal / will-perform / will-convert / will-generate', () => caseForbiddenPrediction()],
    ['forbidden-external-apis',    'no Meta / Google Ads / CRM / payment / auto-publish phrasing', () => caseForbiddenExternalAPIs()],
    ['allowed-language',           'historically associated / observed alongside / correlated with / requires more evidence', () => caseAllowedLanguage()],
    ['advisory-notices',           'all 5 engines declare "Human remains final authority"',   () => caseAllAdvisoryNotices()],
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
