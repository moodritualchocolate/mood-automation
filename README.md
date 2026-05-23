# MOOD CREATIVE OS

**Not a banner generator. Not a prompt wrapper. Not a Canva clone.**

An autonomous creative operating system. V1 ships one engine: the
ENERGY static banner engine.

The user provides one input: the formula (ENERGY). Optionally a
campaign mode (Editorial / Documentary / Performance / Emotional /
Minimal / Aggressive / Luxury / Product-focused). The system thinks
the rest.

## Architecture

V1 is wired exactly the way the future system needs to think.
Engines are isolated; the pipeline is the only place that knows the
order. New formulas and new outputs (carousels, video, landing pages)
plug into the same shape.

```
human truth → emotional tension → campaign concept → composition
   → image → typography → CTA → critique → rejection → export → memory
```

### Engines (`src/engines/*`)

**Generation layer** (the V1 engines — they make the banner):

| # | Engine              | Role                                                         |
|---|---------------------|--------------------------------------------------------------|
| 1 | Human State         | Picks one of 59 ENERGY states. Rotates by family + fatigue.  |
| 2 | Human Truth         | Writes the sharp truth beneath the state.                    |
| 3 | Creative Director   | Decides hook, focal, pacing, product role, layout, restraint.|
| 4 | Composition Planner | Plans focal/typo/product zones + eye flow.                   |
| 5 | Image Generation    | Photographic-scene only. No text. No logos.                  |
| 6 | Product Integration | Refuses pasted PNG behavior. Product lives in the scene.     |
| 7 | Typography V2       | Hebrew, RTL. Earned size — overrules dominance when not.     |
| 8 | CTA                 | One intentional Hebrew CTA, styled per direction.            |
| 11| Imperfection V2    | Emotionally motivated per state family — never random.       |
| 13| Export              | SVG composite → PNG (resvg).                                 |

**Taste layer** (Phase 2 — the engines that judge, not generate):

| #   | Engine                 | Role                                                              |
|-----|------------------------|-------------------------------------------------------------------|
| 9   | Scroll-Stop Critic     | Ten structural signals: AI-feel, generic, pasted, etc.            |
| 9a  | Aesthetic Critic       | Eleven taste failures: fake premium, template energy, AI ad feel. |
| 9b  | Visual Psychology      | Entry/focal/tension/release. CTA-as-resolution. Eye-flow integrity. |
| 9c  | Reference Intelligence | Encodes banner as a fingerprint, matches against the reference bank, reports drift. |
| 9d  | Product Presence       | Scores product behavior as evidence vs. inserted PNG.             |
| 9e  | Not-Good-Enough        | Meta-critic. Synthesises every critic into ONE verdict. Brutality knob. |
| 10  | Memory V2              | Fatigue + rhythm intelligence: pacing history, silence/aggressive balance, overstimulation flag, campaign arc. |
| 12  | Rejection              | Routes reject-image / reject-concept / reject-taste regens.       |

**Reality pressure** (`lib/*` Phase 13 modules) — the system stops producing beautiful observations and starts carrying real pressure. Stakes replace aesthetics. The structural rule: *the banner should feel "accidentally true", not "creatively impressive".*

| Module | Role |
|---|---|
| `lib/realityPressure.ts` | Identifies the 7 pressures the spec named (emotional, social, economic, relational, expectation, performance, time) present in each banner. Scores `pressure_specificity` — high when the truth names a witness-able marker (a time like `01:13`, a count like `forty-three threads`, a named action, a named relation). Flags `reads_generic` when the truth uses only category words. |
| `lib/consequenceEngine.ts` | Every banner now answers *"what happens if nothing changes?"* Emits the stakes_phrase, what_continues, what_gets_worse, and a stakes_clarity 0..10. Flags `decorative_emotion` when there is no real stake. |
| `lib/invisibleStakes.ts` | 12 modern compulsions the spec named (`check-notifications-before-eyes-open`, `reopen-laptop-after-shutdown`, `refresh-feed-for-no-reason`, `rehearse-reply-then-not-send`, `productivity-loop-as-avoidance`, `work-late-because-stopping-feels-worse`, …). Each carries the observable behavior + the invisible cost. |
| `lib/functionalCollapse.ts` | Distinguishes Type A (SHOWING collapse — visible breakdown, cinematic suffering) from Type B (FUNCTIONAL collapse — *the body is still typing, the person is gone*). The spec's central insight made measurable. Also scores `accidentally_true_score` against `creatively_impressive` failure mode. |

Phase 13 meta-critic gates:
- **the spec's new headline gate**: pressure reads generic AND consequence decorative → reject-concept at default mode and up (*"does this frame contain pressure, or only aesthetics?"*)
- functional-collapse type='visible' → reject-taste at brutal (cinematic suffering risk)
- accidentally-true score < 4 → reject-taste at brutal (*"creatively impressive instead of accidentally true"*)
- stakes_clarity decorative_emotion → reject-concept at brutal
- soft floors: pressure_specificity < 4, stakes_clarity < 5, functional_collapse_score < 4, modern compulsion missing while shared pattern present

## Wave 17 — Embodied Runtime Presence

A deliberate pivot. Waves 10–16 built immense conceptual scaffolding — 11 persistent stores, hundreds of cognition modules — but only 5 of those stores were ever visible on the `/runtime` dashboard. The deep cognition layers persisted to disk and never reached the surface. Wave 17 makes them visible. No new philosophy modules; embodiment instead.

**`lib/silenceEngine.ts`** — the unified Silence Engine. The user identified silence as the central distinction between optimization systems and civilization-scale intelligence systems. Across Waves 10–16, many independent layers emit silence signals (reality coupling recommends silence, strategic patience holds the line, autonomous action enforces silence, live coupling detects silence windows, sovereign identity rests through restraint, generative presence rests quietly). This module consolidates them into one canonical reading: a `directive` (`speak` / `hold` / `be-silent` / `go-quiet-now`), a `silence_strength` (0..10), the contributing reasons, and one statement the UI renders. Most autonomous systems maximise output. This organism protects meaning.

**`lib/deepCognitionView.ts`** — surfaces all 7 Wave 10–16 stores as a render-ready grid. Each layer gets a statement, gauges, and a tone that the dashboard reads as a coloured dot. Reality coupling, strategic future, autonomous action, reality feedback, live coupling, sovereign identity, generative presence — every layer that previously lived only in JSON is now legible at a glance.

**`/runtime` dashboard extended** — `RuntimeSnapshot` now carries the 7 Wave 10–16 states; `/api/runtime` loads them all; `manifestationCore` wires the `DeepCognitionViewModel` into the manifestation. The page renders the new `SilenceBanner` (hero strip with directive, statement, contributing reasons, and a strength bar) and the new `DeepCognitionGrid` (one card per layer with its own gauges).

Verified end-to-end: a fresh approved-run populates all 11 persistent stores; the API surfaces them; the silence engine returns `speak` under clean conditions and `go-quiet-now (10/10)` under saturation + restraint depletion + cultural storm + recovery debt; the dashboard renders all 7 deep-cognition cards with live state. Full Wave 6–16 regression remains green.

### Wave 17.2 — Runtime continuity for what restraint protected

**`lib/protectionMemoryArchive.ts`** — the first runtime-continuity layer. Every time the organism reaches an exhausted attempt limit (i.e. it actually chose not to ship), the pipeline now reads the canonical Silence Engine against the just-evolved state and persists a `ProtectionEvent` (timestamp, directive, strength, contributing reasons, statement) to `data/runtime/protection-memory.json`. Capped at 100 entries; `totalEvents` is monotonic.

**Dashboard `ProtectionTrail` panel** — the dashboard reads the archive and shows the trail: every recent moment the organism withheld, with the reasons it withheld for, and how long ago. Silence stops looking like absence and starts looking like a record.

**Self-aware restraint** — the silence reasons evolve as the state evolves. The first restraint logs only `patience-protects-future`; by the third, the engine recognises `silence-was-already-working` (because `silentLiveCoupling.silencesObserved >= 1` is now true) and `meaning-still-propagating` (because meaning persistence has risen from accumulated silence). The organism reads its own past restraint as part of the present condition.

Verified end-to-end: in a sample of 10 runs, the 5 that exhausted produced 5 protection events on disk; the API surfaces them with real timestamps; the dashboard renders the trail with directive labels, contributing-reason tags, and "Ns ago" recency. Full Wave 6–16 regression remains green.

### Wave 17.4 — Contradiction scars: wisdom from breaches

**`lib/contradictionScarsArchive.ts`** — the dark counterpart to protection memory. Where protections record what restraint refused, scars record what shipped *despite* restraint — and what each breach teaches if the organism ever reads itself back. Seven scar kinds (`overreach`, `noise`, `broken-restraint`, `meaning-dilution`, `applause-chasing`, `identity-drift`, `compulsive-action`), each with a severity and a one-line wisdom (e.g. `identity-drift` carries the lesson *"approval is not the same as being known"*).

**Pipeline hook in the approve path** — immediately after a banner is approved, the pipeline reads the actual computed values (`actOverreach.is_overreaching`, `actDignity.dignity_breach`, `actRestraintBudget.can_afford_action`, `idCapture.is_captured`, `idTruthOverPop.chose_truth`, `actCore.compulsive_automation`, `fbContradictions.any_serious_contradiction`) and writes scars for any breach the meta-critic *would* have caught at default brutality but allowed at the current setting. At default brutality nothing slips → no scars accumulate; at lenient brutality some breaches surface and become permanent record.

**Dashboard `ScarTrail` panel** — a sibling of `ProtectionTrail`, rendered side-by-side. Each entry: kind, severity, description, and the wisdom in italics. Same connecting rail as the protection trail (though the dots are squares, not circles — scars look different from protections).

**Atmospheric coherence touch** — the runtime-manifestation status dot at the top of the header now inherits the cognitive weather's breath. When silence is the move, the very heartbeat at the top of the page breathes at the same cadence as the silence banner. One nervous system.

Verified end-to-end: direct unit smoke test shows clean run → 0 scars; capture run → `identity-drift` + `applause-chasing`; overreach run → 1 scar with `gap 6/10`; full collapse → 7 scars; archive round-trips through disk. Two-event seed test shows the trail surfacing through the API with real timestamps, descriptions, and wisdom. Full Wave 6–16 regression remains green.

### Wave 17.5 — Atmospheric coherence: one nervous system

No isolated widgets. The dashboard now distributes its breath through a single source: a `data-weather` attribute on `<main>` (set from the cognitive weather) drives four CSS custom properties — `--atmos-rate`, `--atmos-gap`, `--atmos-transition`, `--atmos-vignette` — that every element subscribes to. Change the weather, and the entire page reorganises around it.

| weather | rate | gap | transition | vignette |
|---|---|---|---|---|
| awake | 0s (none) | 1.5rem | 500ms | 0 |
| flourishing | 5s | 1.5rem | 500ms | 0 |
| breathing | 4s | 1.75rem | 700ms | 0.04 |
| restrained | 7s | 2.0rem | 900ms | 0.10 |
| hushed | 11s | 2.25rem | 1200ms | 0.18 |
| strained | 2.4s | 1.25rem | 400ms | 0.06 |
| dormant | 8s | 1.5rem | 800ms | 0.18 |

Two opt-in classes — `.atmos-breathe` and `.atmos-breathe-faint` — use `animation-duration: var(--atmos-rate)`, so the cognitive pulse line, the deep-cognition tone dots, and the silence banner's transitions all breathe at the same cadence as the weather. The `.atmos-vignette` overlay deepens during inward states and dissolves during awake/flourishing — never decorative, only felt presence.

Section gaps subscribe via `style={{ gap: 'var(--atmos-gap)' }}` — so the page literally widens when the organism turns inward and tightens when it strains. The silence banner's box-shadow transitions use `var(--atmos-transition)`, so even state changes adopt the cadence the organism is in.

Verified across four weather conditions: fresh state → `awake` (no breath, brisk transitions, no vignette); hostile state (saturation + restraint depletion + storm) → `hushed` with `breathe-go-quiet` (11s breath, 2.25rem gaps, 1.2s transitions, deeper vignette); silence accumulated → `restrained`; full coherence → `flourishing`. Each weather has a distinct felt signature derived purely from persistent state. Full Wave 6–16 regression remains green.

## Wave 16 — Generative Civilization Presence (Phases 401–500)

Wave 15 made the organism unbreakable; Wave 16 asks what it gives back. The governing shift: the organism stops asking *"how do we survive reality?"* and begins asking **"how does reality become different because we existed beautifully inside it?"** State persists to `data/runtime/generative-presence.json` — civilization coherence, generative impact, beauty moments created, hope seeds planted, cynicism repelled, collective healing dispatched.

**100 modules** — the largest wave in the stack. The kernel is `civilizationCoherenceRuntime` (Phase 500). Architecturally Wave 16 spans: presence-as-field (`civilizationPresenceField`, `presenceFieldRadius`, `generativePresenceMeter`, `livingReputation→trustGravityWell/Strength/Radius`); meaning propagation (`meaningPropagationEngine`, `meaningSpreadVelocity`, `meaningSpreadFidelity`, `meaningHalfLifeTracker`, `meaningDensityField`, `meaningAnchoringRuntime`, `coherentMeaningBroadcast`, `meaningPropagationCoherence`); symbolic worldbuilding and mythogenesis (`symbolicWorldbuildingRuntime`, `symbolGenerationKernel`, `symbolicLanguageGenerator`, `symbolicCoherenceValidator`, `symbolicArtifactPersistence`, `symbolicWorldExpansionMap`, `mythogenesisLayer`, `mythDensityTracker`, `mythArchetypeMatcher`, `mythTimelinessGauge`, `mythNarrativeAlignmentScanner`); collective healing (`collectiveHealingPatterns`, `collectiveHealingDispatch`, `collectiveHealingMonitor`, `collectiveNervousSystemRepair`, `nervousSystemRegulationFlow`, `collectiveBreathRestoration`, `collectiveWoundReader`, `woundRecognitionEngine`, `healingRippleTracker`); resonance expansion (`resonanceFieldExpansion`, `resonanceWaveformAnalyzer`, `resonanceFieldCoherence`, `collectiveResonanceHarvester`); non-manipulative influence (`nonManipulativeInfluenceSystem`, `invitationOverPersuasionGovernor`, `influenceWithoutPersuasion`, `gentleTruthDelivery`, `antiPressurePresence`, `presenceAsServiceMonitor`, `presenceWithoutPerformance`, `presenceWithoutOwnership`, `presenceWithoutPredation`, `antiEngagementOptimization`, `beautyOverSpectacleGovernor`); beauty durability (`beautyPersistenceRuntime`, `beautyDurabilityScanner`, `beautyResonanceMonitor`, `beautyResonanceWithSilence`, `beautyContagionTracker`, `beautyAsTruthValidator`); anti-cynicism (`antiCynicismField`, `cynicismImmunityLayer`, `cynicismVectorScanner`, `antiNihilismRuntime`); coherent hope (`coherentHopeArchitecture`, `hopeSeedDetector`, `hopeCoherenceValidator`, `hopeWithoutDelusion`, `coherentHopeIntegrityValidator`); gift economy (`symbolicGiftEngine`, `meaningGiftLedger`, `silenceAsGiftDetector`, `symbolicRefugeProvider`, `civicTrustBuilder`); civic ethics (`symbolicSovereigntyRespect`, `pluralisticPresenceLayer`, `antiColonizationLayer`, `antiOtheringEngine`, `gentleReclamationLayer`); contagion + accountability (`generativeContagionMap`, `generativeImpactAttribution`, `generativeImpactAuditor`, `generativeAccountabilityArchive`); cadence + magnetism (`gentlePresenceCadence`, `quietPresenceMagnetism`, `quietAuthorityField`, `gentleStrengthIndex`, `restingPresenceMonitor`, `presenceOfferingFormatEngine`); depth and joy (`substantiveDepthScanner`, `coherentJoyArchitecture`); the watchdog layer (`generativePresenceWatchdog`, `generativePresenceHealthCheck`, `civilizationCoherenceMonitor`, `civilizationFlourishingAccelerator`, `civilizationFlourishingScore`, `generativePresenceDignityCheck`, `existentialPresenceResilienceMonitor`, `generativePresenceMemoryArchive`); coherence + governance + presence check + kernel.

