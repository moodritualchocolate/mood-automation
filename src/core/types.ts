/**
 * MOOD CREATIVE OS — core type contracts.
 *
 * Every engine input/output is typed here so the pipeline can be
 * recomposed for future formulas (CALM, FOCUS, etc.) and future
 * outputs (carousels, video, landing pages) without rewriting wiring.
 *
 * Treat this file as a public API. Engine internals may change freely;
 * these shapes must not change without a corresponding pipeline migration.
 */

import { z } from 'zod';

// ───────────────────────────────────────────────────────────
// FORMULAS — V1 ships ENERGY only. Architecture supports more.
// ───────────────────────────────────────────────────────────

export const FORMULAS = ['ENERGY'] as const;
export type Formula = (typeof FORMULAS)[number];

export const CAMPAIGN_MODES = [
  'Editorial',
  'Documentary',
  'Performance',
  'Emotional',
  'Minimal',
  'Aggressive',
  'Luxury',
  'Product-focused',
] as const;
export type CampaignMode = (typeof CAMPAIGN_MODES)[number];

// ───────────────────────────────────────────────────────────
// HUMAN STATE
// ───────────────────────────────────────────────────────────

export const HumanStateSchema = z.object({
  id: z.string(),                       // stable slug, e.g. "third-coffee"
  label: z.string(),                    // human-readable, e.g. "third coffee"
  family: z.enum([
    'fatigue',
    'overstimulation',
    'avoidance',
    'numbness',
    'pressure',
    'fragmentation',
    'paralysis',
    'collapse',
  ]),
  timeAnchor: z.string().nullable(),    // "16:30" if time is emotionally critical, else null
  setting: z.array(z.string()),         // physical contexts the state lives in
  body: z.array(z.string()),            // body language signals
  weight: z.number().min(0).max(1),     // base selection weight (raised by wins, lowered by fatigue)
});
export type HumanState = z.infer<typeof HumanStateSchema>;

// ───────────────────────────────────────────────────────────
// HUMAN TRUTH
// ───────────────────────────────────────────────────────────

export const HumanTruthSchema = z.object({
  state: HumanStateSchema,
  truth: z.string(),                    // the sharp human insight
  tension: z.string(),                  // the contradiction at the core
  voice: z.enum(['observed', 'overheard', 'internal']),
  forbidden: z.array(z.string()),       // motivational / wellness phrases to never use
});
export type HumanTruth = z.infer<typeof HumanTruthSchema>;

// ───────────────────────────────────────────────────────────
// CREATIVE DIRECTION
// ───────────────────────────────────────────────────────────

export const CreativeDirectionSchema = z.object({
  hook: z.string(),                     // the one-line visual hook
  focalPoint: z.enum([
    'human-face',
    'hands',
    'object',
    'environment',
    'gesture',
    'product-in-hand',
    'empty-space',
  ]),
  emotionalPacing: z.enum(['quiet', 'tense', 'interrupted', 'collapsed', 'wired']),
  productRole: z.enum([
    'hidden',
    'environmental',
    'hand-held',
    'partial-crop',
    'foreground-blur',
    'table-object',
    'desk-proof',
    'background-object',
    'emotional-proof',
  ]),
  typographyDominance: z.enum(['absent', 'whisper', 'editorial', 'loud', 'timestamp']),
  ctaBehavior: z.enum(['quiet', 'integrated', 'editorial', 'corner']),
  layoutFamily: z.enum([
    'documentary-crop',
    'editorial-page',
    'off-center-portrait',
    'environmental-wide',
    'timestamp-anchor',
    'negative-space',
  ]),
  restraint: z.number().min(0).max(1),  // 1 = extreme restraint, 0 = aggressive
});
export type CreativeDirection = z.infer<typeof CreativeDirectionSchema>;

// ───────────────────────────────────────────────────────────
// COMPOSITION PLAN
// ───────────────────────────────────────────────────────────

export const Zone = z.object({
  x: z.number(),                        // 0..1
  y: z.number(),
  w: z.number(),
  h: z.number(),
});
export type Zone = z.infer<typeof Zone>;

