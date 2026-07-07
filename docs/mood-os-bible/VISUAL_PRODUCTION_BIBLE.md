# VISUAL_PRODUCTION_BIBLE

The production system for every image MOOD will ever have. Goal: not beauty —
**recognizability.** Someone should know "this is MOOD" with no logo and no text.
This operationalizes Volumes 07–08 and `GROK_ASSET_BRIEF.md`; where they define the
*language*, this defines the *factory*.

> **PRODUCTION GATE.** The pipeline, templates, and queue below are built now. **No
> Grok scene runs until `OBSERVE_TEN` returns "wanted."** Exception:
> **`Scene_001_Before_Returning`** may run first, because it defines the light,
> atmosphere, and emotional DNA every other scene inherits. Spend nothing on volume
> before that one scene proves the world.

---

## 0. The Signature — what makes it recognizable

Recognizability is not a subject. It is a **constant** applied to every subject.
MOOD's four constants:

1. **The Light** — one warm, low, directional source (golden hour / window /
   candle). Never flat, never top-lit, never cool. Light always *comes from one
   side and falls off into warm shadow.*
2. **The Held Breath (composition)** — the subject sits to one side or low; a
   deliberate **empty region** (lower third or one side) is reserved. That emptiness
   *is* the brand. It's where the live Hebrew text breathes.
3. **The Skin of Film** — soft grain, gentle falloff, shallow depth, muted filmic
   color. Never crisp, never HDR, never plastic, never "AI-clean."
4. **Human Intimacy at Small Scale** — a shoulder, hands, a back to the light, two
   people about to speak. Never posed, never faces-to-camera, never stock.

If an image has these four, it is MOOD even if the subject changes. This document
protects those four across every asset.

---

## 0.5 The Scene Is the Atomic Unit

**We do not generate images. We generate emotional worlds.** The atomic unit of
production is the **Scene** — one place, one light, one atmosphere, one emotional
truth. Every asset the app, website, store, print, and film will ever need is a
**crop, reframe, or motion pass of a Scene.** Nothing is generated in isolation.

**NEW RULE:** Never generate an isolated image. Generate a Scene, then *derive*
every asset from it. This is what guarantees one visual language — because every
surface literally shares the same light and air.

**Every Scene must be able to produce:** app · website · marketing · social · print ·
collector · motion · video assets — all from the same visual DNA.

### Scene folder (the reusable production universe)
```
scene_001_before_returning/
  wide_16x9_v01.webp          establishing shot — the whole world (master)
  hero_9x16_v01.webp          app hero crop
  close_1x1_v01.webp          intimate detail crop
  mobile_9x16_v01.webp        phone full-bleed
  desktop_16x9_v01.webp       web full-bleed
  story_9x16_v01.webp         social story
  poster_3x4_v01.webp         marketing / print poster
  print_3x4_v01.webp          high-res collector print
  wallpaper_9x19_v01.webp     device wallpaper
  transition_9x16_v01.webp    loop/transition still
  video_frame_16x9_v01.webp   motion key-frame
  background_9x16_v01.webp     text-bearing background
  thumbnail_1x1_v01.webp       library thumb
  collector_1x1_v01.webp       limited object art
  metadata.json               scene DNA + version log (§7)
  animation_notes.md          how the world breathes (§ motion)
```

### Scene template (define before the master prompt)
```
Scene ID:         scene_00N_<name>
Emotional Truth:  the one human truth this world holds
Place / World:    where it is
The Light:        the single source, direction, time — the DNA
Atmosphere:       air, weather, temperature, stillness
Palette / LUT:    the fixed color of this world
Human Presence:   none | hands | figures from behind
Anchor Objects:   the few recurring props
Negative Space:   where emptiness lives (for text/breath)
Derivation Map:   which of the 15 outputs this scene must yield, and from which region
Forbidden:        the no-list for this world
```

Derivations share the master's light and LUT **exactly** — a derivation that
introduces a new light source is a QA failure, because it breaks the world.

