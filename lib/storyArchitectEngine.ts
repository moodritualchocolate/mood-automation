/**
 * STORY ARCHITECT ENGINE (pure, observational)
 *
 * Transforms observatory intelligence into structured STORY BLUEPRINTS.
 * This is NOT generation, NOT publishing, NOT execution. Only
 * exploratory structures the operator may review.
 *
 * Story families supported (15):
 *   Quiet Return Home, Parent After Exhaustion, Morning Restart,
 *   Night Decompression, Child Growing Older, Ordinary Ritual,
 *   Silent Relief, Small Victory, Before-and-After Without Hype,
 *   The Moment Nobody Notices, Kitchen Light, Empty Chair,
 *   Hand on Shoulder, The Breath Before Continuing,
 *   Becoming Yourself Again.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a "best" / "winner" / "recommended" blueprint
 *   - never executes anything
 *   - allowed phrasing only:
 *       "may carry emotional weight", "historically associated",
 *       "observed alongside", "requires more evidence",
 *       "exploratory story structure", "operator review required"
 *   - forbidden: winner, best, recommended, selected, chosen, optimal,
 *     generate, publish, launch, auto-apply, will-perform, guaranteed
 *
 * Story blueprints are exploratory structures. The operator remains
 * the creative authority.
 */

import {
  computeEmotionalArcs,
  type EmotionalArcInput, type EmotionalArcReading,
} from './emotionalArcEngine';
import {
  computeMemoryAnchors,
  type MemoryAnchorInput, type MemoryAnchorReading,
} from './memoryAnchorEngine';
import {
  computePresenceAnchors,
  type PresenceAnchorInput, type PresenceAnchorReading,
} from './presenceAnchorEngine';
import {
  computeStoryRisk,
  type StoryRiskInput, type StoryRiskReading, type RiskLevel,
} from './storyRiskEngine';

// ─── loose structural subsets ────────────────────────────────

export interface ArchInputWorldSignals {
  emotionalExhaustion?: number;
  emotionalOverload?: number;
  stimulationSaturation?: number;
  anxietyClimate?: number;
  attentionFragmentation?: number;
  lonelinessSignals?: number;
  ritualHunger?: number;
  meaningSeeking?: number;
  simplicityCraving?: number;
  authenticityDemand?: number;
  realismDemand?: number;
  nostalgiaPressure?: number;
  trustFragility?: number;
  optimismDrift?: number;
}

export interface ArchInputPresence {
  presenceScore?: number;
  stillnessWeight?: number;
  authenticityWeight?: number;
  imperfectionSignature?: number;
  vulnerabilitySignals?: number;
  emotionalBreathing?: number;
  listeningSignals?: number;
  syntheticPressure?: number;
  signals?: Record<string, number>;
}

export interface ArchInputImprint {
  imprintStrength?: number;
  scenePermanence?: number;
  emotionalAftertaste?: number;
  identityAttachment?: number;
  memoryRisk?: number;
  ritualPersistence?: Record<string, number>;
  mythicWeights?: Record<string, number>;
}

export interface ArchInputSelfReflection {
  syntheticDrift?: number;
  humanityRetention?: number;
  manipulationCreep?: number;
  aestheticExhaustion?: number;
  restraintIntegrity?: number;
  identityCoherence?: number;
}

export interface ArchInputHumanTruth {
  authenticityScore?: number;
  feltHumanScore?: number;
  signals?: Record<string, number>;
}

export interface ArchInputCulturalMemory {
  emotionalPersistence?: number;
  collapsedSymbols?: number;
  dominantSignals?: string[];
}

export interface ArchInputSupervised {
  alignedMutations?: string[];
  contradictedMutations?: string[];
}

export interface ArchInputTrialOutcomes {
  trustFormationShare?: number;
  emotionalResonanceShare?: number;
  authenticityRejectionShare?: number;
  fatigueShare?: number;
  totalOutcomes?: number;
}

export interface ArchInputScar {
  verdict?: 'soft' | 'heavy' | 'exploitative-risk' | 'dignity-preserved';
  signals?: {
    exploitationRisk?: number;
    emotionalHeaviness?: number;
    griefPressure?: number;
    dignityPreservation?: number;
  };
}