export const CompositionPlanSchema = z.object({
  aspect: z.enum(['1:1', '4:5', '9:16', '16:9']),
  focal: Zone,
  productZone: Zone.nullable(),         // null when product is hidden/environmental in the photo itself
  typoZones: z.object({
    primary: Zone,
    secondary: Zone.nullable(),
    cta: Zone,
    timestamp: Zone.nullable(),
  }),
  safeZones: z.array(Zone),
  eyeFlow: z.array(z.tuple([z.number(), z.number()])),
  negativeSpaceBias: z.enum(['top', 'bottom', 'left', 'right', 'center', 'corners']),
});
export type CompositionPlan = z.infer<typeof CompositionPlanSchema>;

// ───────────────────────────────────────────────────────────
// IMAGE BRIEF + RESULT
// ───────────────────────────────────────────────────────────

export const ImageBriefSchema = z.object({
  scene: z.string(),                    // cinematic-only scene description
  lighting: z.string(),
  framing: z.string(),
  lens: z.string(),
  mood: z.string(),
  forbiddenInImage: z.array(z.string()),// text, logos, packaging, fake typography
  imperfections: z.array(z.string()),
  aspect: z.string(),
});
export type ImageBrief = z.infer<typeof ImageBriefSchema>;

export const ImageResultSchema = z.object({
  provider: z.string(),
  url: z.string().nullable(),           // remote URL (provider) — may be null when inline
  dataUrl: z.string().nullable(),       // inline data URL — used by stub + PNG export
  width: z.number(),
  height: z.number(),
  cost: z.number().nullable(),
});
export type ImageResult = z.infer<typeof ImageResultSchema>;

// ───────────────────────────────────────────────────────────
// TYPOGRAPHY + CTA
// ───────────────────────────────────────────────────────────

export const TypographyPlanSchema = z.object({
  primary: z.object({
    text: z.string(),
    lang: z.enum(['he', 'en']),
    size: z.number(),                   // px at 1080px reference
    weight: z.number(),
    tracking: z.number(),               // em
    leading: z.number(),                // multiplier
    color: z.string(),
    align: z.enum(['start', 'end', 'center']),
  }),
  secondary: z.object({
    text: z.string(),
    lang: z.enum(['he', 'en']),
    size: z.number(),
    weight: z.number(),
    color: z.string(),
  }).nullable(),
  timestamp: z.object({
    text: z.string(),
    size: z.number(),
  }).nullable(),
});
export type TypographyPlan = z.infer<typeof TypographyPlanSchema>;

export const CTASchema = z.object({
  text: z.string(),                     // Hebrew CTA
  lang: z.literal('he'),
  style: z.enum(['underline', 'enclosed', 'bare', 'pill']),
  position: Zone,
});
export type CTA = z.infer<typeof CTASchema>;

// ───────────────────────────────────────────────────────────
// CRITIQUE
// ───────────────────────────────────────────────────────────

export const CritiqueSchema = z.object({
  scores: z.object({
    feelsAI: z.number().min(0).max(10),         // higher = more AI-feeling — BAD
    compositionGeneric: z.number().min(0).max(10),
    productPasted: z.number().min(0).max(10),
    typographyForced: z.number().min(0).max(10),
    emotionalTruthClarity: z.number().min(0).max(10), // higher = clearer — GOOD
    focalPointObvious: z.number().min(0).max(10),
    eyeStops: z.number().min(0).max(10),
    tension: z.number().min(0).max(10),
    curiosity: z.number().min(0).max(10),
    feelsLikeRealCampaign: z.number().min(0).max(10),
  }),
  verdict: z.enum(['approve', 'reject-image', 'reject-concept']),
  notes: z.string(),
  rejectionReasons: z.array(z.string()),
});
export type Critique = z.infer<typeof CritiqueSchema>;

// ───────────────────────────────────────────────────────────
// TASTE LAYER (Phase 2)
//
// The taste layer does not generate. It judges. Each engine emits
// scored opinions about the same banner; the Not-Good-Enough engine
// synthesizes them into a single final verdict that the pipeline acts on.
// ───────────────────────────────────────────────────────────