---

## 1. Asset Categories

**A · In-experience (the app):**
- Hero Moments · Discovery Images · Choice Images · Human Map Visuals · Backgrounds
  (dusk/room/weaving-light) · Library ground · **Portrait Evolution** (Becoming
  stages) · Objects · Hands · Homes · Transition frames · Illustrations · Icons ·
  Loading · Empty States · Celebration (arrival, never confetti) · "Not this time"
  (warm, never failure) · Motion Frames.

**B · Out-of-experience (the brand):**
- Marketing · Website · App Store · Social/Share grounds · Packaging · Collector
  Objects (prints) · Print · Wallpaper.

Every category still obeys: **no text baked in, ever; negative space reserved.**

---

## 2. Production Pipeline

```
Idea → Purpose → Story → Emotion → Composition → Shot List → Prompt
     → Grok → QA → Versioning → Approval → Registry (scenes.tsx / asset store)
```

No image enters the app until it clears **QA (§6)** and is **Approved (§7)** and
**named (§4)**. Approved images bind to `MomentTemplate`s / scene keys.

---

## 3. Asset Template (define ALL fields before any prompt)

Every asset is specified with this block before a prompt is written:

```
ID:               <naming §4>
Purpose:          why it exists
User Emotion:     the one feeling it must produce
Screen:           where it appears (Vol 09 name)
Aspect Ratio:     9:16 | 4:5 | 1:1 | 16:9 | 3:4
Safe Area:        where UI/text sits (must stay clear)
Negative Space:   which third/side is reserved and why
Color Language:   warm cacao/amber range + LUT
Lighting:         source, direction, time of day, falloff
Lens:             35 / 50 / 85mm equiv, and why
Camera Height:    eye / low / high / over-shoulder
Depth of Field:   shallow (default) / medium
Human Presence:   none | hands | figure(s) from behind | shoulder
Objects:          what, if any
Motion Notes:     how it breathes if it moves
Future Animation: parallax / light-drift / grain plan
Forbidden:        the no-list for this asset
```

Only when this block is complete do we write the prompt (§5).

---

## 4. Asset Naming System

Predictable, sortable, no random files.

```
{group}_{id}_{variant}_{aspect}_v{NN}.{ext}
```
- **group:** `moment | discovery | humanmap | background | library | portrait |
  object | hand | home | transition | ui | icon | state | marketing | packaging`
- **id:** stable subject key (`001`, `belonging`, `dusk`, `becoming`)
- **variant:** `hero | thumb | bg | a | b | stage1..N | loading | empty | celebrate |
  notthistime | icon`
- **aspect:** `9x16 | 4x5 | 1x1 | 16x9 | 3x4`
- **v{NN}:** version, zero-padded

Examples:
`moment_001_hero_9x16_v01.webp` · `discovery_belonging_a_9x16_v02.webp` ·
`background_dusk_bg_9x16_v01.webp` · `portrait_becoming_stage3_1x1_v01.webp` ·
`marketing_hero_16x9_v01.webp`

Each asset carries a sidecar `…_meta.json` (§7).

---

## 5. Prompt Standard (never improvise — fixed order)

Every Grok prompt is assembled in this exact order:

```
[SIGNATURE TOKENS] · [SUBJECT + EMOTION] · [COMPOSITION + NEGATIVE SPACE]
· [LIGHT] · [LENS + CAMERA HEIGHT + DOF] · [COLOR/LUT] · [ONE MOOD WORD]
--ar <ratio>  --no [FORBIDDEN LIST]
```

- **SIGNATURE TOKENS (constant, every prompt):**
  `timeless painterly photograph, one warm low directional light, soft film grain,
  shallow depth of field, muted filmic color, intimate human scale, generous
  reserved negative space, no text`
- **FORBIDDEN LIST (constant, every prompt):**
  `text, letters, words, hebrew, captions, watermark, logo, signage, ui, numbers,
  faces to camera, posed stock, harsh flash, hdr, oversaturation, plastic skin,
  distorted hands, cluttered background, cool blue light`

