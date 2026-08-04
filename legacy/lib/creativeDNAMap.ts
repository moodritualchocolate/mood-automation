/**
 * CREATIVE DNA MAP (pure, observational)
 *
 * Phase 4 — Creative Performance Layer.
 *
 * Tracks per-published-asset DNA signatures:
 *   - hook (the brief's emotionalArc / story-type signature)
 *   - emotion type
 *   - visual style
 *   - story structure
 *   - camera style
 *   - headline style
 *   - silence ratio
 *   - pace
 *
 * Joins each signature with its observed performance to surface
 * historically-associated DNA tokens. NO winner selection. NO
 * recommendation. Observation only.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a winning DNA token
 *   - never recommends a DNA combination
 *   - allowed phrasing: "historically associated", "observed
 *     alongside", "appears elevated", "appears suppressed",
 *     "requires more evidence"
 */

import type { AssetRecord, AssetExecutionType } from './assetRegistryMemory';
import type { PerformanceRecord } from './performanceMemory';
import type { PublicationRecord } from './publicationRegistryMemory';

// ─── input ────────────────────────────────────────────────────

export interface CreativeDNAMapInput {
  assets?: AssetRecord[];
  publications?: PublicationRecord[];
  performances?: PerformanceRecord[];
}

// ─── output ───────────────────────────────────────────────────

export type DNAAxis =
  | 'hook' | 'emotionType' | 'visualStyle' | 'storyStructure'
  | 'cameraStyle' | 'headlineStyle' | 'silenceRatio' | 'pace';

export interface DNAToken {
  token: string;
  /** Number of asset publications carrying this token. */
  publicationCount: number;
  /** Average engagement rate observed alongside this token (0..1). */
  averageEngagementRate: number;
  /** Average completion rate observed alongside this token (0..1). */
  averageCompletionRate: number;
  /** Average watch time observed alongside this token (seconds). */
  averageWatchTimeSeconds: number;
  /** 0..10 — observed-strength composite (NOT a winner score). */
  observedStrength: number;
  /** Plain-language note — allowed phrasing only. */
  observation: string;
}

export interface DNAAxisMap {
  axis: DNAAxis;
  /** Tokens sorted by descending publicationCount, ties broken by token name. */
  tokens: DNAToken[];
  /** Top observed tokens (descriptive only — NOT recommended). */
  dominantTokens: string[];
}