// — Reference Intelligence —
// Each reference is a structured taste anchor (NOT an image). The
// engine computes the closest match for the current banner and reports
// divergence on the axes that matter.
export const ReferenceSchema = z.object({
  id: z.string(),
  family: z.enum([
    'editorial-restraint',
    'documentary-quiet',
    'cinema-poster',
    'fashion-aggressive',
    'intimate-documentary',
    'product-as-evidence',
    'negative-space-luxury',
    'campaign-overheard',
  ]),
  emotional_category: z.enum(['quiet', 'tense', 'collapsed', 'wired', 'observed', 'interrupted']),
  composition_type: z.enum([
    'bottom-heavy-asymmetry',
    'off-center-portrait',
    'environmental-wide',
    'negative-space-corner',
    'documentary-crop',
    'timestamp-anchor',
    'centered-restraint',
  ]),
  pacing: z.enum(['slow-interruption', 'quiet', 'wired', 'staccato', 'breath']),
  product_behavior: z.enum(['evidence', 'hidden', 'partial-crop', 'environmental', 'hand-held', 'absent']),
  typography_behavior: z.enum(['whisper', 'restrained-oversized', 'editorial-balanced', 'silence', 'interruption', 'timestamp-anchor']),
  restraint_score: z.number().min(0).max(1),
  tension_score: z.number().min(0).max(1),
  realism_score: z.number().min(0).max(1),
  campaign_feeling: z.string(),  // a short observed phrase describing what the reference "feels like"
});
export type Reference = z.infer<typeof ReferenceSchema>;

export const ReferenceMatchSchema = z.object({
  reference: ReferenceSchema,
  distance: z.number(),                  // 0 = perfect alignment; ~1 = far
  divergences: z.array(z.string()),      // named axes where the banner falls short of the reference
  closeness: z.number().min(0).max(1),   // 1 - normalised distance
});
export type ReferenceMatch = z.infer<typeof ReferenceMatchSchema>;

// — Aesthetic / Taste Critic —
// Eleven taste signals — all are "higher = worse" (failure scores).
export const AestheticCritiqueSchema = z.object({
  failures: z.object({
    fakePremium: z.number().min(0).max(10),
    startupAIFeeling: z.number().min(0).max(10),
    overdesigned: z.number().min(0).max(10),
    genericGradients: z.number().min(0).max(10),
    forcedCinematic: z.number().min(0).max(10),
    fakeEmotion: z.number().min(0).max(10),
    randomTypography: z.number().min(0).max(10),
    predictableHierarchy: z.number().min(0).max(10),
    templateEnergy: z.number().min(0).max(10),
    safeComposition: z.number().min(0).max(10),
    aiAdFeeling: z.number().min(0).max(10),
  }),
  verdict: z.enum(['cleared', 'taste-reject']),
  notes: z.string(),
  reasons: z.array(z.string()),
});
export type AestheticCritique = z.infer<typeof AestheticCritiqueSchema>;

// — Visual Psychology —
// Eye-flow / tension / release analysis on the composition.
export const VisualPsychologySchema = z.object({
  entryPoint: z.object({ x: z.number(), y: z.number() }),
  focalInterruption: z.number().min(0).max(10),   // higher = better, stops the eye
  tensionZone: z.tuple([z.number(), z.number()]).nullable(),
  releaseZone: z.tuple([z.number(), z.number()]).nullable(),
  emotionalHierarchyClear: z.number().min(0).max(10),
  delayedProductReveal: z.number().min(0).max(10),
  ctaResolution: z.number().min(0).max(10),
  eyeFlowIntegrity: z.number().min(0).max(10),
  notes: z.array(z.string()),
});
export type VisualPsychology = z.infer<typeof VisualPsychologySchema>;

// — Product Presence Intelligence —
// Scored only when productRole is not 'hidden'. When 'hidden' the engine
// returns null (no product to score) and the meta-critic skips it.
export const ProductPresenceSchema = z.object({
  scores: z.object({
    environmentalRealism: z.number().min(0).max(10),
    naturalSceneIntegration: z.number().min(0).max(10),
    emotionalRelevance: z.number().min(0).max(10),
    physicalLogic: z.number().min(0).max(10),
    lensConsistency: z.number().min(0).max(10),
    shadowConsistency: z.number().min(0).max(10),
    narrativeJustification: z.number().min(0).max(10),
  }),
  verdict: z.enum(['evidence', 'inserted-risk', 'pasted']),
  reasons: z.array(z.string()),
});
export type ProductPresence = z.infer<typeof ProductPresenceSchema>;

