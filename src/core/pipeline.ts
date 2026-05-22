/**
 * The pipeline.
 *
 * This is the ONLY place that wires engines together. It enforces the
 * spec's mandatory order:
 *
 *   human truth → emotional tension → campaign concept → composition
 *   → image → typography → CTA → critique → rejection → export → memory
 *
 * Phase 2 adds the TASTE LAYER between generation and the rejection
 * decision. The scroll-stop critic still runs first (cheap structural
 * checks), then four taste engines weigh in (reference intelligence,
 * taste critic, visual psychology, product presence), and finally the
 * "Not Good Enough" meta-critic synthesises everything into the single
 * verdict the pipeline acts on.
 *
 * Engines never call each other. The pipeline calls them. This keeps
 * each engine swappable and lets future formulas (CALM, FOCUS) and
 * future outputs (carousels, video) inject themselves cleanly.
 */

import { randomUUID } from 'crypto';
import type {
  Banner,
  EngineContext,
  GenerateRequest,
  HumanState,
  MemorySnapshot,
  PipelineEvent,
} from './types';
import { ExhaustedAttempts } from './errors';

import { selectHumanState } from '@/engines/human-state';
import { buildHumanTruth } from '@/engines/human-truth';
import { direct } from '@/engines/creative-director';
import { planComposition } from '@/engines/composition';
import { generateImage } from '@/engines/image';
import { decideProductIntegration } from '@/engines/product-integration';
import { buildTypography } from '@/engines/typography';
import { buildCTA } from '@/engines/cta';
import { critique } from '@/engines/scroll-stop-critic';
import { createMemoryStore } from '@/engines/memory';
// Phase 2 — taste layer
import { matchReference } from '@/engines/reference-intelligence';
import { tasteCritique } from '@/engines/taste-critic';
import { analyzeVisualPsychology } from '@/engines/visual-psychology';
import { analyzeProductPresence } from '@/engines/product-presence';
import { decideFinalVerdict } from '@/engines/not-good-enough';
// Phase 2.5 — explicit taste system (lib/*)
import {
  extractDNA,
  loadReferences,
  judgeTaste,
  simulateHumanReaction,
  evolveCampaign,
  detectFatigue,
  // Phase 3 — campaign brain
  selectCulturalMoment,
  decideAssetJob,
  decideCourage,
  analyzeRhythm,
  bannerWouldWorsenRhythm,
  scanAntiAI,
  createHumanMemoryStore,
  entryFromBanner,
  // Phase 4 — reality loop
  createEngagementStore,
  createAftertasteStore,
  predictAftertaste,
  detectDrift,
  analyzeAtmosphere,
  // Phase 5 — perceptual foundation
  coresForState,
  momentsForCore,
  scoreVisualTaste,
  planVisualBehavior,
  predictEmotionalAftertaste,
  synthesiseCampaignMemoryV2,
  // Phase 7 — human perception + world continuity
  selectAtmosphericLight,
  planTypographyPsychology,
  applyTypographyPsychology,
  planWorldContinuity,
  planMicroHumanDetails,
  buildInvisibleStory,
  decideHumanInterruption,
  createObjectEmotionStore,
  extractObjectsFromBrief,
  synthesiseCampaignIdentity,
  critiquePerception,
  // Phase 8 — visual composition intelligence
  analyzeVisualGravity,
  analyzeNegativeSpace,
  analyzeCompositionRhythm,
  decideProductPresence,
  planHumanFraming,
  directLayout,
  // Phase 9 — temporal campaign cinema
  buildCampaignTimeline,
  judgeSequence,
  analyzeWorldPersistence,
  buildObjectMemoryGraph,
  analyzeSceneContinuity,
  analyzeVisualTempo,
  tempoWouldWorsen,
  decideAbsence,
  readEmotionalContradiction,
  // Phase 10 — unified cinematic brain
  analyzeUnresolvedEmotion,
  scoreEmotionalCompression,
  analyzeSubconsciousRecognition,
  detectSyntheticBehavior,
  decideCinematicVerdict,
  // Phase 11 — natural human chaos
  planLifeNoise,
  readHumanContradiction,
  readNonPerformativeReality,
  // Phase 12 — cultural memory engine
  matchSharedCulturalPattern,
  readCollectiveRecognition,
  selectUnspokenRitual,
  detectCulturalDrift,
  // Phase 13 — reality pressure
  readRealityPressure,
  readConsequence,
  readInvisibleStakes,
  readFunctionalCollapse,
  // Phase 14 — suppressed humanity
  readEmotionalAvoidance,
  readModernNumbing,
  readSocialMasking,
  readUnfeltEmotion,
  // Phase 15 — longitudinal reality memory
  createTruthPersistenceStore,
  truthPersistenceKey,
  createCulturalTimelineStore,
  verifyReality,
  readEmotionalDecay,
  readGenerationPressure,
  // Phase 16 — reality ingestion layer
  createRealityIngestionStore,
  extractHumanSignals,
  trackCollectiveDrift,
  readPrivateLanguage,
  weightReality,
  // Phase 17 — systemic human pressure model
  matchSystemicCause,
  readAttentionFragmentation,
  identifyEnvironmentalSystem,
  readRecoveryFailure,
  readCognitiveResidue,
  // Phase 18 — behavioral survival engine
  readBehaviorLoop,
  readMicroEscape,
  readCompensationRitual,
  readFakeRecovery,
  readSilentCoping,
  readBehavioralResidue,
  // Phase 19 — social masking + identity performance engine
  readSocialMaskingEngine,
  readHighFunctioningBurnout,
  readIdentityMaintenance,
  readEmotionalCamouflage,
  readPublicPrivateSplit,
  readMaskFatigue,
  // Phases 20–25 — unified human desire + ritual intelligence
  createHumanDesireMemoryStore,
  readUnifiedHumanGraph,
  // Phase 20 — desire systems
  readDesireArchitecture,
  readQuietStatus,
  readEmotionalHunger,
  readValidationSystems,
  readInvisibleEnvy,
  readAspirationalIdentityGap,
  // Phase 21 — social gravity
  readSocialGravity,
  readCollectiveEmotionalMovement,
  readCulturalAcceleration,
  readGroupAnxiety,
  readViralEmotionPatterns,
  readSocialPermissionStructures,
  // Phase 22 — ritual attachment
  readRitualFormation,
  readAttachmentLoops,
  readSymbolicSafety,
  readEmotionalReturnMechanics,
  readPrivateRitualMemory,
  readRepeatedComfortSystems,
  // Phase 23 — narrative self
  readInternalNarrative,
  readSelfStoryArchitecture,
  readIdentityContinuity,
  readPrivateMeaningSystems,
  readEmotionalSelfTranslation,
  readPersonalMythology,
  // Phase 24 — predictive human states
  readEmotionalForecasting,
  readBehaviorPrediction,
  readCollapseProbability,
  readRecoveryAttemptModel,
  readFuturePressureTrajectory,
  readEmotionalDriftPrediction,
  // Phase 25 — autonomous campaign intelligence
  readAutonomousNarrativeEngine,
  readCulturalSignalEvolution,
  readSelfUpdatingPsychology,
  readEmergentCampaignMemory,
  readCollectiveRealityTracking,
  readAdaptiveEmotionalIntelligence,
  // Phase 26 — unified cognitive field (the nervous system)
  createWorldStatePersistenceStore,
  readSymbolicObjects,
  buildCognitiveField,
  readEmotionalPhysics,
  mapTensionTopology,
  projectLifeTrajectory,
  resolveContradictions,
  buildCognitionTrace,
  evolveWorldModel,
  evolveWorldStateFromBanner,
  evolveWorldStateFromRejection,
  evolveWorldStateFromSignals,
  describeWorldState,
  recordCausalChain,
} from '@lib/index';
import type { ModuleVote } from '@lib/cognitiveContradictionResolver';
import type { CausalChainLink } from '@lib/causalMemoryGraph';
import { SEED_INGESTED_SIGNALS } from '@data/seed-ingested-signals';
import type { BannerFootprint } from '@lib/atmosphereConsistency';
import type { EmotionalCore } from '@lib/humanTruthEngine';
import type { CulturalMicroMoment } from '@lib/culturalMemory';

export interface RunOptions {
  onEvent?: (event: PipelineEvent) => void;
  /** Override the meta-critic brutality for this run. 0..1. */
  brutality?: number;
}

export interface RunResult {
  banner: Banner;
  events: PipelineEvent[];
}