Improvisation is a QA failure. The only variables are subject, composition, light
description, lens, and the single mood word.

---

## 6. QA (answer ALL before approval)

Craft (must all be YES):
- Does it feel like MOOD (the four constants, §0)?
- Would someone frame it / set it as a wallpaper?
- Does it still work with **no text**?
- Does it create emotional **breathing room** (reserved negative space present)?
- Is the text-safe zone genuinely clear?

Taste (must all pass):
- Is it **too cinematic**? (reject theatrics)
- Does it read **too AI**? (reject over-clean, over-symmetry, waxy skin)
- Would **Apple** approve this craft?
- Would **Leica** photographers respect the light and grain?
- Would **Aesop** use this image?
- Would **Kinfolk** publish it?

Hard rules (auto-reject if any fail):
- Any text/letters/numbers/signage anywhere → reject.
- Faces posed to camera / stock feel → reject.
- Correct aspect + ≥2048px long edge → else reject.
- Safe, humane content (aligns with challenge safety) → else reject.

---

## 7. Versioning

Each asset has a sidecar `{name}_meta.json`:

```json
{
  "id": "moment_001_hero_9x16",
  "versions": [
    { "v": "v01", "status": "rejected", "reason": "too cinematic, light too theatrical" },
    { "v": "v02", "status": "rejected", "reason": "negative space filled by second figure" },
    { "v": "v03", "status": "approved", "prompt_ref": "§10.1", "date": "<stamped on ingest>" }
  ],
  "approved": "v03"
}
```
Statuses: `v01..N`, `approved`, `rejected` (+reason), `archived`. Nothing ships
without an `approved`. Rejections keep their reason so the language compounds.

---

## 8. Master Scene List — MVP

We count **scenes**, not assets. Each scene yields its full derivation set (§0.5).

| # | Scene | Emotional Truth | Yields (app + brand) | Priority |
|---|-------|-----------------|----------------------|----------|
| 1 | **`Scene_001_Before_Returning`** | the held breath before you come back — to the app, to yourself | evening + becoming-close + dusk background + splash + wallpaper + marketing hero + social + collector | **P0 · master** |
| 2 | `Scene_002_First_Hello` | the instant before a first hello | moment_001 hero/close/thumb + poster + story | P0 |
| 3 | `Scene_003_Four_Doorways` | the small choices that reveal you | 8 discovery crops (4 pairs) + transitions | P0 |
| 4 | `Scene_004_The_Unsaid_Word` | the warm thing you finally say | moment_002 hero/close/thumb + social | P1 |
| 5 | `Scene_005_Becoming` | a self taking form, never finished | portrait stages 1–5 + collector + wallpaper | P1 |

Five scenes cover the entire MVP across app, web, store, print, and motion — because
each is a world, not a picture. **Optimize for the first world being unforgettable.**

---

## 9. Grok Scene Production Queue

One scene at a time. Each scene = generate the master (wide establishing), approve
the world, then derive its full set. The next scene never starts until the current
scene's master is approved.

```
Scene_001_Before_Returning  · master + 15 derivations · runs FIRST · defines the DNA
--- GATE: OBSERVE_TEN = "wanted" AND Scene_001 master approved ---
Scene_003_Four_Doorways     · master + 8 discovery crops
Scene_002_First_Hello       · master + derivations
Scene_004_The_Unsaid_Word   · master + derivations
Scene_005_Becoming          · master (5 stages) + derivations
```
Never generate blindly: the **master establishes the world; derivations only reframe
it.** A derivation that changes the light is rejected — it has left the scene.

---

## 10. Scenes (one world at a time — master, then derivations)