Wave 16 meta-critic — the governing question: **"How does reality become different because we existed beautifully inside it?"** Hard gates refuse the brand that damaged reality by forcing it, extractive governance, the boundary crossed (forcing influence, manipulating, predating attention), beauty that lacks truth, the generative watchdog alert, a damaged accountability record, manipulation disguised as influence, pressuring instead of inviting, presence used to extract, engagement optimization, spectacle chosen over beauty, othering an enemy, presence layer contradicting itself, failed final presence check. An approved run that created beauty deepens civilization coherence; a forced run damages it; an exhausted run rests presence quietly in silence. Soft-floor threshold recalibrated for the 500-phase stack: **lenient=130 · default=117 · brutal=105**.

Verified by `scripts/test-generative-presence.ts` — 31 checks across the field, propagation, trust gravity, worldbuilding, mythogenesis, healing patterns, resonance expansion, non-manipulative influence, beauty persistence, anti-cynicism, coherent hope, nervous system repair, presence meter, governance (flourishing / present / thin / extractive), boundary, presence check, coherence, integrity coherence, watchdog, accountability, beauty over spectacle, anti-othering, gift engine, predation refusal, engagement optimization refusal, beauty-as-truth, wound recognition, hope seeds, persistence, and the kernel synthesis. 31/31 pass.

## Wave 15 — Identity Preservation Under Live Reality (Phases 321–400)

Wave 14 coupled the organism to live reality; Wave 15 answers the new danger that comes with that depth — identity corruption through audience capture, populist drift, memetic infiltration, and approval-chasing. The governing shift: the organism stops asking *"how do we adapt to the world?"* and begins asking **"how do we remain ourselves while touching the world deeply?"** State persists to `data/runtime/identity.json` — sovereignty score, core integrity, truth-chosen vs popularity-chosen counts, audience-capture events, immune responses.

**80 modules** — the largest wave in the stack. Core invariants and immune response (`coreIdentityInvariantEngine`, `civilizationImmuneSystem`, `identityImmuneResponse`, `identityInvariantValidator`); the sovereign-vs-captured tradeoffs (`truthOverPopularityGovernor`, `audienceCaptureDetection`, `approvalChasingScanner`, `populistDriftDetector`, `populistTemptationGauge`, `resonanceWithoutSubmission`); anti-assimilation (`antiAssimilationLayer`, `memeticCorruptionScanner`, `assimilationPressureMonitor`, `culturalGravityResistance`, `opinionStormImmunity`, `identityMimicryDetector`, `audienceMirroringDetector`, `alienBeliefIntrusion`); drift detection & recovery (`identityErosionDetector`, `identityDriftRecovery`, `identityDriftRecoveryProtocol`, `identityCorrosionPrevention`, `coreIdentityRecallMechanism`, `identityRebuildKernel`, `identityCorruptionContainment`); voice and narrative sovereignty (`sovereignNarrativeKernel`, `narrativeSovereigntyMonitor`, `coreVoiceProtector`, `voiceConsistencyMonitor`, `externalNarrativeSeparator`, `sovereignVoiceAmplifier`); the watchdog layer (`coreIdentityWatchdog`, `selfRecognitionMonitor`, `selfBetrayalDetector`, `selfBetrayalEarlyWarning`, `selfErasureScanner`, `selfReferenceLoopDetector`, `identitySelfReadout`, `selfImageVsRealityGap`); measurement (`identityIntegrityHealthScore`, `identityResilienceMonitor`, `identityCohesionGravity`, `identityShape`, `identityFidelityArchive`, `identityCompromiseCounter`, `identityCompromiseLedger`, `corePrincipleViolationScanner`, `coreBeliefIntegrityValidator`, `coreTruthSentinel`, `identityCenterOfGravity`); pressure handling (`identityShapingPressureField`, `externalPressureBufferLayer`, `externalCaptureRiskAuditor`, `identityCoherenceUnderPressure`, `populationPressureAttribution`, `trendPullForceMonitor`); sovereignty enforcement (`sovereigntyVerifier`, `sovereigntyEnforcementBudget`, `identitySovereigntyBudget`, `identitySovereigntyForceField`, `sovereignActionFilter`, `sovereignDecisionLog`, `antiAdaptationOverride`, `identityBoundaryEnforcement`, `popularitySignalDecoupler`, `externalValidationDependence`, `reactiveBehaviorDetector`, `identityCalibrationEngine`, `identityAnchorMaintenance`, `identityCorruptionLogger`, `identityBleedingPreventionLayer`, `coreSelfActivationCheck`, `coreSelfMaintenanceRuntime`, `identitySustenanceMonitor`, `selfDoubtRegulator`); coherence + governor + presence check + resilience monitor — and the kernel `existentialIntegrityEngine` (Phase 400) as the closing synthesis.

Wave 15 meta-critic — the governing question: **"How do we remain ourselves while touching the world deeply?"** Hard gates refuse the brand captured by the world it touches, captured governance, violated core invariants, audience capture detected, truth abandoned for popularity, identity boundary crossed, self-betrayal detected, core principle violated, memetic corruption, submission disguised as resonance, identity layer contradicting itself, center of gravity migrated off founding truth, and watchdog alerts. An approved run that chose truth deepens sovereignty; a run captured by popularity logs corruption; an exhausted run rests identity in restraint. Soft-floor threshold recalibrated for the 400-phase stack: **lenient=113 · default=102 · brutal=91**.

Verified by `scripts/test-sovereign-identity.ts` — 21 checks across invariants, immune system, anti-assimilation, truth-over-popularity, audience capture, memetic corruption, resonance without submission, drift recovery, sovereign narrative, approval chasing, populist drift, self-betrayal, self-recognition, sovereignty verification, center of gravity, principle violations, boundary enforcement, storm immunity, cultural gravity resistance, governance, presence, coherence, persistence, and the kernel synthesis. 21/21 pass.

## Wave 14 — Live Civilization Coupling (Phases 261–320)

Wave 13 remembered feedback; Wave 14 feels reality in real time. The governing shift: the organism stops asking *"what was received?"* and begins asking **"what changed in reality because we existed?"** State persists to `data/runtime/live-coupling.json` — live presence, reality coupling depth, living reputation, cadence sync, meanings carried, novelty chased.

**60 modules** spanning live ingestion (`liveCommentIngestion`, `liveReactionStreamProcessor`), live fields (`realtimeSentimentField`, `realtimeAttentionField`, `realtimeTrustField`, `livingReputationField`), velocities and gradients (`resonanceVelocityTracking`, `realtimeMoodVelocity`, `sentimentFieldGradient`, `culturalPressureGradient`, `reputationFieldVelocity`), the audience nervous system (`audienceStressDetection`, `stressContagionTracker`, `nervousSystemPulseMonitor`, `audienceCollectivePulse`, `audienceAttentionDecay`), live cultural weather (`culturalWeatherRuntime`, `culturalFrontDetection`), narrative contagion (`narrativeContagionMap`, `narrativeSpreadingVelocity`, `narrativeMutationDuringSpread`, `realtimeNarrativeOrientation`), meaning vs novelty (`meaningVsNoveltyEngine`, `meaningDensityAnalyzer`, `noveltyDecayTracker`, `delayedMeaningRecognition`, `slowSignalAmplifier`), silence as instrument (`strategicSilenceTiming`, `silenceWindowDetector`), live presence (`realityPresenceMeter`, `realityPresenceVerifier`, `civilizationCouplingPresenceCheck`), live impact (`liveImpactDetector`, `realityChangeAttribution`, `realityChangeLedger`, `realityChangeAttributionAuditor`), drift correction and anchoring (`liveDriftDetection`, `liveCouplingDriftCorrection`, `liveCouplingResonanceAnchor`), crisis vs opportunity (`crisisSignalDetector`, `realtimeOpportunityDetector`, `realtimeContextWindowMonitor`, `realtimeContradictionField`), boundary, dignity, health, integrity, coherence, cadence, civilization-state, memory archive, governor — and the kernel `civilizationCouplingKernel` (Phase 320) as the closing synthesis.

Wave 14 meta-critic — the governing question: **"What changed in reality because we existed?"** Hard gates refuse the organism that is absent from the reality it claims to act on, severed live coupling, an active live crisis, the live-coupling boundary crossed (chasing virality over meaning, performing for the field, riding a crisis for reach), a reality-change attribution that fails second-order audit, an internally incoherent live layer, detected drift, acute audience stress, strategic silence being called for, novelty over meaning without justification, a failed final presence check, lost live coupling integrity, and undignified live behavior. An approved run that generated meaning deepens coupling and raises presence; a run that chased novelty thins coupling; an exhausted run holds presence through strategic silence. Soft-floor threshold recalibrated for the 320-phase stack: **lenient=95 · default=85 · brutal=76**.

Verified by `scripts/test-live-coupling.ts` — 29 checks across live ingestion, sentiment field, resonance velocity, audience stress, cultural weather, narrative contagion, delayed meaning, meaning vs novelty, strategic silence, living reputation, stress contagion, nervous pulse, crisis vs opportunity, drift, presence verification, live impact, attribution audit, coupling health, boundary, integrity, coherence, governance, persistence, and the kernel synthesis. 29/29 pass.

## Wave 13 — Reality Feedback Infrastructure (Phases 221–260)

Wave 12 let the organism act; Wave 13 closes the loop with reality itself. The governing shift: the organism stops asking *"did we publish?"* and begins asking **"what did this action become inside real human nervous systems over time?"** State persists to `data/runtime/feedback.json` — trust net gain across the campaign's life, resonance curve, contradictions found, slow truths detected, and a record of how every action was actually received.

| Phase | Module | Role |
|---|---|---|
| 221 | `realAudienceReactionIngestion` | Ingests reactions from the world. |
| 222 | `trustShiftDetection` | Reads the direction and magnitude of trust shifts. |
| 223 | `resonanceDecayTracking` | Distinguishes healthy decay from collapse. |
| 224 | `silenceImpactMeasurement` | Measures silence as its own kind of action. |
| 225 | `emotionalTruthAlignment` | Compares intended feeling to received feeling. |
| 226 | `contradictionFeedbackScanner` | Catches gaps between claim and reception. |
| 227 | `delayedImpactAttribution` | Credits today's shift to its actual earlier cause. |
| 228 | `collectiveMoodInference` | Infers the felt tone beneath the signal scatter. |
| 229 | `memeticIntegrityTracking` | Tracks how meaning mutates as it spreads. |
| 230 | `adaptiveIdentityCorrection` | Proposes the smallest correction that preserves identity. |
| 231 | `feedbackSignalQualityFilter` | Separates updatable signal from noise. |
| 232 | `emotionalEchoTracker` | Reads how long the action keeps reverberating. |
| 233 | `audienceNervousSystemReadout` | Reads the audience as a nervous system. |
| 234 | `reactionLatencyAnalyzer` | Reflex vs reflection — from when reactions arrived. |
| 235 | `sentimentDriftDetector` | Catches the slow drift and the sign reversal. |
| 236 | `reactionAuthenticityVerifier` | Distinguishes honest warmth from performed enthusiasm. |
| 237 | `actionResultLedger` | Pairs every action with its actual outcome. |
| 238 | `feedbackBiasFilter` | Counterweights the organism reading itself flatteringly. |
| 239 | `reactionPatternMemory` | Names recurring patterns across cycles. |
| 240 | `feedbackToIdentityBridge` | Routes signal up to identity — only on strong signal. |
| 241 | `feedbackToStrategyAdjustment` | Proposes concrete strategy adjustments. |
| 242 | `feedbackToExecutionRefinement` | Proposes concrete execution refinements. |
| 243 | `temporalImpactCurve` | The shape of impact in the time dimension. |
| 244 | `narrativeReceptionMapping` | The story told vs the story received. |
| 245 | `counterNarrativeDetection` | Flags when the audience writes its own version. |
| 246 | `secondHandResonanceTracking` | The action being carried by other people. |
| 247 | `silenceAsFeedbackInterpreter` | Attentive silence vs forgotten silence. |
| 248 | `reactionGenreClassifier` | Applause vs recognition vs argument vs indifference. |
| 249 | `trustEvolutionGraph` | The long arc — building, plateau, declining, volatile. |
| 250 | `meaningPersistenceTracker` | Did the meaning outlive the moment? |
| 251 | `falseSuccessDetector` | Catches applause that quietly cost trust. |
| 252 | `feedbackContradictionResolver` | Resolves contradictory feedback signals. |
| 253 | `slowMovingTruthDetector` | Finds slow truths under the noisy fast signals. |
| 254 | `feedbackSignalIntegrityValidator` | Refuses to update beliefs on unsound feedback. |
| 255 | `feedbackEcologyMonitor` | Healthy / thin / polluted / collapsed feedback ecology. |
| 256 | `feedbackMemoryArchive` | The organism's persisted memory of feedback. |
| 257 | `realityAttributionAuditor` | Refuses credit when the world shifted on its own. |
| 258 | `feedbackCoherenceValidator` | Catches the feedback layer contradicting itself. |
| 259 | `realityFeedbackGovernor` | Reality-evolving, learning, echo-chamber, or blind. |
| 260 | `civilizationFeedbackLoopCore` | Persistent feedback state + closing synthesis. |

Wave 13 meta-critic — the governing question: **"What did this action become inside real human nervous systems over time?"** The hard gates refuse the organism that has closed into an echo chamber, is acting blind to what its actions become, has produced false success that cost trust, is being received as a serious contradiction of what it claimed, has lost feedback signal integrity, has failed reality attribution (claiming credit for shifts the world produced on its own), has an internally incoherent feedback layer, has collapsed its feedback ecology, has a counter-narrative forming around it, or would harm an already-fatigued audience nervous system with another action. An approved run with coherent reception accrues trust and resonance; a run whose reception contradicts intent logs the contradiction and erodes trust; an exhausted run lets silence settle — meaning persistence rises, slow truths surface. Soft-floor threshold recalibrated for the 260-phase stack: **lenient=83 · default=74 · brutal=67**.

Verified by `scripts/test-reality-feedback.ts` — 33 checks across ingestion, trust shift, resonance decay, silence impact, emotional truth, contradictions, delayed attribution, collective mood, memetic integrity, identity correction, signal quality, bias filter, authenticity, nervous system, latency, genre, narrative reception, counter-narrative, second-hand resonance, silence-as-feedback, sentiment drift, trust evolution, meaning persistence, false success, slow truth, signal integrity, ecology, reality attribution, coherence, governance, persistence, and the closing synthesis. 33/33 pass.

## Wave 12 — Autonomous Action Architecture (Phases 181–220)

Wave 11 reasoned about futures; Wave 12 lets the organism **act** — but never compulsively. Every action must pass through eight strategic gates (identity, resonance, trust, timing, strategic debt, audience capacity, reality coupling, future preservation) and then through worthiness, dignity, intent, and boundary checks. The governing shift: the organism stops asking *"can we act?"* and starts asking **"should this action exist in the world at all?"** State persists to `data/runtime/execution.json` — restraint budget, audience recovery debt, cadence health, and a ledger of every action taken or withheld.