// — Not-Good-Enough meta-verdict —
// Synthesizes every critic into a single decision. The pipeline acts
// only on this verdict — the underlying critics are inputs, not voters.
export const FinalVerdictSchema = z.object({
  verdict: z.enum(['approve', 'reject-image', 'reject-concept', 'reject-taste']),
  reasons: z.array(z.string()),
  notes: z.string(),
  totals: z.object({
    scrollStop: z.number(),     // 0..10 composite of original critic
    taste: z.number(),          // 0..10 (higher = worse)
    psychology: z.number(),     // 0..10 (higher = better)
    productPresence: z.number().nullable(),
    referenceCloseness: z.number(),   // 0..1
  }),
  brutality: z.number().min(0).max(1),  // how brutally the meta-critic was set this run
});
export type FinalVerdict = z.infer<typeof FinalVerdictSchema>;

// ───────────────────────────────────────────────────────────
// PIPELINE I/O
// ───────────────────────────────────────────────────────────

export interface GenerateRequest {
  formula: Formula;
  campaignMode?: CampaignMode;
  /** Optional override — when omitted the system chooses autonomously. */
  forceStateId?: string;
  /** Max critic-driven regeneration attempts. */
  maxAttempts?: number;
  /** Phase 27 — the persistent-runtime campaign this run belongs to.
   *  When omitted the runtime uses the formula as the campaign id. */
  campaignId?: string;
}

/**
 * Phase 2.5 — explicit taste system (lib/*) outputs.
 * Structural only; concrete shapes live in lib/.
 */