export async function runPipeline(request: GenerateRequest, opts: RunOptions = {}): Promise<RunResult> {
  const bannerId = randomUUID();
  const events: PipelineEvent[] = [];
  const emit = (e: Omit<PipelineEvent, 'ts'>) => {
    const full: PipelineEvent = { ...e, ts: Date.now() };
    events.push(full);
    opts.onEvent?.(full);
  };

  const ctx: EngineContext = {
    formula: request.formula,
    campaignMode: request.campaignMode ?? null,
    bannerId,
    emit,
  };

  const memoryStore = createMemoryStore();
  let memory: MemorySnapshot = await memoryStore.read();

  // Phase 2 raises the default attempts ceiling — the meta-critic is
  // brutal, so the pipeline needs more room to converge.
  const maxAttempts = Math.max(1, Math.min(request.maxAttempts ?? 3, 5));
  let attempt = 0;
  const rejectedAttempts: Banner['rejectedAttempts'] = [];

  let stateSeed = Date.now();
  let forceStateId: string | undefined = request.forceStateId;

  // Phase 2.5 — compute the campaign-director directive once per run
  // from the memory snapshot at run start. The Creative Director reads
  // it on every attempt below.
  const evolutionAtRunStart = evolveCampaign(memory);
  emit({
    stage: 'campaign-evolution',
    message: `directive: ${evolutionAtRunStart.move} — ${evolutionAtRunStart.narrative}`,
    data: evolutionAtRunStart,
  });

  // Phase 2.5 — references load once (cached on globalThis after).
  const references = await loadReferences();
  emit({ stage: 'references', message: `loaded ${references.length} reference analyses` });

  // ─── Phase 3 — campaign brain pre-generation decisions ────────
  const jobDecision = decideAssetJob({ memory, campaignMode: ctx.campaignMode, seed: stateSeed });
  emit({
    stage: 'campaign-decision',
    message: `asset job: "${jobDecision.job}" — ${jobDecision.rationale}`,
    data: jobDecision,
  });

  const rhythmReport = analyzeRhythm(memory);
  emit({
    stage: 'campaign-rhythm',
    message: `health ${rhythmReport.healthScore.toFixed(1)}/10 · imbalanced axis: ${rhythmReport.mostImbalanced ?? 'none'}`,
    data: rhythmReport,
  });

  const humanMemoryStore = createHumanMemoryStore();
  const emotionalTrail = await humanMemoryStore.read();
  emit({ stage: 'human-memory', message: `${emotionalTrail.length} prior emotional traces` });

  // ─── Phase 4 — reality loop: drift + atmosphere readings ──────
  const engagementStore = createEngagementStore();
  const aftertasteStore = createAftertasteStore();
  const allEngagements = await engagementStore.list();
  const priorAftertaste = await aftertasteStore.read();
  // Join the engagement records with the emotional trace's banner facts
  // — those carry the typography dominance / layout / product role /
  // DNA fragments the drift detector needs.
  const bannerFacts = emotionalTrail
    .filter((e) => !!e.facts)
    .map((e) => ({
      bannerId: e.bannerId,
      typographyDominance: e.facts!.typographyDominance as any,
      layoutFamily: e.facts!.layoutFamily as any,
      productRole: e.facts!.productRole as any,
      documentary_weight: e.facts!.documentary_weight,
      realism_type: e.facts!.realism_type,
      silence_ratio: e.facts!.silence_ratio,
      shippedAt: e.createdAt,
    }));
  const driftReport = detectDrift({ engagements: allEngagements, bannerFacts });
  emit({
    stage: 'taste-drift',
    message: driftReport.active.length === 0
      ? 'no drift yet — audience signal too thin'
      : `${driftReport.active.length} drift signals active; guard ${driftReport.diversityGuardEngaged ? 'ENGAGED' : 'idle'}`,
    data: driftReport,
  });

  // ─── Phase 5 — campaign memory v2 synthesised once per run ────
  const campaignMemoryV2 = synthesiseCampaignMemoryV2({
    trail: emotionalTrail,
    aftertaste: priorAftertaste,
    rhythm: rhythmReport,
  });

  // ─── Phase 7 — load object motifs + synthesise campaign identity
  const objectEmotionStore = createObjectEmotionStore();
  const motifs = await objectEmotionStore.list();
  const campaignIdentity = synthesiseCampaignIdentity({
    trail: emotionalTrail,
    campaignMemoryV2,
    motifs,
  });
  emit({
    stage: 'campaign-identity',
    message: campaignIdentity.directorNote,
    data: { recognisability: campaignIdentity.recognisability, motifs: campaignIdentity.objectMotifs.slice(0, 3) },
  });

  // ─── Phase 9 — campaign timeline + world DNA + object graph + tempo
  const campaignTimeline = buildCampaignTimeline(emotionalTrail);
  emit({ stage: 'campaign-timeline', message: campaignTimeline.directorRead });

  // Build per-banner light history from the trail's facts (none persisted
  // directly; we derive a stand-in by mapping the family to a typical
  // light family using the same heuristics atmosphericLight uses).
  const recentLightBehaviors = emotionalTrail.slice(0, 8).map((t) => ({
    behavior: inferLightBehaviorFromTrail(t),
    ts: t.createdAt,
  }));
  const worldPersistence = analyzeWorldPersistence({
    trail: emotionalTrail,
    recentLightBehaviors,
    motifs,
  });
  emit({
    stage: 'world-persistence',
    message: worldPersistence.worldFeelsLivedIn
      ? `world lived in: ${worldPersistence.dna_signature.objectScars.slice(0, 3).map((o) => o.objectId).join(', ')}`
      : 'world still forming',
    data: { evolve: worldPersistence.whatShouldEvolve, stay: worldPersistence.whatShouldStay },
  });

  const objectMemoryGraph = buildObjectMemoryGraph({ trail: emotionalTrail, motifs });
  if (objectMemoryGraph.loudest) {
    emit({
      stage: 'object-memory-graph',
      message: `loudest object: "${objectMemoryGraph.loudest.objectId}" (weight ${objectMemoryGraph.loudest.emotionalWeight.toFixed(1)})`,
    });
  }

  const visualTempo = analyzeVisualTempo({ trail: emotionalTrail });
  emit({
    stage: 'visual-tempo',
    message: visualTempo.needs_breath_next ? 'needs breath next' : 'tempo healthy',
    data: visualTempo.axes,
  });

  // ─── Phase 16 — reality ingestion (campaign-level) ────────────
  const ingestionStore = createRealityIngestionStore(undefined, SEED_INGESTED_SIGNALS);
  const ingestedSignals = await ingestionStore.read();
  const humanSignalExtraction = extractHumanSignals(ingestedSignals);
  const collectiveDriftReport = trackCollectiveDrift(ingestedSignals);
  if (ingestedSignals.length > 0) {
    emit({
      stage: 'reality-ingestion',
      message: `${ingestedSignals.length} observed signals · ${humanSignalExtraction.private_truth_markers.length} private-truth markers · ${humanSignalExtraction.coping_behaviors.length} coping behaviours`,
      data: { drift: collectiveDriftReport.director_read },
    });
  }

  // ─── Phases 20–25 — unified human desire memory (campaign-level) ─
  const humanDesireStore = createHumanDesireMemoryStore();
  const desireEntriesAtRunStart = await humanDesireStore.list();

  // ─── Phase 26 — unified cognitive field: load the persistent
  // world-state and causal graph the last run left behind. ─────────
  const worldStateStore = createWorldStatePersistenceStore();
  const worldStateBook = await worldStateStore.read();
  let worldState = worldStateBook.worldState;
  const causalGraph = worldStateBook.causalGraph;
  emit({
    stage: 'world-state',
    message: `loaded — gen ${worldState.generationCount}, ${describeWorldState(worldState)}`,
  });
  // Reality signals also move the world-state weather.
  worldState = evolveWorldStateFromSignals(worldState, ingestedSignals.length);

  // ─── Phase 15 — longitudinal reality reads (campaign-level) ───
  const truthPersistenceStore = createTruthPersistenceStore();
  const culturalTimelineStore = createCulturalTimelineStore();
  const culturalTimelineReport = await culturalTimelineStore.report();
  if (culturalTimelineReport.buckets.length > 0) {
    emit({
      stage: 'cultural-timeline',
      message: culturalTimelineReport.current_drift,
      data: { phases: culturalTimelineReport.phases.length, buckets: culturalTimelineReport.buckets.length },
    });
  }
  const recentLightBehaviors15 = emotionalTrail.slice(0, 6).map((t) => inferLightBehaviorFromTrail(t));
  const recentLayouts15 = emotionalTrail.slice(0, 6).map((t) => t.facts?.layoutFamily ?? '').filter(Boolean) as string[];
  const recentDominances15 = emotionalTrail.slice(0, 6).map((t) => t.facts?.typographyDominance ?? '').filter(Boolean) as string[];
  const generationPressureReading = readGenerationPressure({
    trail: emotionalTrail,
    motifs,
    recentAftertaste: priorAftertaste,
    recentLightBehaviors: recentLightBehaviors15,
    recentLayouts: recentLayouts15,
    recentDominances: recentDominances15,
  });
  if (generationPressureReading.pressure_score >= 4 || generationPressureReading.force_disruption) {
    emit({
      stage: 'generation-pressure',
      message: generationPressureReading.force_disruption
        ? `FORCE DISRUPTION (${generationPressureReading.pressure_score.toFixed(1)}/10) — ${generationPressureReading.disruption_directives[0] ?? ''}`
        : `pressure ${generationPressureReading.pressure_score.toFixed(1)}/10`,
      data: generationPressureReading.axes,
    });
  }

  // ─── Phase 10 — unified cinematic brain (campaign-level signals)
  const unresolvedReport = analyzeUnresolvedEmotion({
    trail: emotionalTrail,
    timeline: campaignTimeline,
  });
  emit({
    stage: 'unresolved-emotion',
    message: unresolvedReport.unfinished_sentence,
    data: { signals: unresolvedReport.signals.length, most_active: unresolvedReport.most_active?.kind },
  });

  const subconsciousRecognition = analyzeSubconsciousRecognition({
    trail: emotionalTrail,
    worldDNA: worldPersistence.dna_signature,
    objectGraph: objectMemoryGraph,
    timeline: campaignTimeline,
  });
  emit({
    stage: 'subconscious-recognition',
    message: subconsciousRecognition.recognisable_without_logo
      ? `recognisable without a logo — ${subconsciousRecognition.recognition_score.toFixed(1)}/10`
      : `forming recognition — ${subconsciousRecognition.recognition_score.toFixed(1)}/10`,
    data: { patterns: subconsciousRecognition.patterns.length, missing: subconsciousRecognition.missing_signatures },
  });
  emit({
    stage: 'campaign-memory-v2',
    message: campaignMemoryV2.directorNote,
    data: {
      coresCovered: campaignMemoryV2.coresCovered.slice(0, 3),
      coresMissing: campaignMemoryV2.coresMissing.length,
      saturation: campaignMemoryV2.saturationScore,
      atmosphereAtRisk: campaignMemoryV2.atmosphereAtRisk,
    },
  });

  while (attempt < maxAttempts) {
    attempt += 1;

    const state: HumanState = selectHumanState({ ctx, memory, forceStateId, seed: stateSeed });
    const truth = await buildHumanTruth({ ctx, state });

    // ─── Per-attempt campaign-brain decisions ────────────────────
    const culturalMoment = selectCulturalMoment({ state, memory, seed: stateSeed + attempt });
    emit({
      stage: 'cultural-intelligence',
      message: `moment: "${culturalMoment.id}" — ${culturalMoment.reading}`,
      data: { forbidden: culturalMoment.forbiddenPatterns },
    });

    const courage = decideCourage({ state, job: jobDecision.job, culturalMoment: culturalMoment.id, memory, seed: stateSeed + attempt });
    emit({
      stage: 'visual-courage',
      message: `${courage.level} — ${courage.reason}`,
      data: courage.overrides,
    });

    const direction = await direct({
      ctx, truth, campaignMode: ctx.campaignMode, memory,
      evolution: evolutionAtRunStart,
      job: jobDecision,
      courage,
      rhythm: rhythmReport,
      culturalMoment,
    });
    const composition = planComposition({ ctx, direction });
    decideProductIntegration({ ctx, direction });

    // Image-level inner loop (max 2 image regens before bumping to concept).
    let imageAttempts = 0;
    while (true) {
      imageAttempts += 1;
      const { brief, image } = await generateImage({ ctx, truth, direction, composition });

      const typography = await buildTypography({ ctx, truth, direction });
      const cta = buildCTA({ ctx, direction, composition, seed: stateSeed + imageAttempts });

      // ─── Critic stack ──────────────────────────────────────────
      const scrollStop = await critique({
        ctx, truth, direction, composition,
        imageBrief: brief, image, typography, cta,
      });

      const reference = matchReference({ ctx, truth, direction, composition, typography });
      const taste = await tasteCritique({ ctx, truth, direction, composition, typography, image });
      const psychology = analyzeVisualPsychology({ ctx, direction, composition, typography });
      const productPresence = analyzeProductPresence({ ctx, truth, direction, composition, brief, image });

      // ─── Phase 2.5 — explicit taste system ────────────────────
      const dna = extractDNA({ direction, composition, typography, truth, brief, imageProvider: image.provider });
      const judge = judgeTaste({ truth, direction, composition, typography, image, bannerDNA: dna, references });
      emit({
        stage: 'taste-judge',
        message: `verdict: ${judge.verdict} · composite ${judge.composite.toFixed(1)} · nearest "${judge.closestCategory ?? 'none'}" (${judge.closestDistance.toFixed(2)})`,
        data: { rewards: judge.rewards, punishments: judge.punishments },
      });
      const reaction = simulateHumanReaction({ truth, direction, bannerDNA: dna, taste: judge });
      emit({
        stage: 'human-reaction',
        message: `${reaction.at_0_3s} → ${reaction.at_1s} → ${reaction.at_3s} (engagement ${reaction.engagementQuality.toFixed(1)})`,
        data: { arc: reaction.arc, scrollPast: reaction.scrollPast },
      });
      const fatigue = detectFatigue({
        banner: { direction, state, typography, hook: direction.hook },
        memory,
      });
      emit({
        stage: 'visual-fatigue',
        message: `${fatigue.verdict} · totals ${fatigue.totals.toFixed(1)}`,
        data: { flags: fatigue.flags, scores: fatigue.scores },
      });

      // ─── Phase 3 — anti-AI scan + rhythm-worsen check ────────
      const antiAI = scanAntiAI({ direction, typography, bannerDNA: dna, truth, memory, imageProvider: image.provider });
      emit({
        stage: 'anti-ai',
        message: `smell ${antiAI.smell.toFixed(1)} · signatures [${antiAI.signatures.join(', ') || 'none'}] · drift [${antiAI.driftSignatures.join(', ') || 'none'}]`,
        data: { notes: antiAI.notes, pushAwayFrom: antiAI.pushAwayFrom },
      });

      const rhythmWorsen = bannerWouldWorsenRhythm(rhythmReport, { direction, job: jobDecision.job });
      if (rhythmWorsen.worsens) {
        emit({
          stage: 'campaign-rhythm',
          message: `would worsen rhythm: ${rhythmWorsen.reason}`,
          data: rhythmWorsen,
        });
      }

      // ─── Phase 5 — perceptual layer ───────────────────────────
      const cores = coresForState(state.id);
      const emotionalCore: EmotionalCore | null = cores[0] ?? null;
      const candidateMoments = emotionalCore ? momentsForCore(emotionalCore.id) : [];
      const culturalMicroMoment: CulturalMicroMoment | null =
        candidateMoments[(stateSeed + attempt) % Math.max(candidateMoments.length, 1)] ?? null;
      emit({
        stage: 'emotional-core',
        message: emotionalCore ? `core: ${emotionalCore.id} — "${emotionalCore.silent_sentence}"` : 'no emotional core mapped',
      });
      if (culturalMicroMoment) {
        emit({
          stage: 'cultural-micro-moment',
          message: `moment: ${culturalMicroMoment.state_id} — ${culturalMicroMoment.environment}`,
        });
      }

      const imperfectionPlan = planVisualBehavior({
        formula: ctx.formula,
        plan: composition,
        direction,
        state,
        emotionalCore,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'human-visual-behavior',
        message: `${imperfectionPlan.behaviors.join(', ')} — ${imperfectionPlan.motivation}`,
      });

      const visualTaste = scoreVisualTaste({
        direction, typography, bannerDNA: dna,
        truth: { truth: truth.truth, tension: truth.tension },
        timeAnchor: state.timeAnchor,
        imageProvider: image.provider,
        emotionalCore,
        referenceCloseness: reference.closeness,
        atmosphereConsistency: null, // computed alongside aftertaste below
      });
      emit({
        stage: 'visual-taste',
        message: `score ${visualTaste.score.toFixed(1)}/10 · AI prob ${(visualTaste.ai_detection_probability * 100).toFixed(0)}% · ${visualTaste.rejection_reason ?? 'cleared'}`,
        data: { forbidden: visualTaste.forbiddenPatternsHit.map((p) => p.id) },
      });

      const emotionalAftertaste = predictEmotionalAftertaste({
        bannerDNA: dna,
        reactionAt3s: reaction.at_3s,
        tensionPhrase: truth.tension,
        truthText: truth.truth,
        emotionalCore,
      });
      emit({
        stage: 'emotional-aftertaste',
        message: `composite ${emotionalAftertaste.composite.toFixed(1)} — ${emotionalAftertaste.post_view_emotional_state}`,
      });

      // ─── Phase 7 — perception + world continuity layer ───────
      const atmosphericLight = selectAtmosphericLight({
        state, emotionalCore,
        microMomentId: culturalMicroMoment?.state_id ?? null,
      });
      emit({ stage: 'atmospheric-light', message: `${atmosphericLight.behavior} — ${atmosphericLight.psychological_meaning}` });

      const worldContinuity = planWorldContinuity({
        state, emotionalCore,
        microMoment: culturalMicroMoment,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'world-continuity',
        message: `${worldContinuity.artifacts.length} artifacts: ${worldContinuity.artifacts.map((a) => a.id).join(', ')}`,
      });

      const microHumanDetails = planMicroHumanDetails({
        state, emotionalCore,
        seed: stateSeed + attempt,
      });
      emit({ stage: 'micro-human-details', message: microHumanDetails.details.join(', ') });

      const invisibleStory = buildInvisibleStory({
        state, emotionalCore,
        microMoment: culturalMicroMoment,
      });
      emit({ stage: 'invisible-story', message: `before: ${invisibleStory.ten_minutes_before.slice(0, 70)}…` });

      const humanInterruption = decideHumanInterruption({
        job: jobDecision.job,
        emotionalCore,
        direction,
      });
      emit({
        stage: 'human-interruption',
        message: `${humanInterruption.intensity} (vis ${humanInterruption.visibility}/10) — ${humanInterruption.reasoning}`,
      });

      const typographyPsychology = planTypographyPsychology({
        state, emotionalCore, direction, typography, composition,
      });
      emit({
        stage: 'typography-psychology',
        message: `${typographyPsychology.posture} — ${typographyPsychology.psychological_meaning}`,
      });

      const perceptionCriticVerdict = critiquePerception({
        truth, direction, typography, bannerDNA: dna,
        emotionalCore, emotionalAftertaste,
        visualTaste, tasteJudge: judge,
        worldContinuity, microDetails: microHumanDetails, invisibleStory,
        hasCulturalGrounding: !!culturalMicroMoment,
      });
      emit({
        stage: 'perception-critic',
        message: `${perceptionCriticVerdict.verdict} — silent-recognition ${perceptionCriticVerdict.silent_emotional_recognition.toFixed(1)}/10` + (perceptionCriticVerdict.rejection_reason ? ` — ${perceptionCriticVerdict.rejection_reason}` : ''),
        data: { notes: perceptionCriticVerdict.notes },
      });

      // ─── Phase 8 — visual composition intelligence ─────────────
      const gravity = analyzeVisualGravity({ direction, composition, typography });
      emit({
        stage: 'visual-gravity',
        message: `composite ${gravity.composite.toFixed(1)} · focal-dominance ${gravity.focal_dominance.toFixed(1)} · competing ${gravity.competing_anchors.toFixed(1)}` + (gravity.rejection_reason ? ` — ${gravity.rejection_reason}` : ''),
      });

      const negativeSpace = analyzeNegativeSpace({ formula: ctx.formula, direction, composition });
      emit({
        stage: 'negative-space',
        message: `${negativeSpace.prescribed_behavior} · tension ${negativeSpace.space_tension_score.toFixed(1)}/10` + (negativeSpace.rejection_reason ? ` — ${negativeSpace.rejection_reason}` : ''),
      });

      const compositionRhythm8 = analyzeCompositionRhythm({
        trail: emotionalTrail,
        memory,
        candidate: {
          layoutFamily: direction.layoutFamily,
          focalPoint: direction.focalPoint,
          productRole: direction.productRole,
          typographyDominance: direction.typographyDominance,
          negativeSpaceBias: composition.negativeSpaceBias,
        },
      });
      emit({
        stage: 'composition-rhythm',
        message: compositionRhythm8.would_repeat
          ? `would repeat: ${compositionRhythm8.repeated_pattern} — suggested: ${compositionRhythm8.suggested_correction ?? '—'}`
          : 'spatial rhythm healthy',
      });

      const productMotifs = await objectEmotionStore.list();
      const rhythmSaysReduceProduct = !!rhythmReport.axes.find(
        (a) => a.axis === 'product-vs-no-product' && a.bias > 0.4,
      );
      const productPresence8 = decideProductPresence({
        emotionalCore,
        job: jobDecision.job,
        direction,
        interruption: humanInterruption,
        motifs: productMotifs,
        rhythmSaysReduceProduct,
        campaignBannerIndex: emotionalTrail.length,
      });
      emit({
        stage: 'product-presence-v2',
        message: `mode: ${productPresence8.mode} — ${productPresence8.reasoning}`,
      });

      const framing8 = planHumanFraming({
        direction,
        emotionalCore,
        restraint: direction.restraint,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'human-framing',
        message: `${framing8.camera_distance} · ${framing8.behaviors.join(', ')}`,
      });

      const directorVerdict = directLayout({
        formula: ctx.formula,
        direction, composition, emotionalCore,
        gravity, negativeSpace, rhythm: compositionRhythm8,
        presence: productPresence8, framing: framing8,
        campaignIdentity, recentAftertaste: priorAftertaste,
      });
      emit({
        stage: 'layout-director',
        message: directorVerdict.director_note,
        data: {
          archetype: directorVerdict.composition_archetype,
          would_subtract: directorVerdict.would_improve_with_subtraction,
          subtract_target: directorVerdict.subtraction_target,
          rejections: directorVerdict.rejection_conditions,
        },
      });

      // ─── Phase 9 — temporal cognition per candidate banner ─────
      const candidateNote = inferCandidateNote(reaction.at_3s, state.family);
      const sequenceVerdict = judgeSequence({
        timeline: campaignTimeline,
        candidate_note: candidateNote,
      });
      emit({
        stage: 'emotional-sequence',
        message: sequenceVerdict.redundant_with_previous
          ? `REDUNDANT — candidate "${candidateNote}" repeats previous`
          : sequenceVerdict.advances_arc
            ? `advances arc → "${candidateNote}"`
            : `flat — "${candidateNote}" does not advance the arc`,
      });

      const candidateApartmentKind = culturalMicroMoment?.state_id
        ? APARTMENT_KIND_MAP[culturalMicroMoment.state_id] ?? null
        : null;
      const sceneContinuityReport = analyzeSceneContinuity({
        trail: emotionalTrail,
        worldDNA: worldPersistence.dna_signature,
        objectGraph: objectMemoryGraph,
        candidate: {
          apartmentKind: candidateApartmentKind,
          lightBehavior: atmosphericLight.behavior,
          family: state.family,
          objectIds: extractObjectsFromBrief(brief.scene, worldContinuity.artifacts.map((a) => a.description)),
          isQuiet: direction.typographyDominance === 'whisper' || direction.typographyDominance === 'absent',
        },
        bannerIndex: emotionalTrail.length,
      });
      emit({
        stage: 'scene-continuity',
        message: sceneContinuityReport.invisible_context.slice(0, 120),
      });

      const tempoWorsen = tempoWouldWorsen(visualTempo, {
        typographyDominance: direction.typographyDominance,
        productRole: direction.productRole,
        restraint: direction.restraint,
      });
      if (tempoWorsen.worsens) {
        emit({ stage: 'visual-tempo', message: `would worsen ${tempoWorsen.axis} — ${tempoWorsen.reason}` });
      }

      const absenceDecision = decideAbsence({
        emotionalCore,
        microMoment: culturalMicroMoment,
        tempo: visualTempo,
        timeline: campaignTimeline,
        bannerIndex: emotionalTrail.length,
        jobId: jobDecision.job,
      });
      emit({
        stage: 'absence-intelligence',
        message: `curiosity ${absenceDecision.curiosity_score.toFixed(1)}/10 — ${absenceDecision.reasoning[0] ?? '—'}`,
        data: { drop_copy: absenceDecision.drop_copy, drop_cta: absenceDecision.drop_cta, drop_product: absenceDecision.drop_product },
      });

      const contradictionReading = readEmotionalContradiction({ truth, emotionalCore });
      emit({
        stage: 'emotional-contradiction',
        message: contradictionReading.the_contradiction
          ? `"${contradictionReading.the_contradiction.name}" — depth ${contradictionReading.depth.toFixed(1)}/10`
          : 'no named contradiction',
      });

      // ─── Phase 10 — per-banner cinematic signals ──────────────
      const compressionReading = scoreEmotionalCompression({
        truth, direction, typography, emotionalCore,
        worldContinuity,
      });
      emit({
        stage: 'emotional-compression',
        message: `score ${compressionReading.score.toFixed(1)}/10 · ratio ${compressionReading.compression_ratio.toFixed(2)} · implied ${compressionReading.implied_emotions.length} / shown ${compressionReading.shown_emotions.length}`,
      });

      const syntheticReading = detectSyntheticBehavior({
        direction, composition, typography, dna,
        framing: framing8, worldContinuity, gravity,
        truthLength: truth.truth.length,
      });
      emit({
        stage: 'anti-synthetic',
        message: syntheticReading.reads_as_designed
          ? `reads as designed — ${syntheticReading.signatures.join(', ')}`
          : `observed (${syntheticReading.rewards.length} imperfection signals)`,
        data: { score: syntheticReading.synthetic_score, signatures: syntheticReading.signatures },
      });

      const cinematicVerdict = decideCinematicVerdict({
        trail: emotionalTrail,
        timeline: campaignTimeline,
        unresolved: unresolvedReport,
        worldDNA: worldPersistence.dna_signature,
        objectGraph: objectMemoryGraph,
        campaignIdentity,
        subconsciousRecognition,
        tempo: visualTempo,
        candidateAftertaste: emotionalAftertaste,
        candidateContradiction: contradictionReading,
        candidateCompression: compressionReading,
        candidateSynthetic: syntheticReading,
        candidateNote,
      });
      emit({
        stage: 'cinematic-brain',
        message: cinematicVerdict.director_voice,
        data: {
          thesis: cinematicVerdict.campaign_emotional_thesis,
          trajectory: cinematicVerdict.emotional_trajectory,
          three_second_pass: cinematicVerdict.three_second_test.passes,
          aligned: cinematicVerdict.candidate_alignment.serves_thesis,
        },
      });

      // ─── Phase 11 — natural human chaos ───────────────────────
      const lifeNoise = planLifeNoise({ state, seed: stateSeed + attempt });
      emit({
        stage: 'life-noise',
        message: `${lifeNoise.fragments.length} non-symbolic fragments · mess ${lifeNoise.mess_score.toFixed(1)}/10`,
      });

      const humanContradiction = readHumanContradiction({
        state, emotionalCore, truthText: truth.truth,
      });
      emit({
        stage: 'human-contradiction',
        message: humanContradiction.pair
          ? `${humanContradiction.pair.feeling} → ${humanContradiction.pair.behavior} (recognition ${humanContradiction.recognition_score.toFixed(1)}/10)`
          : 'no behavioral contradiction mapped',
      });

      const nonPerformative = readNonPerformativeReality({
        direction, typography, dna,
        atmosphericLight,
        aftertaste: emotionalAftertaste,
        contradiction: humanContradiction,
        truthText: truth.truth,
        poeticOverloadHint: syntheticReading.synthetic_score,
      });
      emit({
        stage: 'non-performative-reality',
        message: nonPerformative.trying_to_simulate
          ? `WARNING simulating depth — ${nonPerformative.patterns.join(', ')}`
          : nonPerformative.feels_like_happened
            ? 'feels like a moment that happened'
            : `mild performance risk (${nonPerformative.performativeness_score.toFixed(1)}/10)`,
        data: { rewards: nonPerformative.rewards },
      });

      // ─── Phase 12 — cultural memory engine ────────────────────
      const sharedPatternMatch = matchSharedCulturalPattern({ state, emotionalCore });
      emit({
        stage: 'shared-cultural-pattern',
        message: sharedPatternMatch.pattern
          ? `pattern: "${sharedPatternMatch.pattern.named_tension}" (strength ${sharedPatternMatch.strength})`
          : 'no shared cultural pattern matched',
      });
      const collectiveRecognition = readCollectiveRecognition({
        truth, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        pattern_strength: sharedPatternMatch.strength,
      });
      emit({
        stage: 'collective-recognition',
        message: collectiveRecognition.is_collective
          ? `collective — recognition ${collectiveRecognition.recognition_score.toFixed(1)}/10`
          : collectiveRecognition.is_individual_only
            ? `reads as one specific person — ${collectiveRecognition.recognition_score.toFixed(1)}/10`
            : `forming recognition (${collectiveRecognition.recognition_score.toFixed(1)}/10)`,
      });
      const unspokenRitualPick = selectUnspokenRitual({
        state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        seed: stateSeed + attempt,
      });
      if (unspokenRitualPick.ritual) {
        emit({
          stage: 'unspoken-ritual',
          message: `${unspokenRitualPick.ritual.id} — ${unspokenRitualPick.ritual.observable_action}`,
        });
      }
      const culturalDriftReading = detectCulturalDrift({
        direction,
        emotionalCore,
        pattern: sharedPatternMatch.pattern,
        atmosphericLight,
        truthText: truth.truth,
      });
      emit({
        stage: 'cultural-drift',
        message: culturalDriftReading.feels_culturally_consumed
          ? `culturally consumed: ${culturalDriftReading.detected_cliches.join(', ')}`
          : `no drift — saturation ${culturalDriftReading.saturation_score.toFixed(1)}/10`,
      });

      // ─── Phase 13 — reality pressure ──────────────────────────
      const realityPressureReading = readRealityPressure({
        truth, state, emotionalCore,
      });
      emit({
        stage: 'reality-pressure',
        message: `specificity ${realityPressureReading.pressure_specificity.toFixed(1)}/10 · signals: ${realityPressureReading.signals.map((s) => s.type).join(', ') || 'none'}` + (realityPressureReading.reads_generic ? ' · GENERIC' : ''),
      });
      const consequenceReading = readConsequence({
        truth, state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        pressure: realityPressureReading,
      });
      emit({
        stage: 'consequence',
        message: consequenceReading.has_stakes
          ? `stakes ${consequenceReading.stakes_clarity.toFixed(1)}/10 — "${consequenceReading.stakes_phrase.slice(0, 100)}…"`
          : `decorative emotion — no stakes`,
      });
      const invisibleStakesReading = readInvisibleStakes({
        state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        ritual: unspokenRitualPick.ritual,
      });
      emit({
        stage: 'invisible-stakes',
        message: invisibleStakesReading.compulsion
          ? `${invisibleStakesReading.compulsion.id} — "${invisibleStakesReading.compulsion.daily_cost.slice(0, 80)}"`
          : 'no modern compulsion mapped',
      });
      const functionalCollapseReading = readFunctionalCollapse({
        state, truth, direction, emotionalCore, atmosphericLight,
      });
      emit({
        stage: 'functional-collapse',
        message: `${functionalCollapseReading.type} (functional ${functionalCollapseReading.functional_collapse_score.toFixed(1)}, accidentally-true ${functionalCollapseReading.accidentally_true_score.toFixed(1)}) — ${functionalCollapseReading.directorNote}`,
      });

      // ─── Phase 14 — suppressed humanity ───────────────────────
      const avoidanceReading = readEmotionalAvoidance({ state, truth, emotionalCore });
      emit({
        stage: 'emotional-avoidance',
        message: avoidanceReading.pattern
          ? `${avoidanceReading.pattern.id} — replacement: "${avoidanceReading.pattern.replacement_behavior}"` + (avoidanceReading.feeling_named_directly ? ' · WARNING: truth names feeling directly' : '')
          : 'no avoidance pattern matched',
      });
      const numbingReading = readModernNumbing({ state, emotionalCore });
      emit({
        stage: 'modern-numbing',
        message: numbingReading.pattern
          ? `${numbingReading.pattern.id} — preventing "${numbingReading.pattern.what_it_prevents}"`
          : 'no modern numbing detected',
      });
      const maskingReading = readSocialMasking({ truth, state, emotionalCore });
      emit({
        stage: 'social-masking',
        message: maskingReading.is_mask_present
          ? `surface ${maskingReading.surface_coherence_score.toFixed(1)} · fracture ${maskingReading.internal_fracture_score.toFixed(1)} · gap ${maskingReading.mask_gap.toFixed(1)}`
          : 'no mask present — surface and internal aligned',
      });
      const unfeltReading = readUnfeltEmotion({ truth, emotionalCore });
      emit({
        stage: 'unfelt-emotion',
        message: unfeltReading.reads_as_therapy_content
          ? `WARNING therapy content — ${unfeltReading.therapy_signatures.join(', ')}`
          : unfeltReading.viewer_realizes_before_character
            ? 'viewer realises before the character — accidentally revealed'
            : `character self-awareness ${unfeltReading.character_self_awareness.toFixed(1)}/10`,
      });
      // ───────────────────────────────────────────────────────────

      // ─── Phase 15 — per-banner longitudinal reads ─────────────
      const candidateTruthKey = (truth.tension?.trim().toLowerCase() || emotionalCore?.id || 'untracked');
      const truthPersistenceReport = await truthPersistenceStore.report(candidateTruthKey);
      emit({
        stage: 'truth-persistence',
        message: truthPersistenceReport.candidate_touches_persistent
          ? `persistent truth (×${truthPersistenceReport.candidate_entry!.count}) · durability ${truthPersistenceReport.durability_score.toFixed(1)}/10`
          : truthPersistenceReport.persistent.length > 0
            ? `new truth — campaign has ${truthPersistenceReport.persistent.length} persistent truths so far`
            : 'no persistent truths yet',
      });

      // Reality verification — read engagement for THIS banner if any
      // signals have arrived. New banners have none; the persistence
      // store contributes the historical signal.
      const candidateEngagement = await engagementStore.get(bannerId);
      const realityVerificationReading = verifyReality({
        engagement: candidateEngagement,
      });
      if (realityVerificationReading.confirmation_strength > 0) {
        emit({
          stage: 'reality-verification',
          message: realityVerificationReading.reality_confirmed
            ? `reality confirmed (${realityVerificationReading.confirmation_strength.toFixed(1)}/10) — ${realityVerificationReading.recognition_signals[0] ?? ''}`
            : `partial confirmation (${realityVerificationReading.confirmation_strength.toFixed(1)}/10)`,
        });
      }

      const emotionalDecayReading = readEmotionalDecay({
        persistenceEntry: truthPersistenceReport.candidate_entry,
        truthAftertasteRecords: priorAftertaste
          .filter((r) => {
            const matched = emotionalTrail.find((e) => e.bannerId === r.bannerId);
            if (!matched) return false;
            const matchedKey = (matched.tension?.trim().toLowerCase() || candidateTruthKey);
            return matchedKey === candidateTruthKey;
          }),
        culturalDrift: culturalDriftReading,
        truthText: truth.truth,
      });
      emit({
        stage: 'emotional-decay',
        message: emotionalDecayReading.status === 'decorative'
          ? `DECORATIVE${emotionalDecayReading.decorative_mode ? ` (${emotionalDecayReading.decorative_mode})` : ''} — truth has become aesthetic recognition`
          : emotionalDecayReading.status === 'aging'
            ? `aging (${emotionalDecayReading.decay_score.toFixed(1)}/10)`
            : 'fresh',
      });

      // ─── Phase 16 — per-banner reality reads ──────────────────
      const privateLanguageReading = readPrivateLanguage({
        truthText: truth.truth,
        tensionText: truth.tension,
        extraction: humanSignalExtraction,
      });
      emit({
        stage: 'private-language',
        message: privateLanguageReading.is_unguarded
          ? `unguarded register (${privateLanguageReading.private_language_score.toFixed(1)}/10) — matched: ${privateLanguageReading.matched_private_phrases.slice(0, 2).join('; ') || 'none'}`
          : privateLanguageReading.performative_signatures.length > 0
            ? `WARNING performative — ${privateLanguageReading.performative_signatures.join(', ')}`
            : `register ${privateLanguageReading.private_language_score.toFixed(1)}/10`,
      });

      const realityWeightingReading = weightReality({
        truthText: truth.truth,
        tensionText: truth.tension,
        ingestedSignals,
      });
      emit({
        stage: 'reality-weighting',
        message: realityWeightingReading.generated_from_aesthetics_only
          ? `WARNING generated from aesthetics — no deep signal resonates`
          : `discovered from reality ${realityWeightingReading.discovered_from_reality_score.toFixed(1)}/10 · ${realityWeightingReading.resonating_signals.length} signals resonate`,
      });

      // ─── Phase 17 — systemic pressure model ───────────────────
      const systemicCauseReading = matchSystemicCause({ state, truth, emotionalCore });
      emit({
        stage: 'systemic-cause',
        message: systemicCauseReading.has_systemic_cause
          ? `caused by: ${systemicCauseReading.matched_systems.primary!.id} (clarity ${systemicCauseReading.causal_clarity.toFixed(1)}/10)`
          : `no systemic cause matched — banner is feeling without machinery`,
      });
      const attentionFragmentationReading = readAttentionFragmentation({
        state, truth, emotionalCore, microMoment: culturalMicroMoment,
      });
      if (attentionFragmentationReading.patterns_detected.length > 0) {
        emit({
          stage: 'attention-fragmentation',
          message: `${attentionFragmentationReading.attention_fragmentation_score.toFixed(1)}/10 · ${attentionFragmentationReading.patterns_detected.map((p) => p.id).join(', ')}`,
        });
      }
      const environmentalSystemReading = identifyEnvironmentalSystem({
        state, microMoment: culturalMicroMoment,
        atmosphericLightBehavior: atmosphericLight.behavior,
      });
      if (environmentalSystemReading.primary) {
        emit({
          stage: 'environmental-machine',
          message: `${environmentalSystemReading.primary.id} — ${environmentalSystemReading.primary.what_it_replaces}`,
        });
      }
      const recoveryFailureReading = readRecoveryFailure({
        state, truth, emotionalCore, microMoment: culturalMicroMoment,
      });
      if (recoveryFailureReading.primary_failure) {
        emit({
          stage: 'recovery-failure',
          message: `${recoveryFailureReading.primary_failure.id} (${recoveryFailureReading.recovery_failure_score.toFixed(1)}/10)${recoveryFailureReading.rest_is_not_rest ? ' — REST IS NOT REST' : ''}`,
        });
      }
      const cognitiveResidueReading = readCognitiveResidue({
        state, truth, emotionalCore, worldContinuity,
      });
      if (cognitiveResidueReading.detected.length > 0) {
        emit({
          stage: 'cognitive-residue',
          message: `load ${cognitiveResidueReading.residue_load.toFixed(1)}/10 · ${cognitiveResidueReading.detected.map((r) => r.id).join(', ')}`,
        });
      }
      // ───────────────────────────────────────────────────────────

      // ─── Phase 18 — behavioral survival engine ────────────────
      const behaviorLoopReading = readBehaviorLoop({ state, truth, emotionalCore });
      if (behaviorLoopReading.primary_loop) {
        emit({
          stage: 'behavior-loop',
          message: `${behaviorLoopReading.primary_loop.id} (${behaviorLoopReading.primary_loop.classification}) — strength ${behaviorLoopReading.loop_signature_strength.toFixed(1)}/10${behaviorLoopReading.is_automatic ? ' — AUTOMATIC' : ''}`,
        });
      }
      const microEscapeReading = readMicroEscape({
        state, truth, emotionalCore, microMoment: culturalMicroMoment,
      });
      if (microEscapeReading.primary) {
        emit({
          stage: 'micro-escape',
          message: `${microEscapeReading.primary.id} — "${microEscapeReading.primary.recognition_phrase}" (${microEscapeReading.micro_escape_score.toFixed(1)}/10)${microEscapeReading.in_the_act ? ' — IN THE ACT' : ''}`,
        });
      }
      const ritualCompensationReading = readCompensationRitual({ state, truth, emotionalCore });
      if (ritualCompensationReading.primary) {
        emit({
          stage: 'ritual-compensation',
          message: `${ritualCompensationReading.primary.id} replaces "${ritualCompensationReading.primary.what_it_replaces}"${ritualCompensationReading.romanticisation_detected ? ' — ROMANTICISED' : ''}`,
        });
      }
      const fakeRecoveryReading = readFakeRecovery({ state, truth, emotionalCore });
      if (fakeRecoveryReading.primary) {
        emit({
          stage: 'fake-recovery',
          message: `${fakeRecoveryReading.primary.id} (${fakeRecoveryReading.fake_recovery_score.toFixed(1)}/10)${fakeRecoveryReading.performs_rest ? ' — PERFORMS REST' : ''}`,
        });
      }
      const silentCopingReading = readSilentCoping({ state, truth, emotionalCore });
      if (silentCopingReading.primary) {
        emit({
          stage: 'silent-coping',
          message: `${silentCopingReading.primary.id} — "${silentCopingReading.primary.cinematic_marker}"`,
        });
      }
      const behavioralResidueReading = readBehavioralResidue({
        state, truth, emotionalCore,
        behaviorLoop: behaviorLoopReading,
        microEscape: microEscapeReading,
        ritualCompensation: ritualCompensationReading,
        fakeRecovery: fakeRecoveryReading,
        silentCoping: silentCopingReading,
        recentTrail: emotionalTrail,
      });
      if (behavioralResidueReading.fingerprints.length > 0) {
        emit({
          stage: 'behavioral-residue',
          message: `carryover ${behavioralResidueReading.carryover_score.toFixed(1)}/10 · recurrence ${behavioralResidueReading.recurrence_density.toFixed(1)}/10${behavioralResidueReading.carries_weeks_not_minutes ? ' — CARRIES WEEKS' : ''}${behavioralResidueReading.residue_becoming_signature ? ' — SIGNATURE FORMING' : ''}`,
        });
      }
      // ───────────────────────────────────────────────────────────

      // ─── Phase 19 — social masking + identity performance ─────
      const socialMaskingEngineReading = readSocialMaskingEngine({ state, truth, emotionalCore });
      if (socialMaskingEngineReading.primary) {
        emit({
          stage: 'social-masking-engine',
          message: `${socialMaskingEngineReading.primary.id} (${socialMaskingEngineReading.classification}) — strength ${socialMaskingEngineReading.mask_signature_strength.toFixed(1)}/10${socialMaskingEngineReading.truth_reveals_too_much ? ' — MASK BROKEN' : ''}`,
        });
      }
      const highFunctioningBurnoutReading = readHighFunctioningBurnout({ state, truth, emotionalCore });
      if (highFunctioningBurnoutReading.primary) {
        emit({
          stage: 'high-functioning-burnout',
          message: `${highFunctioningBurnoutReading.primary.id} — output ${highFunctioningBurnoutReading.functional_output_unchanged.toFixed(1)}/10 unchanged, internal ${highFunctioningBurnoutReading.internal_depletion.toFixed(1)}/10 depleted${highFunctioningBurnoutReading.burnout_hidden_in_competence ? ' — HIDDEN IN COMPETENCE' : ''}${highFunctioningBurnoutReading.burnout_visible_too_early ? ' — VISIBLE TOO EARLY' : ''}`,
        });
      }
      const identityMaintenanceReading = readIdentityMaintenance({ state, truth, emotionalCore });
      if (identityMaintenanceReading.primary) {
        emit({
          stage: 'identity-maintenance',
          message: `identity: ${identityMaintenanceReading.primary.id} — pressure ${identityMaintenanceReading.identity_pressure.toFixed(1)}/10, cost ${identityMaintenanceReading.identity_cost.toFixed(1)}/10${identityMaintenanceReading.subject_names_their_role ? ' — SELF-CONSCIOUS' : ''}`,
        });
      }
      const emotionalCamouflageReading = readEmotionalCamouflage({ state, truth, emotionalCore });
      if (emotionalCamouflageReading.primary) {
        emit({
          stage: 'emotional-camouflage',
          message: `${emotionalCamouflageReading.primary.id} · concealment ${emotionalCamouflageReading.concealment_intensity.toFixed(1)}/10 · readability ${emotionalCamouflageReading.social_readability.toFixed(1)}/10${emotionalCamouflageReading.too_analytic ? ' — ANALYTIC VOICE' : ''}`,
        });
      }
      const publicPrivateSplitReading = readPublicPrivateSplit({
        state, truth, emotionalCore, recentTrail: emotionalTrail,
      });
      emit({
        stage: 'public-private-split',
        message: `side: ${publicPrivateSplitReading.candidate_side} · split coverage ${publicPrivateSplitReading.split_coverage.toFixed(1)}/10${publicPrivateSplitReading.banner_completes_a_pair ? ' — COMPLETES PAIR' : ''}${publicPrivateSplitReading.one_sided_campaign ? ' — ONE-SIDED CAMPAIGN' : ''}`,
      });
      const maskFatigueReading = readMaskFatigue({ state, truth, emotionalCore });
      if (maskFatigueReading.primary) {
        emit({
          stage: 'mask-fatigue',
          message: `${maskFatigueReading.primary.id} · mask ${maskFatigueReading.mask_fatigue_score.toFixed(1)}/10 vs work ${maskFatigueReading.work_fatigue_score.toFixed(1)}/10${maskFatigueReading.fatigue_misattributed ? ' — MISATTRIBUTED' : ''}`,
        });
      }
      // ───────────────────────────────────────────────────────────

      // ─── Phase 20 — desire systems ────────────────────────────
      const desireArchitectureReading = readDesireArchitecture({ state, truth, emotionalCore });
      if (desireArchitectureReading.primary) {
        emit({
          stage: 'desire-architecture',
          message: `${desireArchitectureReading.primary.id} — gravity ${desireArchitectureReading.desire_gravity.toFixed(1)}/10, inevitability ${desireArchitectureReading.emotional_inevitability.toFixed(1)}/10${desireArchitectureReading.uses_forbidden_framing ? ' — FORBIDDEN FRAMING' : ''}`,
        });
      }
      const quietStatusReading = readQuietStatus({ state, truth, emotionalCore });
      const emotionalHungerReading = readEmotionalHunger({ state, truth, emotionalCore });
      if (emotionalHungerReading.primary) {
        emit({ stage: 'emotional-hunger', message: `${emotionalHungerReading.primary.id} — intensity ${emotionalHungerReading.hunger_intensity.toFixed(1)}/10` });
      }
      const validationSystemsReading = readValidationSystems({ state, truth, emotionalCore });
      const invisibleEnvyReading = readInvisibleEnvy({ state, truth, emotionalCore });
      const aspirationalGapReading = readAspirationalIdentityGap({ state, truth, emotionalCore });

      // ─── Phase 21 — social gravity ────────────────────────────
      const socialGravityReading = readSocialGravity({ state, truth, emotionalCore });
      if (socialGravityReading.primary) {
        emit({
          stage: 'social-gravity',
          message: `${socialGravityReading.primary.id} — gravity ${socialGravityReading.gravity_strength.toFixed(1)}/10, collective grounding ${socialGravityReading.collective_grounding.toFixed(1)}/10${socialGravityReading.individually_dramatized ? ' — INDIVIDUALLY DRAMATIZED' : ''}`,
        });
      }
      const collectiveMovementReading = readCollectiveEmotionalMovement({
        state, truth, recentTrail: emotionalTrail, ingestedSignals,
      });
      const culturalAccelerationReading = readCulturalAcceleration({ ingestedSignals });
      const groupAnxietyReading = readGroupAnxiety({ state, truth, emotionalCore });
      const viralPatternsReading = readViralEmotionPatterns({ truth });
      if (viralPatternsReading.hits.length > 0) {
        emit({ stage: 'viral-emotion-patterns', message: `contamination ${viralPatternsReading.contamination_score.toFixed(1)}/10 · ${viralPatternsReading.hits.map((h) => h.id).join(', ')}` });
      }
      const socialPermissionReading = readSocialPermissionStructures({ state, truth, emotionalCore });

      // ─── Phase 22 — ritual attachment ─────────────────────────
      const ritualFormationReading = readRitualFormation({ truth });
      const attachmentLoopsReading = readAttachmentLoops({ state, truth, emotionalCore });
      const symbolicSafetyReading = readSymbolicSafety({ state, truth, emotionalCore });
      const emotionalReturnReading = readEmotionalReturnMechanics({ state, truth, emotionalCore });
      const privateRitualMemoryReading = await readPrivateRitualMemory({ store: humanDesireStore });
      const repeatedComfortReading = readRepeatedComfortSystems({ state, truth, emotionalCore });
      if (attachmentLoopsReading.primary || ritualFormationReading.detected_stage) {
        emit({
          stage: 'ritual-attachment',
          message: `${attachmentLoopsReading.primary?.id ?? 'no-anchor'} · formation ${ritualFormationReading.detected_stage ?? 'none'}${repeatedComfortReading.comfort_is_designed ? ' — DESIGNED COMFORT' : ''}`,
        });
      }

      // ─── Phase 23 — narrative self ────────────────────────────
      const internalNarrativeReading = readInternalNarrative({ state, truth, emotionalCore });
      if (internalNarrativeReading.primary) {
        emit({
          stage: 'internal-narrative',
          message: `${internalNarrativeReading.primary.id} — authenticity ${internalNarrativeReading.narrative_authenticity.toFixed(1)}/10${internalNarrativeReading.too_articulate ? ' — TOO ARTICULATE' : ''}${internalNarrativeReading.too_literary ? ' — TOO LITERARY' : ''}`,
        });
      }
      const selfStoryReading = readSelfStoryArchitecture({ state, truth, emotionalCore });
      const identityContinuityReading = readIdentityContinuity({ state, truth, emotionalCore });
      const meaningSystemsReading = readPrivateMeaningSystems({ state, truth, emotionalCore });
      const selfTranslationReading = readEmotionalSelfTranslation({ state, truth, emotionalCore });
      if (selfTranslationReading.primary) {
        emit({ stage: 'emotional-self-translation', message: `${selfTranslationReading.primary.id} — gap visible ${selfTranslationReading.gap_visible.toFixed(1)}/10` });
      }
      const personalMythologyReading = readPersonalMythology({ state, truth, emotionalCore });

      // ─── Phase 24 — predictive human states ───────────────────
      const emotionalForecastReading = readEmotionalForecasting({
        state, truth, emotionalCore, recentTrail: emotionalTrail,
      });
      emit({
        stage: 'emotional-forecasting',
        message: `${emotionalForecastReading.direction} — confidence ${emotionalForecastReading.forecast_confidence.toFixed(1)}/10, inevitability ${emotionalForecastReading.inevitability.toFixed(1)}/10${emotionalForecastReading.forecast_too_clean ? ' — TOO CLEAN' : ''}`,
      });
      const behaviorPredictionReading = readBehaviorPrediction({ state, truth, emotionalCore });
      const collapseProbabilityReading = readCollapseProbability({ state, truth, recentTrail: emotionalTrail });
      if (collapseProbabilityReading.probability >= 5) {
        emit({
          stage: 'collapse-probability',
          message: `${collapseProbabilityReading.probability.toFixed(1)}/10 (${collapseProbabilityReading.horizon})${collapseProbabilityReading.depicts_collapse_directly ? ' — DEPICTS COLLAPSE DIRECTLY' : ''}`,
        });
      }
      const recoveryAttemptReading = readRecoveryAttemptModel({ state, truth, emotionalCore });
      const pressureTrajectoryReading = readFuturePressureTrajectory({ state, truth, recentTrail: emotionalTrail });
      const emotionalDriftReading = readEmotionalDriftPrediction({ state, recentTrail: emotionalTrail });

      // ─── Phase 25 — autonomous campaign intelligence ──────────
      const autonomousNarrativeReading = readAutonomousNarrativeEngine({ recentTrail: emotionalTrail });
      const culturalSignalEvolutionReading = readCulturalSignalEvolution({ ingestedSignals });
      const selfUpdatingPsychologyReading = await readSelfUpdatingPsychology({ store: humanDesireStore });
      const emergentCampaignMemoryReading = readEmergentCampaignMemory({ recentTrail: emotionalTrail });
      const collectiveRealityTrackingReading = readCollectiveRealityTracking({
        recentTrail: emotionalTrail, ingestedSignals,
      });
      const adaptiveEmotionalIntelligenceReading = readAdaptiveEmotionalIntelligence({
        autonomousNarrative: autonomousNarrativeReading,
        culturalSignalEvolution: culturalSignalEvolutionReading,
        selfUpdatingPsychology: selfUpdatingPsychologyReading,
        emergentCampaignMemory: emergentCampaignMemoryReading,
        collectiveRealityTracking: collectiveRealityTrackingReading,
      });
      emit({
        stage: 'autonomous-intelligence',
        message: `directive: ${adaptiveEmotionalIntelligenceReading.directive} (urgency ${adaptiveEmotionalIntelligenceReading.adaptation_urgency.toFixed(1)}/10) — ${adaptiveEmotionalIntelligenceReading.organism_state}`,
      });

      // ─── Phases 20–25 — unified human cognition graph ─────────
      const unifiedGraphReading = readUnifiedHumanGraph({
        state,
        recentTrail: emotionalTrail,
        desireEntries: desireEntriesAtRunStart,
        forecast: emotionalForecastReading,
        drift: emotionalDriftReading,
        adaptive: adaptiveEmotionalIntelligenceReading,
      });
      emit({
        stage: 'unified-human-graph',
        message: `coherence ${unifiedGraphReading.human_coherence.toFixed(1)}/10 · candidate-belongs ${unifiedGraphReading.candidate_belongs.toFixed(1)}/10 — ${unifiedGraphReading.portrait}`,
      });
      // ───────────────────────────────────────────────────────────

      // ═══ PHASE 26 — UNIFIED COGNITIVE FIELD ═══════════════════
      // The nervous system. Every reading above is now unified into
      // ONE living world-state. The system stops running modules in
      // a line and starts maintaining a persistent psychological
      // world. The meta-critic's central Phase 26 question:
      //   "Did this output EMERGE from the world model, or was it
      //    merely DECORATED by the intelligence modules?"
      const symbolicObjectsReading = readSymbolicObjects({ truth, sceneText: brief.scene });
      const cognitiveField = buildCognitiveField({
        state, truth, emotionalCore,
        culturalMicroMoment,
        systemicCause: systemicCauseReading,
        cognitiveResidue: cognitiveResidueReading,
        behaviorLoop: behaviorLoopReading,
        behavioralResidue: behavioralResidueReading,
        socialMasking: socialMaskingEngineReading,
        desire: desireArchitectureReading,
        ritualFormation: ritualFormationReading,
        attachmentLoops: attachmentLoopsReading,
        internalNarrative: internalNarrativeReading,
        selfStory: selfStoryReading,
        forecast: emotionalForecastReading,
        collectiveMovement: collectiveMovementReading,
        truthPersistenceReport,
        decay: emotionalDecayReading,
        symbolicObjects: symbolicObjectsReading,
        unifiedGraph: unifiedGraphReading,
        worldState,
      });
      const emotionalPhysicsReading = readEmotionalPhysics({ field: cognitiveField });
      const tensionTopologyReading = mapTensionTopology({ field: cognitiveField, truth });
      const lifeTrajectoryReading = projectLifeTrajectory({
        forecast: emotionalForecastReading,
        behaviorPrediction: behaviorPredictionReading,
        collapseProbability: collapseProbabilityReading,
        recoveryAttempt: recoveryAttemptReading,
        pressureTrajectory: pressureTrajectoryReading,
        drift: emotionalDriftReading,
      });
      // Build the contradiction-resolver votes from the live cognition.
      const contradictionVotes: ModuleVote[] = [
        {
          voice: 'human-truth',
          position: emotionalCore ? `serve the core "${emotionalCore.id}"` : 'serve the observed truth',
          strength: emotionalCore ? 9 : 6,
        },
        {
          voice: 'reality-pressure',
          position: systemicCauseReading.has_systemic_cause
            ? `keep the systemic cause "${systemicCauseReading.matched_systems.primary!.id}" visible`
            : 'no structural pressure to honour',
          strength: systemicCauseReading.has_systemic_cause ? 8 : 2,
        },
        {
          voice: 'behavioral-authenticity',
          position: behaviorLoopReading.primary_loop
            ? `keep the behaviour "${behaviorLoopReading.primary_loop.id}" observed, not performed`
            : 'keep the body behaviour authentic',
          strength: nonPerformative && nonPerformative.trying_to_simulate ? 8 : 5,
        },
        {
          voice: 'cultural-honesty',
          position: 'keep the register unguarded, not performative',
          strength: privateLanguageReading.performative_signatures.length > 0 ? 8 : 4,
        },
        {
          voice: 'campaign-atmosphere',
          position: `stay continuous with: ${cognitiveField.campaignAtmosphere}`,
          strength: unifiedGraphReading.human_coherence >= 6 ? 6 : 3,
        },
        {
          voice: 'product-commercial',
          position: `product role: ${direction.productRole}`,
          strength: direction.productRole === 'hidden' || direction.productRole === 'environmental' ? 3 : 6,
        },
        {
          voice: 'aesthetic-preference',
          position: 'whatever reads as most visually striking',
          strength: visualTaste.score >= 8 ? 6 : 4,
        },
      ];
      const contradictionResolution = resolveContradictions({ votes: contradictionVotes });
      emit({
        stage: 'cognitive-field',
        message: `unified — confidence ${cognitiveField.worldStateConfidence}/10 · coherence ${cognitiveField.field_coherence}/10 · emergence ${cognitiveField.emergence_score}/10 · governing voice "${contradictionResolution.governing_voice}"`,
      });
      if (emotionalPhysicsReading.primary_chain) {
        emit({
          stage: 'emotional-physics',
          message: `${emotionalPhysicsReading.primary_chain.chain.join(' → ')} (clarity ${emotionalPhysicsReading.causal_clarity.toFixed(1)}/10)`,
        });
      }
      if (tensionTopologyReading.deepest_opportunity) {
        emit({
          stage: 'tension-topology',
          message: `deepest opportunity: "${tensionTopologyReading.deepest_opportunity.the_tension}" (depth ${tensionTopologyReading.opportunity_depth}/10)${tensionTopologyReading.truth_inhabits_opportunity ? ' — INHABITED' : ' — not inhabited'}`,
        });
      }
      emit({
        stage: 'life-trajectory',
        message: lifeTrajectoryReading.trajectory_statement,
      });
      // ═══════════════════════════════════════════════════════════

      // ─── Phase 4 — aftertaste prediction + atmosphere snapshot
      // computed pre-verdict so the meta-critic can gate on them. ──
      const tentativeAftertaste = predictAftertaste({
        bannerId,
        shippedAt: Date.now(),
        engagement: null,
        bannerDNA: dna,
        predictedReactionAt3s: reaction.at_3s,
        tensionPhrase: truth.tension,
        truthLength: truth.truth.length,
      });
      const tentativeFootprint: BannerFootprint = {
        bannerId,
        dna,
        job: jobDecision.job,
        family: state.family,
        truth: truth.truth,
        tension: truth.tension,
      };
      const priorFootprints: BannerFootprint[] = emotionalTrail.slice(0, 19).map((e) => ({
        bannerId: e.bannerId,
        dna: dnaFromFacts(e.facts),
        job: e.job ?? 'sell',
        family: e.family,
        truth: e.truth,
        tension: e.tension,
      }));
      const tentativeAtmosphere = analyzeAtmosphere([tentativeFootprint, ...priorFootprints]);
      emit({
        stage: 'aftertaste',
        message: `predicted ${tentativeAftertaste.residueStrength.toFixed(1)}/10 · spike-vs-residue ${tentativeAftertaste.spikeVsResidueRatio.toFixed(2)}`,
        data: tentativeAftertaste,
      });
      emit({
        stage: 'atmosphere',
        message: `consistency ${tentativeAtmosphere.consistency.toFixed(1)}/10 · uniformity penalty ${tentativeAtmosphere.uniformityPenalty.toFixed(1)}`,
        data: tentativeAtmosphere,
      });
      // ───────────────────────────────────────────────────────────

      const finalVerdict = decideFinalVerdict({
        ctx,
        scrollStop,
        taste,
        psychology,
        productPresence,
        reference,
        memory,
        brutality: opts.brutality,
        judge,
        reaction,
        fatigue,
        antiAI,
        rhythmWorsen,
        job: jobDecision,
        direction,
        aftertastePrediction: tentativeAftertaste,
        atmosphere: tentativeAtmosphere,
        drift: driftReport,
        // Phase 5
        visualTaste,
        emotionalAftertaste,
        campaignMemoryV2,
        // Phase 7
        perceptionCriticVerdict,
        campaignIdentity,
        // Phase 8
        gravity,
        negativeSpace,
        compositionRhythm8,
        productPresence8,
        framing8,
        directorVerdict,
        // Phase 9
        sequenceVerdict,
        tempoWorsen,
        absenceDecision,
        contradictionReading,
        objectMemoryGraph,
        // Phase 10
        compressionReading,
        syntheticReading,
        cinematicVerdict,
        // Phase 11
        humanContradiction,
        nonPerformative,
        lifeNoise,
        // Phase 12
        sharedPattern: sharedPatternMatch.pattern,
        collectiveRecognition,
        unspokenRitualPick,
        culturalDriftReading,
        // Phase 13
        realityPressureReading,
        consequenceReading,
        invisibleStakesReading,
        functionalCollapseReading,
        // Phase 14
        avoidanceReading,
        numbingReading,
        maskingReading,
        unfeltReading,
        // Phase 15
        truthPersistenceReport,
        realityVerificationReading,
        emotionalDecayReading,
        generationPressureReading,
        // Phase 16
        privateLanguageReading,
        realityWeightingReading,
        // Phase 17
        systemicCauseReading,
        attentionFragmentationReading,
        environmentalSystemReading,
        recoveryFailureReading,
        cognitiveResidueReading,
        // Phase 18
        behaviorLoopReading,
        microEscapeReading,
        ritualCompensationReading,
        fakeRecoveryReading,
        silentCopingReading,
        behavioralResidueReading,
        // Phase 19
        socialMaskingEngineReading,
        highFunctioningBurnoutReading,
        identityMaintenanceReading,
        emotionalCamouflageReading,
        publicPrivateSplitReading,
        maskFatigueReading,
        // Phase 20
        desireArchitectureReading,
        quietStatusReading,
        emotionalHungerReading,
        validationSystemsReading,
        invisibleEnvyReading,
        aspirationalGapReading,
        // Phase 21
        socialGravityReading,
        collectiveMovementReading,
        culturalAccelerationReading,
        groupAnxietyReading,
        viralPatternsReading,
        socialPermissionReading,
        // Phase 22
        ritualFormationReading,
        attachmentLoopsReading,
        symbolicSafetyReading,
        emotionalReturnReading,
        privateRitualMemoryReading,
        repeatedComfortReading,
        // Phase 23
        internalNarrativeReading,
        selfStoryReading,
        identityContinuityReading,
        meaningSystemsReading,
        selfTranslationReading,
        personalMythologyReading,
        // Phase 24
        emotionalForecastReading,
        behaviorPredictionReading,
        collapseProbabilityReading,
        recoveryAttemptReading,
        pressureTrajectoryReading,
        emotionalDriftReading,
        // Phase 25
        autonomousNarrativeReading,
        culturalSignalEvolutionReading,
        selfUpdatingPsychologyReading,
        emergentCampaignMemoryReading,
        collectiveRealityTrackingReading,
        adaptiveEmotionalIntelligenceReading,
        // Unified graph
        unifiedGraphReading,
        // Phase 26 — unified cognitive field
        cognitiveField,
        emotionalPhysicsReading,
        tensionTopologyReading,
        contradictionResolution,
      });
      // ───────────────────────────────────────────────────────────

      if (finalVerdict.verdict === 'approve') {
        const shippedAt = Date.now();
        // Phase 4 — the aftertaste + atmosphere already computed
        // pre-verdict. Persist them.
        const aftertastePrediction = { ...tentativeAftertaste, shippedAt };
        await aftertasteStore.upsert(aftertastePrediction);
        const atmosphere = tentativeAtmosphere;

        // ─── Phase 26 — the world model absorbs this banner ───────
        // Record the banner's causal chain into the campaign-level
        // causal memory graph, then evolve the persistent world-state.
        const causalChainLinks: CausalChainLink[] = [];
        if (systemicCauseReading.matched_systems.primary) {
          causalChainLinks.push({ kind: 'cause', label: systemicCauseReading.matched_systems.primary.id });
        }
        if (behaviorLoopReading.primary_loop) {
          causalChainLinks.push({ kind: 'behavior', label: behaviorLoopReading.primary_loop.id });
        }
        if (cognitiveResidueReading.detected[0]) {
          causalChainLinks.push({ kind: 'residue', label: cognitiveResidueReading.detected[0].id });
        }
        if (socialMaskingEngineReading.primary) {
          causalChainLinks.push({ kind: 'adaptation', label: socialMaskingEngineReading.primary.id });
        }
        if (symbolicObjectsReading.objects_present[0]) {
          causalChainLinks.push({ kind: 'symbolic-object', label: symbolicObjectsReading.objects_present[0].object });
        }
        causalChainLinks.push({ kind: 'future-drift', label: emotionalForecastReading.direction });
        recordCausalChain(causalGraph, causalChainLinks);

        worldState = evolveWorldStateFromBanner(worldState, {
          state,
          attentionFragmentationScore: attentionFragmentationReading.attention_fragmentation_score,
          recoveryFailing: recoveryFailureReading.rest_is_not_rest,
          ritualIntensity: ritualCompensationReading.ritual_compulsion,
          identityPressure: identityMaintenanceReading.identity_pressure,
          maskingActive: socialMaskingEngineReading.primary !== null,
          desireVolatile: desireArchitectureReading.uses_forbidden_framing,
          culturalPressure: collectiveMovementReading.movement_confidence,
        });

        // Self-evolving world model — what the system should now
        // strengthen, weaken, retire, or detect as emerging.
        const worldModelEvolution = evolveWorldModel({
          worldState, causalGraph,
          desireEntries: desireEntriesAtRunStart,
          truthPersistence: truthPersistenceReport,
          decay: emotionalDecayReading,
        });

        // The cognition trace — the system explaining its thinking.
        const cognitionTrace = buildCognitionTrace({
          bannerId,
          field: cognitiveField,
          physics: emotionalPhysicsReading,
          topology: tensionTopologyReading,
          trajectory: lifeTrajectoryReading,
          resolver: contradictionResolution,
          rejectedAttempts,
          productDecision: `productRole=${direction.productRole}`,
          typographyDecision: `typographyDominance=${direction.typographyDominance}`,
          silenceDecision: `restraint=${direction.restraint.toFixed(2)}`,
          worldStateUpdate: describeWorldState(worldState),
        });
        emit({
          stage: 'cognition-trace',
          message: `explainability ${cognitionTrace.explainability}/10 — ${cognitionTrace.finalCreativeReason}`,
        });
        if (worldModelEvolution.evolution_pressure >= 5) {
          emit({
            stage: 'self-evolving-world-model',
            message: `evolution pressure ${worldModelEvolution.evolution_pressure}/10 — ${worldModelEvolution.notes[0] ?? ''}`,
          });
        }

        const partial: Omit<Banner, 'memorySnapshot'> = {
          id: bannerId,
          createdAt: shippedAt,
          formula: ctx.formula,
          campaignMode: ctx.campaignMode,
          state, truth, direction, composition,
          imageBrief: brief, image, typography, cta,
          critique: scrollStop,
          taste, psychology, productPresence, referenceMatch: reference, finalVerdict,
          tasteSystem: {
            dna, judge, reaction, fatigue, evolutionAtRunStart,
            campaignBrain: {
              job: jobDecision,
              culturalMoment,
              courage,
              rhythm: rhythmReport,
              antiAI,
              residue: '', // filled by entryFromBanner below
            },
            realityLoop: {
              aftertastePrediction,
              drift: driftReport,
              atmosphere,
            },
            perception: {
              emotionalCore,
              culturalMicroMoment,
              visualTaste,
              imperfection: imperfectionPlan,
              emotionalAftertaste,
              campaignMemoryV2,
            },
            perceptionV2: {
              atmosphericLight,
              typographyPsychology,
              worldContinuity,
              microHumanDetails,
              invisibleStory,
              humanInterruption,
              campaignIdentity,
              perceptionCritic: perceptionCriticVerdict,
            },
            composition8: {
              gravity,
              negativeSpace,
              rhythm: compositionRhythm8,
              presence: productPresence8,
              framing: framing8,
              director: directorVerdict,
            },
            temporal: {
              timeline: campaignTimeline,
              sequence: sequenceVerdict,
              worldPersistence,
              objectGraph: objectMemoryGraph,
              sceneContinuity: sceneContinuityReport,
              visualTempo,
              absence: absenceDecision,
              contradiction: contradictionReading,
            },
            cinematic: {
              unresolved: unresolvedReport,
              compression: compressionReading,
              recognition: subconsciousRecognition,
              synthetic: syntheticReading,
              verdict: cinematicVerdict,
            },
            humanity: {
              lifeNoise,
              contradiction: humanContradiction,
              nonPerformative,
            },
            culture: {
              sharedPattern: sharedPatternMatch.pattern,
              collectiveRecognition,
              unspokenRitual: unspokenRitualPick,
              drift: culturalDriftReading,
            },
            pressure: {
              reality: realityPressureReading,
              consequence: consequenceReading,
              invisibleStakes: invisibleStakesReading,
              functionalCollapse: functionalCollapseReading,
            },
            suppression: {
              avoidance: avoidanceReading,
              numbing: numbingReading,
              masking: maskingReading,
              unfelt: unfeltReading,
            },
            longitudinal: {
              truthPersistence: truthPersistenceReport,
              culturalTimeline: culturalTimelineReport,
              realityVerification: realityVerificationReading,
              emotionalDecay: emotionalDecayReading,
              generationPressure: generationPressureReading,
            },
            reality: {
              extraction: humanSignalExtraction,
              collectiveDrift: collectiveDriftReport,
              privateLanguage: privateLanguageReading,
              weighting: realityWeightingReading,
            },
            systems: {
              systemicCause: systemicCauseReading,
              attentionFragmentation: attentionFragmentationReading,
              environmentalSystem: environmentalSystemReading,
              recoveryFailure: recoveryFailureReading,
              cognitiveResidue: cognitiveResidueReading,
            },
            survival: {
              behaviorLoop: behaviorLoopReading,
              microEscape: microEscapeReading,
              ritualCompensation: ritualCompensationReading,
              fakeRecovery: fakeRecoveryReading,
              silentCoping: silentCopingReading,
              behavioralResidue: behavioralResidueReading,
            },
            identity: {
              socialMaskingEngine: socialMaskingEngineReading,
              highFunctioningBurnout: highFunctioningBurnoutReading,
              identityMaintenance: identityMaintenanceReading,
              emotionalCamouflage: emotionalCamouflageReading,
              publicPrivateSplit: publicPrivateSplitReading,
              maskFatigue: maskFatigueReading,
            },
            desire: {
              architecture: desireArchitectureReading,
              quietStatus: quietStatusReading,
              emotionalHunger: emotionalHungerReading,
              validation: validationSystemsReading,
              invisibleEnvy: invisibleEnvyReading,
              aspirationalGap: aspirationalGapReading,
            },
            socialGravity: {
              gravity: socialGravityReading,
              collectiveMovement: collectiveMovementReading,
              culturalAcceleration: culturalAccelerationReading,
              groupAnxiety: groupAnxietyReading,
              viralPatterns: viralPatternsReading,
              permissionStructures: socialPermissionReading,
            },
            ritual: {
              formation: ritualFormationReading,
              attachmentLoops: attachmentLoopsReading,
              symbolicSafety: symbolicSafetyReading,
              returnMechanics: emotionalReturnReading,
              privateRitualMemory: privateRitualMemoryReading,
              comfortSystems: repeatedComfortReading,
            },
            narrative: {
              internalNarrative: internalNarrativeReading,
              selfStory: selfStoryReading,
              identityContinuity: identityContinuityReading,
              meaningSystems: meaningSystemsReading,
              selfTranslation: selfTranslationReading,
              personalMythology: personalMythologyReading,
            },
            predictive: {
              forecast: emotionalForecastReading,
              behaviorPrediction: behaviorPredictionReading,
              collapseProbability: collapseProbabilityReading,
              recoveryAttempt: recoveryAttemptReading,
              pressureTrajectory: pressureTrajectoryReading,
              drift: emotionalDriftReading,
            },
            autonomous: {
              narrativeEngine: autonomousNarrativeReading,
              culturalSignalEvolution: culturalSignalEvolutionReading,
              selfUpdatingPsychology: selfUpdatingPsychologyReading,
              emergentMemory: emergentCampaignMemoryReading,
              realityTracking: collectiveRealityTrackingReading,
              adaptiveIntelligence: adaptiveEmotionalIntelligenceReading,
            },
            unifiedGraph: unifiedGraphReading,
            cognition: {
              field: cognitiveField,
              physics: emotionalPhysicsReading,
              tensionTopology: tensionTopologyReading,
              lifeTrajectory: lifeTrajectoryReading,
              contradictionResolution,
              symbolicObjects: symbolicObjectsReading,
              trace: cognitionTrace,
              worldModelEvolution,
            },
          },
          attempts: attempt,
          rejectedAttempts,
        };

        // Persist emotional trace + main memory in parallel.
        const provisional: Banner = { ...partial, memorySnapshot: memory };
        const traceEntry = entryFromBanner(provisional, jobDecision.job, culturalMoment.id);
        partial.tasteSystem.campaignBrain.residue = traceEntry.residue;
        await humanMemoryStore.record(traceEntry);

        const memorySnapshot = await memoryStore.record(provisional);
        const banner: Banner = { ...partial, memorySnapshot };

        // ─── Phase 7 — update object-emotion store from the scene ─
        const detectedObjects = extractObjectsFromBrief(
          brief.scene,
          worldContinuity.artifacts.map((a) => a.description),
        );
        for (const objectId of detectedObjects) {
          await objectEmotionStore.record(objectId, emotionalCore?.id ?? null);
        }
        if (detectedObjects.length > 0) {
          emit({
            stage: 'object-emotion-memory',
            message: `${detectedObjects.length} objects updated: ${detectedObjects.slice(0, 4).join(', ')}`,
          });
        }

        // ─── Phase 15 — record into truth-persistence + cultural-
        // timeline stores so the next campaign run sees this banner.
        const engagementResidueAtShip = realityVerificationReading.confirmation_strength;
        const persistenceUpdated = await truthPersistenceStore.record(banner, engagementResidueAtShip);
        await culturalTimelineStore.record(banner);
        if (persistenceUpdated.count >= 2) {
          emit({
            stage: 'truth-persistence',
            message: `recorded — truth "${persistenceUpdated.display}" now at ×${persistenceUpdated.count}`,
          });
        }

        // ─── Phases 20–25 — record into the human desire memory ───
        // graph so the longing graph compounds across the campaign.
        if (desireArchitectureReading.primary) {
          await humanDesireStore.record({
            category: 'aspiration',
            key: desireArchitectureReading.primary.id,
            display: desireArchitectureReading.primary.the_reach,
            intensity: desireArchitectureReading.desire_gravity,
            sampleTruth: truth.truth,
          });
        }
        if (emotionalHungerReading.primary) {
          await humanDesireStore.record({
            category: 'emotional-hunger',
            key: emotionalHungerReading.primary.id,
            display: emotionalHungerReading.primary.the_deficit,
            intensity: emotionalHungerReading.hunger_intensity,
            sampleTruth: truth.truth,
          });
        }
        if (attachmentLoopsReading.primary) {
          await humanDesireStore.record({
            category: 'ritual-dependency',
            key: attachmentLoopsReading.primary.id,
            display: attachmentLoopsReading.primary.the_object_or_window,
            intensity: attachmentLoopsReading.attachment_strength,
            sampleTruth: truth.truth,
          });
        }
        if (invisibleEnvyReading.primary) {
          await humanDesireStore.record({
            category: 'invisible-envy',
            key: invisibleEnvyReading.primary.id,
            display: invisibleEnvyReading.primary.the_thing,
            intensity: invisibleEnvyReading.envy_specificity,
            sampleTruth: truth.truth,
          });
        }
        emit({
          stage: 'human-desire-memory',
          message: `longing graph updated — ${desireEntriesAtRunStart.length} prior entries · organism: ${adaptiveEmotionalIntelligenceReading.directive}`,
        });

        // ─── Phase 26 — persist the unified cognitive field so the
        // next run inherits the world the system has been building.
        await worldStateStore.saveWorldState(worldState);
        await worldStateStore.saveCausalGraph(causalGraph);
        await worldStateStore.recordCognitionTrace(cognitionTrace);
        await worldStateStore.recordFieldSnapshot({
          bannerId,
          ts: shippedAt,
          worldStateConfidence: cognitiveField.worldStateConfidence,
          field_coherence: cognitiveField.field_coherence,
          emergence_score: cognitiveField.emergence_score,
          campaignAtmosphere: cognitiveField.campaignAtmosphere,
        });
        emit({
          stage: 'world-state',
          message: `persisted — gen ${worldState.generationCount} · ${describeWorldState(worldState)}`,
        });

        emit({
          stage: 'human-memory',
          message: `residue: ${traceEntry.residue}`,
          data: { traceEntry },
        });
        emit({ stage: 'pipeline', message: 'banner approved', data: { attempt, imageAttempts, totals: finalVerdict.totals } });
        return { banner, events };
      }

      // Rejection routing.
      if (finalVerdict.verdict === 'reject-image' && imageAttempts < 2) {
        rejectedAttempts.push({ stage: 'image', reason: finalVerdict.reasons.join('; ') });
        emit({ stage: 'rejection', message: 'regenerating image', data: { reasons: finalVerdict.reasons } });
        continue; // inner loop
      }

      rejectedAttempts.push({
        stage: finalVerdict.verdict === 'reject-image' ? 'image-exhausted' : finalVerdict.verdict,
        reason: finalVerdict.reasons.join('; '),
      });
      emit({ stage: 'rejection', message: `regenerating concept (${finalVerdict.verdict})`, data: { reasons: finalVerdict.reasons } });
      // Phase 26 — a rejection is also an observation; the world-state
      // absorbs it and the next run inherits the slightly raised bar.
      worldState = evolveWorldStateFromRejection(worldState);
      await worldStateStore.saveWorldState(worldState);
      stateSeed += 7919;
      forceStateId = undefined;
      memory = await memoryStore.read();
      break; // exit inner loop, next outer attempt
    }
  }

  throw new ExhaustedAttempts(
    maxAttempts,
    rejectedAttempts.slice(-3).map((r) => `${r.stage}: ${r.reason}`),
  );
}