export interface ArchInputDirector {
  dominantDirections?: string[];
  /** Optional pass-through of director-side observations. */
  notes?: string[];
}

export interface StoryArchitectInput {
  director?: ArchInputDirector | null;
  presence?: ArchInputPresence | null;
  imprint?: ArchInputImprint | null;
  humanTruth?: ArchInputHumanTruth | null;
  culturalMemory?: ArchInputCulturalMemory | null;
  world?: ArchInputWorldSignals | null;
  selfReflection?: ArchInputSelfReflection | null;
  supervised?: ArchInputSupervised | null;
  trialOutcomes?: ArchInputTrialOutcomes | null;
  scar?: ArchInputScar | null;
}

// ─── output ───────────────────────────────────────────────────

export interface StoryBlueprint {
  blueprintId: string;
  storyName: string;
  storyType: string;
  humanTension: string;
  emotionalArc: string;
  memoryAnchor: string;
  presenceAnchor: string;
  silencePlacement: string;
  mythicFrame: string;
  realismStyle: string;
  /** 0..10 — how strongly the blueprint protects dignity. */
  dignityProtection: number;
  /** 0..10 — manipulation risk observed for this blueprint. */
  manipulationRisk: number;
  /** Plain-language audience feeling, allowed-phrasing only. */
  audienceFeeling: string;
  whyThisMayMatter: string;
  /** Unresolved risk text, allowed-phrasing only. */
  unresolvedRisk: string;
  /** 0..10 — alignment with observed window. */
  alignment: number;
  /** Risk level from storyRiskEngine. */
  riskLevel: RiskLevel;
  reasonCodes: string[];
}

export interface SilenceMoment {
  moment: string;
  alignment: number;
  observation: string;
}

export interface MythicFrame {
  frame: string;
  alignment: number;
  observation: string;
}

export interface RealismAnchor {
  anchor: string;
  alignment: number;
  observation: string;
}

