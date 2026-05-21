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