/**
 * Neutral DNA — used when the atmosphere analyser needs to score voice
 * + job mix across banners whose DNA was not persisted (older runs).
 * Every axis at 0.5 contributes nothing to spread, so older banners
 * effectively count only toward voice and job-mix consistency.
 */
const NEUTRAL_DNA: import('@lib/referenceDNA').ReferenceDNA = {
  silence_ratio: 0.5,
  tension_map: 0.5,
  framing_behavior: 0.5,
  typography_confidence: 0.5,
  negative_space_usage: 0.5,
  emotional_density: 0.5,
  product_aggression_level: 0.5,
  interruption_style: 0.5,
  realism_type: 0.5,
  visual_temperature: 0.5,
  camera_energy: 0.5,
  editorial_level: 0.5,
  fashion_influence: 0.5,
  documentary_weight: 0.5,
  luxury_restraint: 0.5,
  anti_commercial_feel: 0.5,
};

/**
 * Build a partial DNA from the emotional trace's stored facts. The
 * trail persists 3 axes (silence_ratio, documentary_weight,
 * realism_type) directly; the rest are filled with neutral midpoints,
 * which means atmosphere spread reads honestly on the 3 stored axes
 * and ignores the others.
 */
function dnaFromFacts(facts: { silence_ratio: number; documentary_weight: number; realism_type: number } | undefined) {
  if (!facts) return NEUTRAL_DNA;
  return {
    ...NEUTRAL_DNA,
    silence_ratio: facts.silence_ratio,
    documentary_weight: facts.documentary_weight,
    realism_type: facts.realism_type,
  };
}