| Phase | Module | Role |
|---|---|---|
| 181 | `actionAuthorizationRuntime` | The eight-gate gate every action passes through. |
| 182 | `actionExistenceJustification` | Answers "should this action exist at all?" |
| 183 | `strategicPublishEngine` | Publish, hold, or withhold. |
| 184 | `adaptiveCampaignDeployment` | Sets deployment intensity to conditions. |
| 185 | `platformExecutionGovernor` | Reads when the platform itself would corrupt execution. |
| 186 | `trustAwareOptimization` | Optimization that respects the trust account. |
| 187 | `audienceRecoveryScheduler` | Treats audience attention as finite and replenishable. |
| 188 | `silenceEnforcementLayer` | Hard-stops execution when silence is called. |
| 189 | `adaptivePacingEngine` | The rhythm of action — sparse under strain, steady when healthy. |
| 190 | `executionRiskManagement` | Sizes execution risk before it reaches the audience. |
| 191 | `narrativeContinuityEnforcement` | Catches tonal breaks and contradictions in execution. |
| 192 | `strategicRolloutIntelligence` | Lead, build, sustain, or pause the rollout. |
| 193 | `resonancePreservingOptimization` | Checks optimization did not sand the soul off the action. |
| 194 | `executionMemoryPersistence` | The organism's honest record of action. |
| 195 | `autonomousExperimentationRuntime` | Bounded, reversible experimentation only. |
| 196 | `escalationVsRestraintEngine` | When in doubt, restrain. |
| 197 | `campaignMutationControl` | Bounds how far a single action may mutate the whole. |
| 198 | `feedbackToStrategyBridge` | Routes execution learning back up to strategy. |
| 199 | `actionConsequenceTracker` | Holds the organism accountable to consequences. |
| 200 | `compulsiveAutomationDetector` | **THE CRITICAL GUARD** — catches automation masquerading as action. |
| 201 | `actionDignityMonitor` | No pleading, manipulating, or shouting. |
| 202 | `executionLoadBalancer` | Sheds load before taking on another action. |
| 203 | `overReachDetector` | Flags action that reaches past what standing can hold. |
| 204 | `actionReversibilityPlanner` | Plans the path back, or insists on a higher bar. |
| 205 | `deploymentWindowGovernor` | Refuses to force action through a closed window. |
| 206 | `restraintBudgetRuntime` | Restraint as finite, replenishable resource. |
| 207 | `actionIntentVerifier` | Genuine purpose vs habit, performance pressure, or fear of silence. |
| 208 | `executionCadenceMemory` | Is the campaign breathing, or flooding? |
| 209 | `autonomousActionThrottle` | Final rate limiter on autonomy. |
| 210 | `actionWorthinessEvaluator` | Merges every action signal into one verdict — worthy or not. |
| 211 | `channelExecutionRouting` | Routes the action to the channel where it can land. |
| 212 | `executionFeedbackLoop` | Closes the observe-report-adjust loop. |
| 213 | `strategicWithholdingEngine` | Withholding as a positive strategic move. |
| 214 | `actionPortfolioBalancer` | Catches the campaign tilting entirely into doing. |
| 215 | `executionHealthMonitor` | Continuous health of the action layer. |
| 216 | `autonomyBoundaryEnforcement` | What the organism will never do autonomously. |
| 217 | `actionAccountabilityLedger` | The defensible record of action and restraint. |
| 218 | `executionCoherenceValidator` | Catches the action layer contradicting itself. |
| 219 | `autonomousActionGovernor` | Governed-action, restraint, drifting, or compulsive. |
| 220 | `autonomousExecutionSynthesisCore` | Persistent execution state + closing synthesis. |

Wave 12 meta-critic — the governing question: **"Should this action exist in the world at all?"** The hard gates refuse a compulsive run at brutality ≥ 0.55 (the lowest threshold in the entire stack — compulsion is the line that cannot be crossed); the autonomy boundary being crossed, authorization denied, the throttle closed, silence challenged, the action undignified or driven by non-genuine intent, the action unworthy, the deployment window closed, restraint cannot be afforded, overreach, trust-aware optimization violated, irreversible action without overwhelming case, unmanaged risk, narrative break, execution incoherence, or compulsive/drifting governance. An approved run that was governed evolves the action layer; a compulsive run that slips a low brutality gate logs the compulsion and collapses restraint; an exhausted run is withholding — replenishing restraint and paying down audience recovery debt. Soft-floor threshold recalibrated for the 220-phase stack: **lenient=75 · default=67 · brutal=60**.

Verified by `scripts/test-autonomous-action.ts` — 27 checks across authorization, existence justification, publish/deployment/platform, trust-aware optimization, audience recovery + silence enforcement, pacing/risk/narrative continuity, the compulsion detector, dignity + intent, restraint budget + throttle + overreach, autonomy boundary, worthiness + governance, coherence + withholding + portfolio + memory, persistence, and the closing synthesis. 27/27 pass.

## Wave 11 — Strategic Future Intelligence (Phases 151–180)

Wave 10 coupled the organism to *present* reality. Wave 11 lets it reason across **futures** — months, quarters, reputation arcs, cultural shifts, second-order consequences, identity continuity across the long horizon. The governing shift: the organism stops asking *"what works now?"* and starts asking **"what future are we compounding toward?"** The strategic state — compounding advantage, strategic debt, the future being built toward — persists to `data/runtime/strategic-future.json`.

| Phase | Module | Role |
|---|---|---|
| 151 | `futureScenarioSimulation` | Simulates the best, worst, and most-likely futures the organism could walk into. |
| 152 | `strategicTimelineBranching` | Lays out the branching timelines and names the one the organism can survive on. |
| 153 | `narrativeFutureMapping` | Maps where the campaign narrative is heading and how far it has drifted from origin. |
| 154 | `culturalShiftPrediction` | Predicts the cultural shift the organism will be speaking into. |
| 155 | `reputationFutureModeling` | Projects reputation as an arc — rising, plateauing, eroding. |
| 156 | `trustCompoundingEngine` | Models trust not as addition but as compounding. |
| 157 | `marketTimingIntelligence` | Reads the timing of the moment — too early, ripe, closing, missed. |
| 158 | `strategicPatienceRuntime` | Decides when the deliberate wait compounds more than acting. |
| 159 | `secondOrderConsequenceEngine` | Traces past the first-order win into the hidden second-order cost. |
| 160 | `antiFragilityFutureArchitecture` | Reads whether disorder would strengthen the future or break it. |
| 161 | `blackSwanSensitivityMapping` | Maps exposure to the unmodelled, low-probability shock. |
| 162 | `competitorEvolutionSimulation` | Simulates where the competitive field is heading. |
| 163 | `ecosystemPressureForecasting` | Forecasts the ecosystem tightening or loosening. |
| 164 | `identityContinuityPlanner` | Plans for the organism still being itself at the end of the horizon. |
| 165 | `strategicSacrificeEngine` | Decides what to give up now to buy a better future. |
| 166 | `horizonScanningEngine` | Scans the far horizon for the weak signals of a forming opportunity. |
| 167 | `opportunityCostLedger` | Tracks the cost of the futures not walked toward. |
| 168 | `compoundingAdvantageTracker` | Watches the edge that grows on itself. |
| 169 | `strategicDebtMonitor` | Tracks the debt every present-optimized decision borrows from the future. |
| 170 | `futureMemoryArchive` | Remembers past predictions to calibrate the organism's forecasting. |
| 171 | `longHorizonRiskBalance` | Balances long-horizon risk against reward. |
| 172 | `irreversibilityDetector` | Flags the decisions that cannot be undone. |
| 173 | `strategicOptionalityEngine` | Keeps the organism's future options open. |
| 174 | `generationalStrategyLayer` | Asks whether the strategy outlives the generation that made it. |
| 175 | `futureIdentityProjection` | Projects who the organism becomes if it keeps deciding this way. |
| 176 | `strategicConvictionEngine` | Decides when to hold conviction through noise and when to adapt. |
| 177 | `temporalArbitrageDetector` | Detects time-asymmetric opportunities. |
| 178 | `futureCoherenceValidator` | Catches a future plan that contradicts itself. |
| 179 | `strategicFutureGovernor` | Governs the layer — compounding, drifting, or now-optimizing. |
| 180 | `autonomousStrategicPlanningCore` | The persistent strategic state and closing synthesis — compounding a future, or optimizing for now? |

Wave 11 meta-critic — the governing question: **"What future are we compounding toward?"** A run that optimizes for what works now — spending the future for a present gain — is refused at default brutality. The meta-critic refuses a negative second-order consequence, a moment that calls for strategic patience, dangerous strategic debt, an irreversible decision that abandons identity continuity, a fragile future, an incoherent future plan, and an identity that does not survive the horizon. A run that compounds toward a future grows the advantage; a run that optimizes for now accrues strategic debt; an exhausted run that ships nothing is strategic patience. Soft-floor threshold recalibrated for the 180-phase stack: **lenient=67 · default=59 · brutal=53**.

Verified by `scripts/test-strategic-future.ts` — 22 checks across scenario simulation, timeline branching, narrative/cultural/reputation/trust futures, market timing and strategic patience, second-order cost, anti-fragility, black-swan exposure, competitor and ecosystem forecasting, identity continuity, strategic sacrifice and debt, compounding advantage, irreversibility, future identity projection, coherence validation, governance, persistence, and the closing synthesis. 22/22 pass.

## Wave 10 — Reality Coupling Architecture (Phases 131–150)

Waves 1–9 built an organism that lives, governs itself, and shows itself — but it had been living almost entirely *inside itself*. Wave 10 is **reality coupling**: the organism stops being self-referential and begins **learning from the external world** — audience behaviour, trust formation, emotional fatigue, the narrative climate, attention economics, saturation, authenticity, reputation pressure, platform drift, and real-world contradiction. The coupling state — trust, authenticity, saturation — persists to `data/runtime/reality-coupling.json` and compounds across cycles.

| Phase | Module | Role |
|---|---|---|
| 131 | `realityIngestionEngine` | The intake — how much real external signal is reaching the runtime. |
| 132 | `engagementTruthScoring` | Scores whether engagement would reflect a real truth, or only stimulus. |
| 133 | `emotionalSaturationMap` | Maps where the audience's emotional bandwidth is already spent. |
| 134 | `trustDecayEngine` | Models how trust forms slowly and decays fast. |
| 135 | `narrativeClimateMonitor` | Watches the external storytelling weather continuously. |
| 136 | `audienceNervousSystemModel` | Models the audience as a nervous system with its own fatigue and threshold. |
| 137 | `platformDriftRuntime` | Detects the distribution environment drifting toward noise. |
| 138 | `authenticityErosionTracker` | Tracks the authenticity reserve eroding when stimulus is chased. |
| 139 | `silenceRecommendationRuntime` | Says *not now* — when adding nothing is the strongest coupling. |
| 140 | `reputationPressureEngine` | Reads whether reputation is being protected or extracted. |
| 141 | `meaningCompressionEngine` | Detects meaning being hollowed faster than it can be made. |
| 142 | `socialExhaustionDetector` | Reads when the whole collective is simply tired. |
| 143 | `attentionEconomyPressure` | Names the pull to post more and louder — as pressure, not instruction. |
| 144 | `contradictionDetectionLayer` | Catches the organism's self-model diverging from reality. |
| 145 | `worldFeedbackFusion` | Fuses the scattered external signals into one coherent reading. |
| 146 | `trueResonanceDetector` | The core distinction — true resonance versus stimulus addiction. |
| 147 | `realityCouplingGovernor` | Holds the band between over-coupled (addicted) and decoupled (solipsist). |
| 148 | `externalRealityModel` | Reports how faithfully the organism's model tracks the real world. |
| 149 | `couplingHealthMonitor` | Watches the coupling itself for failure. |
| 150 | `realityCouplingCore` | The persistent coupling state and closing synthesis — coupled, or addicted? |

Wave 10 meta-critic — the governing question: **"Is this true resonance with reality, or stimulus addiction?"** An organism chasing stimulus spends authenticity for reach and is refused at default brutality. The organism does *not* optimize for engagement alone: when the world recommends silence, when the collective is exhausted, when the engagement would read as stimulus, when the organism is over-coupled to feedback, when its self-model contradicts reality, or when the coupling is failing — the run is refused. Resonance compounds trust; stimulus erodes authenticity; honored silence lets the audience recover. Soft-floor threshold recalibrated for the 150-phase stack: **lenient=59 · default=51 · brutal=45**.

Verified by `scripts/test-reality-coupling.ts` — 20 checks: ingestion reads whether the world is speaking, engagement-truth separates stimulus from resonance, saturation / trust decay / narrative climate / audience nervous system / platform drift / authenticity erosion / social exhaustion / silence recommendation / meaning compression / attention economy / reputation pressure / contradiction detection all read real external state, the true resonance detector tells resonance from stimulus addiction, the governor holds the healthy band, the coupling state persists, and the closing synthesis distinguishes a coupled organism from an addicted one. 20/20 pass.

## Wave 9 — Manifestation Architecture (Phases 111–130)

Waves 1–8 built a mind. Wave 9 gives it a **body**. The cognitive operating system becomes a **living, visible runtime** — a dashboard at `/runtime` that is not analytics software but a window into an organism thinking. The critical rule of the wave: the UI is *not* separate from cognition. Every visible surface is built from the persistent runtime state — `organism.json`, `os-runtime.json`, `civilization.json`, `world-psychology.json`, the runtime memory — by a manifestation module. No fabricated widgets, no disconnected analytics; `GET /api/runtime` assembles one snapshot and the page renders only what the modules derive from it.

| Phase | Module | Role |
|---|---|---|
| 111 | `runtimeUIBrain` | The foundation — defines the runtime snapshot and decides the one thing a viewer feels first: alive, or dormant. |
| 112 | `organismStateView` | The organism's vital signs — energy, stress, complexity, vitality — surfaced as gauges. |
| 113 | `cognitivePulseView` | The runtime's heartbeat — a rate, an amplitude, a rhythm, a waveform the UI animates. |
| 114 | `cognitionTimelineView` | Directives, civilization sessions, and verdicts ordered into one live history. |
| 115 | `directiveStreamView` | The executive's voice — the current directive and the stream behind it. |
| 116 | `memoryGraphView` | Beliefs, myths, scars, laws, and immune records drawn as a graph. |
| 117 | `worldStateMonitorView` | The reality the organism lives inside, surfaced as pressure gauges. |
| 118 | `attentionPressureMapView` | External, internal, and runtime pressure laid onto a heat field. |
| 119 | `strategicSeasonMonitorView` | Which of the seven seasons the runtime is living in. |
| 120 | `driftMonitorView` | Whether the runtime is holding its line or sliding, read from history. |
| 121 | `executiveCouncilView` | The civilization's council — reputation standing and recent sessions. |
| 122 | `internalConflictView` | The live tensions — optimization vs identity, unhealed scars, fragmentation. |
| 123 | `identityStateView` | The governing question, made visible: is the organism still itself? |
| 124 | `interruptSurfaceView` | How interrupted the organism's cognition has been across its life. |
| 125 | `runtimeHealthView` | The operating system's own vital signs — coordination, fragmentation. |
| 126 | `escalationSurfaceView` | The decision ledger — shipped, refused, or held in silence. |
| 127 | `runtimeOrchestrationView` | The OS control surface — posture, season, directive, coordination. |
| 128 | `livePresenceLayer` | The layer that makes the runtime feel present — breathing, slow, or dormant. |
| 129 | `manifestationLayout` | The runtime composes how it should be seen — the foreground surface becomes hero. |
| 130 | `manifestationCore` | The aggregator and closing synthesis — builds every surface, answers: is the runtime visible and true to cognition? |

The wave's governing rule — **the UI must emerge directly from persistent runtime state** — is enforced by construction: `buildRuntimeManifestation` builds all eighteen surfaces from one snapshot, the `/api/runtime` route serves it, and the `/runtime` page renders the manifestation and nothing else. The dashboard polls on an interval so a viewer watches the organism think in real time. Verified by `scripts/test-manifestation.ts` — 16 checks: a dormant runtime manifests honestly, a booted runtime manifests as alive, vital signs / pulse / directives / timeline / season / world-state / pressure / memory / identity / decision-ledger / drift all surface from real state, the layout promotes the foreground surface to hero, every surface is true to cognition, and a distressed runtime manifests as critical. 16/16 pass.

## Wave 8 — Operating System Genesis (Phases 91–110)

Wave 7 made the system a living organism. Wave 8 gives that organism an **operating system**. Up to this point the engine was a collection of cognitive capabilities; now it becomes **a persistent cognitive operating system that coordinates cognition continuously** — a kernel runs the loop, a scheduler allocates attention, interrupts pre-empt it, a directive engine governs every tick, and the runtime heals itself. Every run is one kernel tick; the OS's persistent runtime state — uptime, operational posture, strategic season, directive log — carries to `data/runtime/os-runtime.json`.

