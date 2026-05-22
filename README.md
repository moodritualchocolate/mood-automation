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