### 10.0 — `Scene_001_Before_Returning` · MASTER · runs FIRST · defines the DNA
```
Scene ID:        scene_001_before_returning
Emotional Truth: the held breath before you come back — to the app, to yourself,
                 at the end of a day you actually lived.
Place / World:   a quiet street at dusk, a warm lit doorway a little ahead
The Light:       the last low gold sun from frame-left, dissolving into violet dusk
                 — THIS falloff is the brand DNA every other scene inherits.
Atmosphere:      still, private, cooling air holding one last warm breath
Palette / LUT:   violet-blue dusk → warm amber, deeply muted; soft film grain
Human Presence:  one figure from behind, walking gently toward the warm doorway
Anchor Objects:  the lit doorway, a long soft shadow, an empty stretch of road
Negative Space:  lower two-thirds (road + air) reserved for text/breath
Derivation Map:  wide(master) → hero, close(doorway light), mobile, desktop, story,
                 poster, print, wallpaper, transition, video_frame, background,
                 thumbnail, collector; + metadata + animation_notes
Forbidden:       faces to camera, second light source, cool-only cast, any text
```
**MASTER PROMPT (wide establishing — the world):**
```
timeless painterly photograph, one warm low directional light, soft film grain,
shallow depth of field, muted filmic color, intimate human scale, generous reserved
negative space, no text · one person seen from behind walking slowly toward a warm
lit doorway on a quiet street at dusk, the held breath before returning home ·
figure small and left, the empty road and dusk air filling the lower two-thirds ·
last low gold sun from the left dissolving into violet dusk, one long soft shadow ·
35mm, low eye level, deep-soft focus · violet-blue into warm amber, deeply muted ·
homecoming
--ar 16:9  --no text, letters, words, hebrew, captions, watermark, logo, signage,
ui, numbers, faces to camera, posed stock, harsh flash, hdr, oversaturation, plastic
skin, distorted hands, cluttered background, cool-only light
```
**DERIVATIONS (same world, reframed — never a new light):**
| Output | Aspect | From region | Delta from master |
|--------|--------|-------------|-------------------|
| `hero` | 9:16 | recompose vertical | figure lower-left, doorway glow upper-right, road for text |
| `close` | 1:1 | the doorway | just the warm lit doorway + spill, no figure |
| `background` | 9:16 | the dusk air | the empty violet→amber sky only, lower 2/3 open |
| `wallpaper` | 9:19 | full world | device-safe margins, figure off-center |
| `poster`/`print` | 3:4 | full world | max resolution, collector crop |
| `story`/`social` | 9:16 | full world | brand-safe center, breathing top |
| `video_frame` | 16:9 | master | key-frame for a slow light-drift push-in |
**Derivation prompt pattern:** reuse the master prompt verbatim, change only the
subject-framing clause and `--ar`. If you find yourself re-describing the light, stop
— you are leaving the scene.
**QA:** run §6 in full. **Scene_001's master must score YES on every craft line
before any other scene is authorized** — it is the world everything inherits.

---

### 10.1 — `Scene_002_First_Hello` · MASTER (moment_001 world)
```
Purpose:        The one image that defines MOOD's language; hero for Moment_001.
User Emotion:   tender hope — "someone is about to be brave."
Screen:         Today / Daily Moment; Recognition
Aspect:         9:16 (also 4:5, 1:1 crops)
Safe Area:      lower third empty for live Hebrew title + reflection
Negative Space: lower third (warm wall / air)
Color:          warm cacao→amber LUT, muted
Lighting:       late-afternoon window light from frame-left, warm falloff to shadow
Lens:           50mm equiv, shallow DOF
Camera Height:  eye level, slight over-shoulder
Human Presence: two figures seen from behind, at the edge of a first hello
Objects:        a café counter edge, one warm cup
Motion (future): slow light-drift + grain; figures still
Forbidden:      faces to camera, second light, any text, clutter
```
**PROMPT:**
```
timeless painterly photograph, one warm low directional light, soft film grain,
shallow depth of field, muted filmic color, intimate human scale, generous reserved
negative space, no text · two people seen from behind at a sunlit café counter, the
instant before a first hello, tender and hopeful · composition weighted upper-right,
lower third left as warm empty wall for text · late-afternoon window light from the
left falling into warm shadow · 50mm, eye level, slight over-shoulder, shallow focus
· warm cacao and amber, muted · yearning
--ar 9:16  --no text, letters, words, hebrew, captions, watermark, logo, signage,
ui, numbers, faces to camera, posed stock, harsh flash, hdr, oversaturation, plastic
skin, distorted hands, cluttered background, cool blue light
```
**QA:** run §6 in full. This is `Scene_002`'s master; approve it before deriving its set.