export interface BannerTasteSystem {
  dna: import('@lib/referenceDNA').ReferenceDNA;
  judge: import('@lib/tasteJudge').TasteVerdict;
  reaction: import('@lib/humanReaction').ReactionCurve;
  fatigue: import('@lib/visualFatigue').FatigueReport;
  evolutionAtRunStart: import('@lib/campaignEvolution').EvolutionDirective;
  // Phase 3 — campaign brain
  campaignBrain: {
    job: import('@lib/campaignDecision').JobDecision;
    culturalMoment: import('@lib/culturalIntelligence').CulturalMoment;
    courage: import('@lib/visualCourage').CourageDecision;
    rhythm: import('@lib/campaignRhythm').RhythmReport;
    antiAI: import('@lib/antiAI').AntiAIReport;
    residue: string;
  };
  // Phase 4 — reality loop (predictions made at ship time; reality
  // is appended later as engagement signals come in)
  realityLoop: {
    aftertastePrediction: import('@lib/aftertaste').AftertasteRecord;
    drift: import('@lib/tasteDrift').DriftReport;
    atmosphere: import('@lib/atmosphereConsistency').AtmosphereReport;
  };
  // Phase 5 — perceptual foundation
  perception: {
    emotionalCore: import('@lib/humanTruthEngine').EmotionalCore | null;
    culturalMicroMoment: import('@lib/culturalMemory').CulturalMicroMoment | null;
    visualTaste: import('@lib/visualTaste').VisualTasteVerdict;
    imperfection: import('@lib/humanVisualBehavior').ImperfectionPlan;
    emotionalAftertaste: import('@lib/emotionalAftertaste').EmotionalAftertaste;
    campaignMemoryV2: import('@lib/campaignMemoryV2').CampaignMemoryV2Report;
  };
  // Phase 7 — human perception + world continuity
  perceptionV2: {
    atmosphericLight: import('@lib/atmosphericLight').AtmosphericLight;
    typographyPsychology: import('@lib/typographyPsychology').TypographyPsychologyPlan;
    worldContinuity: import('@lib/worldContinuity').WorldContinuityPlan;
    microHumanDetails: import('@lib/microHumanDetails').MicroDetailPlan;
    invisibleStory: import('@lib/invisibleStory').InvisibleStory;
    humanInterruption: import('@lib/humanInterruption').InterruptionPlan;
    campaignIdentity: import('@lib/campaignIdentity').CampaignIdentity;
    perceptionCritic: import('@lib/perceptionCritic').PerceptionVerdict;
  };
  // Phase 8 — visual composition intelligence
  composition8: {
    gravity: import('@lib/visualGravity').GravityReading;
    negativeSpace: import('@lib/negativeSpacePsychology').NegativeSpaceReading;
    rhythm: import('@lib/compositionRhythm').CompositionRhythmReport;
    presence: import('@lib/productPresence').PresenceDecision;
    framing: import('@lib/humanFraming').FramingPlan;
    director: import('@lib/layoutDirector').DirectorVerdict;
  };
  // Phase 9 — temporal campaign cinema
  temporal: {
    timeline: import('@lib/campaignTimeline').CampaignTimeline;
    sequence: import('@lib/emotionalSequence').SequenceVerdict;
    worldPersistence: import('@lib/worldPersistence').WorldPersistenceReport;
    objectGraph: import('@lib/objectMemoryGraph').ObjectMemoryGraph;
    sceneContinuity: import('@lib/sceneContinuity').SceneContinuityReport;
    visualTempo: import('@lib/visualTempo').TempoReport;
    absence: import('@lib/absenceIntelligence').AbsenceDecision;
    contradiction: import('@lib/emotionalContradiction').ContradictionReading;
  };
  // Phase 10 — unified cinematic brain
  cinematic: {
    unresolved: import('@lib/unresolvedEmotion').UnresolvedReport;
    compression: import('@lib/emotionalCompression').CompressionReading;
    recognition: import('@lib/subconsciousRecognition').RecognitionReport;
    synthetic: import('@lib/antiSyntheticBehavior').SyntheticReading;
    verdict: import('@lib/cinematicBrain').CinematicVerdict;
  };
  // Phase 11 — natural human chaos
  humanity: {
    lifeNoise: import('@lib/lifeNoise').LifeNoisePlan;
    contradiction: import('@lib/humanContradiction').HumanContradictionReading;
    nonPerformative: import('@lib/nonPerformativeReality').PerformativeReading;
  };
  // Phase 12 — cultural memory engine
  culture: {
    sharedPattern: import('@lib/sharedCulturalMemory').CulturalPattern | null;
    collectiveRecognition: import('@lib/collectiveRecognition').CollectiveRecognitionReading;
    unspokenRitual: import('@lib/unspokenRituals').RitualSelection;
    drift: import('@lib/culturalDrift').DriftReading;
  };
  // Phase 13 — reality pressure
  pressure: {
    reality: import('@lib/realityPressure').RealityPressureReading;
    consequence: import('@lib/consequenceEngine').ConsequenceReading;
    invisibleStakes: import('@lib/invisibleStakes').StakesReading;
    functionalCollapse: import('@lib/functionalCollapse').FunctionalCollapseReading;
  };
  // Phase 14 — suppressed humanity
  suppression: {
    avoidance: import('@lib/emotionalAvoidance').AvoidanceReading;
    numbing: import('@lib/modernNumbing').NumbingReading;
    masking: import('@lib/socialMasking').SocialMaskingReading;
    unfelt: import('@lib/unfeltEmotion').UnfeltReading;
  };
  // Phase 15 — longitudinal reality memory
  longitudinal: {
    truthPersistence: import('@lib/truthPersistence').TruthPersistenceReport;
    culturalTimeline: import('@lib/culturalTimeline').CulturalTimelineReport;
    realityVerification: import('@lib/realityVerification').RealityVerificationReading;
    emotionalDecay: import('@lib/emotionalDecay').DecayReading;
    generationPressure: import('@lib/generationPressure').GenerationPressureReading;
  };
  // Phase 16 — reality ingestion layer
  reality: {
    extraction: import('@lib/humanSignalExtraction').ExtractionReport;
    collectiveDrift: import('@lib/collectiveDriftTracker').CollectiveDriftReport;
    privateLanguage: import('@lib/privateLanguageMap').PrivateLanguageReading;
    weighting: import('@lib/realityWeighting').WeightingReading;
  };
  // Phase 17 — systemic human pressure model
  systems: {
    systemicCause: import('@lib/systemicPressureMap').SystemicCauseReading;
    attentionFragmentation: import('@lib/attentionFragmentation').FragmentationReading;
    environmentalSystem: import('@lib/modernEnvironmentSystems').EnvironmentalSystemReading;
    recoveryFailure: import('@lib/recoveryFailure').RecoveryFailureReading;
    cognitiveResidue: import('@lib/cognitiveResidue').CognitiveResidueReading;
  };
  // Phase 18 — behavioral survival engine
  survival: {
    behaviorLoop: import('@lib/behaviorLoopEngine').BehaviorLoopReading;
    microEscape: import('@lib/microEscapeDetection').MicroEscapeReading;
    ritualCompensation: import('@lib/ritualCompensation').CompensationRitualReading;
    fakeRecovery: import('@lib/fakeRecovery').FakeRecoveryReading;
    silentCoping: import('@lib/silentCopingMechanisms').SilentCopingReading;
    behavioralResidue: import('@lib/behavioralResidue').BehavioralResidueReading;
  };
  // Phase 19 — social masking + identity performance engine
  identity: {
    socialMaskingEngine: import('@lib/socialMaskingEngine').SocialMaskingEngineReading;
    highFunctioningBurnout: import('@lib/highFunctioningBurnout').HighFunctioningBurnoutReading;
    identityMaintenance: import('@lib/identityMaintenance').IdentityMaintenanceReading;
    emotionalCamouflage: import('@lib/emotionalCamouflage').EmotionalCamouflageReading;
    publicPrivateSplit: import('@lib/publicPrivateSplit').PublicPrivateSplitReading;
    maskFatigue: import('@lib/maskFatigue').MaskFatigueReading;
  };
  // Phase 20 — desire systems
  desire: {
    architecture: import('@lib/desireArchitecture').DesireArchitectureReading;
    quietStatus: import('@lib/statusWithoutStatus').QuietStatusReading;
    emotionalHunger: import('@lib/emotionalHunger').EmotionalHungerReading;
    validation: import('@lib/validationSystems').ValidationSystemsReading;
    invisibleEnvy: import('@lib/invisibleEnvy').InvisibleEnvyReading;
    aspirationalGap: import('@lib/aspirationalIdentityGap').AspirationalIdentityGapReading;
  };
  // Phase 21 — social gravity
  socialGravity: {
    gravity: import('@lib/socialGravity').SocialGravityReading;
    collectiveMovement: import('@lib/collectiveEmotionalMovement').CollectiveEmotionalMovementReading;
    culturalAcceleration: import('@lib/culturalAcceleration').CulturalAccelerationReading;
    groupAnxiety: import('@lib/groupAnxiety').GroupAnxietyReading;
    viralPatterns: import('@lib/viralEmotionPatterns').ViralEmotionPatternsReading;
    permissionStructures: import('@lib/socialPermissionStructures').SocialPermissionReading;
  };
  // Phase 22 — ritual attachment
  ritual: {
    formation: import('@lib/ritualFormation').RitualFormationReading;
    attachmentLoops: import('@lib/attachmentLoops').AttachmentLoopsReading;
    symbolicSafety: import('@lib/symbolicSafety').SymbolicSafetyReading;
    returnMechanics: import('@lib/emotionalReturnMechanics').EmotionalReturnReading;
    privateRitualMemory: import('@lib/privateRitualMemory').PrivateRitualMemoryReading;
    comfortSystems: import('@lib/repeatedComfortSystems').RepeatedComfortSystemsReading;
  };
  // Phase 23 — narrative self
  narrative: {
    internalNarrative: import('@lib/internalNarrative').InternalNarrativeReading;
    selfStory: import('@lib/selfStoryArchitecture').SelfStoryArchitectureReading;
    identityContinuity: import('@lib/identityContinuity').IdentityContinuityReading;
    meaningSystems: import('@lib/privateMeaningSystems').PrivateMeaningSystemsReading;
    selfTranslation: import('@lib/emotionalSelfTranslation').EmotionalSelfTranslationReading;
    personalMythology: import('@lib/personalMythology').PersonalMythologyReading;
  };
  // Phase 24 — predictive human states
  predictive: {
    forecast: import('@lib/emotionalForecasting').EmotionalForecastReading;
    behaviorPrediction: import('@lib/behaviorPrediction').BehaviorPredictionReading;
    collapseProbability: import('@lib/collapseProbability').CollapseProbabilityReading;
    recoveryAttempt: import('@lib/recoveryAttemptModel').RecoveryAttemptReading;
    pressureTrajectory: import('@lib/futurePressureTrajectory').FuturePressureTrajectoryReading;
    drift: import('@lib/emotionalDriftPrediction').EmotionalDriftPredictionReading;
  };
  // Phase 25 — autonomous campaign intelligence
  autonomous: {
    narrativeEngine: import('@lib/autonomousNarrativeEngine').AutonomousNarrativeReading;
    culturalSignalEvolution: import('@lib/culturalSignalEvolution').CulturalSignalEvolutionReading;
    selfUpdatingPsychology: import('@lib/selfUpdatingPsychology').SelfUpdatingPsychologyReading;
    emergentMemory: import('@lib/emergentCampaignMemory').EmergentCampaignMemoryReading;
    realityTracking: import('@lib/collectiveRealityTracking').CollectiveRealityTrackingReading;
    adaptiveIntelligence: import('@lib/adaptiveEmotionalIntelligence').AdaptiveEmotionalIntelligenceReading;
  };
  // Phases 20–25 — unified human cognition graph
  unifiedGraph: import('@lib/unifiedHumanGraph').UnifiedHumanGraphReading;
  // Phase 26 — unified cognitive field (the nervous system)
  cognition: {
    field: import('@lib/cognitiveField').CognitiveFieldState;
    physics: import('@lib/emotionalPhysics').EmotionalPhysicsReading;
    tensionTopology: import('@lib/tensionTopology').TensionTopologyReading;
    lifeTrajectory: import('@lib/lifeTrajectory').LifeTrajectoryReading;
    contradictionResolution: import('@lib/cognitiveContradictionResolver').ContradictionResolverReading;
    symbolicObjects: import('@lib/symbolicObjects').SymbolicObjectsReading;
    trace: import('@lib/cognitionTrace').CognitionTrace;
    worldModelEvolution: import('@lib/selfEvolvingWorldModel').WorldModelEvolution;
  };
  // Phase 27 — persistent cognitive runtime (the living runtime layer)
  runtime: {
    persistentState: import('@lib/persistentCognitiveRuntime').PersistentRuntimeState;
    continuity: import('@lib/cognitiveContinuityScore').CognitiveContinuityReading;
    drift: import('@lib/runtimeDriftDetector').RuntimeDriftReport;
    health: import('@lib/runtimeHealthMonitor').RuntimeHealth;
    trace: import('@lib/runtimeTrace').RuntimeTrace;
    nextRunDirective: import('@lib/nextRunDirective').NextRunDirective;
    identityDefense: import('@lib/runtimeIdentity').IdentityDefenseReading;
  };
  // Wave 2 — reality execution architecture (Phases 28–35)
  execution: {
    nervousSystem: import('@lib/campaignNervousSystem').CampaignNervousSystemReading;
    attentionPhysics: import('@lib/attentionPhysics').AttentionPhysicsReading;
    visualCognition: import('@lib/visualCognition').VisualCognitionReading;
    emotionalContinuity: import('@lib/emotionalContinuityRuntime').EmotionalContinuityRuntimeReading;
    audienceFeedback: import('@lib/audienceRealityFeedback').AudienceRealityFeedbackReading;
    antiOptimization: import('@lib/antiOptimization').AntiOptimizationReading;
    identityPersistence: import('@lib/identityPersistence').IdentityPersistenceReading;
    autonomousDirection: import('@lib/autonomousCreativeDirection').AutonomousCreativeDirectionReading;
    orchestration: import('@lib/realityExecutionOrchestrator').RealityExecutionState;
  };
  // Wave 4 — executive cognition layer (Phases 36–42)
  executive: {
    strategicPriority: import('@lib/strategicPriorityEngine').StrategicPriorityReading;
    cognitiveEnergy: import('@lib/cognitiveEnergyModel').CognitiveEnergyReading;
    temporalPsychology: import('@lib/temporalPsychology').TemporalPsychologyReading;
    identityGovernance: import('@lib/identityGovernance').IdentityGovernanceReading;
    campaignLifecycle: import('@lib/campaignLifecycle').CampaignLifecycleReading;
    worldState: import('@lib/worldStateEngine').ExecutiveWorldState;
    decision: import('@lib/executiveRuntime').ExecutiveDecision;
  };
  // Wave 5 — autonomous strategic society (Phases 43–55)
  society: {
    session: import('@lib/cognitiveCouncil').CouncilSession;
    debate: import('@lib/internalDebateEngine').InternalDebateReading;
    conflict: import('@lib/councilConflictResolution').CouncilConflictReading;
    plan: import('@lib/autonomousCampaignPlanning').AutonomousCampaignPlanReading;
    arc: import('@lib/narrativeArcIntelligence').NarrativeArcIntelligenceReading;
    silenceGovernance: import('@lib/silenceRestraintGovernance').SilenceRestraintReading;
    audienceSociety: import('@lib/audienceInterpretationSociety').AudienceInterpretationReading;
    identityCourt: import('@lib/identityDefenseCourt').IdentityDefenseCourtReading;
    selfReflection: import('@lib/selfReflectionHypocrisy').SelfReflectionReading;
    consensus: import('@lib/executiveConsensusRuntime').ExecutiveConsensusReading;
    consciousness: import('@lib/autonomousStrategicConsciousness').StrategicConsciousnessReading;
  };
  // Wave 6 — cognitive civilization infrastructure (Phases 56–70)
  civilization: {
    institutionalMemory: import('@lib/institutionalMemory').InstitutionalMemoryReading;
    culturalDrift: import('@lib/culturalDriftEngine').CulturalDriftReading;
    beliefs: import('@lib/beliefPersistence').BeliefPersistenceReading;
    mythology: import('@lib/strategicMythology').StrategicMythologyReading;
    reputationEconomy: import('@lib/internalReputationEconomy').ReputationEconomyReading;
    trustAuthority: import('@lib/trustAuthorityGraph').TrustAuthorityReading;
    ideologicalMutation: import('@lib/ideologicalMutationDetection').IdeologicalMutationReading;
    scars: import('@lib/psychologicalScarMemory').ScarMemoryReading;
    decisionArchive: import('@lib/historicalDecisionArchive').DecisionArchiveReading;
    laws: import('@lib/cognitiveLawSystem').CognitiveLawReading;
    ethics: import('@lib/executiveEthicsRuntime').ExecutiveEthicsReading;
    politics: import('@lib/internalPoliticalDynamics').InternalPoliticalReading;
    longTermPlan: import('@lib/autonomousLongTermPlanning').LongTermPlanReading;
    stability: import('@lib/civilizationStabilityLayer').CivilizationStabilityReading;
    identityContinuity: import('@lib/emergentIdentityContinuity').EmergentIdentityContinuityReading;
  };
}

