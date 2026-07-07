# VISUAL_PRODUCTION_BIBLE

The production system for every image MOOD will ever have. Goal: not beauty —
**recognizability.** Someone should know "this is MOOD" with no logo and no text.
This operationalizes Volumes 07–08 and `GROK_ASSET_BRIEF.md`; where they define the
*language*, this defines the *factory*.

> **PRODUCTION GATE.** The pipeline, templates, and queue below are built now. **No
> Grok batch runs until `OBSERVE_TEN` returns "wanted."** Exception: **Batch 00 — the
> single Signature Proof** may run first, because it defines the language everything
> else inherits. Spend nothing on volume before the one image proves the look.

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

## 8. Master Asset List — MVP

Grouped, prioritized (P0 blocks launch), with production order.

| # | Group | Assets | Count | Priority |
|---|-------|--------|-------|----------|
| 1 | **Signature Proof** | `moment_001_hero` (the language-defining image) | 1 | **P0** |
| 2 | Discovery | 4 pairs (belonging/initiation/energy/risk) ×2 | 8 | P0 |
| 3 | Moment_001 | hero (9:16, 4:5, 1:1), library thumb | 4 | P0 |
| 4 | Backgrounds | dusk, room, weaving-light, library ground | 4 | P0 |
| 5 | States | loading, empty, celebrate(arrival), notthistime | 4 | P1 |
| 6 | Moment_002 | hero set + thumb | 4 | P1 |
| 7 | Portrait/Becoming | stages 1–5 | 5 | P1 |
| 8 | Icon/Splash | app icon, splash light | 2 | P1 |
| 9 | Marketing | hero 16:9, App Store 3–4, social ground | 6 | P2 |

**Production order:** 1 → (gate) → 2 → 4 → 3 → 5 → 6 → 7 → 8 → 9.
Total MVP ≈ **38 approved assets.** Optimize for the first one being unforgettable.

---

## 9. Grok Production Queue

```
Batch 00 — SIGNATURE PROOF     · 1 asset  · runs FIRST · defines the language
--- GATE: OBSERVE_TEN = "wanted" AND Batch 00 approved ---
Batch 01 — Discovery           · 8 assets
Batch 02 — Backgrounds         · 4 assets
Batch 03 — Moment_001 set      · 4 assets
Batch 04 — States              · 4 assets
Batch 05 — Moment_002 set      · 4 assets
Batch 06 — Portrait/Becoming   · 5 assets
Batch 07 — Icon/Splash         · 2 assets
Batch 08 — Marketing/App Store · 6 assets
```
Never batch blindly: each batch is approved before the next begins.

---

## 10. Grok Prompts (one asset at a time — exemplars that set the standard)

### 10.1 — `moment_001_hero_9x16` · BATCH 00 · the Signature Proof
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
**QA:** run §6 in full. This asset must score YES on every craft line before ANY
other batch is authorized.

### 10.2 — `discovery_belonging_a_9x16` (pair with `_b`)
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

### 10.3 — `background_dusk_bg_9x16`
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

### 10.4 — `portrait_becoming_stage3_1x1`
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
in §7. One asset at a time. The first unforgettable image outranks a thousand
beautiful ones.