### 10.2 — `Scene_003_Four_Doorways` derivation · `discovery_belonging_a_9x16` (pair with `_b`)
```
Purpose:  Discovery choice — the "from outside" pole of belonging.
Emotion:  quiet longing to be inside the warmth.
Negative: full-flexible (tappable full-bleed); keep center calm.
Light:    a single lit window glowing from within a dark exterior.
Lens:     35mm, low, shallow.
Human:    none (or one distant silhouette).
```
**PROMPT:**
```
timeless painterly photograph, one warm low directional light, soft film grain,
shallow depth of field, muted filmic color, intimate human scale, generous reserved
negative space, no text · a single warm lit window seen from a dark quiet street at
night, longing to be inside · centered calm, dark surround · the window is the only
light, spilling gold into blue-dark · 35mm, low angle, shallow · warm amber against
deep warm-black · longing
--ar 9:16  --no text, letters, words, hebrew, watermark, logo, signage, ui, numbers,
faces to camera, posed stock, hdr, oversaturation, plastic skin, cluttered
```
*(`_b` = the same world from **inside** a warm room — enveloped, belonging.)*

### 10.3 — `Scene_001_Before_Returning` derivation · `background_9x16` (same world, sky only)
```
Purpose:  Evening / return backdrop for Check-in and the Becoming close.
Emotion:  calm arrival, the day softening.
Negative: lower two-thirds calm for text.
Human:    none.
```
**PROMPT:**
```
timeless painterly photograph, one warm low directional light, soft film grain,
shallow depth of field, muted filmic color, generous reserved negative space, no
text · an empty warm dusk sky over a faint horizon, the day softening to gold, calm
and private · vast simple gradient, lower two-thirds open for text · last warm sun
low at the base of the frame · wide, deep focus on emptiness · violet-to-amber, muted
· stillness
--ar 9:16  --no text, letters, words, hebrew, watermark, logo, signage, ui, numbers,
harsh flash, hdr, oversaturation, cluttered, cool blue cast
```

### 10.4 — `Scene_005_Becoming` · MASTER (stage 3 of 5) · `portrait_becoming_stage3_1x1`
```
Purpose:  A stage in the Becoming portrait — the self accumulating.
Emotion:  quiet recognition of one's own growth.
Negative: generous margin; the form sits small in warm space.
Human:    an abstract warm form / light gathering — never a literal face.
Note:     stages 1→5 grow in warmth/definition, never in "score."
```
**PROMPT:**
```
timeless painterly photograph, one warm low directional light, soft film grain,
muted filmic color, generous reserved negative space, no text · a soft gathering of
warm light slowly taking form in a dark field, a self becoming more defined but not
finished, tender · small centered form in vast warm-dark space · one low warm source
within the form · macro-soft, extremely shallow · amber glow on warm black ·
becoming
--ar 1:1  --no text, letters, words, hebrew, watermark, logo, signage, ui, numbers,
faces, portrait likeness, hdr, oversaturation, plastic, cluttered
```

---

### Standard for every future prompt
Purpose · Emotion · Composition · Camera · Light · Environment · Negative Space ·
Color · Human Truth · Production Notes · Forbidden Elements · Aspect Ratio · Output
Variants · QA Checklist — assembled in the §5 order, cleared through §6, versioned
in §7. **One scene at a time — master first, then derive; never re-invent the
light.** The first unforgettable *world* outranks a thousand beautiful images.