/** Phase 9 helper: derive a per-banner light behaviour from a trail
 *  entry's family + closing reaction. Mirrors atmosphericLight's family
 *  fallback so the worldPersistence reading stays honest across runs. */
function inferLightBehaviorFromTrail(t: import('@lib/humanMemory').EmotionalTraceEntry): string {
  switch (t.family) {
    case 'fatigue':
    case 'collapse':       return 'sunset-emotional-pause';
    case 'overstimulation':return 'fluorescent-depletion';
    case 'numbness':
    case 'paralysis':      return 'overcast-flattening';
    case 'pressure':       return 'late-office-warmth';
    case 'fragmentation':  return 'monitor-cool-only';
    case 'avoidance':      return 'cold-morning-detachment';
    default:               return 'window-soft-warm';
  }
}

/** Phase 9 helper: map closing reaction + family → an emotional note
 *  for the current candidate banner. Mirrors campaignTimeline's
 *  noteForEntry so the sequence engine and the timeline agree. */
function inferCandidateNote(
  at_3s: import('@lib/humanReaction').Reaction,
  family: string,
): import('@lib/campaignTimeline').EmotionalNote {
  if (at_3s === 'rejection') return 'denial';
  if (at_3s === 'indifference') return 'numbness';
  if (at_3s === 'confusion') return 'disorientation';
  if (at_3s === 'discomfort') return 'micro-collapse';
  if (at_3s === 'intimacy' && (family === 'fatigue' || family === 'collapse')) return 'aftermath';
  if (at_3s === 'intimacy') return 'recovery';
  if (at_3s === 'validation') return 'quiet-control';
  if (at_3s === 'recognition' && family === 'numbness') return 'detachment';
  if (at_3s === 'recognition' && (family === 'fatigue' || family === 'collapse')) return 'ritual';
  if (at_3s === 'recognition') return 'quiet-control';
  if (at_3s === 'emotional tension' && family === 'pressure') return 'micro-collapse';
  if (at_3s === 'emotional tension') return 'ritual';
  if (at_3s === 'aspiration') return 'recovery';
  if (at_3s === 'curiosity') return 'disorientation';
  if (at_3s === 'interruption') return 'disorientation';
  return 'ritual';
}