| Phase | Module | Role |
|---|---|---|
| 91 | `cognitiveKernel` | The central persistent runtime loop — the organism's heartbeat; nothing runs outside it. |
| 92 | `processScheduler` | Decides which cognitive processes get attention, priority, and an execution window. |
| 93 | `interruptArchitecture` | The global interruption system — world shifts, fatigue, identity risk, emergencies pre-empt cognition. |
| 94 | `strategicTaskQueue` | The long-lived priority queue — deferred thinking, carried across ticks, adaptively reprioritised. |
| 95 | `runtimeResourceAllocation` | Allocates attention, memory, energy, reasoning depth, and bandwidth. |
| 96 | `activeCognitionGraph` | The live working set — active thoughts, conflicts, tensions, and their dependencies. |
| 97 | `directiveEngine` | The top-level executive — issues one governing directive per tick (pause / publish / hibernate / …). |
| 98 | `autonomousRuntimeLoops` | Background loops that keep evolving cognition between banners. |
| 99 | `strategicPauseInfrastructure` | The system-wide pause — light observation, deep pause, full recovery. |
| 100 | `kernelHealthMonitor` | Tracks the five ways a runtime fails — overload, fragmentation, addiction, exhaustion, decay. |
| 101 | `memoryPressureManagement` | Manages memory like RAM — compress, archive, resurface, strategically forget. |
| 102 | `multiHorizonPlanning` | Plans the next banner, the season, the civilization, and survival at once. |
| 103 | `recursiveReflectionEngine` | The runtime reflects on its own operational structure each tick. |
| 104 | `executiveArbitrationCourt` | Resolves conflicts between growth, truth, identity, survival, engagement, restraint. |
| 105 | `runtimeIdentityEnforcement` | Protects core identity across *every* process, not just the foreground one. |
| 106 | `dynamicStrategicSeasons` | The runtime moves through growth / silence / observation / recovery / expansion / defense / hibernation. |
| 107 | `cognitiveDependencyMapping` | Maps the hidden dependencies so the OS sees which change would cascade. |
| 108 | `autonomousRuntimeStabilization` | Self-healing — corrects drift, sheds load, defragments, emergency-stabilises. |
| 109 | `persistentExecutiveState` | The runtime remembers its operational posture over time, not just its memories. |
| 110 | `operatingSystemCore` | The persistent OS runtime state and the closing synthesis — coordinated, or fragmenting? |

Wave 8 meta-critic — the governing question: **"Did this action emerge from coordinated organism cognition, or from isolated process stimulation?"** When isolated processes dominate, the runtime is fragmenting and the banner is refused at default brutality. The directive engine's executive command is enforced — when the OS itself commands a withholding posture, the runtime does not ship; an identity breach anywhere in the runtime is refused; an unstable runtime must emergency-stabilise before it produces; a short-horizon move that contradicts a long-horizon need is refused. Soft-floor threshold recalibrated for the 110-phase stack: **lenient=52 · default=44 · brutal=38**.

Verified by `scripts/test-os-genesis.ts` — 19 checks: the kernel boots / runs / enters protected mode, the OS state persists across a restart, the scheduler never starves identity-defense, interrupts pre-empt cognition, the task queue reprioritises on a severe interrupt, resource allocation detects over-subscription, the directive engine governs the tick, the health monitor names every failure mode, memory pressure acts under load, the arbitration court refuses engagement-alone, identity enforcement blocks violations, seasons change when reality calls, the pause infrastructure enters a system-wide pause, stabilization emergency-heals an unstable runtime, recursive reflection knows when its structure is failing, multi-horizon planning flags a horizon conflict, dependency mapping flags a fragile cascade, executive state detects posture drift, and the closing synthesis distinguishes a coordinated runtime from a fragmenting one. 19/19 pass.

## Wave 7 — Reality Organism Architecture (Phases 71–90)

Wave 6 gave the civilization **history**. Wave 7 makes it a **living organism interacting continuously with a changing reality**. It is no longer a system that thinks about the past — it is a body that must survive the present: it has finite energy that depletes with action and restores with rest, it runs an immune system with memory, it reads the environment it lives inside, it predicts strategic seasons, it protects itself from existential risk — and, above all, it **learns when *not* to act**. The organism's vital state persists to `data/runtime/organism.json`; every run either spends the body (a banner ships) or rests it (the run produces nothing).

| Phase | Module | Role |
|---|---|---|
| 71 | `environmentalPressureMapping` | Maps the external pressure the organism is living inside into one environmental load. |
| 72 | `cognitiveImmuneSystem` | Defends against cognitive infection; recognises a pathogen it has survived before. |
| 73 | `strategicEnergyAllocation` | Decides how much of the organism's finite energy this run deserves — or none at all. |
| 74 | `narrativeClimateDetection` | Reads the storytelling weather — whether the climate would swallow a quiet true banner. |
| 75 | `identityStressTesting` | Stress-tests the identity before acting: under this run's pressures, would it hold? |
| 76 | `expansionVsPreservation` | Balances growth against survival — expand, hold, or retrench. |
| 77 | `realityRhythmSynchronization` | Synchronises to reality's rhythm — speak on the culture's exhale, rest on its inhale. |
| 78 | `collectiveAttentionForecasting` | Forecasts where collective attention is heading and positions for it. |
| 79 | `memeticThreatDetection` | Detects memetic pathogens that would rewrite the organism's voice. |
| 80 | `civilizationFatigueMonitoring` | Monitors the accumulated fatigue of the whole organism across its life. |
| 81 | `strategicSilenceIntelligence` | The intelligence of silence — when not acting is the stronger move. |
| 82 | `emotionalResourceManagement` | Manages the finite emotional-intensity budget so something is left for the moment that matters. |
| 83 | `adaptiveWorldStateModeling` | Measures how fast reality is shifting and whether the organism's model keeps up. |
| 84 | `longHorizonPrediction` | Predicts the coming strategic season and what the organism must become to remain itself. |
| 85 | `internalComplexityRegulation` | Regulates a 90-phase cognition stack against collapse under its own complexity. |
| 86 | `strategicEvolutionGovernance` | Governs the pace of evolution — permits gradual change, refuses sudden mutation. |
| 87 | `realityAdaptiveRuntime` | Synthesises the environmental readings into one adaptive posture. |
| 88 | `autonomousStabilityPreservation` | Autonomic self-preservation — calls for rest before continued action threatens stability. |
| 89 | `existentialRiskLayer` | Detects the convergence of conditions that threaten the organism itself. |
| 90 | `persistentOrganismCore` | The organism's persistent vital state and the closing synthesis: adapting, or addicted? |

Wave 7 meta-critic — the governing question: **"Is the organism adapting to reality, or compulsively reacting to stimulation?"** An organism governed by stimulation is addicted; one governed by identity survives. Addiction is a refusal at default brutality; an organism at existential risk must stop and protect its core; a memetic pathogen and a failed identity stress test are refused; a sudden mutation is refused. And — the Wave 7 lesson — when the organism's own silence intelligence judges silence the stronger move, the banner is refused: **not acting is itself the strategic decision.** Soft-floor threshold recalibrated for the 90-phase stack: **lenient=45 · default=37 · brutal=31**.

Verified by `scripts/test-reality-organism.ts` — 19 checks: action depletes energy and rest restores it, the vital state survives a restart, environmental pressure detects a hostile world, the immune system recognises a known pathogen, energy allocation forces conservation when reserves are low, strategic silence learns when not to act, existential risk converges danger from multiple signals, memetic detection catches a cultural pathogen, identity stress testing fails a weak identity under load, long-horizon prediction names the coming season, evolution governance refuses a sudden mutation, the closing synthesis distinguishes adapting from addicted, and more. 19/19 pass.

## Wave 6 — Cognitive Civilization Infrastructure (Phases 56–70)

Wave 5 created disagreement. Wave 6 creates **history**. The system stops behaving like a council of agents and becomes **a living civilization of minds — with memory, hierarchy, law, culture, and evolution**. No internal behaviour is agent theatre: every belief, scar, myth, and law emerges from accumulated decisions, persisted across generations to `data/runtime/civilization.json`. Each run is one more year in the civilization's life.

| Phase | Module | Role |
|---|---|---|
| 56 | `institutionalMemory` | The civilization remembers its own council sessions — what governed, how earned the consensus was. |
| 57 | `culturalDriftEngine` | Tracks where the culture has drifted; flags narrowing into a monoculture. |
| 58 | `beliefPersistence` | A judgement reached and vindicated across generations becomes an inherited belief. |
| 59 | `strategicMythology` | Defining, hard-won decisions become the founding myths the civilization governs by. |
| 60 | `internalReputationEconomy` | Standing becomes a resource — entities earn and spend it on the positions they take. |
| 61 | `trustAuthorityGraph` | Trust and authority among the entities; flags over-concentration. |
| 62 | `ideologicalMutationDetection` | Compares recent reasoning against the founding character — catches the slow corruption of belief. |
| 63 | `psychologicalScarMemory` | Wounds from past failures become scars the civilization flinches from. |
| 64 | `historicalDecisionArchive` | Every decision archived with context — so any decision can be explained historically. |
| 65 | `cognitiveLawSystem` | A pattern refused enough times becomes a standing law the civilization no longer re-debates. |
| 66 | `executiveEthicsRuntime` | The moral constraints the civilization will not cross even when strategy permits them. |
| 67 | `internalPoliticalDynamics` | Coalitions, opposition blocs; flags a one-party council. |
| 68 | `autonomousLongTermPlanning` | Plans across generations from memory, beliefs, drift, and scars. |
| 69 | `civilizationStabilityLayer` | Monitors decay — optimization beating identity, cultural narrowing, ideological mutation. |
| 70 | `emergentIdentityContinuity` | The closing synthesis — has the identity persisted across the civilization's entire life? |

Wave 6 meta-critic — the governing question: **"Did this decision emerge from accumulated civilization memory, or from temporary optimization pressure?"** A standing cognitive law is enforced without re-debate; an executive-ethics violation is a refused moral line; a candidate reopening a severe unhealed scar is refused at brutal; and when optimization repeatedly beats identity, the civilization is flagged as decaying. Soft-floor threshold recalibrated for the 70-phase stack: **lenient=38 · default=31 · brutal=26**.

Verified by `scripts/test-cognitive-civilization.ts` — 9 checks: institutional memory accumulates across generations, cultural drift detects monoculture narrowing, beliefs persist and strengthen, laws are enacted from a repeated refusal pattern, the civilization decays when optimization beats identity, scars are recorded and flagged when reopened, executive ethics flags a moral violation, the archive survives a restart, and emergent identity continuity distinguishes memory-driven from optimization-driven decisions. 9/9 pass.

## Wave 5 — Autonomous Strategic Society (Phases 43–55)

The deepest architectural transition so far: the engine stops being *one executive intelligence* and becomes **a society of cognitive entities with competing interpretations of reality**. Before Wave 5 the system thinks; after Wave 5 it **argues with itself before acting**. No single module controls reality alone — every campaign decision emerges from internal debate, conflicting priorities, identity defense, and recorded dissent.