export interface Banner {
  id: string;
  createdAt: number;
  formula: Formula;
  campaignMode: CampaignMode | null;
  state: HumanState;
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
  imageBrief: ImageBrief;
  image: ImageResult;
  typography: TypographyPlan;
  cta: CTA;
  critique: Critique;
  // Taste layer (Phase 2)
  taste: AestheticCritique;
  psychology: VisualPsychology;
  productPresence: ProductPresence | null;
  referenceMatch: ReferenceMatch;
  finalVerdict: FinalVerdict;
  // Phase 2.5 — explicit taste system
  tasteSystem: BannerTasteSystem;
  attempts: number;
  rejectedAttempts: Array<{ stage: string; reason: string }>;
  memorySnapshot: MemorySnapshot;
}

export interface MemorySnapshot {
  totalBanners: number;
  recentStateIds: string[];
  recentLayouts: string[];
  recentHooks: string[];
  stateScores: Record<string, number>;
  layoutFatigue: Record<string, number>;
  // Campaign Memory V2 — rhythm intelligence
  pacingHistory: Array<'quiet' | 'tense' | 'interrupted' | 'collapsed' | 'wired'>;
  silenceCount: number;             // banners with restraint > 0.7
  aggressiveCount: number;          // banners with restraint < 0.4
  typographyFatigue: Record<string, number>;       // by dominance
  recurringEmotionalPatterns: Record<string, number>;  // by family
  overstimulationFlag: boolean;     // raised when too many "wired" in a row
  campaignArc: Array<{
    bannerId: string;
    family: string;
    pacing: string;
    restraint: number;
    ts: number;
  }>;
  // Phase 3 — campaign brain
  recentJobs?: string[];
  jobFatigue?: Record<string, number>;
  recentCulturalMoments?: string[];
  recentProductRoles?: string[];
  recentTypographyDominances?: string[];
  recentCourageLevels?: Array<'none' | 'restrained' | 'radical'>;
}

export interface PipelineEvent {
  ts: number;
  stage: string;
  message: string;
  data?: unknown;
}

// ───────────────────────────────────────────────────────────
// ENGINE CONTRACT
// ───────────────────────────────────────────────────────────

export interface EngineContext {
  formula: Formula;
  campaignMode: CampaignMode | null;
  bannerId: string;
  emit: (event: Omit<PipelineEvent, 'ts'>) => void;
}
