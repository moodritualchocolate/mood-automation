/**
 * SCENE ARCHITECT ENGINE (pure, observational)
 *
 * Transforms STORY BLUEPRINTS into SCENE BLUEPRINTS — structural
 * scene observations only. NOT prompts. NOT ads. NOT scripts.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a "best" scene
 *   - never recommends, never names a winner
 *   - allowed phrasing: "exploratory scene structure",
 *     "may carry emotional weight", "historically associated",
 *     "observed alongside", "requires more evidence",
 *     "operator review required"
 *   - forbidden: generate, publish, execute, launch, deploy, run,
 *     winner, best, recommended, selected, chosen, optimal,
 *     predict, will-rise/fall/happen/be/perform, auto-apply,
 *     optimize, viral, manipulat
 *
 * Scene blueprints are exploratory structures. The operator remains
 * the creative authority.
 */

// ─── loose structural subsets ────────────────────────────────

export interface SceneStoryBlueprintHint {
  blueprintId?: string;
  storyName?: string;
  storyType?: string;
  humanTension?: string;
  emotionalArc?: string;
  memoryAnchor?: string;
  presenceAnchor?: string;
  silencePlacement?: string;
  mythicFrame?: string;
  realismStyle?: string;
  alignment?: number;
  dignityProtection?: number;
  manipulationRisk?: number;
  riskLevel?: string;
}

export interface SceneInputImprint {
  dominantImprintSignals?: string[];
  mythicWeights?: Record<string, number>;
  ritualPersistence?: Record<string, number>;
}

export interface SceneInputPresence {
  presenceScore?: number;
  stillnessWeight?: number;
  authenticityWeight?: number;
  imperfectionSignature?: number;
  signals?: Record<string, number>;
}

export interface SceneInputWorld {
  realismDemand?: number;
  authenticityDemand?: number;
  simplicityCraving?: number;
  ritualHunger?: number;
  emotionalExhaustion?: number;
  emotionalOverload?: number;
}

export interface SceneInputDirector {
  dominantDirections?: string[];
}

export interface SceneArchitectInput {
  storyBlueprints?: SceneStoryBlueprintHint[];
  imprint?: SceneInputImprint | null;
  presence?: SceneInputPresence | null;
  world?: SceneInputWorld | null;
  director?: SceneInputDirector | null;
}

// ─── output ───────────────────────────────────────────────────

export interface SceneBlueprint {
  /** Joins to the source storyBlueprint. */
  sourceBlueprintId: string;
  sourceStoryName: string;
  sceneId: string;
  sceneType: string;
  location: string;
  environment: string;
  timeOfDay: string;
  realismLevel: number;
  cameraLanguage: string;
  framingStyle: string;
  lightingStyle: string;
  silenceAllocation: string;
  presenceAnchors: string[];
  memoryAnchors: string[];
  symbolismAnchors: string[];
  dignityAnchors: string[];
  emotionalWeight: number;
  restraintLevel: number;
  reasonCodes: string[];
  observation: string;
}

