/**
 * ASSET COMPOSER ENGINE (pure, observational)
 *
 * Translates all prior creative layers into CREATIVE SPECIFICATION
 * PACKAGES. This engine DOES NOT create assets — it composes
 * structured creative packages for operator review.
 *
 * Four package families: IMAGE, VIDEO, BANNER, LANDING SECTION.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never names a "best" package
 *   - never recommends, never selects, never executes
 *   - allowed phrasing: "may carry emotional weight",
 *     "historically associated", "observed alongside",
 *     "requires more evidence", "exploratory specification",
 *     "operator review required"
 *   - forbidden: generate, publish, execute, launch, deploy, run,
 *     winner, best, recommended, selected, chosen, optimal,
 *     predict, will-rise/fall/happen/be/perform, auto-apply,
 *     optimize, viral, dopamine, outrage, manipulat
 *
 * Creative packages are specifications only. No asset generation
 * occurs here. The operator remains the only authority.
 */

// ─── loose structural subsets ────────────────────────────────

export interface AssetStoryHint {
  blueprintId?: string;
  storyName?: string;
  storyType?: string;
  humanTension?: string;
  emotionalArc?: string;
  memoryAnchor?: string;
  presenceAnchor?: string;
  mythicFrame?: string;
  realismStyle?: string;
  alignment?: number;
  dignityProtection?: number;
  manipulationRisk?: number;
  riskLevel?: string;
  audienceFeeling?: string;
  whyThisMayMatter?: string;
}

export interface AssetSceneHint {
  sourceBlueprintId?: string;
  sourceStoryName?: string;
  sceneId?: string;
  sceneType?: string;
  location?: string;
  environment?: string;
  timeOfDay?: string;
  realismLevel?: number;
  cameraLanguage?: string;
  framingStyle?: string;
  lightingStyle?: string;
  silenceAllocation?: string;
  presenceAnchors?: string[];
  memoryAnchors?: string[];
  symbolismAnchors?: string[];
  dignityAnchors?: string[];
  emotionalWeight?: number;
  restraintLevel?: number;
}

export interface AssetRhythmHint {
  pacingProfile?: string;
  restraintProfile?: string;
  rhythmProfile?: Record<string, number>;
  silenceMoments?: Array<{ moment?: string; alignment?: number }>;
  breathingMoments?: Array<{ moment?: string; alignment?: number }>;
  emotionalDensity?: number;
}

export interface AssetPresenceHint {
  presenceScore?: number;
  authenticityWeight?: number;
  stillnessWeight?: number;
  imperfectionSignature?: number;
  syntheticPressure?: number;
  signals?: Record<string, number>;
}

export interface AssetMemoryHint {
  imprintStrength?: number;
  scenePermanence?: number;
  dominantImprintSignals?: string[];
  mythicWeights?: Record<string, number>;
  ritualPersistence?: Record<string, number>;
}

export interface AssetWorldHint {
  realismDemand?: number;
  authenticityDemand?: number;
  simplicityCraving?: number;
  ritualHunger?: number;
  emotionalExhaustion?: number;
}

export interface AssetDirectorHint {
  dominantDirections?: string[];
}

export interface AssetComposerInput {
  stories?: AssetStoryHint[];
  scenes?: AssetSceneHint[];
  rhythm?: AssetRhythmHint | null;
  presence?: AssetPresenceHint | null;
  memory?: AssetMemoryHint | null;
  world?: AssetWorldHint | null;
  director?: AssetDirectorHint | null;
}

// ─── output ───────────────────────────────────────────────────

export interface ImagePackage {
  packageId: string;
  narrative: string;
  scene: string;
  presence: string;
  rhythm: string;
  realism: string;
  visualLanguage: string;
  memoryAnchors: string[];
  emotionalWeight: number;
  observation: string;
}

export interface VideoSceneEntry {
  index: number;
  scene: string;
  emotionalBeat: string;
  silenceShare: number;
}

export interface VideoPackage {
  packageId: string;
  narrative: string;
  sceneSequence: VideoSceneEntry[];
  rhythm: string;
  silenceMoments: string[];
  presenceMoments: string[];
  emotionalArc: string;
  realismAnchors: string[];
  emotionalWeight: number;
  observation: string;
}

export interface BannerPackage {
  packageId: string;
  emotionalDirection: string;
  visualDirection: string;
  memoryDirection: string;
  restraintDirection: string;
  compositionDirection: string;
  emotionalWeight: number;
  observation: string;
}

export interface LandingSectionPackage {
  packageId: string;
  sectionPurpose: string;
  emotionalPurpose: string;
  narrativePurpose: string;
  memoryAnchor: string;
  visualAnchor: string;
  emotionalWeight: number;
  observation: string;
}