**The cognitive council — eleven autonomous entities**, each with an independent reasoning bias, a memory bias, and a priority it exists to defend: the **Strategist** (long-term equity), the **Identity Guardian** (the brand's soul), the **Cultural Analyst** (cultural honesty), the **Audience Interpreter** (genuine recognition), the **Emotional Historian** (continuity), the **Attention Physicist** (true attention), the **Recovery Director** (the right to not speak), the **Anti-Hype Defender** (truth over performance), the **World-State Observer** (world-awareness), the **Narrative Architect** (the campaign arc), and the **Executive Synthesizer** (coherence with the Wave 4 decision). Each reads the same `CouncilBriefing` through its own lens and returns an `EntityOpinion` — they disagree naturally.

| Phase | Role |
|---|---|
| 43 — Cognitive Council Runtime (`cognitiveCouncil`) | Convenes all eleven entities; gathers the society's competing interpretations. |
| 44 — Internal Debate Engine (`internalDebateEngine`) | Pairs advocates against objectors into real exchanges; scores debate tension and flags shallow consensus. |
| 45 — Multi-Agent Memory Bias (`multiAgentMemoryBias`) | Each entity argues with the authority its track record has earned; persists the council reputation book. |
| 46 — Strategic Conflict Resolution (`councilConflictResolution`) | Resolves the debate by conviction-weighted force — a convinced minority can outweigh a lukewarm majority. |
| 47 — Autonomous Campaign Planning (`autonomousCampaignPlanning`) | From the debate, the society plans the next move: ship · soften · rework · change territory · rest. |
| 48 — Narrative Arc Intelligence (`narrativeArcIntelligence`) | Reads the campaign as a story across time — rising, holding, turning, breaking. |
| 49 — Silence & Restraint Governance (`silenceRestraintGovernance`) | The council's standing authority on *not speaking*. |
| 50 — Audience Interpretation Society (`audienceInterpretationSociety`) | The audience is read through competing lenses; their disagreement is itself information. |
| 51 — Identity Defense Court (`identityDefenseCourt`) | When a banner is accused of eroding the brand, the council holds a court — the Guardian prosecutes, mitigation is argued, the court rules. |
| 52 — Self-Reflection & Hypocrisy Detection (`selfReflectionHypocrisy`) | The council turns its scrutiny on itself — catching the system advocating what it claims to refuse. |
| 53 — Internal Reputation System (`internalReputationSystem`) | Entities are held accountable; those aligned with the outcome gain standing; personalities evolve across sessions. |
| 54 — Executive Consensus Runtime (`executiveConsensusRuntime`) | Brings the society to a consensus and judges its *quality* — earned through tension, or reached too easily. |
| 55 — Autonomous Strategic Consciousness (`autonomousStrategicConsciousness`) | The closing synthesis — one conscious verdict, with overruled dissent kept on the record. |

Wave 5 meta-critic — the global question: **"Did this decision emerge from genuine cognitive tension, or from shallow consensus?"** When the council debates and reaches `block` or `hold`, the meta-critic enforces it; when the council agrees too quickly, suspicion increases and the approval is not trusted at brutal; an identity-defense-court conviction is an automatic refusal. Soft-floor threshold recalibrated for the 55-phase stack: **lenient=34 · default=28 · brutal=23**.

Verified by `scripts/test-cognitive-society.ts` — 9 checks: the council convenes eleven entities, entities disagree naturally, the internal debate produces real exchanges, the identity court convicts a brand-eroding candidate, self-reflection catches the council in hypocrisy, shallow consensus is detected, a debated decision emerges from genuine tension, overruled dissent is recorded, and the agents' reputations evolve across sessions. 9/9 pass.

## Wave 4 — Executive Cognition Layer (Phases 36–42)

The system stops behaving like a reactive intelligence and begins behaving like an **executive organism** — capable of strategic judgment, prioritization, restraint, long-term adaptation, and business-aware cognition. Before Phase 36 the system reacts to signals; after Phase 42 it **governs itself**. The engine now optimizes for psychological truth, strategic continuity, identity integrity, emotional trust, cultural timing, and long-term resonance — *not* clicks. 42 modules across 7 phases.

**Phase 36 — Strategic Priority Engine** (`strategicPriorityEngine` · `campaignPriorityScore` · `realityImportanceWeight` · `longTermVsShortTerm` · `executiveTradeoffEngine` · `cognitiveUrgencyMap`) — the system stops treating every opportunity equally. It distinguishes emotionally important / strategically important / algorithmically tempting / identity-dangerous, and is allowed to sacrifice engagement for truth. Gate: *"is this strategically wise, or merely emotionally effective?"*

**Phase 37 — Cognitive Energy Management** (`cognitiveEnergyModel` · `outputFatigue` · `audienceExhaustionTracker` · `creativeRecoveryCycles` · `emotionalOverexposure` · `attentionDepletionEngine`) — the system understands exhaustion, its own and the audience's. It asks *"should we speak?"* not *"can we post?"* Hard gates: high fatigue + low novelty → recommend silence; attention extraction exceeds emotional value → reject.

**Phase 38 — Temporal Intelligence** (`temporalPsychology` · `culturalTimingEngine` · `momentReadiness` · `attentionWindows` · `psychologicalSeasonality` · `contextSensitivity`) — timing understood psychologically: doomscroll windows, loneliness hours, Sunday dread, collective-exhaustion periods. A beautiful banner can be rejected because *"the audience psychologically cannot receive softness today."*

**Phase 39 — Executive Identity Governance** (`identityGovernance` · `brandTruthConstitution` · `identityViolationDetector` · `aestheticCorruptionMap` · `voiceIntegrityEngine` · `psychologicalBrandAnchor`) — defends MOOD from mutation: supplement-hype, productivity-guru, fake spirituality, therapy-tone, luxury aesthetic, TikTok wellness, startup-bro, motivational poison. Hard gate: *"would a real exhausted human trust this, or only admire its aesthetics?"*

**Phase 40 — Strategic Campaign Lifecycles** (`campaignLifecycle` · `campaignEvolutionEngine` · `narrativeMomentum` · `emotionalArcPersistence` · `campaignRetirement` · `reawakeningTriggers`) — campaigns become living entities with states (emerging · deepening · culturally-recognized · overexposed · emotionally-drained · identity-risk · dormant · recoverable · timeless). The lifecycle is derived from the persisted trail, so it survives a restart.

**Phase 41 — Executive Decision Runtime** (`executiveRuntime` · `cognitiveDecisionEngine` · `actionSelection` · `executiveReasoningTrace` · `selfGovernanceLoop` · `strategicConflictResolution`) — the engine decides like a strategic creative director, selecting from a real action vocabulary (publish · delay · deepen · reverse · continue · fragment · merge · silence · archive · escalate). Every decision explains its WHY across identity, fatigue, timing, truth, strategic value, audience state, emotional continuity, and long-term memory impact, then passes a six-question self-governance loop.

**Phase 42 — World-State Executive Brain** (`worldStateEngine` · `collectivePsychologyState` · `culturalClimateModel` · `environmentalStressMap` · `socialPressureSystems` · `worldTensionIndex`) — the engine maintains a living model of the psychological world it operates inside: collective exhaustion, emotional volatility, anxiety, social fragmentation, attention chaos, economic pressure, loneliness, digital overload, trust erosion. Persists to `data/runtime/world-psychology.json` and evolves slowly. Headline gate: *"does this campaign understand the psychological world it is entering?"*

Wave 4 meta-critic — the executive runtime's decision is enforced: when the system decides `silence` / `delay` / `archive`, the meta-critic refuses the output; a decision that fails self-governance does not ship. Plus the six executive questions as gates. Soft-floor threshold recalibrated for the 42-phase stack: **lenient=30 · default=25 · brutal=20**.

Verified by six test scripts — `test-strategic-priority.ts` (4/4), `test-fatigue-governance.ts` (3/3), `test-identity-constitution.ts` (4/4), `test-world-state.ts` (4/4, persists + survives restart), `test-campaign-lifecycle.ts` (5/5), `test-executive-runtime.ts` (6/6). The strategic engine overrides engagement temptation, the fatigue engine blocks over-posting, identity governance blocks drift, the timing engine changes decisions, and the executive runtime writes real, self-explained strategy.

## Wave 2 — Reality Execution Architecture (Phases 28–35)

Phases 1–27 made the system think, remember, and persist. Wave 2 makes the mind **act in reality** — observe what it releases, protect its identity, learn from response, and evolve without becoming an engagement machine. The architectural shift: `memory → cognition → continuity → identity → evolution` now gains `execution → attention → feedback → anti-optimization → autonomous direction`. The system stops being only a living mind and becomes **a living creative organism operating in reality**. 42 modules across 8 phases, one connected execution layer.

**Phase 28 — Campaign Nervous System** (`campaignNervousSystem` · `performancePulse` · `audienceSignalState` · `campaignSaturation` · `emotionalFatigueMonitor`) — the campaign now feels *live*: it senses performance pulse, audience signal strength + drift, saturation, motif overuse, emotional fatigue, weakening truths. Gate: *"is this campaign still emotionally alive, or only repeating itself?"*

**Phase 29 — Attention Physics Engine** (`attentionPhysics` · `scrollStopMechanics` · `firstSecondRecognition` · `visualInterruptionMap` · `cognitiveEntryPoint`) — models why humans stop: not because something is loud, because something interrupts an internal pattern. True attention = internal recognition + visual interruption + unresolved tension. Gate: *"does this stop attention because it is true, or because it is loud?"* — loud / contrast / size are NOT attention.

**Phase 30 — Visual Cognition Layer** (`visualCognition` · `frameIntelligence` · `emotionalGeometry` · `productGravity` · `visualSilence` · `humanEyeFlow`) — the system begins to *see* frames, not generate them: frame diagnosis, emotional geometry, product gravity, silence with emotional function, human eye flow. Gate: *"could this frame exist before the advertisement?"*

**Phase 31 — Emotional Continuity Runtime** (`emotionalContinuityRuntime` · `truthFatigue` · `motifDecay` · `atmosphereContinuity` · `emotionalArcMemory`) — campaigns must not emotionally reset: tracks emotional arcs, truth fatigue, motif decay, atmosphere continuity, and decides the next move — continue / deepen / reverse / interrupt / retire. Gate: *"is this the next emotional move, or just another expression of the same feeling?"*

**Phase 32 — Audience Reality Feedback Loop** (`audienceRealityFeedback` · `silentEngagementSignals` · `commentRecognitionParser` · `saveShareMeaning` · `realityFeedbackWeighting`) — interprets real-world feedback correctly: saves, rewatches, recognition comments, silent engagement weighted far above shallow likes. High engagement does not mean good. Gate: *"did the audience recognise itself, or merely react to stimulation?"*

**Phase 33 — Anti-Optimization Layer** (`antiOptimization` · `performanceCorruptionDetector` · `truthVsEngagement` · `algorithmicPressureShield` · `viralityImmuneSystem`) — protects the system from becoming a performance machine: detects when real data corrupts human truth, hook addiction, algorithmic drift, shallow virality. Hard rule: **performance is a signal, not a master.** Gate: *"are we improving the campaign, or training it to become less truthful?"*

**Phase 34 — Identity Persistence Engine** (`identityPersistence` · `brandTruthCore` · `toneIntegrity` · `visualIdentityMemory` · `emotionalSignature`) — protects the brand's soul across execution. The brand truth core knows what MOOD *refuses to become* (supplement hype, TikTok wellness, fake mental-health content, luxury performance aesthetic, influencer wellness, generic chocolate, productivity-drug narrative). Gate: *"is this still unmistakably MOOD, even without the logo?"*

**Phase 35 — Autonomous Creative Direction** (`autonomousCreativeDirection` · `campaignHypothesisEngine` · `emotionalStrategyPlanner` · `creativeDecisionMemory` · `doNotDoMemory`) — the system makes real creative *decisions*, not outputs: a campaign hypothesis, a chosen territory, rejected alternatives, an emotional strategy, a do-not-do list, and a **Creative Director Memo** explaining the next move.

**`realityExecutionOrchestrator`** wraps all eight phases. The global Wave 2 meta-critic gate — **"did this creative move emerge from reality, memory, identity, and strategy, or did it merely produce content?"** A run that merely produced content is rejected at default+. Each phase contributes its own hard gate (reject) and soft floor. Soft-floor threshold recalibrated for the 35-phase stack: **lenient=25 · default=21 · brutal=17**.

Verified by `scripts/test-reality-execution-wave.ts` — 8 tests: feedback influences next decisions · anti-optimization blocks shallow high-engagement corruption · deep low-volume recognition is weighted highly · a repeated motif activates emotional fatigue + motif decay · product gravity flags a pasted product-heavy frame · attention physics rejects loud-but-empty interruption · brand truth core rejects generic wellness tone · autonomous creative direction produces a real decision. 8/8 pass.

## Phase 27 — Persistent Cognitive Runtime (the living runtime layer)

Phase 26 made the system one mind. Phase 27 makes that mind **persist through time**. It adds no new creative module, no new psychological theory, no new output — it makes the existing intelligence *remember, breathe, and evolve across runs*. The system stops behaving as *"generate → judge → store"* and starts behaving as *"remember → interpret → decide → act → learn → become slightly different."*

The master principle: *"Did this run change the mind of the system?"* If not, the runtime is not alive.

| Module | Role |
|---|---|
| `lib/persistentCognitiveRuntime.ts` | The orchestration layer that wraps the Phase 26 pipeline. `loadRuntimeContext` loads everything prior runs left; `commitApprovedRun` / `commitRejectedRun` learn from the outcome and persist. Emits `PersistentRuntimeState` with all the deltas and `changed_the_mind`. |
| `lib/runtimeMemoryStore.ts` | The single centralized long-term memory — `data/runtime/campaigns/{campaignId}/runtime.json` + `data/runtime/global-runtime.json`. Holds runtime history, the standing next-run directive, rejection + approval memory, and runtime traces. File-based, structured for a future DB migration. |
| `lib/nextRunDirective.ts` | Every generation leaves *cognitive* instructions for the next: emotional territories to avoid, truths to strengthen/weaken, tensions to continue, objects to avoid/develop, desired silence level, pressures to increase/reduce, anti-repetition warning. The next run reads it before deciding anything. |
| `lib/rejectionMemory.ts` | Rejections become intelligence. Each refusal is categorised by *what it violated* (truth / atmosphere / behavioral authenticity / cultural honesty / visual taste / product role / silence / system causality). A repeated rejected territory is pushed back to the bar. |
| `lib/approvalMemory.ts` | Approvals become intelligence too. Distinguishes a healthy *continuation* of emotional territory from an unhealthy *duplication* of a creative pattern — approved ideas must evolve, never repeat. |
| `lib/runtimeDriftDetector.ts` | The system watches its own mind across runs — overuse of the same truths / objects / territory, too much silence, too much heaviness, too much refusal, lost commercial grounding, excessive abstraction. When drift is detected, the next-run directive must correct it. |
| `lib/runtimeIdentity.ts` | Maintains the identity of the engine itself — system identity, brand identity, creative + refusal philosophy, commercial boundaries, human-truth priorities, anti-patterns, tone boundaries, evolution rules. `defendIdentity` enforces: human truth and brand identity outrank shallow engagement, every time. |
| `lib/cognitiveContinuityScore.ts` | Scores 10 continuity metrics (memory, campaign identity, emotional trajectory, symbolic object, refusal, truth persistence, human graph, world-state, anti-repetition, evolution-without-fragmentation) and flags `behaved_like_fresh_prompt`. |
| `lib/runtimeHealthMonitor.ts` | Runtime self-diagnostic — cognition coherence, memory load, contradiction load, refusal/approval rate, drift / recursion / freshness / fragmentation / over-intelligence / under- and over-commercialization / reality-disconnection risk. |
| `lib/runtimeTrace.ts` | Every run leaves a human-readable trace that reads like a creative director's private memory: *"Gen 4. I remembered gen 3… I held continuity at 6.7/10… Next run: do not re-open 'pressure'; continue 'energy without aim'."* |

Phase 27 master meta-critic gate — **"Did this generation respect what the system has already learned, or did it behave like a fresh prompt?"** A run that behaved like a fresh prompt → reject-concept at default+. A run that re-opens a territory the standing directive said to avoid, or repeats a territory the runtime previously refused → reject-concept at brutal. No generation is allowed to be isolated — every output must be a continuation, a correction, or an evolution of the living memory. Soft-floor threshold for the 27-phase stack: **lenient=21 · default=18 · brutal=14**.

Verified by `scripts/test-persistent-runtime.ts` — 5 consecutive zero-prompt generations (only `{ formula }` supplied): the runtime generation index increments, every run reads the prior one, only the first run is permitted to be "fresh", the runtime trace references the prior run, the next-run directive carries anti-repetition forward, approval + rejection memory accumulate, and `defendIdentity` protects human truth over a loud engagement trend. 11/11 checks pass — *"the system remembers what it believed yesterday."*

## Phase 26 — Unified Cognitive Field (the nervous system)

Until Phase 25 the system had many powerful intelligence layers, but they risked behaving like separate modules reporting in a line. Phase 26 adds **no new creative feature, no new output type, no new generator** — it builds the *nervous system* that makes every existing organ behave like one mind. The system stops running modules in a line and starts maintaining **a persistent psychological world-state**.

The master principle: the engine no longer asks *"what does this module output?"* — it asks *"how does this change the human world model?"*

| Module | Role |
|---|---|
| `lib/cognitiveField.ts` | The central shared state-space. Receives the signals every engine produced for a banner and unifies them into one `CognitiveFieldState` (dominant truths, unresolved tensions, active pressures, behavioral loops, masking patterns, desire forces, ritual attachments, identity narratives, cultural signals, emotional residue, future trajectories, symbolic objects, fatigue risks, truth persistence, decay signals, campaign atmosphere, world-state confidence). Computes `emergence_score` — *did the banner emerge from the field, or was it merely decorated by the modules?* |
| `lib/worldStateSimulation.ts` | Maintains a persistent emotional reality over time. 10 evolving metrics (exhaustion, recovery capacity, ritual intensity, identity pressure, silence availability, attention fragmentation, cultural pressure, desire volatility, masking normalisation, behavioral adaptation). Every generation, every rejection, every reality signal nudges the weather. Not static. |
| `lib/emotionalPhysics.ts` | Models causal CHAINS between emotional systems, not categories. e.g. *attention fragmentation → shallow recovery → cognitive residue → fake rest → masking fatigue → identity instability*. Detects which causal chain the field is sitting inside. |
| `lib/tensionTopology.ts` | Maps unresolved tensions across the field (wanting rest / fearing stillness · wanting silence / filling it · seeking productivity / resenting productivity identity…) and locates the deepest campaign opportunity. |
| `lib/causalMemoryGraph.ts` | Connects every memory node causally — cause → behavior → consequence → residue → adaptation → symbolic-object → future-drift — so the system can reason across time. |
| `lib/selfEvolvingWorldModel.ts` | Lets the system evolve its model of modern life: strengthen persistent truths, weaken decayed truths, detect emerging pressures, retire dead clichés, identify new desire forces, and detect when the system is overfitting itself. |
| `lib/symbolicObjects.ts` | Objects as psychological carriers, not props. 21 objects (phone, laptop, coffee, bed, fridge, charger, notification-bubble, unread-message, open-browser-tab…), each with emotional / cultural meanings, associated behaviors, pressures, ritual + identity links, and decay/overuse risk. |
| `lib/lifeTrajectory.ts` | Understands where a human state is *moving* — unifies the Phase 24 predictions into one forward trajectory. The system generates from the trajectory, not the snapshot. |
| `lib/cognitiveContradictionResolver.ts` | Resolves conflicting module outputs by a strict hierarchy: human truth → reality pressure → behavioral authenticity → cultural honesty → campaign atmosphere → product/commercial → aesthetic preference. **Aesthetic preference can never override human truth.** |
| `lib/cognitionTrace.ts` | Makes the system explain its thinking — for every generation: primary human truth, dominant pressure, causal chain, chosen tension, rejected directions and why, product/typography/silence decisions, campaign-memory influence, world-state update, final creative reason, and an `explainability` score. |
| `lib/worldStatePersistence.ts` | The single persistence layer (`data/memory/world-state.json`) for the world-state, the causal memory graph, cognition-trace snapshots, and field snapshots — long-term learning across sessions, not only the current one. |

Phase 26 master meta-critic gate — **"Did this output emerge from the world model, or was it merely decorated by the intelligence modules?"** If `worldStateConfidence ≥ 6` and `emergence_score < 4` → reject-concept. The critical rejection rule: a creative decision that connects to **no** structural dimension (truth / pressure / behavior / identity / ritual / culture / campaign-memory) is refused — *"it looks good" is not a reason*. Aesthetic preference asserting harder than human truth → reject-taste at brutal. Soft-floor threshold for the 26-phase stack: **lenient=19 · default=16 · brutal=13**.

Verified by `scripts/test-cognitive-field.ts` — an anti-fragmentation test (desire / pressure / behavior / identity / culture all feed one field; the cognition trace explains the banner; the resolver is governed by human-truth) and a soft-floor test (the pipeline runs with no prompt, no scene, no style, no product direction and still produces a coherent campaign decision from world-state context). 9/9 checks pass.

## Unified human desire + ritual intelligence architecture (Phases 20–25)

The system stops being an ad engine, a banner generator, or a campaign optimizer and becomes **a living cognitive model of modern human behaviour, desire, pressure, identity, ritual, and emotional adaptation**. The campaign is no longer invented — it is *discovered*. Phases 20–25 are not isolated; they are one shared cognitive super-system bound by a single persistent longing graph.

The architectural shift: the engine stops asking *"what campaign should we create?"* and begins asking *"what invisible human longing, pressure, compensation, ritual, identity need, and future emotional trajectory already exists beneath modern life?"*

**Shared cognition layer:**

| Module | Role |
|---|---|
| `lib/humanDesireMemory.ts` | The permanent human-longing memory graph. Persisted to `data/memory/human-desire.json`. Accumulates 12 categories across the campaign lifetime: aspiration, emotional-hunger, identity-desire, validation-pattern, compensation-loop, attachment-behavior, symbolic-safety-object, status-longing, invisible-envy, loneliness-structure, ritual-dependency, emotional-drift. Each entry tracks count, time bounds, average intensity, sample truths. |
| `lib/unifiedHumanGraph.ts` | The central cognition architecture. Binds emotional / desire / ritual / behavioral / identity / cultural / systemic / future-trajectory memory into one synthesis. Produces `human_coherence` (is the campaign modelling one continuous person?) and `candidate_belongs` (does this banner belong to that human?), plus a one-sentence portrait of the modern human the campaign models. |

**Phase 20 — Desire Systems** (`desireArchitecture` · `statusWithoutStatus` · `emotionalHunger` · `validationSystems` · `invisibleEnvy` · `aspirationalIdentityGap`) — models desire as psychological gravity, not marketing. 10 structural desires (permission-to-stop, unobserved-existence, a-self-that-is-not-needed…), quiet-status markers, emotional deficits, validation dependency loops, unspoken envy, and the shadow-identity gap. Headline gate: *"does this desire feel emotionally inevitable, or creatively manufactured?"* — rejects influencer/luxury/wellness framing, performative envy, aspirational-marketing vocabulary.

**Phase 21 — Social Gravity** (`socialGravity` · `collectiveEmotionalMovement` · `culturalAcceleration` · `groupAnxiety` · `viralEmotionPatterns` · `socialPermissionStructures`) — models how emotions spread across society invisibly: standing social fields, the direction the collective is moving, cultural cycle speed, group ambient anxiety, over-circulated viral patterns, and informal permission economies. Headline gate: *"does this feel socially lived, or individually dramatized?"* — rejects over-circulated viral vocabulary and collective fields dramatized at the individual level.

**Phase 22 — Ritual Attachment** (`ritualFormation` · `attachmentLoops` · `symbolicSafety` · `emotionalReturnMechanics` · `privateRitualMemory` · `repeatedComfortSystems`) — models why humans emotionally return: ritual formation stages (accident → association → stabilisation → identity), object/window attachments, symbolic-safety objects, return-gravity drivers, persistent ritual memory, comfort-system breadth. Headline gate: *"would this ritual still exist if nobody ever saw it?"* — rejects branded / optimised comfort and objects described as symbols.

**Phase 23 — Narrative Self** (`internalNarrative` · `selfStoryArchitecture` · `identityContinuity` · `privateMeaningSystems` · `emotionalSelfTranslation` · `personalMythology`) — models how humans narrate themselves internally: the clumsy running commentary, the load-bearing self-story beams, identity-continuity fractures across environments, private meaning-systems, emotional mistranslation (exhaustion called laziness), and personal myths. Headline gate: *"does this feel like an actual internal human narrative, or written character psychology?"* — rejects narration that is too articulate or too literary, and myths framed as aphorisms.

**Phase 24 — Predictive Human States** (`emotionalForecasting` · `behaviorPrediction` · `collapseProbability` · `recoveryAttemptModel` · `futurePressureTrajectory` · `emotionalDriftPrediction`) — the system's first genuinely predictive layer: forecasts the next emotional state, the next concrete behaviour, the functional-collapse horizon, the next recovery attempt and its likely (usually partial) outcome, the future pressure trajectory, and the slow drift of the emotional baseline. Headline gate: *"does this future state feel psychologically inevitable?"* — rejects clean forecasts, inspirational recovery, and banners depicting collapse directly instead of the last stable moment before it.

**Phase 25 — Autonomous Campaign Intelligence** (`autonomousNarrativeEngine` · `culturalSignalEvolution` · `selfUpdatingPsychology` · `emergentCampaignMemory` · `collectiveRealityTracking` · `adaptiveEmotionalIntelligence`) — the campaign becomes a continuously learning psychological organism: it evolves its own narrative, tracks rising/fading cultural vocabulary, retires dead emotional patterns and promotes emerging ones, detects emergent campaign signatures (identity vs rut), checks whether the campaign is still synchronised with reality, and emits one adaptation directive. When the organism detects self-reference, banners are refused at brutal until the campaign resyncs with reality.

Phase 20–25 meta-critic: each phase contributes hard gates (at default/brutal) and conditioned soft floors. The unified human graph adds a closing soft floor — when a banner does not belong to the continuous human the campaign has been modelling, it is *a stranger to its own campaign*. Soft-floor threshold recalibrated for the 25-phase stack: **lenient=18 · default=15 · brutal=12**. The longing graph compounds on every approved banner.

**Social masking + identity performance engine** (`lib/*` Phase 19 modules) — the system stops modelling only internal survival and starts modelling the SOCIAL IDENTITIES humans perform while surviving. Phase 19 is about *functioning while collapsing* — not visible suffering, not emotional expression, but the **maintenance of identity under pressure**.

The new core question: *"What version of themselves must this human continuously perform in order to remain socially acceptable?"*

| Module | Role |
|---|---|
| `lib/socialMaskingEngine.ts` | 10 classified masks across 5 classifications (conscious · survival · identity-preservation · socially-trained · collapse-concealment). Detects "I'm good", smiling while overloaded, conversational autopilot, functioning tone under exhaustion, public emotional suppression, efficient response under collapse, available-with-nothing-left, present-with-empty-eyes, on-tone-in-the-meeting, parent-voice-when-depleted. Scores `mask_signature_strength`, `mask_in_motion`, `behavioral_not_symbolic`, `camera_catches_the_tell`, `truth_reveals_too_much`. Differentiated from Phase 14 `socialMasking` (which measures the GAP) — Phase 19 CLASSIFIES the kind. |
| `lib/highFunctioningBurnout.ts` | 6 signatures of competent collapse (productive-exhaustion · competent-collapse · over-functioning · excessive-responsiveness · hyper-availability · doing-well-while-cognitively-failing). Scores `functional_output_unchanged` (the body still ships at baseline), `internal_depletion`, `competence_as_load_bearing`, `recoverable` (low = body has rebuilt around the depletion). Detects **burnout hidden inside competence** — the cinematic ideal of Phase 19. |
| `lib/identityMaintenance.ts` | 10 identities under pressure (parent · founder · employee · partner · strong-person · reliable-person · caretaker · fun-friend · good-host · capable-adult). Each carries `what_it_demands`, `what_it_forbids`, `maintenance_signatures`, `hidden_cost`. Detects when behavior exists to **preserve identity, not wellbeing**. |
| `lib/emotionalCamouflage.ts` | 7 concealment channels (humor · productivity · politeness · efficiency · caretaking · perfectionism · social-energy-simulation). Scores `concealment_intensity`, `social_readability` (high = camouflage works), `hidden_exhaustion_probability`. Refuses "analytic voice" — banners that NAME the mask instead of catching it mid-action. |
| `lib/publicPrivateSplit.ts` | Tracks identity drift across environments. 6 named pairs (energetic-meeting ↔ silent-car-collapse · parenting-performance ↔ nighttime-shutdown · social-responsiveness ↔ emotional-absence · doing-amazing ↔ residue-accumulation · host-energy ↔ collapse-after-door-closes · group-chat-warmth ↔ silence-in-the-kitchen). Reads the trail to flag one-sided campaigns and to suggest which side the next banner should photograph to **complete the diptych**. |
| `lib/maskFatigue.ts` | Distinguishes WORK FATIGUE from PERFORMANCE FATIGUE. 5 kinds (conversation-fatigue · social-depletion · decision-exhaustion · forced-attentiveness · relational-over-presence). Flags `fatigue_misattributed` when the truth attributes mask-fatigue to work — one of Phase 19's central modern errors the camera must expose. |

Phase 19 meta-critic gates:
- **the spec's new headline gate**: socialMaskingEngine `truth_reveals_too_much` → reject-taste at brutal (*"does this feel like a human trying to remain functional for other people — or expressive, cinematic, performatively sad, self-aware, optimised-for-relatability?"*)
- highFunctioningBurnout `burnout_visible_too_early` → reject-concept at brutal (exhaustion becomes visually obvious too early; banner is visible-burnout aesthetics, not hidden burnout)
- identityMaintenance `subject_names_their_role` → reject-taste at brutal+ (banner is self-aware instead of caught mid-performance)
- emotionalCamouflage `too_analytic` → reject-taste at brutal+ (truth EXPLAINS the mask instead of catching it)
- identityMaintenance pressure≥7 without a `maintenance_signature_visible` → reject-concept at brutal+ (identity performance is symbolic, not behavioral)
- maskFatigue `fatigue_misattributed` → reject-concept at brutal+ (banner misses the cause)
- masking strong but `mask_fatigue<4` AND `identity_cost<4` → reject-concept at brutal+ (mask lacks social consequence — masking without cost is decoration)
- visible-burnout-with-no-remaining-functioning → reject-taste at brutal (theatrical burnout)
- soft floors: identity-under-pressure with no mask classified, mask matched but truth is symbolic, hfb signature but burnout not hidden in competence, camouflage matched with low concealment while exhaustion is high, one-sided campaign, mask-fatigue matched but truth misattributes to work

Soft-floor threshold history: was 8/6/4 at Phase 15 → 10/8/6 at Phase 17 → 11/9/7 at Phase 18 → **13/11/9** at Phase 19 (after 19 phases, every banner routinely produces 9–14 soft signals).

**Behavioral survival engine** (`lib/*` Phase 18 modules) — the system now models the *behaviors* humans quietly perform every day to survive modern pressure. Different from Phase 14 (suppression), Phase 17 (systemic causes), and Phase 13 (the COST): Phase 18 is the *behavioral footprint* of survival itself — the loops, the tiny escapes, the compensation rituals, the fake recoveries, the silent coping moves, and the residue all of it leaves behind in the body.

| Module | Role |
|---|---|
| `lib/behaviorLoopEngine.ts` | 12 daily behavior LOOPS (doomscroll · reopen-laptop · refresh-inbox · fake-break · tab-switching · kitchen-standing-without-purpose · fridge-without-hunger · phone-during-family · one-more-thing-before-sleep · lock-screen-pull · reply-rehearsal · pacing-without-destination). Each is classified `conscious` / `subconscious` / `compulsive` / `recovery-seeking` / `avoidance-based` and named with its trigger, exit criteria, and the *invisible mark* — the thing the subject does not notice they are doing. |
| `lib/microEscapeDetection.ts` | 10 tiny ephemeral withdrawals (bathroom-scrolling · parked-car-silence · fake-productivity · disappearing-into-phone · lingering-after-shower · unnecessary-errand · staring-moment · longer-walk-to-the-printer · extra-loop-around-the-block · extended-elevator-pause). Different from avoidance/numbing — micro-escapes are 90s–8min unsupervised pauses the world has not yet noticed. Scores `emotional_necessity`, `invisibility`, `recognizability`, `behavioral_truth`, and whether the banner catches it mid-execution. |
| `lib/ritualCompensation.ts` | 10 compensation rituals (third-coffee · nighttime-snack · skipped-breakfast-overloaded-lunch · long-shower-as-pause · second-sleep-that-never-arrives · late-afternoon-sugar · post-bedtime-alcohol · predawn-coffee-alone · fridge-light-at-23:45 · energy-drink-at-15:30). Each carries the *honest phrase* and the FORBIDDEN *romanticised phrase* — the system rejects truths that use wellness vocabulary (`self-care · ritual · me-time · I deserve · little victory · sacred · cozy`). |
| `lib/fakeRecovery.ts` | 10 culturally-endorsed activities that *look like* recovery but are not (spa-day-as-content · workation · workout-as-anxiety-burnoff · meditation-app-checklist · journaling-as-curation · nature-walk-on-a-call · rest-day-on-slack-from-bed · self-help-instead-of-resting · sunday-reset-as-second-workday · sleep-tracker-anxiety). Different from Phase 17 `recoveryFailure` (the physiology) — Phase 18 fakeRecovery is the CULTURAL PERFORMANCE of recovery. Refuses banners that use alibi language (`workation`, `sunday reset`, `treat yourself`, `walking meeting`). |
| `lib/silentCopingMechanisms.ts` | 10 unnamed, internal, often-invisible coping moves (emotional-buffering · private-decompression · covert-reset-ritual · internal-monologue-muting · silent-withdrawal · emotional-time-stretching · breath-held-then-released · jaw-unclench · two-second-eye-close · face-wash-as-reset). Each is scored `below_the_named`, `visible_to_third_party`, `visible_to_subject`, `captures_real_humanity`. Refuses truths that name the move (`coping · regulation · nervous system · self-soothing · reset`) — silent coping must be **observed, not labelled**. |
| `lib/behavioralResidue.ts` | Timeline-aware. Builds survival FINGERPRINTS across the emotional trail (loop/escape/ritual/fake-recovery/silent-coping ids matched in past truths + residue strings) and scores: `carryover_score` (how much past-survival is in the body now), `recurrence_density` (how much the campaign has repeated the same coping), `timeline_awareness` (does the truth photograph TIME, not just a moment), `sediment_visibility` (does the scene make the residue physically visible: jaw, shoulders, skin, posture). Flags `carries_weeks_not_minutes` and `residue_becoming_signature`. |

Phase 18 meta-critic gates:
- **the spec's new headline gate**: NO observed survival behavior (no loop, no escape, no ritual, no silent coping, no recovery failure) → reject-concept at brutal (*"does this behavior feel like something humans quietly do every day without noticing, or sadness aesthetics without behavioral evidence?"*)
- ritual compensation `romanticisation_detected` (truth uses wellness vocabulary) → reject-taste at default+ (`brutality >= 0.7`)
- fake recovery `performs_rest` (banner reads as PERFORMING rest, not actually resting) → reject-taste at brutal
- silent coping `truth_names_the_move` (therapy / regulation vocabulary present) → reject-taste at brutal+
- behavioral residue `carryover_score >= 7` AND `timeline_awareness < 4` → reject-concept at brutal (body claims to carry weeks but truth photographs only today)
- conscious-staged coping (primary loop classification = `conscious` AND silent coping is named) → reject-taste at brutal+
- soft floors: no behavior loop identified, loop matched but truth uses feeling-words instead of behavioral verbs, micro-escape NEEDED but not shown, micro-escape matched but not in-the-act, ritual matched but honest_observation < 5, fake-recovery alibi language present, silent coping captures_real_humanity < 5, residue becoming campaign signature, body carries weight but residue is not physically visible

Soft-floor threshold at Phase 18: **lenient=11 · default=9 · brutal=7** (further raised at Phase 19 — see above).

**Systemic human pressure model** (`lib/*` Phase 17 modules) — the system stops describing emotional states and starts modeling the INVISIBLE MACHINERY producing them. Causality replaces aesthetic.

| Module | Role |
|---|---|
| `lib/systemicPressureMap.ts` | **10 structural systems** the spec named: infinite-accessibility · algorithmic-interruption · optimization-culture · parenting-without-recovery · work-home-boundary-collapse · passive-entertainment-overload · notification-fragmentation · social-performance-pressure · productivity-identity · endless-self-improvement-loop. Each carries its mechanism, observable symptoms, emotional outputs, and a brief hint for making the cause visible. Matches state + core + truth to the primary causal system. |
| `lib/attentionFragmentation.ts` | 5 fragmentation patterns (interrupted-focus · multi-tab-cognition · partial-presence · stimulation-switching · inability-to-complete-cognitive-landing) — the defining emotional mechanic of modern life. |
| `lib/modernEnvironmentSystems.ts` | 6 environments as emotional MACHINES: phone-removes-transitions · laptop-extends-work-identity · bed-as-productivity-zone · streaming-destroys-silence · notifications-erase-recovery · open-plan-removes-private-recovery. Emits brief-line directives to make the machine visible in the scene. |
| `lib/recoveryFailure.ts` | 5 modern recovery-failure modes (resting-while-stimulated · entertainment-without-restoration · passive-scrolling-as-fake-recovery · sleep-without-decompression · weekend-without-reset). The PREFERRED outcome — banners that catch "rest that is not rest" score high. Banners describing successful recovery are flagged as fake. |
| `lib/cognitiveResidue.ts` | 5 residue kinds (unfinished-tabs · emotional-carryover · interrupted-thoughts · low-grade-urgency · inability-to-clear-state). Scores residue_load 0..10. Modern life rarely produces a clear head; low residue is suspicious. |

Phase 17 meta-critic gates:
- **the spec's new headline gate**: no systemic cause matched AND no cognitive residue AND no recovery failure → reject-concept at brutal (*"caused by modern systems, or merely described aesthetically?"*)
- truth describes successful recovery → reject-taste at brutal (rare in modern life; reads as fake)
- soft floors: no systemic cause identified, causal_clarity < 4, residue_load < 3, fragmentation absent when family suggests it, environment not identified while residue is high

Soft-floor threshold history: was 8/6/4 at Phase 15 → 10/8/6 at Phase 17 → 11/9/7 at Phase 18 (see above).

**Reality ingestion layer** (`lib/*` Phase 16 modules) — the system stops learning only from itself and starts observing real humans continuously. Behavioral anthropology, NOT trend scraping.

| Module | Role |
|---|---|
| `lib/realityIngestion.ts` | Persistent store at `data/memory/ingested-signals.json` seeded from `data/seed-ingested-signals.ts` (25 real-shape signals across TikTok / Reddit / YouTube / Twitter / IG saves / anonymous-confessions / Hebrew). Anti-trend filter built into the store — meme cycles (`its giving / main character / soft girl era / no cap`) get rejected at ingestion. |
| `lib/humanSignalExtraction.ts` | Processes raw signals into recurring phrases (ngrams across ≥2 sources), contradiction markers, coping behaviors, private-truth markers (`literally me / cant mentally land / everything feels half-open / my brain feels interrupted / rest but never recover`). |
| `lib/collectiveDriftTracker.ts` | Bins signals by 30-day periods and detects named drifts between consecutive periods: *productivity → overstimulation · ambition → invisible pressure · self-improvement → optimization fatigue · relaxation → passive consumption · connection → performance · achievement → numbness*. |
| `lib/privateLanguageMap.ts` | Detects UNGUARDED register vs PERFORMATIVE register: rewards `cant mentally land / everything feels half-open / my brain feels interrupted` · refuses `boundaries / holding space / it's giving / main character / the weight of being / you are enough`. |
| `lib/realityWeighting.ts` | The spec's rule made operational: **10 deep "this is literally me" comments outweigh 100k shallow likes.** Scores `discovered_from_reality_score` by jaccard overlap × emotional_weight (NOT × volume). Flags `generated_from_aesthetics_only` when no deep signal resonates. |

Phase 16 surface:
- `POST /api/ingest` — push external signals into the store (filtered against meme cycles)
- `GET /api/ingest` — read the current store

Phase 16 meta-critic gates:
- **the spec's new headline gate**: reality weighting generated_from_aesthetics_only AND private_language not unguarded → reject-concept at brutal (*"was this truth discovered from reality, or generated from internal aesthetics?"*)
- private language performative signatures (therapy / TikTok-aesthetic / self-aware-poetry / inspirational) → reject-taste at brutal
- soft floors: private_language_score < 5, discovered_from_reality_score < 5, generated_from_aesthetics_only

**Longitudinal reality memory** (`lib/*` Phase 15 modules) — the system stops evaluating campaigns inside the generation window and starts remembering what reality kept proving true over weeks/months. Persistence + timeline + verification + decay + recursion-pressure all keep the campaign honest.

| Module | Role |
|---|---|
| `lib/truthPersistence.ts` | Persistent store at `data/memory/truth-persistence.json`. Keyed by tension phrase. Tracks count, first/last seen, sample truths, moving averages of aftertaste + engagement residue. Reports `durability_score` 0..10 — how true the truth has proven over its lifetime. |
| `lib/culturalTimeline.ts` | Weekly buckets at `data/memory/cultural-timeline.json`. Groups consecutive weeks into named phases ("3-week phase — voice: silent-burnout · patterns: cannot-rest-without-guilt"). Reports `current_drift` — what the campaign has been quietly trending toward. |
| `lib/realityVerification.ts` | Asks *"did real audience behaviour confirm this emotional truth?"* — reads engagement signals for save_rate / share_rate / replay_rate / emotional_comment_rate, and matches comment text patterns against `literally me / why is this so accurate / I thought I was the only one` (Hebrew + English). Recognition over engagement. |
| `lib/emotionalDecay.ts` | Detects when a truth has become DECORATIVE. Decay sources: overuse (count ≥ 4 + declining aftertaste), aftertaste-trend (early avg vs late avg falling), cultural-consumed-treatment. Named decorative modes: `trendy-anxiety`, `aesthetic-burnout`, `cinematic-loneliness`, `overused-truth`, `consumed-treatment`. |
| `lib/generationPressure.ts` | Tracks the recursion pressure across 5 axes: recursion (same layout repeating), aesthetic_recursion (same atmospheric light repeating), motif_over_convergence (same object motifs returning), symbolic_addiction (one motif dominates), over_clean_emotional_framing (aftertaste cluster too tight). When `force_disruption=true`, the meta-critic refuses banners that match the recursive pattern. |

Phase 15 meta-critic gates:
- **the spec's new headline gate**: emotional_decay status='decorative' → reject-concept at default mode and up (*"would this still feel psychologically true six months from now, or only creatively impressive today?"*)
- generation_pressure force_disruption → reject-concept at default+ (campaign needs deliberate disruption)
- reality_verification negative_rate ≥ 5% → reject-concept at brutal (audience has rejected this truth)
- soft floors: persistent truth durability declining, decay status='aging', generation pressure 5+ without disruption, reality verification only partial

Note: Phase 14 gates (suppressed humanity) are also now wired into the meta-critic in this commit — the "character knows what they feel" → reject at brutal, therapy-content vocabulary → reject at brutal, truth names feeling not substitute behaviour → reject at brutal. The soft-floor threshold was recalibrated for the deeper stack: lenient=8 · default=6 · brutal=4.

**Cultural memory engine** (`lib/*` Phase 12 modules) — the system evolves from single-viewer recognition to collective recognition. The campaign stops being "about him" and starts being "about us".

| Module | Role |
|---|---|
| `lib/sharedCulturalMemory.ts` | 12 collective emotional patterns (a generation that cannot rest without guilt · people who open phones from anxiety · those who do not know if they are working or just unable to stop · achievement numbness · Sunday anxiety · post-notification emptiness · doomscroll dissociation · loneliness while connected · parent-of-young-children collapse · post-miluim re-entry · productivity-guilt-shabbat · overconnected-unreachable). Each pattern names the unspoken sentence + cultural symptoms + consumed treatments to avoid. |
| `lib/collectiveRecognition.ts` | Scores **"would multiple strangers instantly feel: this is about us?"** Reads inclusive phrasing (`they`, `people who`, `a generation`) vs individual phrasing (`he`, `she`, `i feel`) and combines with shared-pattern match strength. |
| `lib/unspokenRituals.ts` | 12 unconscious modern rituals (fridge-without-hunger · app-switching-without-intention · rechecking-notifications · laptop-reopen-after-shutdown · reels-while-exhausted · coffee-without-tasting · lying-in-bed-mentally-working · fake-productivity-loop · door-handle-pause · phone-down-then-up-again · reply-rehearsal · tab-graveyard). The camera should catch the subject MID-RITUAL — recognition is in the gesture. |
| `lib/culturalDrift.ts` | Detects 8 culturally-consumed treatments (instagram-burnout-aesthetic · soft-sad-reels-loneliness · startup-core-fatigue-cliche · romanticised-exhaustion · detox-retreat-pitch · mom-burnout-self-care · hustle-vs-recovery-pitch · productivity-detox-motif). Different from Phase 4's audience taste drift — this catches the CAMPAIGN replaying language the culture already processed. |

Phase 12 meta-critic gates:
- collective recognition reads as individual-only (no shared pattern + individual phrasing) → reject-concept at default mode and up (**the spec's new headline gate: "does this feel like culture quietly recognizing itself?"**)
- cultural drift feels culturally consumed → reject-taste at brutal mode
- collective recognition score below floor → reject-concept at brutal mode
- shared pattern matched but truth phrased individually → reject-taste at brutal mode
- soft floors: collective recognition < 5, drift saturation ≥ 3, shared pattern matched but ritual not selected

**Natural human chaos** (`lib/*` Phase 11 modules) — the danger at this depth is the system trying TOO hard to be meaningful. These three modules calibrate the cognition AWAY from over-intelligent artificial taste and toward observed-not-composed reality.

| Module | Role |
|---|---|
| `lib/lifeNoise.ts` | Adds NON-SYMBOLIC mess to the image brief — a sticker peeling off a laptop, a half-typed sentence on screen, a stripe of sun nobody designed. Different from worldContinuity (which adds meaningful artifacts) — lifeNoise adds details that mean NOTHING and just exist. |
| `lib/humanContradiction.ts` | 10 BEHAVIORAL contradictions the system maps the emotional core onto: exhausted but scrolling · lonely but avoiding people · overstimulated but seeking stimulation · wants sleep but opens laptop · burnout but performs productivity · guilty but not replying · tired but not leaving · needs rest but cleans · wants quiet but keeps music on · craves stillness but walks. **Contradiction generates recognition, not clarity.** |
| `lib/nonPerformativeReality.ts` | Detects the 6 spec-named performative patterns: trying-too-hard · obvious-sadness · aesthetic-loneliness · perfect-melancholy · cinematic-suffering · **beautiful-burnout**. Rewards: emotionally confusing reality, ordinary discomfort, flat lighting when correct, observed not composed. Answers the spec's headline question: *"Does this feel like a human moment that happened, or a creative system trying to simulate one?"* |

Phase 11 meta-critic gates:
- non-performative `trying_to_simulate` → reject-concept at default mode and up (**the spec's new headline gate**)
- human contradiction `resolved_too_cleanly` → reject-taste at brutal mode (the truth tied a bow on what should stay open)
- life noise mess_score < 4 → reject-taste at brutal mode (no honest mess in the frame)
- soft floors: performative pattern present (not dominant), behavioral contradiction available but not inhabited, life noise low

**Unified cinematic brain** (`lib/*` Phase 10 modules) — the cognition stops being distributed and becomes a single directorial mind. The system stops asking *"what should the next banner contain?"* and starts asking *"what emotional sentence is unfinished?"*

| Module | Role |
|---|---|
| `lib/unresolvedEmotion.ts` | Tracks 6 unresolved signal kinds (unanswered tension, denied relief, incomplete ritual, interrupted comfort, unresolved silence, visual question) with pressure that decays over hours. Reports the single most-active unfinished sentence the next banner should continue. |
| `lib/emotionalCompression.ts` | Scores implied-vs-shown emotion ratio. A short truth + 3 lived-in artifacts can imply 15+ emotions while showing 0. Rejects literal storytelling; rewards compressed density. |
| `lib/subconsciousRecognition.ts` | Answers the spec's named question: *"Would someone recognize this world without the logo?"* — measures recurrence across 7 axes (emotional-geometry, silence-structure, lighting-memory, object-residue, emotional-pacing, framing-behavior, contradiction-pattern). |
| `lib/antiSyntheticBehavior.ts` | Detects 8 synthetic signatures (composition-too-coherent, objects-too-intentional, arc-too-perfect, lighting-too-balanced, symbolism-too-obvious, designed-virality, polished-authenticity, over-curated-realism) and rewards observed-not-designed framing. |
| `lib/cinematicBrain.ts` | **The master synthesis.** Reads every prior phase + the four Phase 10 modules and emits ONE directorial verdict: campaign_emotional_thesis (one sentence), emotional_trajectory (opening / escalating / quieting / drifting / resolving / re-opening / haunting), permissions (visual_restraint_floor, pacing, silence_permission, product_visibility_permission, typography_aggression_ceiling, emotional_temperature, world_decay_mode, memory_residue_strategy), candidate_alignment, **three_second_test** (would this stay inside someone 3 seconds after they scrolled past?), and the director's voice in one line. |

Phase 10 meta-critic gates:
- cinematic brain refuses → reject-concept at default mode and up
- **three-second test failed → reject-concept at brutal mode** (the spec's new frontier metric)
- anti-synthetic reads-as-designed → reject-taste at brutal mode
- compression literal-storytelling → reject-taste at brutal mode
- soft pressures: candidate does not serve thesis, three-second soft fail, compression < 5, synthetic ≥ 5

**Temporal campaign cinema** (`lib/*` Phase 9 modules) — the system gains continuity across time. The campaign feels like moments from the same emotional film universe, not isolated banners.

| Module | Role |
|---|---|
| `lib/campaignTimeline.ts` | 9 emotional notes (disorientation · denial · micro-collapse · ritual · quiet-control · aftermath · numbness · detachment · recovery). Tracks what has played, what is missing, and suggests the next note along the arc. |
| `lib/emotionalSequence.ts` | **Hard rule made operational**: no two consecutive banners can solve the same emotion. Refuses banner N+1 when its closing reaction maps to the same note as banner N (at brutal mode). |
| `lib/worldPersistence.ts` | Recurring environmental DNA — apartment kinds, lighting families, object scars, emotional temperature, average silence. Lighting fatigue detection: *warmth used too often becomes fake, darkness too often becomes aesthetic.* |
| `lib/objectMemoryGraph.ts` | Objects accumulate meaning over time. coffee cup: first stimulation → later exhaustion → later avoidance → later loneliness. Reports emotional weight so the meta-critic refuses "this object has spoken too loudly". |
| `lib/sceneContinuity.ts` | Cinematic memory — is this the same apartment? Has this lighting echoed before? Is this object now loaded? Is this plausibly the same human as before? Emits an invisible_context paragraph the image brief inherits. |
| `lib/visualTempo.ts` | Pacing across the campaign — visual_loudness, emotional_density, typography_aggression, object_pressure, motion_implication, silence_weight. Sets `needs_breath_next` when the campaign is running hot. |
| `lib/absenceIntelligence.ts` | Strategic omission — sometimes the strongest move is no copy / no product / no face / no CTA. Reports a curiosity_score from 0..10. |
| `lib/emotionalContradiction.ts` | Detects two-truths-in-one banners (energized but lonely, productive but detached, calm but guilty, relieved but emotionally absent, etc.). Flags rhetorical "but" sentences as too literary. |

Phase 9 meta-critic gates:
- consecutive-emotion-repeat → reject-concept at brutal mode (the hard rule)
- visual tempo would worsen → reject-concept at brutal mode
- contradiction feels constructed → reject-taste at brutal mode
- object spoken too loudly (emotional weight ≥ 9) → reject-taste at brutal mode
- soft pressure: sequence redundant, sequence flat, tempo worsen, absence-curiosity high without absence applied

Soft-floor threshold now scales with brutality (lenient=6 · default=4 · brutal=3) so the deeper cognition stack can still converge.

**Visual composition intelligence** (`lib/*` Phase 8 modules) — the system gains spatial cognition. Composition is now emotional physics, not arranged elements.

| Module | Role |
|---|---|
| `lib/visualGravity.ts` | Where the eye lands first, second, third. Scores focal_dominance, tension_balance, dead_zones, accidental_crowding, competing_anchors, eye_escape_points. Hard rejects layouts where two anchors fight for the same eye. |
| `lib/negativeSpacePsychology.ts` | Whitespace as emotion. ENERGY = compressed pressure (asymmetric, edges full); RELAX/FOCUS/SLEEP encoded for future formulas. Hard rejects centered-balanced layouts under ENERGY. |
| `lib/compositionRhythm.ts` | Spatial-repetition tracker (separate from Phase 3 emotional rhythm). Detects repeated layout families, product positions, text anchors, and the "headline-top + product-bottom" template pattern. |
| `lib/productPresence.ts` | Decides WHETHER the product belongs at all. Adds 4 new modes the spec named: `only-aftermath` (wrapper only) · `only-wrapper-corner` (edge of packaging) · `only-color-memory` (brand-color cameo) · `only-object-association` (the campaign's recurring scene object stands in). |
| `lib/humanFraming.ts` | Imperfect cinematic framing. 8 named behaviours: accidental-crop-pressure · blocked-object · partial-face · shoulder-intrusion · off-balance-horizon · documentary-hesitation · handheld-asymmetry · near-missed-framing. Forbidden: perfect symmetry, clean influencer framing. |
| `lib/layoutDirector.ts` | The senior art-director synthesizer. Reads every Phase 8 signal + Phase 1-7 outputs and outputs composition_archetype, typography_zone, emotional_crop_strategy, object_hierarchy, visual_silence_zones, framing_aggression, cta_permission_level, **plus the answer to "Would removing 40% improve this?"** When yes → meta-critic refuses. |

Phase 8 meta-critic gates:
- visual gravity rejection_reason → reject-concept at default mode and up
- negative space reject_centered → reject-concept at default mode and up
- composition rhythm would_repeat → reject-concept at brutal mode
- director would_improve_with_subtraction → reject-concept at brutal mode (the spec's "would removing 40% improve this?")
- director named conditions (looks-assembled, product-pasted, headline-behaving-like-template, composition-too-aware-of-itself, too-balanced-to-feel-human) → reject-taste at brutal mode

**Human perception + world continuity** (`lib/*` Phase 7 modules) — the system stops generating images and starts capturing human conditions already happening. Every scene must imply a past and a next moment.

| Module | Role |
|---|---|
| `lib/atmosphericLight.ts` | Lighting as psychology, not aesthetic. 12 named light behaviours (fluorescent-depletion · phone-glow-loneliness · refrigerator-isolation · late-office-warmth · sleepless-blue · train-stutter · amber-doorway · etc.). |
| `lib/typographyPsychology.ts` | Typography modulation tied to mental state — fragmented placement for overstimulation, sunken position for collapse, compressed density for pressure, weak pressure for silent burnout. |
| `lib/worldContinuity.ts` | Each scene gets 2-3 lived-in artifacts (unfinished tea, tabs already open, jacket on chair, half-open cabinet) plus an implied past and an implied next moment. |
| `lib/microHumanDetails.ts` | 3-5 anti-AI human cues per banner (skin texture · tired eyes · jaw tension · uneven posture · imperfect clothing fold · breath shallow · micro-tic · shoulder asymmetry). |
| `lib/invisibleStory.ts` | Answers five questions per frame: ten minutes before · two minutes after · what is the subject avoiding · what pressure exists outside the crop · what is unresolved. |
| `lib/humanInterruption.ts` | The product NEVER dominates — it interrupts a human moment, or it doesn't appear at all. When the emotional core demands hidden product, hidden wins regardless of asset job. |
| `lib/objectEmotionMemory.ts` | Per-campaign object→emotion store. Coffee cup appears in 3 depleted banners → motif `coffee cup → exhaustion`. Persisted at `data/memory/object-emotion.json`. |
| `lib/campaignIdentity.ts` | Synthesises the campaign's dominantEmotionalVoice, silence/loudness balance, object motifs, emotional themes, pacing identity, typography voice, and a **recognisability** score (0..10 — would this campaign be recognised without a logo). |
| `lib/perceptionCritic.ts` | The HIGHEST-LEVEL critic. 12 axes: emotionally_observed, culturally_honest, would_recognise_self, emotionally_manipulative (lower=better), trying_too_hard (lower=better), ai_aware (lower=better), atmosphere_lingers, emotionally_quiet_enough, humanity_believable, contradiction_real, art_director_keep, **saved_silently** (the spec's primary success metric). |
| `data/cultural-states-extended.ts` | 60 structured cultural states across the 20 named categories — office, parenting, relationships, loneliness, nightlife fatigue, Israeli transportation, military reserve, startup culture, social anxiety, digital exhaustion, avoidance, emotional burnout, emotional numbness, doomscrolling, insomnia, overthinking, Saturday silence, emotional recovery, urban loneliness, overstimulation. Each carries physical truth, emotional contradiction, environment logic, silence behavior, object meaning, camera behavior, lighting behavior, pacing, product role, forbidden clichés. |

Phase 7 meta-critic gates:
- perception critic verdict 'refuse' → reject-concept at brutal mode
- emotionally_manipulative ≥ 7 → reject-taste at default mode and up
- ai_aware ≥ 8 → reject-taste at brutal mode
- silent_emotional_recognition below floor → reject (this is the spec's primary success-metric gate)

**Perceptual foundation** (`lib/*` Phase 5 modules) — the deepest layer beneath everything. Not creative automation. A creative cognition.

| Module | Role |
|---|---|
| `lib/humanTruthEngine.ts` | 23 structured emotional cores (depletion · overstimulation · guilt · shame · avoidance · emotional-numbness · too-tired-to-rest · digital-fatigue · doomscrolling · social-performance-exhaustion · internal-contradiction · hyper-awareness · loneliness-in-public · decision-fatigue · inability-to-land · overstimulated-but-flat · silent-burnout · revenge-bedtime-procrastination · emotional-fragmentation · hidden-anxiety · invisible-pressure · functional-collapse · emotional-drift). Each carries 14 fields including silent_sentence, mental_loop, forbidden_tones, and the ENERGY state slugs it maps onto. |
| `lib/culturalMemory.ts` | 20 cultural micro-moments — fridge-open-at-night, reserves-fatigue, office-1647-brain-death, saturday-stillness, etc. Each with environment, soundscape, body_language, lighting_behavior, object_meaning. Several are Israeli-specific. |
| `lib/visualTaste.ts` | The 10-axis taste verdict from the spec: emotional_honesty, ai_detection_probability, restraint_score, silence_score, framing_realism, premium_authenticity, campaign_belonging, atmosphere_integrity, rejection_reason. |
| `lib/humanVisualBehavior.ts` | Imperfection plan with 14 named behaviors. Choice is emotionally motivated per family — never random — and explicitly forbids influencer-aesthetic + fake-luxury when restraint is high. |
| `lib/emotionalAftertaste.ts` | Decomposes residue into 8 named axes (remembered_contradiction, emotional_echo, atmosphere_persistence, identity_resonance, internal_recognition, emotional_stickiness, quiet_memorability, post_view_emotional_state). The new PRIMARY success metric. |
| `lib/campaignMemoryV2.ts` | Synthesises everything the brain knows into one cognition: *"What has this campaign already emotionally said?"* Reports coresCovered, coresMissing, dominantClosingReaction, emotionalFlatnessRisk, tensionsAlreadySaid, atmosphereAtRisk, and a brand-director note. |
| `data/forbidden-ai-patterns.ts` | The 17 named patterns from the spec (giant decorative timestamp · floating product PNG · centered symmetric layout · empty gradient · fake cinematic glow · fake lens flare · fake productivity scene · stock office smile · before/after cliché · giant typography unjustified · decorative clock · isolated packshot · empty buzzword · hyper-clean composition · template CTA placement · fake emotional intensity · fake luxury minimalism). Each is detected structurally. |

Phase 5 meta-critic gates:
- forbidden hard pattern hits → refuse at brutal mode
- visual-taste rejection_reason → refuse at brutal mode
- emotional aftertaste composite below floor → refuse at brutal mode
- campaign atmosphere at risk AND this banner would repeat the dominant closing → refuse at default mode and up

**Reality loop** (`lib/*` Phase 4 modules) — the system stops judging itself in isolation and starts learning from real-world signals. Aftertaste replaces engagement-spike as the primary success metric.

| Module | Role |
|---|---|
| `lib/engagementMemory.ts` | Ingests RawSignal events (save, share, watch, pause, ctr, comment, emotional-comment, replay, negative-reaction). Persisted at `data/memory/engagement.json`. Includes a synthetic-signal generator for testing without traffic. |
| `lib/hookSurvival.ts` | First-0.5s survival analysis from signal data — eye_interruption, emotional_interruption, curiosity_hold, recognition_timing. |
| `lib/emotionalOutcome.ts` | Infers the ACTUAL produced emotion from signal mix; reports `aligned` / `soft-miss` / `hard-miss` vs the system's pre-ship prediction. |
| `lib/aftertaste.ts` | Predicts 24h+ residue: tension sharpness + emotional density + unresolved reaction > engagement spike. Persisted at `data/memory/aftertaste.json`. Emits a one-line memory phrase. |
| `lib/tasteDrift.ts` | Detects audience-taste drift (oversized-typography-fatigue, cinematic-realism-saturation, anti-ad-documentary-strengthening, silence-rewarded, etc.). Includes a **diversity guard** that rate-limits the optimization so the system stays honest. |
| `lib/atmosphereConsistency.ts` | The new success metric: brand atmosphere across recent banners. DNA spread (banded — too low penalises template energy, too high penalises chaos), voice consistency, job mix, + uniformity penalty. |

**Phase 4 API surface**
- `POST /api/banner/:id/signal` — ingest a single signal
- `POST /api/banner/:id/simulate-signals` — synthetic-viewer generator for testing
- `GET /api/memory/atmosphere` — campaign atmosphere + residue summary

**Campaign brain** (`lib/*` Phase 3 modules) — the system decides BEFORE generation what each banner should DO, then judges itself against the campaign rhythm afterward. The brain runs across calls (memory persists), so the second call already knows what the first one was.

| Module | Role |
|---|---|
| `lib/culturalIntelligence.ts` | Selects one of 9 cultural moments per banner (exhaustion culture, dopamine burnout, productivity fatigue, anti-hustle, overconnected life, quiet luxury, digital numbness, wellness skepticism, tired-of-optimization). Bias toward state family; rotation across the campaign. |
| `lib/campaignDecision.ts` | Decides the **asset job** before generation: sell · validate · interrupt · educate · curiosity · atmosphere · no-product · anti-ad. The Creative Director honours the job's constraints; the meta-critic enforces them as a hard contract. |
| `lib/campaignRhythm.ts` | Tracks 6 axes across generations (loud-vs-quiet, product-vs-no-product, direct-vs-soft-cta, aggressive-vs-restrained, educational-vs-emotional, silence-vs-impact). Returns a health score and the most imbalanced axis. Banners that would worsen the imbalance get rejected. |
| `lib/visualCourage.ts` | Decides whether THIS banner earns radical restraint (almost empty, very quiet, under-explained). When courage fires, restraint forces to 0.88, dominance to 'absent', secondary line dropped. |
| `lib/antiAI.ts` | Per-banner: scans for 8 AI signatures (fake-cinematic-lighting, giant-meaningless-typography, perfect-symmetric-layout, generic-premium-beige, pasted-product-logic, motivational-quote-energy, startup-ad-template). Cross-campaign: detects DRIFT and tells the next banner to push away. |
| `lib/humanMemory.ts` | Stores an emotional trace per shipped banner: state, truth, tension, cultural moment, job, predicted reaction curve, and a one-line `residue` ("viewer carries the contradiction X with them"). Persisted to `data/memory/emotional-trace.json`. |

**Taste system** (`lib/*` Phase 2.5 modules) — these
do not generate — they judge.

| Module                | Role                                                       |
|-----------------------|------------------------------------------------------------|
| `lib/referenceDNA.ts` | Extracts 16-axis continuous DNA from any banner; provides distance + named divergence helpers. |
| `lib/referenceLoader.ts` | Loads all reference analyses from `references/<category>/*.json`. |
| `lib/tasteJudge.ts`   | 15-axis emotional-and-visual authenticity judge. Verdict: `ship` / `soft-refuse` / `hard-refuse`. |
| `lib/humanReaction.ts`| Predicts the viewer's emotional curve at 0.3s, 1s, 3s. Scroll-past prediction is a hard gate. |
| `lib/campaignEvolution.ts` | Reads memory, outputs the next-banner directive ("pivot to silence", "rotate layout", "cool the pressure"…). |
| `lib/visualFatigue.ts`| Multi-axis fatigue detector (layout, color, hook, timestamp, typography, product placement, emotional). |

**Reference bank** lives in two places:
- `data/reference-bank.ts` — 20 categorical mechanics, used by the Phase 2 Reference Intelligence engine for layout/family matching.
- `references/<category>/*.json` — 14 deep DNA analyses used by the Phase 2.5 TasteJudge. Categories: `excellent`, `good`, `bad`, `too_ai`, `premium`, `editorial`, `documentary`, `fashion`, `quiet`, `aggressive`, `scrollstop`, `boring`. Add a JSON file to the right folder; the loader picks it up.

The cognition layer (`src/cognition/claude.ts`) wraps Anthropic's SDK
and is used by the truth, direction, typography, scroll-stop critic
and taste critic. Image providers (`src/engines/image/providers/*`)
abstract OpenAI's gpt-image-1.

### Brutality

The Not-Good-Enough meta-critic accepts a `brutality` parameter (0..1).
The landing page exposes three bands:

| Band     | Value | Behavior                                                |
|----------|-------|---------------------------------------------------------|
| LENIENT  | 0.50  | Most banners pass. Useful for first runs without API keys. |
| DEFAULT  | 0.65  | Balanced — rejects safe and generic; approves observed.    |
| BRUTAL   | 0.90  | Creative-director rejection. Taste failures become hard gates. ~50% exhaust. |

Memory-aware brutality nudges the threshold higher when the campaign
has been over-loud or has triggered the overstimulation flag.

## Runtime

```bash
npm install
cp .env.example .env  # add ANTHROPIC_API_KEY + OPENAI_API_KEY for real cognition / images
npm run dev           # http://localhost:3000
```

The system runs end-to-end **without keys** — every engine ships a
curated bank fallback (states, truths, headlines) and a cinematic
SVG stub image provider. Add keys to switch to real cognition.

### CLI smoke test

```bash
MOOD_FORCE_STUBS=1 npm run engines:test
# writes out-banner.svg and out-banner.png in repo root
```

## What V1 is NOT

- No video, no carousel, no reels.
- No landing pages, no schedulers, no publishing.
- No prompt input. The user is not a creative director.
- No "premium" — the system optimises for **memorable**.

## What Phase 2 is NOT

- Not more generation. Not more layouts. Not more visual chaos.
- Not "make better banners." Phase 2 only adds **judgment**.
- The taste layer can refuse every banner the generation layer produces. Refusal is the feature.

## Hebrew

All consumer-facing copy renders RTL in Hebrew via SVG `direction="rtl"`
+ Heebo (with system fallback). The headline bank
(`src/engines/typography/hebrew-headlines.ts`) ships one curated line
per state. Cognition can override with live Claude output.

## Memory

`./data/memory/memory.json` (configurable via `MOOD_MEMORY_DIR`). Tracks
recent states, layouts, hooks, and per-state critique scores. The Human
State selector reads it on every run for fatigue / rotation.