export interface StoryArchitectReading {
  storyBlueprints: StoryBlueprint[];
  dominantHumanTensions: string[];
  emotionalArcOptions: EmotionalArcReading;
  memoryAnchorOptions: MemoryAnchorReading;
  presenceAnchorOptions: PresenceAnchorReading;
  silenceMoments: SilenceMoment[];
  mythicFrames: MythicFrame[];
  realismAnchors: RealismAnchor[];
  riskWarnings: string[];
  unresolvedQuestions: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Story blueprints are exploratory structures only. ' +
  'The system does not generate, publish, or choose. ' +
  'The operator remains the creative authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function get(v: number | undefined, d = 0): number { return v ?? d; }
function getDef(v: number | undefined, d = 5): number { return v ?? d; }

// ─── story family specs ──────────────────────────────────────

interface BlueprintSpec {
  blueprintId: string;
  storyName: string;
  storyType: string;
  /** observed-window alignment (0..10). */
  alignment: (
    w: ArchInputWorldSignals, mi: ArchInputImprint, pr: ArchInputPresence,
    ht: ArchInputHumanTruth, scar: ArchInputScar,
  ) => number;
  humanTension: string;
  arcShape: string;
  memoryAnchor: string;
  presenceAnchor: string;
  silencePlacement: string;
  mythicFrame: string;
  realismStyle: string;
  audienceFeeling: string;
  whyThisMayMatter: string;
}

const BLUEPRINT_SPECS: BlueprintSpec[] = [
  {
    blueprintId: 'quiet-return-home',
    storyName: 'Quiet Return Home',
    storyType: 'return',
    alignment: (w, mi) => Math.max(get(mi.mythicWeights?.return), get(mi.mythicWeights?.home), get(w.lonelinessSignals) * 0.5),
    humanTension: 'fatigue holds the door; the room remembers you',
    arcShape: 'pressure → breath → return',
    memoryAnchor: 'kitchen light',
    presenceAnchor: 'slow hand movement',
    silencePlacement: 'after the door closes',
    mythicFrame: 'return',
    realismStyle: 'documentary handheld',
    audienceFeeling: 'a quiet relief observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight when the audience is observed to be tired and seeking somewhere familiar',
  },
  {
    blueprintId: 'parent-after-exhaustion',
    storyName: 'Parent After Exhaustion',
    storyType: 'care',
    alignment: (w, mi) => Math.max(get(w.emotionalExhaustion), get(mi.mythicWeights?.care), get(mi.ritualPersistence?.parentChild)),
    humanTension: 'the long day softens into care',
    arcShape: 'fatigue → tenderness → continuation',
    memoryAnchor: "child's shoes near the door",
    presenceAnchor: 'tired smile',
    silencePlacement: 'in the small pause before the child speaks',
    mythicFrame: 'care',
    realismStyle: 'documentary handheld',
    audienceFeeling: 'a soft recognition observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with quiet care after a long day',
  },
  {
    blueprintId: 'morning-restart',
    storyName: 'Morning Restart',
    storyType: 'ritual',
    alignment: (w, mi) => Math.max(get(mi.ritualPersistence?.morning), get(mi.ritualPersistence?.coffee), get(w.ritualHunger) * 0.6),
    humanTension: 'the morning carries last night still',
    arcShape: 'noise → silence → clarity',
    memoryAnchor: 'half-empty coffee cup',
    presenceAnchor: 'exhale',
    silencePlacement: 'before the first sip',
    mythicFrame: 'becoming',
    realismStyle: 'natural light',
    audienceFeeling: 'a familiar steadying observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with morning restoration rituals',
  },
  {
    blueprintId: 'night-decompression',
    storyName: 'Night Decompression',
    storyType: 'ritual',
    alignment: (w, mi) => Math.max(get(mi.ritualPersistence?.night), get(w.emotionalExhaustion) * 0.6),
    humanTension: 'the work of the day lets go',
    arcShape: 'exhaustion → stillness → relief',
    memoryAnchor: 'warm lamp',
    presenceAnchor: 'relaxed shoulders',
    silencePlacement: 'after the light is turned low',
    mythicFrame: 'endurance',
    realismStyle: 'ambient room sound',
    audienceFeeling: 'a slow exhale observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with night-time decompression rituals',
  },
  {
    blueprintId: 'child-growing-older',
    storyName: 'Child Growing Older',
    storyType: 'passing-time',
    alignment: (w, mi) => Math.max(get(mi.mythicWeights?.passingTime), get(mi.ritualPersistence?.parentChild), get(w.nostalgiaPressure) * 0.5),
    humanTension: 'the smaller version of them is still in the room',
    arcShape: 'self-loss → small pause → self-return',
    memoryAnchor: 'old table',
    presenceAnchor: 'looking away',
    silencePlacement: 'between two sentences they almost finish',
    mythicFrame: 'passingTime',
    realismStyle: 'documentary handheld',
    audienceFeeling: 'a quiet ache observed alongside the outputs — historically associated with parental memory',
    whyThisMayMatter: 'this human story may carry emotional weight when nostalgia pressure is observed alongside care archetypes — operator review required',
  },
  {
    blueprintId: 'ordinary-ritual',
    storyName: 'Ordinary Ritual',
    storyType: 'ritual',
    alignment: (w, mi) => Math.max(get(w.ritualHunger), Object.values(mi.ritualPersistence ?? {}).reduce((a, b) => Math.max(a, b), 0)),
    humanTension: 'the small thing repeated holds the day',
    arcShape: 'disconnection → ritual → reconnection',
    memoryAnchor: 'familiar room',
    presenceAnchor: 'slow hand movement',
    silencePlacement: 'in the breath between repetitions',
    mythicFrame: 'home',
    realismStyle: 'natural light',
    audienceFeeling: 'a quiet recognition observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with ritual familiarity',
  },
  {
    blueprintId: 'silent-relief',
    storyName: 'Silent Relief',
    storyType: 'relief',
    alignment: (w, _mi, pr) => Math.max(get(w.emotionalOverload), get(pr.stillnessWeight)),
    humanTension: 'the noise finally ends',
    arcShape: 'noise → silence → clarity',
    memoryAnchor: 'phone face down',
    presenceAnchor: 'exhale',
    silencePlacement: 'the entire second half',
    mythicFrame: 'home',
    realismStyle: 'ambient room sound',
    audienceFeeling: 'a quiet relief observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight when stimulation saturation is observed alongside simplicity craving',
  },
  {
    blueprintId: 'small-victory',
    storyName: 'Small Victory',
    storyType: 'quiet-arc',
    alignment: (w, _mi, pr) => Math.max(Math.max(0, getDef(w.optimismDrift, 0)) + 5, get(pr.presenceScore)),
    humanTension: 'no one applauded; it still counted',
    arcShape: 'overwhelm → human presence → groundedness',
    memoryAnchor: 'unfinished work',
    presenceAnchor: 'quiet nod',
    silencePlacement: 'after the small moment lands',
    mythicFrame: 'endurance',
    realismStyle: 'documentary handheld',
    audienceFeeling: 'a small steady warmth observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with unwitnessed effort',
  },
  {
    blueprintId: 'before-and-after-without-hype',
    storyName: 'Before-and-After Without Hype',
    storyType: 'arc-quiet',
    alignment: (w) => Math.max(getDef(w.authenticityDemand, 5), getDef(w.realismDemand, 5)) -
      Math.max(0, get(w.emotionalOverload) - 5) * 0.5,
    humanTension: 'a real difference, observed without persuasion',
    arcShape: 'fatigue → tenderness → continuation',
    memoryAnchor: 'sunset on wall',
    presenceAnchor: 'imperfect posture',
    silencePlacement: 'between the two moments',
    mythicFrame: 'becoming',
    realismStyle: 'documentary handheld',
    audienceFeeling: 'a quiet trust observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with restrained transformation',
  },
  {
    blueprintId: 'moment-nobody-notices',
    storyName: 'The Moment Nobody Notices',
    storyType: 'witness',
    alignment: (_w, mi, pr) => Math.max(get(mi.scenePermanence), get(pr.stillnessWeight)),
    humanTension: 'the moment exists whether or not anyone looks',
    arcShape: 'overwhelm → human presence → groundedness',
    memoryAnchor: 'open window',
    presenceAnchor: 'looking away',
    silencePlacement: 'before and after the moment',
    mythicFrame: 'waiting',
    realismStyle: 'ambient room sound',
    audienceFeeling: 'a quiet attention observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with unseen ordinary moments',
  },
  {
    blueprintId: 'kitchen-light',
    storyName: 'Kitchen Light',
    storyType: 'home',
    alignment: (_w, mi) => Math.max(get(mi.ritualPersistence?.morning), get(mi.ritualPersistence?.food), get(mi.mythicWeights?.home)),
    humanTension: 'the room continues without an event',
    arcShape: 'pressure → breath → return',
    memoryAnchor: 'kitchen light',
    presenceAnchor: 'slow hand movement',
    silencePlacement: 'across the table',
    mythicFrame: 'home',
    realismStyle: 'natural light',
    audienceFeeling: 'a warm steadiness observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with home archetypes',
  },
  {
    blueprintId: 'empty-chair',
    storyName: 'Empty Chair',
    storyType: 'loss',
    alignment: (_w, mi, _pr, _ht, scar) => Math.max(get(mi.mythicWeights?.loss), get(scar.signals?.dignityPreservation)),
    humanTension: 'someone is no longer in their place',
    arcShape: 'self-loss → small pause → self-return',
    memoryAnchor: 'old table',
    presenceAnchor: 'looking away',
    silencePlacement: 'where the chair sits',
    mythicFrame: 'loss',
    realismStyle: 'ambient room sound',
    audienceFeeling: 'a soft-scar ache observed alongside the outputs — dignity-preserved',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with loss — operator review required',
  },
  {
    blueprintId: 'hand-on-shoulder',
    storyName: 'Hand on Shoulder',
    storyType: 'care',
    alignment: (_w, mi, pr) => Math.max(get(mi.mythicWeights?.care), get(mi.mythicWeights?.protection), get(pr.presenceScore)),
    humanTension: 'no words needed, the touch carries it',
    arcShape: 'fatigue → tenderness → continuation',
    memoryAnchor: 'folded blanket',
    presenceAnchor: 'quiet nod',
    silencePlacement: 'in the held moment',
    mythicFrame: 'care',
    realismStyle: 'documentary handheld',
    audienceFeeling: 'a quiet recognition observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with care archetypes',
  },
  {
    blueprintId: 'breath-before-continuing',
    storyName: 'The Breath Before Continuing',
    storyType: 'pause',
    alignment: (_w, _mi, pr) => Math.max(get(pr.emotionalBreathing), get(pr.stillnessWeight)),
    humanTension: 'one breath is the difference between giving up and going on',
    arcShape: 'pressure → breath → return',
    memoryAnchor: 'slow breath',
    presenceAnchor: 'exhale',
    silencePlacement: 'the breath itself',
    mythicFrame: 'endurance',
    realismStyle: 'ambient room sound',
    audienceFeeling: 'a quiet steadying observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with restorative pauses',
  },
  {
    blueprintId: 'becoming-yourself-again',
    storyName: 'Becoming Yourself Again',
    storyType: 'becoming',
    alignment: (w, mi) => Math.max(get(w.meaningSeeking), get(mi.mythicWeights?.becoming)),
    humanTension: 'the version of you that was always there returns',
    arcShape: 'self-loss → small pause → self-return',
    memoryAnchor: 'quiet sofa',
    presenceAnchor: 'unperformed emotion',
    silencePlacement: 'before the answer to a small question',
    mythicFrame: 'becoming',
    realismStyle: 'documentary handheld',
    audienceFeeling: 'a quiet self-recognition observed alongside the outputs',
    whyThisMayMatter: 'this human story may carry emotional weight historically associated with meaning-seeking and self-return',
  },
];

// ─── main ─────────────────────────────────────────────────────

export function computeStoryArchitect(input: StoryArchitectInput): StoryArchitectReading {
  const w = input.world ?? {};
  const mi = input.imprint ?? {};
  const pr = input.presence ?? {};
  const ht = input.humanTruth ?? {};
  const sr = input.selfReflection ?? {};
  const scar = input.scar ?? {};

  // Compose helper engine readings.
  const arcInput: EmotionalArcInput = {
    world: {
      emotionalExhaustion: w.emotionalExhaustion,
      emotionalOverload: w.emotionalOverload,
      stimulationSaturation: w.stimulationSaturation,
      anxietyClimate: w.anxietyClimate,
      attentionFragmentation: w.attentionFragmentation,
      lonelinessSignals: w.lonelinessSignals,
      ritualHunger: w.ritualHunger,
      meaningSeeking: w.meaningSeeking,
      simplicityCraving: w.simplicityCraving,
      authenticityDemand: w.authenticityDemand,
    },
    presence: {
      presenceScore: pr.presenceScore,
      stillnessWeight: pr.stillnessWeight,
      emotionalBreathing: pr.emotionalBreathing,
    },
    imprint: {
      imprintStrength: mi.imprintStrength,
      scenePermanence: mi.scenePermanence,
    },
  };
  const arcs = computeEmotionalArcs(arcInput);

  const memoryAnchorInput: MemoryAnchorInput = {
    world: w,
    imprint: mi,
    presence: pr,
  };
  const memoryAnchors = computeMemoryAnchors(memoryAnchorInput);

  const presenceAnchorInput: PresenceAnchorInput = {
    presence: pr,
  };
  const presenceAnchors = computePresenceAnchors(presenceAnchorInput);

  // Compute per-blueprint alignment + risk.
  const blueprints: StoryBlueprint[] = BLUEPRINT_SPECS.map((spec) => {
    const alignment = r1(clamp10(spec.alignment(w, mi, pr, ht, scar)));

    const riskInput: StoryRiskInput = {
      hint: {
        storyType: spec.storyType,
        humanTension: spec.humanTension,
        emotionalArc: spec.arcShape,
        memoryAnchor: spec.memoryAnchor,
        presenceAnchor: spec.presenceAnchor,
        realismStyle: spec.realismStyle,
      },
      selfReflection: {
        syntheticDrift: sr.syntheticDrift,
        manipulationCreep: sr.manipulationCreep,
        aestheticExhaustion: sr.aestheticExhaustion,
        humanityRetention: sr.humanityRetention,
        restraintIntegrity: sr.restraintIntegrity,
      },
      scar: {
        exploitationRisk: scar.signals?.exploitationRisk,
        emotionalHeaviness: scar.signals?.emotionalHeaviness,
        griefPressure: scar.signals?.griefPressure,
        dignityPreservation: scar.signals?.dignityPreservation,
      },
      presence: {
        syntheticPressure: pr.syntheticPressure,
        authenticityWeight: pr.authenticityWeight,
      },
    };
    const risk: StoryRiskReading = computeStoryRisk(riskInput);

    // Dignity protection: leans on scar's dignityPreservation +
    // presence dignity proxy + low manipulation risk.
    const dignityProtection = r1(clamp10(
      get(scar.signals?.dignityPreservation, 5) * 0.5 +
      getDef(ht.signals?.dignity, 5) * 0.3 +
      (10 - risk.riskIndex) * 0.2,
    ));

    return {
      blueprintId: spec.blueprintId,
      storyName: spec.storyName,
      storyType: spec.storyType,
      humanTension: spec.humanTension,
      emotionalArc: spec.arcShape,
      memoryAnchor: spec.memoryAnchor,
      presenceAnchor: spec.presenceAnchor,
      silencePlacement: spec.silencePlacement,
      mythicFrame: spec.mythicFrame,
      realismStyle: spec.realismStyle,
      dignityProtection,
      manipulationRisk: risk.riskIndex,
      audienceFeeling: spec.audienceFeeling,
      whyThisMayMatter: spec.whyThisMayMatter,
      unresolvedRisk: risk.warnings.length === 0
        ? 'no unresolved risk signal observed in this blueprint'
        : `unresolved risk observed alongside the blueprint: ${risk.warnings[0]} — operator review required`,
      alignment,
      riskLevel: risk.level,
      reasonCodes: [
        `alignment:${alignment}`,
        `riskLevel:${risk.level}`,
        `dignityProtection:${dignityProtection}`,
        `manipulationRisk:${risk.riskIndex}`,
        ...risk.reasonCodes,
      ],
    };
  });

  // Sort blueprints by alignment, ties broken by name.
  blueprints.sort((a, b) => b.alignment - a.alignment || a.blueprintId.localeCompare(b.blueprintId));

  // Dominant human tensions = blueprint humanTensions of top-5 by alignment.
  const dominantHumanTensions = blueprints
    .slice(0, 5)
    .map((b) => b.humanTension);

  // Silence moments — surface anchors that center on stillness.
  const silenceMoments: SilenceMoment[] = [
    { moment: 'after the door closes', alignment: r1(clamp10(get(pr.stillnessWeight) * 0.7 + get(w.emotionalExhaustion) * 0.3)) },
    { moment: 'before the first sip', alignment: r1(clamp10(get(mi.ritualPersistence?.morning) * 0.7 + get(pr.emotionalBreathing) * 0.3)) },
    { moment: 'the breath itself', alignment: r1(clamp10(get(pr.emotionalBreathing) * 0.8 + get(pr.stillnessWeight) * 0.2)) },
    { moment: 'where the chair sits', alignment: r1(clamp10(get(mi.mythicWeights?.loss))) },
    { moment: 'in the held moment', alignment: r1(clamp10(get(mi.mythicWeights?.care))) },
  ].map((m) => ({
    ...m,
    observation: m.alignment >= 6
      ? `${m.moment} may carry emotional weight in observed window`
      : `${m.moment} observed alongside the outputs — requires more evidence`,
  }));

  // Mythic frames — surface archetypes with non-zero weight.
  const mythicFrames: MythicFrame[] = Object.entries(mi.mythicWeights ?? {})
    .map(([frame, v]) => ({
      frame,
      alignment: r1(clamp10(v as number)),
      observation: (v as number) >= 6
        ? `${frame} frame may carry emotional weight — historically associated with mythic resonance`
        : `${frame} frame observed alongside the outputs — requires more evidence`,
    }))
    .sort((a, b) => b.alignment - a.alignment || a.frame.localeCompare(b.frame));

  // Realism anchors — exploratory grounded textures.
  const realismAnchors: RealismAnchor[] = [
    { anchor: 'documentary handheld',   alignment: r1(clamp10(get(w.realismDemand) * 0.7 + get(w.authenticityDemand) * 0.3)) },
    { anchor: 'natural light',          alignment: r1(clamp10(get(w.realismDemand) * 0.6 + get(pr.stillnessWeight) * 0.4)) },
    { anchor: 'ambient room sound',     alignment: r1(clamp10(get(pr.stillnessWeight) * 0.8)) },
    { anchor: 'unedited dialogue',      alignment: r1(clamp10(get(pr.authenticityWeight))) },
    { anchor: 'real hands / real hours', alignment: r1(clamp10(get(w.authenticityDemand))) },
  ].map((a) => ({
    ...a,
    observation: a.alignment >= 6
      ? `${a.anchor} may carry emotional weight — historically associated with grounded realism`
      : `${a.anchor} observed alongside the outputs — requires more evidence`,
  }));

  // Aggregate risk warnings from all blueprints — dedup.
  const riskWarningSet = new Set<string>();
  for (const b of blueprints) {
    if (b.unresolvedRisk.includes('unresolved risk observed')) {
      riskWarningSet.add(`${b.storyName}: ${b.unresolvedRisk}`);
    }
  }
  // Also include posing risk + scar verdict observations.
  if (presenceAnchors.influencerPosingRisk >= 6) {
    riskWarningSet.add('influencer-posing risk observed alongside the presence signals — operator review required');
  }
  if (scar.verdict === 'exploitative-risk') {
    riskWarningSet.add('exploitative-risk verdict observed alongside the emotional scar layer — operator review required');
  }
  const riskWarnings = Array.from(riskWarningSet);

  // Unresolved questions — surface "requires more evidence" signals.
  const unresolvedQuestions: string[] = [];
  if (get(mi.imprintStrength) < 4) {
    unresolvedQuestions.push('imprint strength appears low — requires more evidence to determine which story may carry memory weight');
  }
  if (get(pr.presenceScore) < 4) {
    unresolvedQuestions.push('presence signal appears low — requires more evidence to anchor presence-led blueprints');
  }
  if (get(ht.authenticityScore) < 4 && get(ht.feltHumanScore) < 4) {
    unresolvedQuestions.push('human truth signals appear muted — requires more evidence to support real human framing');
  }
  if ((input.trialOutcomes?.totalOutcomes ?? 0) < 3) {
    unresolvedQuestions.push('few trial outcomes observed — requires more evidence to support supervised-learning-backed exploration');
  }
  if (blueprints.every((b) => b.alignment < 4)) {
    unresolvedQuestions.push('all candidate blueprints appear muted — requires more evidence');
  }
  if (unresolvedQuestions.length === 0) {
    unresolvedQuestions.push('no unresolved evidence gaps observed in this window');
  }

  const notes: string[] = [];
  notes.push('exploratory story structure — the operator remains the creative authority');
  if (blueprints[0]) {
    notes.push(`top-aligned blueprint: ${blueprints[0].storyName} (${blueprints[0].alignment}/10) — operator review required`);
  }

  return {
    storyBlueprints: blueprints,
    dominantHumanTensions,
    emotionalArcOptions: arcs,
    memoryAnchorOptions: memoryAnchors,
    presenceAnchorOptions: presenceAnchors,
    silenceMoments,
    mythicFrames,
    realismAnchors,
    riskWarnings,
    unresolvedQuestions,
    notes,
    reasonCodes: [
      `blueprintCount:${blueprints.length}`,
      ...blueprints.slice(0, 5).map((b) => `${b.blueprintId}:${b.alignment}/${b.riskLevel}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
