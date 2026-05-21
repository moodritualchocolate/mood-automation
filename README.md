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