export interface AssetComposerReading {
  imagePackages: ImagePackage[];
  videoPackages: VideoPackage[];
  bannerPackages: BannerPackage[];
  landingPackages: LandingSectionPackage[];
  dominantPackageIds: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Creative packages are specifications only. No asset generation occurs here. ' +
  'The operator remains the only authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function get(v: number | undefined, d = 0): number { return v ?? d; }
function getDef(v: number | undefined, d = 5): number { return v ?? d; }

function pickRealism(realismLevel: number | undefined, w: AssetWorldHint): string {
  const lvl = getDef(realismLevel, 6);
  if (lvl >= 8) return 'documentary realism · natural light · unedited cadence';
  if (lvl >= 6) return 'documentary handheld · soft practical light · restrained edit';
  if (getDef(w.realismDemand, 5) >= 6) return 'grounded realism · natural light · restrained composition';
  return 'restrained realism · natural light · sparse composition';
}

function pickVisualLanguage(scene: AssetSceneHint | undefined): string {
  if (!scene) return 'observational still · 50mm handheld · natural light';
  return [
    scene.cameraLanguage ?? '50mm handheld',
    scene.framingStyle ?? 'mid-shot, off-center',
    scene.lightingStyle ?? 'natural light',
  ].join(' · ');
}

function pickRhythmString(rh: AssetRhythmHint | undefined | null): string {
  if (!rh) return 'measured restraint · majority silence';
  return [
    (rh.pacingProfile ?? 'measured-restrained').replace(/-/g, ' '),
    (rh.restraintProfile ?? 'measured-restraint').replace(/-/g, ' '),
  ].join(' · ');
}

function pickEmotionalDirection(story: AssetStoryHint, rh: AssetRhythmHint | undefined | null): string {
  const arc = story.emotionalArc ?? 'fatigue → tenderness → continuation';
  const tone = (rh?.restraintProfile ?? 'measured-restraint').replace(/-/g, ' ');
  return `${arc} · ${tone}`;
}

function pickComposition(scene: AssetSceneHint | undefined): string {
  if (!scene) return 'centered restraint · large negative space · single focal anchor';
  return [
    scene.framingStyle ?? 'mid-shot, off-center',
    'large negative space',
    'single focal anchor',
  ].join(' · ');
}

function dedupeAndTake(arr: Array<string | undefined>, n: number): string[] {
  const out: string[] = [];
  for (const item of arr) {
    if (item && !out.includes(item)) out.push(item);
    if (out.length >= n) break;
  }
  return out;
}

function silenceShareForIndex(i: number, total: number, rhythmSilence: number): number {
  if (total === 0) return 0;
  // Front-load less silence, back-load more — observed silence allocations.
  const base = (i / Math.max(1, total - 1)) * 0.5 + 0.4;
  return r1(clamp10(base * (rhythmSilence + 5)) / 1);
}

// ─── main ─────────────────────────────────────────────────────

export function computeAssetPackages(input: AssetComposerInput): AssetComposerReading {
  const stories = input.stories ?? [];
  const scenesArr = input.scenes ?? [];
  const rh = input.rhythm ?? null;
  const pr = input.presence ?? {};
  const mem = input.memory ?? {};
  const w = input.world ?? {};

  // Build a scene lookup keyed on source story id.
  const sceneById = new Map<string, AssetSceneHint>();
  for (const s of scenesArr) {
    if (s.sourceBlueprintId) sceneById.set(s.sourceBlueprintId, s);
  }

  const imagePackages: ImagePackage[] = [];
  const videoPackages: VideoPackage[] = [];
  const bannerPackages: BannerPackage[] = [];
  const landingPackages: LandingSectionPackage[] = [];

  for (const story of stories) {
    const scene = story.blueprintId ? sceneById.get(story.blueprintId) : undefined;
    const weight = r1(clamp10(get(story.alignment) * 0.6 + get(scene?.emotionalWeight) * 0.4));
    const realismDesc = pickRealism(scene?.realismLevel, w);
    const visualLanguage = pickVisualLanguage(scene);

    // ── image package ───────────────────────────────────────
    imagePackages.push({
      packageId: `image-${story.blueprintId ?? 'unknown'}`,
      narrative: story.whyThisMayMatter ?? 'exploratory specification — operator review required',
      scene: scene
        ? `${scene.location ?? 'familiar room'} · ${scene.timeOfDay ?? 'afternoon'} · ${scene.environment ?? 'lived-in'}`
        : 'familiar lived-in room · afternoon',
      presence: dedupeAndTake([
        story.presenceAnchor,
        ...(scene?.presenceAnchors ?? []),
      ], 3).join(' · ') || 'unperformed presence',
      rhythm: pickRhythmString(rh),
      realism: realismDesc,
      visualLanguage,
      memoryAnchors: dedupeAndTake([
        story.memoryAnchor,
        ...(scene?.memoryAnchors ?? []),
        ...(mem.dominantImprintSignals ?? []),
      ], 4),
      emotionalWeight: weight,
      observation: weight >= 6
        ? 'exploratory specification that may carry emotional weight — operator review required'
        : 'exploratory specification observed alongside the source story — requires more evidence',
    });

    // ── video package ───────────────────────────────────────
    // Build a small ordered scene sequence — three beats:
    //   beat 1: tension / observed
    //   beat 2: pause / breath
    //   beat 3: release / continuation
    const rhythmSilence = (rh?.rhythmProfile?.silence ?? 5) / 10;
    const sceneSequence: VideoSceneEntry[] = [
      {
        index: 1,
        scene: scene?.location ? `${scene.location} · entrance / observed moment` : 'familiar room · observed moment',
        emotionalBeat: 'tension observed alongside the scene',
        silenceShare: silenceShareForIndex(0, 3, rhythmSilence),
      },
      {
        index: 2,
        scene: scene?.location ? `${scene.location} · held breath` : 'familiar room · held breath',
        emotionalBeat: 'pause / breathing room observed alongside the scene',
        silenceShare: silenceShareForIndex(1, 3, rhythmSilence),
      },
      {
        index: 3,
        scene: scene?.location ? `${scene.location} · release / continuation` : 'familiar room · release / continuation',
        emotionalBeat: 'release historically associated with restraint',
        silenceShare: silenceShareForIndex(2, 3, rhythmSilence),
      },
    ];
    videoPackages.push({
      packageId: `video-${story.blueprintId ?? 'unknown'}`,
      narrative: story.whyThisMayMatter ?? 'exploratory specification — operator review required',
      sceneSequence,
      rhythm: pickRhythmString(rh),
      silenceMoments: dedupeAndTake([
        scene?.silenceAllocation,
        ...(rh?.silenceMoments ?? []).slice(0, 3).map((m) => m.moment),
      ], 4),
      presenceMoments: dedupeAndTake([
        story.presenceAnchor,
        ...(scene?.presenceAnchors ?? []),
      ], 4),
      emotionalArc: story.emotionalArc ?? 'fatigue → tenderness → continuation',
      realismAnchors: [realismDesc],
      emotionalWeight: weight,
      observation: weight >= 6
        ? 'exploratory specification that may carry emotional weight — operator review required'
        : 'exploratory specification observed alongside the source story — requires more evidence',
    });

    // ── banner package ──────────────────────────────────────
    bannerPackages.push({
      packageId: `banner-${story.blueprintId ?? 'unknown'}`,
      emotionalDirection: pickEmotionalDirection(story, rh),
      visualDirection: visualLanguage,
      memoryDirection: (story.memoryAnchor ?? (mem.dominantImprintSignals?.[0] ?? 'familiar room')),
      restraintDirection: (rh?.restraintProfile ?? 'measured-restraint').replace(/-/g, ' '),
      compositionDirection: pickComposition(scene),
      emotionalWeight: weight,
      observation: weight >= 6
        ? 'exploratory banner specification that may carry emotional weight — operator review required'
        : 'exploratory banner specification observed alongside the source story — requires more evidence',
    });

    // ── landing section package ─────────────────────────────
    landingPackages.push({
      packageId: `landing-${story.blueprintId ?? 'unknown'}`,
      sectionPurpose: `${(story.storyType ?? 'home').replace(/-/g, ' ')} section · exploratory structure`,
      emotionalPurpose: story.audienceFeeling ?? 'a quiet recognition observed alongside the outputs',
      narrativePurpose: story.whyThisMayMatter ?? 'exploratory specification — operator review required',
      memoryAnchor: story.memoryAnchor ?? (mem.dominantImprintSignals?.[0] ?? 'familiar room'),
      visualAnchor: scene?.lightingStyle ?? 'natural light',
      emotionalWeight: weight,
      observation: weight >= 6
        ? 'exploratory landing-section specification that may carry emotional weight — operator review required'
        : 'exploratory landing-section specification observed alongside the source story — requires more evidence',
    });
  }

  // dominantPackageIds — top 3 packages across families by emotional weight.
  const allPkgs: Array<{ id: string; weight: number }> = [
    ...imagePackages.map((p) => ({ id: p.packageId, weight: p.emotionalWeight })),
    ...videoPackages.map((p) => ({ id: p.packageId, weight: p.emotionalWeight })),
    ...bannerPackages.map((p) => ({ id: p.packageId, weight: p.emotionalWeight })),
    ...landingPackages.map((p) => ({ id: p.packageId, weight: p.emotionalWeight })),
  ];
  const dominantPackageIds = allPkgs
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((p) => p.id);

  const notes: string[] = [];
  notes.push('exploratory specification — the operator remains the creative authority');
  if (stories.length === 0) {
    notes.push('no source story blueprints provided — requires more evidence');
  } else {
    notes.push(`top-aligned packages: ${dominantPackageIds.join(', ') || 'none'} — operator review required`);
  }
  if (get(pr.syntheticPressure) >= 6) {
    notes.push('synthetic pressure observed alongside the presence signals — operator review required');
  }

  return {
    imagePackages,
    videoPackages,
    bannerPackages,
    landingPackages,
    dominantPackageIds,
    notes,
    reasonCodes: [
      `imageCount:${imagePackages.length}`,
      `videoCount:${videoPackages.length}`,
      `bannerCount:${bannerPackages.length}`,
      `landingCount:${landingPackages.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