export interface SceneArchitectReading {
  scenes: SceneBlueprint[];
  dominantSceneTypes: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Scene blueprints are exploratory structures only. ' +
  'The operator remains the creative authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function get(v: number | undefined, d = 0): number { return v ?? d; }
function getDef(v: number | undefined, d = 5): number { return v ?? d; }

// ─── scene type table ─────────────────────────────────────────
//
// Per source story family, the canonical scene structure to surface.
// Locations / camera / lighting / silence are HUMAN, GROUNDED, NON-
// PERSUASIVE choices observed alongside historically-aligned realism.

interface SceneTemplate {
  sceneType: string;
  location: string;
  environment: string;
  timeOfDay: string;
  cameraLanguage: string;
  framingStyle: string;
  lightingStyle: string;
  silenceAllocation: string;
  symbolismAnchors: string[];
  dignityAnchors: string[];
}

const TEMPLATES: Record<string, SceneTemplate> = {
  'quiet-return-home': {
    sceneType: 'arrival-stillness',
    location: 'apartment threshold and kitchen',
    environment: 'small home, lived-in',
    timeOfDay: 'late afternoon into early evening',
    cameraLanguage: '50mm handheld',
    framingStyle: 'close, low angle, off-center',
    lightingStyle: 'single warm kitchen light',
    silenceAllocation: 'roughly two-thirds silence',
    symbolismAnchors: ['threshold', 'kitchen light', 'familiar room'],
    dignityAnchors: ['no captions on emotion', 'no music swell'],
  },
  'parent-after-exhaustion': {
    sceneType: 'tender-recovery',
    location: 'family room or hallway',
    environment: 'small home, lived-in',
    timeOfDay: 'evening',
    cameraLanguage: '35mm handheld',
    framingStyle: 'mid-shot, shoulder height, off-center',
    lightingStyle: 'soft warm practical light',
    silenceAllocation: 'majority silence, small soft words',
    symbolismAnchors: ['hallway', 'shoes near door', 'small hand'],
    dignityAnchors: ['no music push', 'no camera glamour'],
  },
  'morning-restart': {
    sceneType: 'ritual-emergence',
    location: 'kitchen counter',
    environment: 'home kitchen, morning light',
    timeOfDay: 'early morning',
    cameraLanguage: '50mm handheld',
    framingStyle: 'tight on hands and cup, low angle',
    lightingStyle: 'natural window light',
    silenceAllocation: 'silence with kettle sound only',
    symbolismAnchors: ['mug', 'window light', 'kettle steam'],
    dignityAnchors: ['no aspirational text', 'no music swell'],
  },
  'night-decompression': {
    sceneType: 'descent-rest',
    location: 'sofa, low-lit living room',
    environment: 'lived-in home, low light',
    timeOfDay: 'night',
    cameraLanguage: '50mm fixed',
    framingStyle: 'mid-shot from below shoulder',
    lightingStyle: 'warm lamp, single source',
    silenceAllocation: 'near-total silence',
    symbolismAnchors: ['warm lamp', 'folded blanket', 'low light'],
    dignityAnchors: ['no overlay text', 'no music push'],
  },
  'child-growing-older': {
    sceneType: 'passing-time',
    location: 'old table or doorway',
    environment: 'familiar lived-in room',
    timeOfDay: 'afternoon',
    cameraLanguage: '35mm handheld',
    framingStyle: 'wide observational, eye level',
    lightingStyle: 'natural light, soft falloff',
    silenceAllocation: 'silence between two sentences they almost finish',
    symbolismAnchors: ['old table', 'doorway', 'reflected light'],
    dignityAnchors: ['no music push', 'no aspirational text'],
  },
  'ordinary-ritual': {
    sceneType: 'ritual-repetition',
    location: 'familiar surface (counter / table / desk)',
    environment: 'home or workspace, lived-in',
    timeOfDay: 'any',
    cameraLanguage: '50mm handheld',
    framingStyle: 'tight on hands or single object',
    lightingStyle: 'natural light',
    silenceAllocation: 'silence with ambient sound',
    symbolismAnchors: ['repeated object', 'familiar room', 'small action'],
    dignityAnchors: ['no captions on emotion', 'no styling glamour'],
  },
  'silent-relief': {
    sceneType: 'silence-release',
    location: 'small home space (sofa, bed, floor)',
    environment: 'home, lived-in',
    timeOfDay: 'evening or night',
    cameraLanguage: '35mm fixed',
    framingStyle: 'wide observational',
    lightingStyle: 'low practical light',
    silenceAllocation: 'second half entirely silent',
    symbolismAnchors: ['phone face down', 'closed laptop', 'open window'],
    dignityAnchors: ['no music swell', 'no overlay text'],
  },
  'small-victory': {
    sceneType: 'unwitnessed-arc',
    location: 'workspace or kitchen',
    environment: 'familiar room',
    timeOfDay: 'afternoon',
    cameraLanguage: '50mm handheld',
    framingStyle: 'mid-shot, off-center, eye level',
    lightingStyle: 'natural light',
    silenceAllocation: 'long silence after the small moment',
    symbolismAnchors: ['unfinished work', 'small gesture', 'paper'],
    dignityAnchors: ['no celebration', 'no captions'],
  },
  'before-and-after-without-hype': {
    sceneType: 'paired-frame',
    location: 'two ordinary locations (same room, different time)',
    environment: 'home or workspace',
    timeOfDay: 'matched (morning + later that day)',
    cameraLanguage: '50mm fixed, matched setups',
    framingStyle: 'mirrored composition',
    lightingStyle: 'natural light',
    silenceAllocation: 'silence between the two moments',
    symbolismAnchors: ['matched composition', 'small visible difference'],
    dignityAnchors: ['no transformation captions', 'no music swell'],
  },
  'moment-nobody-notices': {
    sceneType: 'witness-frame',
    location: 'window seat or familiar corner',
    environment: 'home, lived-in',
    timeOfDay: 'afternoon',
    cameraLanguage: '50mm fixed',
    framingStyle: 'wide observational, low angle',
    lightingStyle: 'natural window light',
    silenceAllocation: 'silence before and after the moment',
    symbolismAnchors: ['open window', 'still air', 'unmoved object'],
    dignityAnchors: ['no overlay text', 'no music push'],
  },
  'kitchen-light': {
    sceneType: 'home-continuity',
    location: 'kitchen',
    environment: 'home kitchen, lived-in',
    timeOfDay: 'late afternoon or evening',
    cameraLanguage: '35mm handheld',
    framingStyle: 'mid-shot across the table',
    lightingStyle: 'single warm kitchen light',
    silenceAllocation: 'silence across the table',
    symbolismAnchors: ['kitchen light', 'familiar room', 'shared table'],
    dignityAnchors: ['no music push', 'no captions'],
  },
  'empty-chair': {
    sceneType: 'absence-frame',
    location: 'familiar room with one chair empty',
    environment: 'home, lived-in',
    timeOfDay: 'afternoon',
    cameraLanguage: '50mm fixed',
    framingStyle: 'wide observational, the chair in frame',
    lightingStyle: 'natural light, soft falloff',
    silenceAllocation: 'the entire scene',
    symbolismAnchors: ['empty chair', 'familiar room', 'untouched object'],
    dignityAnchors: ['no narration', 'no music swell', 'operator review required'],
  },
  'hand-on-shoulder': {
    sceneType: 'touch-recognition',
    location: 'lived-in room',
    environment: 'home or familiar space',
    timeOfDay: 'any',
    cameraLanguage: '35mm handheld',
    framingStyle: 'tight on shoulder and hand, off-center',
    lightingStyle: 'soft practical light',
    silenceAllocation: 'silence held through the touch',
    symbolismAnchors: ['hand on shoulder', 'folded blanket', 'held look'],
    dignityAnchors: ['no music swell', 'no captions'],
  },
  'breath-before-continuing': {
    sceneType: 'pause-frame',
    location: 'anywhere familiar',
    environment: 'home or workspace',
    timeOfDay: 'any',
    cameraLanguage: '50mm handheld',
    framingStyle: 'close on chest or shoulders',
    lightingStyle: 'natural light',
    silenceAllocation: 'the breath itself',
    symbolismAnchors: ['slow breath', 'still hand', 'unmoved object'],
    dignityAnchors: ['no captions', 'no overlay'],
  },
  'becoming-yourself-again': {
    sceneType: 'self-return',
    location: 'familiar room with one personal object',
    environment: 'home, lived-in',
    timeOfDay: 'afternoon',
    cameraLanguage: '50mm handheld',
    framingStyle: 'mid-shot, off-center, eye level',
    lightingStyle: 'natural light',
    silenceAllocation: 'silence before the answer to a small question',
    symbolismAnchors: ['personal object', 'quiet sofa', 'familiar room'],
    dignityAnchors: ['no music swell', 'no captions'],
  },
};

const DEFAULT_TEMPLATE: SceneTemplate = {
  sceneType: 'observational-still',
  location: 'familiar lived-in room',
  environment: 'home, lived-in',
  timeOfDay: 'afternoon',
  cameraLanguage: '50mm handheld',
  framingStyle: 'mid-shot, off-center',
  lightingStyle: 'natural light',
  silenceAllocation: 'majority silence',
  symbolismAnchors: ['familiar room', 'single object'],
  dignityAnchors: ['no music swell', 'no captions'],
};

// ─── main ─────────────────────────────────────────────────────

export function computeSceneArchitect(input: SceneArchitectInput): SceneArchitectReading {
  const blueprints = input.storyBlueprints ?? [];
  const mi = input.imprint ?? {};
  const pr = input.presence ?? {};
  const w = input.world ?? {};

  const scenes: SceneBlueprint[] = blueprints.map((bp) => {
    const id = bp.blueprintId ?? 'unknown';
    const template = TEMPLATES[id] ?? DEFAULT_TEMPLATE;

    // realismLevel: respect realism demand + presence authenticity weight.
    const realismLevel = r1(clamp10(
      getDef(w.realismDemand, 6) * 0.5 +
      getDef(w.authenticityDemand, 6) * 0.3 +
      get(pr.authenticityWeight) * 0.2,
    ));

    // emotionalWeight: pulls from blueprint alignment + dignity protection.
    const emotionalWeight = r1(clamp10(
      get(bp.alignment) * 0.6 +
      get(bp.dignityProtection) * 0.4 -
      get(bp.manipulationRisk) * 0.3,
    ));

    // restraintLevel: based on world simplicity craving + presence stillness.
    const restraintLevel = r1(clamp10(
      getDef(w.simplicityCraving, 5) * 0.4 +
      get(pr.stillnessWeight) * 0.4 +
      get(pr.signals?.emotionalRestraint) * 0.2,
    ));

    // presenceAnchors: collect from blueprint + top presence signals.
    const presenceAnchors: string[] = [];
    if (bp.presenceAnchor) presenceAnchors.push(bp.presenceAnchor);
    const signalEntries = Object.entries(pr.signals ?? {}) as Array<[string, number]>;
    const topPresence = signalEntries
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 2)
      .map(([k]) => k);
    for (const t of topPresence) if (!presenceAnchors.includes(t)) presenceAnchors.push(t);

    // memoryAnchors: blueprint anchor + top imprint signals + top rituals.
    const memoryAnchors: string[] = [];
    if (bp.memoryAnchor) memoryAnchors.push(bp.memoryAnchor);
    for (const s of (mi.dominantImprintSignals ?? []).slice(0, 2)) {
      if (!memoryAnchors.includes(s)) memoryAnchors.push(s);
    }
    const topRituals = Object.entries(mi.ritualPersistence ?? {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([k]) => k);
    for (const r of topRituals) if (!memoryAnchors.includes(r)) memoryAnchors.push(r);

    return {
      sourceBlueprintId: id,
      sourceStoryName: bp.storyName ?? id,
      sceneId: `scene-${id}`,
      sceneType: template.sceneType,
      location: template.location,
      environment: template.environment,
      timeOfDay: template.timeOfDay,
      realismLevel,
      cameraLanguage: template.cameraLanguage,
      framingStyle: template.framingStyle,
      lightingStyle: template.lightingStyle,
      silenceAllocation: template.silenceAllocation,
      presenceAnchors,
      memoryAnchors,
      symbolismAnchors: template.symbolismAnchors,
      dignityAnchors: template.dignityAnchors,
      emotionalWeight,
      restraintLevel,
      reasonCodes: [
        `realism:${realismLevel}`,
        `weight:${emotionalWeight}`,
        `restraint:${restraintLevel}`,
        `risk:${bp.riskLevel ?? 'unknown'}`,
      ],
      observation: emotionalWeight >= 6
        ? 'exploratory scene structure that may carry emotional weight in observed window'
        : emotionalWeight >= 3
        ? 'exploratory scene structure observed alongside the outputs — requires more evidence'
        : 'exploratory scene structure with low alignment — requires more evidence',
    };
  });

  // Dominant scene types — top 3 by emotional weight.
  const dominantSceneTypes = scenes.slice()
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight || a.sceneId.localeCompare(b.sceneId))
    .slice(0, 3)
    .map((s) => s.sceneType);

  const notes: string[] = [];
  notes.push('exploratory scene structure — the operator remains the creative authority');
  if (scenes.length === 0) {
    notes.push('no source story blueprints provided — requires more evidence');
  } else if (scenes[0]) {
    notes.push(`top-aligned scene: ${scenes[0].sourceStoryName} → ${scenes[0].sceneType} (weight ${scenes[0].emotionalWeight}/10) — operator review required`);
  }

  return {
    scenes,
    dominantSceneTypes,
    notes,
    reasonCodes: [
      `sceneCount:${scenes.length}`,
      ...scenes.slice(0, 5).map((s) => `${s.sceneId}:${s.emotionalWeight}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
