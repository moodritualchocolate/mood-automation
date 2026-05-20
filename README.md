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

**Reference bank** (`data/reference-bank.ts`) — 20 structured taste
anchors. NOT images. Each anchor encodes composition mechanics,
pacing, restraint, tension, and a one-line "campaign feeling" the
Reference Intelligence engine matches against.

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