/** Phase 9: cultural micro-moment id → apartment kind (mirror of the
 *  map in worldPersistence so scene-continuity stays consistent). */
const APARTMENT_KIND_MAP: Record<string, string> = {
  'fridge-open-at-night': 'apartment-kitchen-night',
  'bed-scrolling': 'apartment-bedroom-night',
  'saturday-stillness': 'apartment-living-room-day',
  'late-kitchen-silence': 'apartment-kitchen-night',
  'no-energy-for-people': 'apartment-entry',
  'reserves-fatigue': 'apartment-kitchen-morning',
  'parenting-overload': 'apartment-living-room-day',
  'overstimulated-tabs': 'office-or-desk',
  'office-fluorescent': 'office-floor',
  'office-1647-brain-death': 'office-floor',
  'startup-late-night': 'office-floor-night',
  'train-ride-silence': 'transit-train',
  'car-after-work': 'transit-car',
  'post-meeting-emptiness': 'office-corridor',
  'zoning-out': 'video-call-desk',
  'staring-without-processing': 'desk',
  'unread-whatsapp': 'apartment-table',
  'avoiding-messages': 'apartment-surface',
  'eating-without-hunger': 'apartment-kitchen-counter',
  'coffee-machine-emptiness': 'office-kitchenette',
};