export interface CreativeDNAMapReading {
  totalAssetsObserved: number;
  totalPerformancesObserved: number;
  axes: DNAAxisMap[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Creative DNA map is observational only. No winner selection. ' +
  'No recommendation. Operator review required. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function r1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Coarse heuristics that read tokens out of an asset's prompt /
 *  summary text. The map deliberately produces a small token
 *  vocabulary so observations remain comparable. */
function extractDNATokens(asset: AssetRecord): Record<DNAAxis, string> {
  const hay = `${asset.prompt} ${asset.summary}`.toLowerCase();

  // hook — pulled from story type via summary heuristics.
  const hook =
    /quiet return|return home/.test(hay) ? 'return-home' :
    /parent after|after exhaustion/.test(hay) ? 'parent-after-exhaustion' :
    /morning|first sip|coffee/.test(hay) ? 'morning-restart' :
    /night|decompress|warm lamp/.test(hay) ? 'night-decompression' :
    /child growing|grew older|passing time/.test(hay) ? 'child-growing' :
    /ritual|repetition/.test(hay) ? 'ordinary-ritual' :
    /silent relief|silence release|phone face down/.test(hay) ? 'silent-relief' :
    /small victory|unwitnessed/.test(hay) ? 'small-victory' :
    /before.{0,15}after/.test(hay) ? 'before-and-after-without-hype' :
    /moment nobody notices|witness/.test(hay) ? 'moment-nobody-notices' :
    /kitchen light/.test(hay) ? 'kitchen-light' :
    /empty chair/.test(hay) ? 'empty-chair' :
    /hand on shoulder/.test(hay) ? 'hand-on-shoulder' :
    /breath before|exhale|pause-frame/.test(hay) ? 'breath-before-continuing' :
    /becoming yourself|self-return/.test(hay) ? 'becoming-yourself-again' :
    'unclassified';

  // emotionType
  const emotionType =
    /fatigue|exhaust|tired|long day/.test(hay) ? 'fatigue' :
    /tender|tenderness|soft|gentle|warm/.test(hay) ? 'tenderness' :
    /grief|loss|empty chair|funeral/.test(hay) ? 'grief' :
    /ritual|familiar|morning|night/.test(hay) ? 'ritual-recognition' :
    /still|silence|breath|pause/.test(hay) ? 'stillness' :
    /becoming|growing|return/.test(hay) ? 'becoming' :
    /nostalg|childhood|memory/.test(hay) ? 'nostalgia' :
    'observed-quiet';

  // visualStyle
  const visualStyle =
    /documentary handheld|documentary|natural light/.test(hay) ? 'documentary-handheld' :
    /cinematic|polished|gloss/.test(hay) ? 'cinematic-polished' :
    /ambient|still|low light/.test(hay) ? 'ambient-still' :
    /home|kitchen|lived-in/.test(hay) ? 'lived-in-home' :
    'restrained-observational';

  // storyStructure
  const storyStructure =
    /pressure.{0,15}breath.{0,15}return/.test(hay) ? 'pressure-breath-return' :
    /noise.{0,15}silence.{0,15}clarity/.test(hay) ? 'noise-silence-clarity' :
    /fatigue.{0,15}tenderness.{0,15}continuation/.test(hay) ? 'fatigue-tenderness-continuation' :
    /disconnection.{0,15}ritual.{0,15}reconnection/.test(hay) ? 'disconnection-ritual-reconnection' :
    /self.loss.{0,15}pause.{0,15}self.return/.test(hay) ? 'self-loss-pause-self-return' :
    /overwhelm.{0,15}presence.{0,15}grounded/.test(hay) ? 'overwhelm-presence-groundedness' :
    'observed-arc';

  // cameraStyle
  const cameraStyle =
    /50mm handheld/.test(hay) ? '50mm-handheld' :
    /35mm handheld/.test(hay) ? '35mm-handheld' :
    /fixed|static/.test(hay) ? 'fixed-static' :
    /slow push|push-in/.test(hay) ? 'slow-push-in' :
    'restrained-camera';

  // headlineStyle
  const headlineStyle =
    /hebrew rtl|hebrew/.test(hay) ? 'hebrew-restrained' :
    /4-10 words|4-12 words/.test(hay) ? 'short-line' :
    /no aspirational|no claim/.test(hay) ? 'no-claim' :
    'observed-restraint';

  // silenceRatio
  const silenceRatio =
    /entire|second half entirely|near-total|near total|majority/.test(hay) ? 'majority' :
    /two.thirds|2\/3/.test(hay) ? 'two-thirds' :
    /sustained silence/.test(hay) ? 'sustained' :
    /sparse/.test(hay) ? 'sparse' :
    'observed-silence';

  // pace
  const pace =
    /observational.still|observational still/.test(hay) ? 'observational-still' :
    /slow.grounded|slow grounded/.test(hay) ? 'slow-grounded' :
    /measured.restrained|measured restrained/.test(hay) ? 'measured-restrained' :
    /energetic.restrained|energetic restrained/.test(hay) ? 'energetic-restrained' :
    'observed-pace';

  return {
    hook, emotionType, visualStyle, storyStructure,
    cameraStyle, headlineStyle, silenceRatio, pace,
  };
}

// ─── main ─────────────────────────────────────────────────────

export function buildCreativeDNAMap(input: CreativeDNAMapInput): CreativeDNAMapReading {
  const assets = input.assets ?? [];
  const publications = input.publications ?? [];
  const performances = input.performances ?? [];

  const assetById = new Map(assets.map((a) => [a.assetId, a] as const));
  const publicationById = new Map(publications.map((p) => [p.publicationId, p] as const));

  // For each performance record join: performance → publication → asset → DNA tokens.
  // Aggregate by (axis, token).
  type Bucket = { metrics: Array<{ engagement: number; completion: number; watch: number }>; assetIds: Set<string>; pubIds: Set<string> };
  const axisTokenBuckets = new Map<DNAAxis, Map<string, Bucket>>();
  for (const axis of ['hook', 'emotionType', 'visualStyle', 'storyStructure',
                      'cameraStyle', 'headlineStyle', 'silenceRatio', 'pace'] as DNAAxis[]) {
    axisTokenBuckets.set(axis, new Map());
  }

  let assetsObserved = 0;
  const observedAssetIds = new Set<string>();
  for (const perf of performances) {
    const pub = publicationById.get(perf.publicationId);
    if (!pub) continue;
    const asset = assetById.get(pub.assetId);
    if (!asset) continue;
    observedAssetIds.add(asset.assetId);
    const tokens = extractDNATokens(asset);
    const m = {
      engagement: Number(perf.metrics?.engagementRate ?? 0),
      completion: Number(perf.metrics?.completionRate ?? 0),
      watch: Number(perf.metrics?.watchTimeSeconds ?? 0),
    };
    for (const axis of Object.keys(tokens) as DNAAxis[]) {
      const tok = tokens[axis];
      const axisMap = axisTokenBuckets.get(axis)!;
      const bucket = axisMap.get(tok) ?? { metrics: [], assetIds: new Set(), pubIds: new Set() };
      bucket.metrics.push(m);
      bucket.assetIds.add(asset.assetId);
      bucket.pubIds.add(pub.publicationId);
      axisMap.set(tok, bucket);
    }
  }
  assetsObserved = observedAssetIds.size;

  const axes: DNAAxisMap[] = (Array.from(axisTokenBuckets.entries())).map(([axis, tokensMap]) => {
    const tokens: DNAToken[] = Array.from(tokensMap.entries()).map(([token, bucket]) => {
      const e = avg(bucket.metrics.map((m) => m.engagement));
      const c = avg(bucket.metrics.map((m) => m.completion));
      const w = avg(bucket.metrics.map((m) => m.watch));
      const strength = clamp10(e * 5 + c * 3 + Math.min(2, w / 30));
      return {
        token,
        publicationCount: bucket.pubIds.size,
        averageEngagementRate: r1(e * 100) / 100,
        averageCompletionRate: r1(c * 100) / 100,
        averageWatchTimeSeconds: r1(w),
        observedStrength: r1(strength),
        observation: bucket.pubIds.size >= 3
          ? `${token} historically associated with ${bucket.pubIds.size} publication(s) — observed strength ${r1(strength)}/10`
          : `${token} observed alongside ${bucket.pubIds.size} publication(s) — requires more evidence`,
      };
    });
    tokens.sort((a, b) =>
      b.publicationCount - a.publicationCount ||
      b.observedStrength - a.observedStrength ||
      a.token.localeCompare(b.token));
    const dominantTokens = tokens.slice(0, 3).map((t) => t.token);
    return { axis, tokens, dominantTokens };
  });

  const notes: string[] = [];
  if (assetsObserved === 0) {
    notes.push('no performances joined to assets yet — requires more evidence');
  } else {
    notes.push(`${assetsObserved} asset(s) observed across ${performances.length} performance record(s)`);
    const hookAxis = axes.find((a) => a.axis === 'hook');
    if (hookAxis && hookAxis.dominantTokens.length > 0) {
      notes.push(`dominant observed hooks: ${hookAxis.dominantTokens.join(' · ')} — observation only, never recommended`);
    }
  }

  return {
    totalAssetsObserved: assetsObserved,
    totalPerformancesObserved: performances.length,
    axes,
    notes,
    reasonCodes: [
      `assetsObserved:${assetsObserved}`,
      `performances:${performances.length}`,
      ...axes.map((a) => `${a.axis}:${a.tokens.length}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}

// Helper — also exported so the route can flag asset package types.
export function packageTypeOfAsset(asset: AssetRecord): AssetExecutionType {
  return asset.packageType;
}
